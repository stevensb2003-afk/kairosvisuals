'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuoteBuilder } from '@/app/solicitudes/_hooks/useQuoteBuilder';

import { ClientSelectorView } from '@/app/solicitudes/_components/ClientSelectorView';
import { ProposalHeaderSection } from '@/app/solicitudes/_components/ProposalHeaderSection';
import { DocumentDetailsSection } from '@/app/solicitudes/_components/DocumentDetailsSection';
import { QuoteItemsTable } from '@/app/solicitudes/_components/QuoteItemsTable';
import { BottomActionBar } from '@/app/solicitudes/_components/BottomActionBar';
import { QuotePreviewDialog } from '@/app/solicitudes/_components/QuotePreviewDialog';
import { PackageSelectorDialog } from '@/app/solicitudes/_components/PackageSelectorDialog';
import { PlanLoaderDialog } from '@/app/solicitudes/_components/PlanLoaderDialog';

function CreateQuotationPageInner() {
  const { state, setters, actions } = useQuoteBuilder();
  const { s, st, a } = { s: state, st: setters, a: actions };

  const isReadOnly = s.currentStatus === 'accepted';

  // Loading state
  if (s.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Cargando propuesta...</p>
        </div>
      </div>
    );
  }

  // Client selection screen
  if (!s.selectedClientId) {
    return (
      <ClientSelectorView
        allClients={s.allClients}
        clientSearch={s.clientSearch}
        newClient={s.newClient}
        isFormValid={s.isFormValid}
        isSaving={s.isSaving}
        onSelectClient={st.setSelectedClientId}
        onSearchChange={st.setClientSearch}
        onNewClientChange={(field, val) => st.setNewClient({ ...s.newClient, [field]: val })}
        onCreateClient={a.handleCreateClient}
      />
    );
  }

  // Main proposal builder
  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* Header: breadcrumb, status, company/client cards */}
      <ProposalHeaderSection
        companySettings={s.companySettings}
        clientData={s.clientData}
        isReadOnly={isReadOnly}
        currentStatus={s.currentStatus}
        currentVersion={s.currentVersion}
      />

      {/* Document details: title, validity, contract type, start date, notes */}
      <DocumentDetailsSection
        details={s.details}
        contractType={s.contractType}
        isPlanUpdate={s.isPlanUpdate}
        isReadOnly={isReadOnly}
        clientData={s.clientData}
        startDateOptions={a.getStartDateOptions()}
        onDetailsChange={(field, val) => st.setDetails({ ...s.details, [field]: val })}
        onContractTypeChange={st.setContractType}
        onPlanUpdateChange={st.setIsPlanUpdate}
      />

      {/* Items table with service selection, pricing and totals */}
      <QuoteItemsTable
        items={s.items}
        itemCalculations={s.itemCalculations}
        services={s.services}
        companySettings={s.companySettings}
        isReadOnly={isReadOnly}
        subtotal={s.subtotal}
        totalDiscounts={s.totalDiscounts}
        globalDiscountType={s.globalDiscountType}
        globalDiscountValue={s.globalDiscountValue}
        globalDiscountAmount={s.globalDiscountAmount}
        ivaAmount={s.ivaAmount}
        totalAmount={s.totalAmount}
        onAddItem={a.addItem}
        onRemoveItem={a.removeItem}
        onUpdateItem={a.updateItem}
        onOpenPlanLoader={() => st.setIsPlanLoaderOpen(true)}
        onGlobalDiscountTypeToggle={() =>
          st.setGlobalDiscountType(s.globalDiscountType === 'percentage' ? 'amount' : 'percentage')
        }
        onGlobalDiscountValueChange={st.setGlobalDiscountValue}
      />

      {/* Fixed bottom action bar */}
      <BottomActionBar
        totalAmount={s.totalAmount}
        isSaving={s.isSaving}
        isReadOnly={isReadOnly}
        onPreview={() => st.setShowPreview(true)}
        onSave={() => a.handleAction('save')}
        onPublish={() => a.handleAction('publish')}
      />

      {/* Preview dialog */}
      <QuotePreviewDialog
        isOpen={s.showPreview}
        onClose={() => st.setShowPreview(false)}
        isExporting={s.isExporting}
        isSaving={s.isSaving}
        clientData={s.clientData}
        companySettings={s.companySettings}
        details={s.details}
        itemCalculations={s.itemCalculations}
        totalAmount={s.totalAmount}
        subtotalAmount={s.subtotalAmount}
        ivaAmount={s.ivaAmount}
        totalDiscounts={s.totalDiscounts}
        globalDiscountAmount={s.globalDiscountAmount}
        quotationNumber={s.quotationNumber}
        isReadOnly={isReadOnly}
        onDownload={a.downloadQuotation}
        onShare={a.exportAndShareQuotation}
        onPublish={() => a.handleAction('publish')}
      />

      {/* Plan loader dialog */}
      <PlanLoaderDialog
        isOpen={s.isPlanLoaderOpen}
        onClose={() => st.setIsPlanLoaderOpen(false)}
        plans={s.predefinedPlans}
        onLoadPlan={a.loadPlanIntoQuote}
      />

      {/* Package selector dialog */}
      <PackageSelectorDialog
        isOpen={s.isPackageSelectorOpen}
        onClose={() => st.setIsPackageSelectorOpen(false)}
        service={s.activeServiceForPackage}
        itemId={s.activeItemIdForPackage}
        onSelectPackage={(itemId, pkgName, price) => {
          a.updateItem(itemId, 'selectedPackage', pkgName);
          a.updateItem(itemId, 'unitPrice', price);
        }}
      />
    </div>
  );
}

export default function CreateQuotationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CreateQuotationPageInner />
    </Suspense>
  );
}
