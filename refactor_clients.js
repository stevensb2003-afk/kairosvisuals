const fs = require('fs');
const path = 'c:/Users/Lenovo Flex i7/Documents/Apps/KairosVisuals/src/app/clients/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add useSearchParams
if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
}

// 2. Add searchParams hook and new state
if (!content.includes('useSearchParams()')) {
    content = content.replace(
        "export default function ClientsPage() {",
        "export default function ClientsPage() {\n  const searchParams = useSearchParams();\n  const openLead = searchParams.get('openLead');\n  const tabParam = searchParams.get('tab');"
    );
    
    // Set active tab based on param
    content = content.replace(
        'const [activeTab, setActiveTab] = useState("fichas");',
        'const [activeTab, setActiveTab] = useState(tabParam || "fichas");'
    );
    
    // Add quotations state
    content = content.replace(
        'const [leadUser, setLeadUser] = useState<any>(null);',
        'const [leadUser, setLeadUser] = useState<any>(null);\n  const [leadQuotations, setLeadQuotations] = useState<any[]>([]);'
    );
}

// 3. Add auto-open effect
const autoOpenEffect = `
  useEffect(() => {
    const autoOpen = async () => {
      if (openLead && !openDialogId) {
         const allReqs = [...requests, ...inProgressRequests];
         if (allReqs.length > 0) {
            const req = allReqs.find(r => r.id === openLead);
            if (req) {
               setOpenDialogId(req.id);
               await handleOpenLead(req);
            }
         }
      }
    };
    autoOpen();
  }, [openLead, requests, inProgressRequests]);
`;
if (!content.includes('autoOpen()')) {
    content = content.replace('  const copyToClipboard =', autoOpenEffect + '\n  const copyToClipboard =');
}

// 4. Update handleOpenLead to fetch quotations
const fetchQuotesLogic = `
      // Fetch Quotations for this client
      const qQuotes = query(collection(firestore, 'clients', lead.clientId, 'quotations'), orderBy('createdAt', 'desc'));
      const quotesSnap = await getDocs(qQuotes);
      setLeadQuotations(quotesSnap.docs.map(d => ({id: d.id, ...d.data()})));
`;
if (!content.includes('qQuotes')) {
    content = content.replace(
        // Inject right after setLeadOnboarding
        'if (!snaps.empty) {\n        setLeadOnboarding(snaps.docs[0].data());\n      }',
        'if (!snaps.empty) {\n        setLeadOnboarding(snaps.docs[0].data());\n      }\n' + fetchQuotesLogic
    );
}

// 5. Add "Propuestas Generadas" section to the modal
const quotationsSection = `
                                              <div className="h-px bg-border w-full" />
                                              {/* Propuestas Generadas */}
                                              <div className="space-y-4">
                                                  <h4 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                                                      <FileText className="w-4 h-4" /> Propuestas Generadas
                                                  </h4>
                                                  {leadQuotations.length > 0 ? (
                                                      <div className="space-y-3">
                                                          {leadQuotations.map((q, idx) => (
                                                              <div key={idx} className={"flex items-center justify-between p-3 rounded-lg border " + (q.status === 'superseded' ? 'bg-secondary/20 opacity-60' : 'bg-card')}>
                                                                  <div>
                                                                      <p className="font-semibold text-sm">{q.title}</p>
                                                                      <p className="text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleDateString()} - {q.status === 'superseded' ? 'Reemplazada' : (q.status === 'draft' ? 'Borrador' : q.status)}</p>
                                                                  </div>
                                                                  <Button size="sm" variant="outline" onClick={() => router.push(\`/quotations/create?quotationId=\${q.id}&leadId=\${req.id}&clientId=\${req.clientId}\`)}>
                                                                      Editar / Ver
                                                                  </Button>
                                                              </div>
                                                          ))}
                                                      </div>
                                                  ) : (
                                                      <p className="text-sm text-muted-foreground italic bg-secondary/50 p-4 rounded-lg text-center">No se han generado cotizaciones para este cliente.</p>
                                                  )}
                                              </div>
`;
if (!content.includes('Propuestas Generadas')) {
     const targetAnchor = '{/* Briefing Data Section */}';
     content = content.replace(targetAnchor, quotationsSection + '\n                                              ' + targetAnchor);
}

fs.writeFileSync(path, content);
console.log('✅ Refactored clients/page.tsx logic');
