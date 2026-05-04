import os

path = r"c:\Users\Lenovo Flex i7\Documents\Apps\KairosVisuals\src\app\clients\[id]\page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# dashboard extraction
dashboard_start = content.find('<TabsContent value="dashboard"')
dashboard_end = content.find('</TabsContent>', dashboard_start) + len('</TabsContent>')
dashboard_content = content[dashboard_start:dashboard_end]

# invoices extraction
invoices_start = content.find('<TabsContent value="invoices"')
invoices_end = content.find('</TabsContent>', invoices_start) + len('</TabsContent>')
invoices_content = content[invoices_start:invoices_end]

# profile extraction
profile_start = content.find('<TabsContent value="profile"')
profile_end = content.find('</TabsContent>', profile_start) + len('</TabsContent>')
profile_content = content[profile_start:profile_end]

# services detail modal extraction
modal_start = content.find('<Dialog open={isServicesDetailOpen}')
modal_end = content.find('</Dialog>', modal_start) + len('</Dialog>')
modal_content = content[modal_start:modal_end]

dashboard_comp = """import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Sparkles, Receipt, MessageCircle, Calendar, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivePlansCard } from '../ActivePlansCard';

export function ClientDashboardTab({
  leadOnboarding,
  handleOpenBriefing,
  activePlans,
  activeProjects,
  clientData,
  selectedLead,
  router,
  setPreviewQuotation,
  setIsPreviewOpen,
  isAccountPending,
  isAccountOk,
  accountStatusLabel,
  accountStatusDescription,
  setIsServicesDetailOpen,
  handleGenerateMonth1Part2,
  setIsCancelPlanOpen
}: any) {
  return (
""" + dashboard_content + """
  );
}
"""

invoices_comp = """import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { SearchIcon, FileText, Eye, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ClientInvoicesTab({
  docsSearchTerm,
  setDocsSearchTerm,
  filteredQuotations,
  setPreviewQuotation,
  setIsPreviewOpen,
  filteredInvoices
}: any) {
  return (
""" + invoices_content + """
  );
}
"""

profile_comp = """import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Contact, Edit2, Copy, Check, Mail, MessageSquare, Sparkles, FileText, TrendingUp, CheckCircle, Globe, X, Loader2, Save, Trash2, Plus, Instagram, Facebook, Music2, Linkedin, Twitter, Youtube, AtSign, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function ClientProfileTab({
  leadUser,
  selectedLead,
  leadOnboarding,
  handleOpenEditProfile,
  copyToClipboard,
  copiedField,
  formatPhone,
  handleOpenBriefing,
  isEditingSocials,
  handleStartEditSocials,
  handleCancelEditSocials,
  handleSaveSocials,
  isProcessing,
  editableSocials,
  handleUpdateSocialField,
  PLATFORMS,
  handleRemoveSocialRow,
  handleAddSocialRow
}: any) {
  return (
""" + profile_content + """
  );
}
"""

services_modal_comp = """import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ServicesDetailModal({
  isServicesDetailOpen,
  setIsServicesDetailOpen,
  activeQuotation,
  router,
  selectedLead
}: any) {
  return (
""" + modal_content + """
  );
}
"""

os.makedirs(r"c:\Users\Lenovo Flex i7\Documents\Apps\KairosVisuals\src\app\clients\[id]\components\tabs", exist_ok=True)
with open(r"c:\Users\Lenovo Flex i7\Documents\Apps\KairosVisuals\src\app\clients\[id]\components\tabs\ClientDashboardTab.tsx", "w", encoding="utf-8") as f: f.write(dashboard_comp)
with open(r"c:\Users\Lenovo Flex i7\Documents\Apps\KairosVisuals\src\app\clients\[id]\components\tabs\ClientInvoicesTab.tsx", "w", encoding="utf-8") as f: f.write(invoices_comp)
with open(r"c:\Users\Lenovo Flex i7\Documents\Apps\KairosVisuals\src\app\clients\[id]\components\tabs\ClientProfileTab.tsx", "w", encoding="utf-8") as f: f.write(profile_comp)
with open(r"c:\Users\Lenovo Flex i7\Documents\Apps\KairosVisuals\src\app\clients\[id]\components\modals\ServicesDetailModal.tsx", "w", encoding="utf-8") as f: f.write(services_modal_comp)

new_dashboard = '''<ClientDashboardTab
            leadOnboarding={leadOnboarding}
            handleOpenBriefing={handleOpenBriefing}
            activePlans={activePlans}
            activeProjects={activeProjects}
            clientData={clientData}
            selectedLead={selectedLead}
            router={router}
            setPreviewQuotation={setPreviewQuotation}
            setIsPreviewOpen={setIsPreviewOpen}
            isAccountPending={isAccountPending}
            isAccountOk={isAccountOk}
            accountStatusLabel={accountStatusLabel}
            accountStatusDescription={accountStatusDescription}
            setIsServicesDetailOpen={setIsServicesDetailOpen}
            handleGenerateMonth1Part2={handleGenerateMonth1Part2}
            setIsCancelPlanOpen={setIsCancelPlanOpen}
          />'''

new_invoices = '''<ClientInvoicesTab
            docsSearchTerm={docsSearchTerm}
            setDocsSearchTerm={setDocsSearchTerm}
            filteredQuotations={filteredQuotations}
            setPreviewQuotation={setPreviewQuotation}
            setIsPreviewOpen={setIsPreviewOpen}
            filteredInvoices={filteredInvoices}
          />'''

new_profile = '''<ClientProfileTab
            leadUser={leadUser}
            selectedLead={selectedLead}
            leadOnboarding={leadOnboarding}
            handleOpenEditProfile={handleOpenEditProfile}
            copyToClipboard={copyToClipboard}
            copiedField={copiedField}
            formatPhone={formatPhone}
            handleOpenBriefing={handleOpenBriefing}
            isEditingSocials={isEditingSocials}
            handleStartEditSocials={handleStartEditSocials}
            handleCancelEditSocials={handleCancelEditSocials}
            handleSaveSocials={handleSaveSocials}
            isProcessing={isProcessing}
            editableSocials={editableSocials}
            handleUpdateSocialField={handleUpdateSocialField}
            PLATFORMS={PLATFORMS}
            handleRemoveSocialRow={handleRemoveSocialRow}
            handleAddSocialRow={handleAddSocialRow}
          />'''

new_modal = '''<ServicesDetailModal
        isServicesDetailOpen={isServicesDetailOpen}
        setIsServicesDetailOpen={setIsServicesDetailOpen}
        activeQuotation={activeQuotation}
        router={router}
        selectedLead={selectedLead}
      />'''

content = content.replace(dashboard_content, new_dashboard)
content = content.replace(invoices_content, new_invoices)
content = content.replace(profile_content, new_profile)
content = content.replace(modal_content, new_modal)

imports = """
import { ClientDashboardTab } from './components/tabs/ClientDashboardTab';
import { ClientInvoicesTab } from './components/tabs/ClientInvoicesTab';
import { ClientProfileTab } from './components/tabs/ClientProfileTab';
import { ServicesDetailModal } from './components/modals/ServicesDetailModal';
"""

if "import { ClientDashboardTab }" not in content:
    last_import_idx = content.rfind("import ")
    if last_import_idx != -1:
        end_of_last_import = content.find("\\n", last_import_idx) + 1
        content = content[:end_of_last_import] + imports + content[end_of_last_import:]
    else:
        content = imports + content

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Extraction completed successfully!")
