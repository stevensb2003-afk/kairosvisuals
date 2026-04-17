import { Firestore, doc, getDoc, updateDoc, setDoc, addDoc, collection, runTransaction, getDocs, query, where } from 'firebase/firestore';

export async function getNextSequenceNumber(firestore: Firestore, type: 'invoice' | 'quotation'): Promise<string> {
  const counterRef = doc(firestore, 'settings', 'general');
  const counterField = type === 'invoice' ? 'invoiceCounter' : 'quotationCounter';
  const prefix = type === 'invoice' ? 'KV-FAC-' : 'KV-COT-';

  const nextNumber = await runTransaction(firestore, async (transaction) => {
    const docSnap = await transaction.get(counterRef);
    let currentNumber = 0;
    
    if (docSnap.exists() && typeof docSnap.data()[counterField] === 'number') {
      currentNumber = docSnap.data()[counterField];
    }
    
    const newNumber = currentNumber + 1;
    
    if (!docSnap.exists()) {
      transaction.set(counterRef, { [counterField]: newNumber }, { merge: true });
    } else {
      transaction.update(counterRef, { [counterField]: newNumber });
    }
    
    return newNumber;
  });

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Synchronizes the client's root paymentStatus and daysOverdue based on their actual invoices.
 */
export async function syncClientFinancialStatus(firestore: Firestore, clientId: string) {
  const clientRef = doc(firestore, 'clients', clientId);
  const clientSnap = await getDoc(clientRef);
  if (!clientSnap.exists()) return;

  const invoicesRef = collection(firestore, 'clients', clientId, 'invoices');
  
  // Consider pending or overdue invoices
  const qPending = query(invoicesRef, where('status', 'in', ['sent', 'partially_paid', 'overdue']));
  const pendingSnaps = await getDocs(qPending);
  
  let isOverdue = false;
  let hasPending = false;
  let maxDaysOverdue = 0;
  const today = new Date();

  pendingSnaps.forEach(snap => {
    const inv = snap.data();
    hasPending = true;

    if (inv.status === 'overdue') {
      isOverdue = true;
    }
    
    // Fallback date calculation
    const dueDateStr = inv.firstPaymentDueDate || inv.issueDate;
    if (dueDateStr) {
        const dueDate = new Date(dueDateStr);
        if (today > dueDate) {
            const diffTime = Math.abs(today.getTime() - dueDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
                isOverdue = true;
                if (diffDays > maxDaysOverdue) maxDaysOverdue = diffDays;
            }
        }
    }
  });

  let newStatus = 'upToDate'; // Zero balance
  if (isOverdue) {
      newStatus = maxDaysOverdue > 5 ? 'suspended' : 'overdue';
  } else if (hasPending) {
      newStatus = 'pending'; // Unpaid but not yet overdue
  }

  await updateDoc(clientRef, {
      paymentStatus: newStatus,
      daysOverdue: maxDaysOverdue,
      updatedAt: new Date().toISOString()
  });
}

/**
 * Calculates the exact next billing date based on the cycle logic.
 * Cycle starts on 1st -> Part 2 on End of Month
 * Cycle starts on 16th -> Part 2 on 15th of next month
 */
export function calculateNextBillingDate(startDateISO: string): Date {
  const startDate = new Date(startDateISO);
  const startDay = startDate.getDate();
  const nextDate = new Date(startDate.getTime());

  if (startDay <= 15) {
    // Treat as starting on 1st. Part 2 is the 15th of the current month.
    nextDate.setDate(15);
  } else {
    // Treat as starting on 16th. Part 2 is End of Month.
    nextDate.setMonth(nextDate.getMonth() + 1, 0); // last day of current month
  }
  return nextDate;
}

export function determinePlanStartDay(startDateISO: string): 15 | 30 {
  const startDate = new Date(startDateISO);
  const startDay = startDate.getDate();
  // 30 means cycle starts on 1st, 15 means cycle starts on 16th
  return startDay <= 15 ? 30 : 15;
}

export async function acceptQuotationClient(
  firestore: Firestore,
  quotation: any,
  leadOrClient: any,
  isUpdate: boolean = false
) {
  const clientId = leadOrClient.clientId || leadOrClient.id;
  const quoteRef = doc(firestore, 'clients', clientId, 'quotations', quotation.id);

  // 1. Update quotation status
  await updateDoc(quoteRef, {
    status: 'accepted',
    updatedAt: new Date().toISOString()
  });

  // 2. Prepare Active Plan data
  const isRecurring = quotation.contractType === 'recurring';
  const recurringItems = (quotation.items || []).filter((item: any) => item.billingType === 'recurring' || !item.billingType); // Default to recurring if not specified
  const baseAmount = recurringItems.reduce((acc: number, item: any) => acc + (item.unitPrice * item.quantity), 0);

  // Net totals from the quotation (already calculated with discounts, taxes, etc.)
  const netQuotationTotal = quotation.totalAmount || quotation.total || 0;
  const netSubtotal = quotation.subtotalAmount || quotation.subtotal || 0;
  const netDiscount = quotation.totalDiscount || quotation.discount || 0;
  const netTax = quotation.taxAmount || quotation.tax || 0;

  const startDate = quotation.startDate || new Date().toISOString();
  
  const nextBillingDate = calculateNextBillingDate(startDate);
  const planStartDay = determinePlanStartDay(startDate);

  // 3. Update Client Document
  const clientRef = doc(firestore, 'clients', clientId);

  if (isUpdate && isRecurring) {
    // === FLUJO DE ACTUALIZACIÓN DE PLAN ===
    const clientSnap = await getDoc(clientRef);
    if (!clientSnap.exists()) throw new Error("Cliente no existe");
    
    const clientData = clientSnap.data();
    const currentActivePlan = clientData?.activePlan;
    if (!currentActivePlan) throw new Error("No se puede actualizar sin un plan activo vigente");

    const updatedPlan = {
      ...currentActivePlan,
      // FIX #1: usar netQuotationTotal (con descuentos e IVA) en lugar del monto bruto baseAmount
      baseRecurringAmount: netQuotationTotal,
      services: recurringItems.map((item: any) => ({
        serviceId: item.serviceId || '',
        // FIX #3: persistir serviceName para que el dashboard del cliente lo muestre correctamente
        serviceName: item.serviceName || '',
        description: item.description || item.serviceName || 'Servicio',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        discountValue: item.discountValue || 0,
        discountType: item.discountType || 'amount',
        ivaRate: item.ivaRate || 0,
        ivaType: item.ivaType || 'none',
        billingType: 'recurring'
      })),
      updatedAt: new Date().toISOString() // solo traqueamos actualización
    };

    await setDoc(clientRef, {
      activePlan: updatedPlan,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Notificación
    const notificationId = `notif-${Date.now()}`;
    await setDoc(doc(firestore, 'notifications', notificationId), {
      type: 'system',
      priority: 'high',
      title: 'Plan Actualizado',
      message: `El cliente ${leadOrClient.clientName || leadOrClient.name || 'Desconocido'} ha actualizado su plan. El nuevo monto aplicará automáticamente en el próximo corte.`,
      targetUserId: 'all',
      read: false,
      relatedId: clientId,
      relatedType: 'client',
      createdAt: new Date().toISOString()
    });

    return null; // No hay factura inicial 50/50
  }

  // === FLUJO DE CREACIÓN DE NUEVO PLAN (ONBOARDING) ===
  const activePlan = {
    planId: quotation.id,
    startDate: startDate,
    planStartDay: planStartDay,
    baseRecurringAmount: netQuotationTotal, // Net total (after discounts & taxes) as the monthly billing base
    status: 'active',
    services: recurringItems.map((item: any) => ({
      serviceId: item.serviceId || '',
      // FIX #3: persistir serviceName para que el dashboard del cliente lo muestre correctamente
      serviceName: item.serviceName || '',
      description: item.description || item.serviceName || 'Servicio',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      discountValue: item.discountValue || 0,
      discountType: item.discountType || 'amount',
      ivaRate: item.ivaRate || 0,
      ivaType: item.ivaType || 'none',
      billingType: 'recurring'
    })),
    currentCycleMonth: 1,
    isMonth1Part1Paid: false,
    isMonth1Part2Paid: false,
    nextBillingDate: nextBillingDate.toISOString(),
    lastBillingDate: new Date().toISOString()
  };

  await setDoc(clientRef, {
    contractType: isRecurring ? 'recurring' : 'one_time',
    monthlyQuota: isRecurring ? netQuotationTotal : baseAmount,
    activePlan: isRecurring ? activePlan : null,
    updatedAt: new Date().toISOString(),
    portalAccessActive: true
  }, { merge: true });

  // 4. Generate First Invoice (50% of net total — preserving discounts from quotation)
  const invoiceAmount = isRecurring ? (netQuotationTotal / 2) : netQuotationTotal;
  const invoiceId = await getNextSequenceNumber(firestore, 'invoice');

  const newInvoice = {
    clientId: clientId,
    invoiceNumber: invoiceId,
    totalAmount: invoiceAmount,
    subtotalAmount: isRecurring ? (netSubtotal / 2) : netSubtotal,
    taxAmount: isRecurring ? (netTax / 2) : netTax,
    totalDiscount: isRecurring ? (netDiscount / 2) : netDiscount,
    firstPaymentAmount: invoiceAmount,
    secondPaymentAmount: 0,
    amountPaid: 0,
    issueDate: new Date().toISOString(),
    firstPaymentDueDate: new Date().toISOString(),
    status: 'draft',
    isPlanInvoice: isRecurring,
    planPartNumber: isRecurring ? 1 : null,
    billingMonth: new Date().toISOString().slice(0, 7), // "YYYY-MM"
    items: isRecurring ? [
      {
        id: `item-${Date.now()}`,
        description: `Plan Mensual - Pago 1/2 (50%) - ${quotation.title || 'Servicios recurrentes'}`,
        quantity: 1,
        unitPrice: invoiceAmount,
        total: invoiceAmount,
        discount: netDiscount / 2,
        paymentCategory: 'plan'
      }
    ] : quotation.items.map((it: any) => ({
      id: it.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: it.description || it.serviceName || 'Item',
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      total: it.unitPrice * it.quantity,
      discount: it.discount || 0,
      discountType: it.discountType,
      discountValue: it.discountValue,
      ivaRate: it.ivaRate,
      ivaType: it.ivaType,
      paymentCategory: 'extra'
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(firestore, 'clients', clientId, 'invoices', invoiceId), newInvoice);

  // 5. Add notification
  const notificationId = `notif-${Date.now()}`;
  await setDoc(doc(firestore, 'notifications', notificationId), {
    type: 'system',
    priority: 'high',
    title: 'Nueva Propuesta Aceptada',
    message: `El cliente ${leadOrClient.clientName || leadOrClient.name || 'Desconocido'} ha aceptado la propuesta. Se ha generado la primera factura de plan (50%) lista para enviar.`,
    targetUserId: 'all',
    read: false,
    relatedId: invoiceId,
    relatedType: 'invoice',
    createdAt: new Date().toISOString()
  });

  return invoiceId;
}

export async function processInvoicePayment(
  firestore: Firestore,
  clientId: string,
  invoice: any,
  clientName: string = 'Cliente'
) {
  const invRef = doc(firestore, 'clients', clientId, 'invoices', invoice.id);
  
  await updateDoc(invRef, {
    status: 'paid',
    paymentDate: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  if (invoice.isPlanInvoice) {
    const clientRef = doc(firestore, 'clients', clientId);
    const clientSnap = await getDoc(clientRef);
    if (!clientSnap.exists()) return;
    
    const clientData = clientSnap.data();
    const activePlan = clientData?.activePlan;

    if (activePlan) {
      if (invoice.planPartNumber === 1) {
        activePlan.isMonth1Part1Paid = true;
        // Notify that Part 2 is ready to be generated
        await addDoc(collection(firestore, 'notifications'), {
          title: 'Parte 1/2 Pagada - Generar Parte 2',
          message: `El cliente ${clientName} ha pagado la primera parte. Ya puedes generar la factura de la Parte 2/2.`,
          type: 'payment_confirmed',
          priority: 'high',
          targetUserId: 'all',
          read: false,
          relatedId: clientId,
          relatedType: 'client',
          createdAt: new Date().toISOString()
        });
      } else if (invoice.planPartNumber === 2) {
        activePlan.isMonth1Part2Paid = true;
        // Transition to recurring cycle
        activePlan.currentCycleMonth = 2;
        activePlan.status = 'active'; 

        // Update the next billing date for the standard 1st/16th cycle based on planStartDay
        if (activePlan.planStartDay === 30) {
            // New cycle will be 1st
            const nextD = new Date();
            nextD.setMonth(nextD.getMonth() + 1, 1);
            activePlan.nextBillingDate = nextD.toISOString();
        } else {
            // New cycle will be 16th
            const nextD = new Date();
            nextD.setDate(16);
            if (new Date().getDate() > 15) {
                nextD.setMonth(nextD.getMonth() + 1);
            }
            activePlan.nextBillingDate = nextD.toISOString();
        }

        await addDoc(collection(firestore, 'notifications'), {
          title: 'Plan Transicionado a Ciclo Recurrente',
          message: `El cliente ${clientName} ha completado el Mes 1 y ahora está en ciclo de facturación 15/30 estándar.`,
          type: 'system',
          priority: 'medium',
          targetUserId: 'all',
          read: false,
          relatedId: clientId,
          relatedType: 'client',
          createdAt: new Date().toISOString()
        });
      }
      await updateDoc(clientRef, { activePlan, updatedAt: new Date().toISOString() });
    }
  }

  // Sync client's financial status based on remaining invoices
  await syncClientFinancialStatus(firestore, clientId);
}

export async function generateMonth1Part2(
  firestore: Firestore,
  clientId: string,
  clientName: string = 'Cliente'
) {
  const clientRef = doc(firestore, 'clients', clientId);
  const clientSnap = await getDoc(clientRef);
  if (!clientSnap.exists()) throw new Error("Cliente no existe");

  const clientData = clientSnap.data();
  const activePlan = clientData?.activePlan;

  if (!activePlan) throw new Error("El cliente no tiene un plan activo.");
  if (activePlan.isMonth1Part2Paid || (activePlan.currentCycleMonth !== 1)) {
     throw new Error("El cliente ya pasó la fase inicial del plan o ya pagó la parte 2.");
  }

  const invoiceAmount = activePlan.baseRecurringAmount / 2;
  const invoiceId = await getNextSequenceNumber(firestore, 'invoice');

  let subtotalAmt = 0;
  let taxAmt = 0;
  let totalDiscAmt = 0;
  let formattedItems: any[] = [];

  if (activePlan.services && activePlan.services.length > 0) {
      formattedItems = activePlan.services.map((svc: any) => {
          const lineSubtotal = (svc.unitPrice * svc.quantity) / 2;
          const lineDisc = (svc.discountValue || 0) / 2;
          const lineNet = lineSubtotal - lineDisc;
          // FIX #2: el IVA es inclusivo (igual que en la cotización: se extrae del total, no se agrega encima)
          const ivaRate = (svc.ivaRate || 0) / 100;
          const lineBase = ivaRate > 0 ? lineNet / (1 + ivaRate) : lineNet;
          const lineTax = lineNet - lineBase;
          
          subtotalAmt += lineSubtotal;
          totalDiscAmt += lineDisc;
          taxAmt += lineTax;

          return {
              id: `item-${Math.random().toString(36).substr(2, 9)}`,
              description: `Plan Mensual - Pago 2/2 (50%) - ${svc.description || 'Servicio'}`,
              quantity: svc.quantity,
              unitPrice: svc.unitPrice / 2,
              total: lineNet,
              discount: lineDisc,
              discountType: svc.discountType || 'amount',
              discountValue: svc.discountValue ? svc.discountValue / 2 : 0,
              ivaRate: svc.ivaRate || 0,
              ivaType: svc.ivaType || 'none',
              paymentCategory: 'plan'
          };
      });
  } else {
      subtotalAmt = invoiceAmount;
      formattedItems = [{
          id: `item-${Math.random().toString(36).substr(2, 9)}`,
          description: `Plan Mensual - Pago 2/2 (50%) - Servicios`,
          quantity: 1,
          unitPrice: invoiceAmount,
          total: invoiceAmount,
          discount: 0,
          paymentCategory: 'plan'
      }];
  }

  const totalFinal = subtotalAmt - totalDiscAmt + taxAmt;

  const newInvoice = {
    clientId: clientId,
    invoiceNumber: invoiceId,
    totalAmount: totalFinal,
    subtotalAmount: subtotalAmt,
    taxAmount: taxAmt,
    totalDiscount: totalDiscAmt,
    amountPaid: 0,
    issueDate: new Date().toISOString(),
    status: 'draft',
    isPlanInvoice: true,
    planPartNumber: 2,
    billingMonth: activePlan.lastBillingDate ? activePlan.lastBillingDate.slice(0, 7) : new Date().toISOString().slice(0, 7),
    items: formattedItems,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(firestore, 'clients', clientId, 'invoices', invoiceId), newInvoice);

  // Notify that a new draft is ready to be sent
  await addDoc(collection(firestore, 'notifications'), {
    title: 'Factura de Plan Lista para Enviar',
    message: `Se ha generado el borrador de la Parte 2/2 para ${clientName}.`,
    type: 'general',
    priority: 'medium',
    targetUserId: 'all',
    read: false,
    relatedId: invoiceId,
    relatedType: 'invoice',
    createdAt: new Date().toISOString()
  });

  return invoiceId;
}

export async function cancelPlanRequest(
  firestore: Firestore,
  clientId: string,
  clientName: string = 'Cliente'
) {
  const clientRef = doc(firestore, 'clients', clientId);
  const clientSnap = await getDoc(clientRef);
  if (!clientSnap.exists()) throw new Error("Cliente no existe");

  const clientData = clientSnap.data();
  const activePlan = clientData?.activePlan;

  if (!activePlan) throw new Error("No hay un plan activo para cancelar.");

  const tDay = new Date().getDate();
  const planStartDay = activePlan.planStartDay || 30; // 30 means cycle starts on 1st

  let isLate = false;
  if (planStartDay === 15) {
    // Cycle starts 16th. Late if 16-31.
    if (tDay > 15) isLate = true;
  } else {
    // Cycle starts 1st. Late if 31, 1-15.
    if (tDay === 31 || (tDay >= 1 && tDay <= 15)) isLate = true;
  }

  const updates: any = {
    'activePlan.status': 'cancelled',
    updatedAt: new Date().toISOString()
  };

  await updateDoc(clientRef, updates);

  if (isLate) {
    // Generate draft invoice for 50%
    const invoiceAmount = activePlan.baseRecurringAmount / 2;
    const invoiceId = await getNextSequenceNumber(firestore, 'invoice');

    const newInvoice = {
      clientId: clientId,
      invoiceNumber: invoiceId,
      totalAmount: invoiceAmount,
      amountPaid: 0,
      issueDate: new Date().toISOString(),
      status: 'draft',
      isPlanInvoice: false,
      billingMonth: new Date().toISOString().slice(0, 7),
      items: [
        {
          description: `Recargo por cancelación extemporánea (50% de mensualidad)`,
          quantity: 1,
          unitPrice: invoiceAmount,
          total: invoiceAmount,
          paymentCategory: 'extra'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(firestore, 'clients', clientId, 'invoices', invoiceId), newInvoice);

    await addDoc(collection(firestore, 'notifications'), {
      title: 'Cancelación con Recargo',
      message: `El cliente ${clientName} ha cancelado su plan tarde. Se generó factura de recargo.`,
      type: 'general',
      priority: 'high',
      targetUserId: 'all',
      read: false,
      relatedId: invoiceId,
      relatedType: 'invoice',
      createdAt: new Date().toISOString()
    });
  } else {
    await addDoc(collection(firestore, 'notifications'), {
      title: 'Plan Cancelado',
      message: `El cliente ${clientName} ha cancelado su plan a tiempo.`,
      type: 'system',
      priority: 'medium',
      targetUserId: 'all',
      read: false,
      relatedId: clientId,
      relatedType: 'client',
      createdAt: new Date().toISOString()
    });
  }

  return { isLate };
}
