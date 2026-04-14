/**
 * notificationService.ts
 * Helpers para crear y gestionar notificaciones en Firestore.
 * Colección: /notifications/{notificationId}
 *
 * Cada notificación tiene un campo targetUserId:
 *  - UID específico → solo ese usuario la ve
 *  - 'all'          → todos los admins/administrativos la ven
 */

import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import type {
  AppNotification,
  NotificationType,
  NotificationPriority,
} from './types';

// ── Constantes ──────────────────────────────────────────────────────────────

const COLLECTION = 'notifications';
const MAX_NOTIFICATIONS = 100; // máximo a leer por usuario

// ── Tipo de payload de creación (sin id, sin read, sin createdAt) ─────────

type CreateNotificationPayload = Omit<AppNotification, 'id' | 'read' | 'createdAt' | 'readAt'>;

// ── Crear notificación ────────────────────────────────────────────────────

export async function createNotification(
  firestore: Firestore,
  payload: CreateNotificationPayload
): Promise<string> {
  const ref = await addDoc(collection(firestore, COLLECTION), {
    ...payload,
    read: false,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

// ── Marcar como leída ────────────────────────────────────────────────────────

export async function markNotificationRead(
  firestore: Firestore,
  notificationId: string
): Promise<void> {
  await updateDoc(doc(firestore, COLLECTION, notificationId), {
    read: true,
    readAt: new Date().toISOString(),
  });
}

// ── Marcar todas como leídas ──────────────────────────────────────────────

export async function markAllNotificationsRead(
  firestore: Firestore,
  userId: string
): Promise<void> {
  const q = query(
    collection(firestore, COLLECTION),
    where('read', '==', false),
    where('targetUserId', 'in', [userId, 'all'])
  );
  const snap = await getDocs(q);
  const batch = writeBatch(firestore);
  snap.docs.forEach(d => {
    batch.update(d.ref, { read: true, readAt: new Date().toISOString() });
  });
  await batch.commit();
}

// ── Archivar notificación ───────────────────────────────────────────────────

export async function archiveNotification(
  firestore: Firestore,
  notificationId: string
): Promise<void> {
  await updateDoc(doc(firestore, COLLECTION, notificationId), {
    archived: true,
    archivedAt: new Date().toISOString(),
  });
}

// ── Archivar todas las notificaciones del usuario ───────────────────────────

export async function archiveAllNotifications(
  firestore: Firestore,
  userId: string
): Promise<void> {
  const q = query(
    collection(firestore, COLLECTION),
    where('archived', '!=', true),
    where('targetUserId', 'in', [userId, 'all'])
  );
  const snap = await getDocs(q);
  const batch = writeBatch(firestore);
  snap.docs.forEach(d => {
    batch.update(d.ref, { 
      archived: true, 
      archivedAt: new Date().toISOString() 
    });
  });
  await batch.commit();
}

// ── Helpers de notificaciones específicas ────────────────────────────────────

/**
 * Notificación: Cliente reportó pago de una factura.
 * Destinatario: 'all' (todos los admins).
 */
export async function notifyPaymentReported(
  firestore: Firestore,
  params: { invoiceId: string; clientName: string; invoiceNumber: string; amount: number; clientId: string }
) {
  return createNotification(firestore, {
    type: 'payment_reported',
    priority: 'high',
    title: '💳 Pago Reportado',
    message: `${params.clientName} reportó el pago de la factura ${params.invoiceNumber} por ₡${params.amount.toLocaleString('es-CR')}.`,
    targetUserId: 'all',
    actionUrl: '/invoicing',
    relatedId: params.invoiceId,
    relatedType: 'invoice',
  });
}

/**
 * Notificación: Equipo confirmó pago de una factura.
 * Destinatario: UID del cliente (para su portal).
 */
export async function notifyPaymentConfirmed(
  firestore: Firestore,
  params: { invoiceId: string; clientUserId: string; invoiceNumber: string; amount: number }
) {
  return createNotification(firestore, {
    type: 'payment_confirmed',
    priority: 'medium',
    title: '✅ Pago Confirmado',
    message: `Tu pago de la factura ${params.invoiceNumber} por ₡${params.amount.toLocaleString('es-CR')} fue confirmado por el equipo.`,
    targetUserId: params.clientUserId,
    actionUrl: '/client-portal/billing',
    relatedId: params.invoiceId,
    relatedType: 'invoice',
  });
}

/**
 * Notificación: Tarea completada en kanban.
 * Destinatario: 'all'.
 */
export async function notifyTaskDone(
  firestore: Firestore,
  params: { taskId: string; taskName: string; assignedTo: string; clientName?: string }
) {
  return createNotification(firestore, {
    type: 'task_done',
    priority: 'low',
    title: '🎉 Tarea Completada',
    message: `"${params.taskName}" fue marcada como Done${params.clientName ? ` (${params.clientName})` : ''}.`,
    targetUserId: 'all',
    actionUrl: '/kanban',
    relatedId: params.taskId,
    relatedType: 'task',
  });
}

/**
 * Notificación: Tarea asignada a un usuario.
 * Destinatario: UID asignado.
 */
export async function notifyTaskAssigned(
  firestore: Firestore,
  params: { taskId: string; taskName: string; assigneeUid: string; assignerName: string; dueDate?: string }
) {
  return createNotification(firestore, {
    type: 'task_assigned',
    priority: 'medium',
    title: '📋 Nueva Tarea Asignada',
    message: `${params.assignerName} te asignó: "${params.taskName}"${params.dueDate ? ` — vence el ${params.dueDate}` : ''}.`,
    targetUserId: params.assigneeUid,
    actionUrl: '/kanban',
    relatedId: params.taskId,
    relatedType: 'task',
  });
}

/**
 * Notificación: Factura enviada al cliente.
 * Destinatario: 'all'.
 */
export async function notifyInvoiceSent(
  firestore: Firestore,
  params: { invoiceId: string; invoiceNumber: string; clientName: string; amount: number }
) {
  return createNotification(firestore, {
    type: 'invoice_sent',
    priority: 'medium',
    title: '🧾 Factura Enviada',
    message: `Factura ${params.invoiceNumber} enviada a ${params.clientName} por ₡${params.amount.toLocaleString('es-CR')}.`,
    targetUserId: 'all',
    actionUrl: '/invoicing',
    relatedId: params.invoiceId,
    relatedType: 'invoice',
  });
}

/**
 * Notificación: Consumo del plan superó el 80%.
 * Destinatario: 'all'.
 */
export async function notifyPlanLimitReached(
  firestore: Firestore,
  params: { clientId: string; clientName: string; consumed: number; quota: number }
) {
  const pct = Math.round((params.consumed / params.quota) * 100);
  return createNotification(firestore, {
    type: 'plan_limit_reached',
    priority: 'high',
    title: '⚠️ Plan al Límite',
    message: `${params.clientName} ha consumido el ${pct}% de su plan mensual (${params.consumed}/${params.quota} unidades).`,
    targetUserId: 'all',
    actionUrl: `/clients`,
    relatedId: params.clientId,
    relatedType: 'client',
  });
}

/**
 * Notificación: Factura vencida.
 * Destinatario: 'all'.
 */
export async function notifyPaymentOverdue(
  firestore: Firestore,
  params: { invoiceId: string; invoiceNumber: string; clientName: string; daysOverdue: number; amount: number }
) {
  return createNotification(firestore, {
    type: 'payment_overdue',
    priority: 'critical',
    title: '🚨 Factura Vencida',
    message: `La factura ${params.invoiceNumber} de ${params.clientName} llevan ${params.daysOverdue} días vencida (₡${params.amount.toLocaleString('es-CR')}).`,
    targetUserId: 'all',
    actionUrl: '/invoicing',
    relatedId: params.invoiceId,
    relatedType: 'invoice',
  });
}
