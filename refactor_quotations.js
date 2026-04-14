const fs = require('fs');
const path = 'c:/Users/Lenovo Flex i7/Documents/Apps/KairosVisuals/src/app/quotations/create/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add quotationId and currentVersion
if (!content.includes('quotationId')) {
    content = content.replace(
        "const leadId = searchParams.get('leadId');\n  const clientId = searchParams.get('clientId');",
        "const leadId = searchParams.get('leadId');\n  const clientId = searchParams.get('clientId');\n  const quotationId = searchParams.get('quotationId');"
    );
    content = content.replace(
        "const [showPreview, setShowPreview] = useState(false);",
        "const [showPreview, setShowPreview] = useState(false);\n  const [currentVersion, setCurrentVersion] = useState(1);"
    );
}

// 2. Add fetching quotation logic
const fetchQuotationLogic = `
        // Fetch Existing Quotation if Edit
        if (quotationId) {
            const qSnap = await getDoc(doc(firestore, 'clients', clientId, 'quotations', quotationId));
            if (qSnap.exists()) {
                const qData = qSnap.data();
                setItems(qData.items || []);
                setDetails({
                    title: qData.title || 'Cotización de Servicios',
                    validityDays: qData.validityDays || 5,
                    notes: qData.notes || ''
                });
                setCurrentVersion(qData.version || 1);
            }
        }
`;
if (!content.includes('Fetch Existing Quotation')) {
    content = content.replace(
        // Inject at the end of try block in loadData
        "const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() } as TaskType));\n        setTaskTypes(tasks);",
        "const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() } as TaskType));\n        setTaskTypes(tasks);\n\n" + fetchQuotationLogic
    );
}

// 3. Modifying handleSaveQuotation
const handleSaveLogicOriginal = `      const quotationsRef = collection(firestore, 'clients', clientId, 'quotations');
      await addDoc(quotationsRef, {
        clientId,
        title: details.title,
        validityDays: details.validityDays,
        notes: details.notes,
        status: 'draft',
        items: items,
        subtotal,
        totalDiscounts,
        ivaAmount,
        grandTotal,
        createdAt: new Date().toISOString(),
      });
      
      toast({ title: "¡Éxito!", description: "Cotización guardada como borrador." });
      router.push('/clients'); // Could go to the client's page or quotation details`;

const handleSaveLogicNew = `      const quotationsRef = collection(firestore, 'clients', clientId, 'quotations');
      
      if (quotationId) {
          // Update the old one to superseded
          await updateDoc(doc(firestore, 'clients', clientId, 'quotations', quotationId), { status: 'superseded' });
      }

      await addDoc(quotationsRef, {
        clientId,
        leadId, // Save referential lead too
        title: details.title,
        validityDays: details.validityDays,
        notes: details.notes,
        status: 'draft',
        version: quotationId ? currentVersion + 1 : 1,
        parentId: quotationId || null,
        items: items,
        subtotal,
        totalDiscounts,
        ivaAmount,
        grandTotal,
        createdAt: new Date().toISOString(),
      });
      
      toast({ title: "¡Éxito!", description: quotationId ? "Nueva versión generada guardada." : "Cotización guardada como borrador." });
      router.push('/clients?tab=in_progress&openLead=' + leadId);`;

if (content.includes("status: 'draft',") && !content.includes("superseded")) {
    content = content.replace(handleSaveLogicOriginal, handleSaveLogicNew);
    
    // Fallback if the strict replacement failed
    if (content.includes("status: 'draft',") && !content.includes("superseded")) {
        console.log("Fallback replacement used.");
        content = content.replace(/const quotationsRef = collection\([\s\S]*?router\.push\('\/clients'\);\s*\/\/ Could go to the client's page or quotation details/m, handleSaveLogicNew);
    }
} else if (content.includes("router.push('/clients');")) {
    content = content.replace("router.push('/clients');", "router.push('/clients?tab=in_progress&openLead=' + leadId);");
}

// 4. Update the Back button
content = content.replace(
    'onClick={() => router.back()}',
    'onClick={() => router.push(\'/clients?tab=in_progress&openLead=\' + leadId)}'
);

// We need updateDoc in imports
if (!content.includes('updateDoc')) {
    content = content.replace(
        "import { collection, doc, getDoc, getDocs, setDoc, addDoc } from 'firebase/firestore';",
        "import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc } from 'firebase/firestore';"
    );
}

fs.writeFileSync(path, content);
console.log('✅ Refactored quotations create page logic');
