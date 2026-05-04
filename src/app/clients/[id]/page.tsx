"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertTriangle, LayoutDashboard, Receipt, Contact } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { formatPhone } from "@/lib/utils";
import { ClientHeader } from './components/ClientHeader';
import { CancelPlanModal } from './components/modals/CancelPlanModal';
import { ProfileEditorModal } from './components/modals/ProfileEditorModal';
import { BriefingWizardModal } from './components/modals/BriefingWizardModal';
import { QuotationPreviewModal } from './components/modals/QuotationPreviewModal';
import { ClientDashboardTab } from './components/tabs/ClientDashboardTab';
import { ClientInvoicesTab } from './components/tabs/ClientInvoicesTab';
import { ClientProfileTab } from './components/tabs/ClientProfileTab';
import { ServicesDetailModal } from './components/modals/ServicesDetailModal';
import { useClientProfileData } from './hooks/useClientProfileData';

export default function ClientProfilePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const data = useClientProfileData(id);

  if (data.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Cargando expediente del cliente...</p>
      </div>
    );
  }

  if (!data.selectedLead) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 min-h-[50vh]">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold">Cliente no encontrado</h2>
        <Button onClick={() => router.push('/clients')} variant="outline">Volver a Clientes</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-6 space-y-6">
      {/* Header Navigation */}
      <ClientHeader
        selectedLead={data.selectedLead}
        isProcessing={data.isProcessing}
        onArchive={data.handleArchiveClient}
        onUnarchive={data.handleUnarchiveClient}
        onMarkAsContacted={data.markAsContacted}
      />

      {/* Tabs Layout */}
      <Tabs defaultValue="dashboard" className="w-full mt-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl border border-border/50 w-full grid grid-cols-3 h-11">
          <TabsTrigger value="dashboard" className="h-full rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex flex-row items-center justify-center gap-1.5 px-2 sm:px-4">
            <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] sm:text-sm font-semibold truncate">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="h-full rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex flex-row items-center justify-center gap-1.5 px-2 sm:px-4">
            <Receipt className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] sm:text-sm font-semibold truncate">Cotizaciones</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="h-full rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex flex-row items-center justify-center gap-1.5 px-2 sm:px-4">
            <Contact className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] sm:text-sm font-semibold truncate">Perfil</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <ClientDashboardTab
            leadOnboarding={data.leadOnboarding}
            handleOpenBriefing={data.handleOpenBriefing}
            activePlans={data.activePlans}
            activeProjects={data.activeProjects}
            clientData={data.clientData}
            selectedLead={data.selectedLead}
            router={router}
            setPreviewQuotation={data.setPreviewQuotation}
            setIsPreviewOpen={data.setIsPreviewOpen}
            isAccountPending={data.isAccountPending}
            isAccountOk={data.isAccountOk}
            accountStatusLabel={data.accountStatusLabel}
            accountStatusDescription={data.accountStatusDescription}
            setIsServicesDetailOpen={data.setIsServicesDetailOpen}
            handleGenerateMonth1Part2={data.handleGenerateMonth1Part2}
            setIsCancelPlanOpen={data.setIsCancelPlanOpen}
          />

          <ClientInvoicesTab
            docsSearchTerm={data.docsSearchTerm}
            setDocsSearchTerm={data.setDocsSearchTerm}
            filteredQuotations={data.filteredQuotations}
            setPreviewQuotation={data.setPreviewQuotation}
            setIsPreviewOpen={data.setIsPreviewOpen}
            filteredInvoices={data.filteredInvoices}
          />

          <ClientProfileTab
            leadUser={data.leadUser}
            selectedLead={data.selectedLead}
            leadOnboarding={data.leadOnboarding}
            handleOpenEditProfile={data.handleOpenEditProfile}
            copyToClipboard={data.copyToClipboard}
            copiedField={data.copiedField}
            formatPhone={formatPhone}
            handleOpenBriefing={data.handleOpenBriefing}
            isEditingSocials={data.isEditingSocials}
            handleStartEditSocials={data.handleStartEditSocials}
            handleCancelEditSocials={data.handleCancelEditSocials}
            handleSaveSocials={data.handleSaveSocials}
            isProcessing={data.isProcessing}
            editableSocials={data.editableSocials}
            handleUpdateSocialField={data.handleUpdateSocialField}
            PLATFORMS={data.PLATFORMS}
            handleRemoveSocialRow={data.handleRemoveSocialRow}
            handleAddSocialRow={data.handleAddSocialRow}
          />
        </div>
      </Tabs>

      {/* Modales Compartidos */}
      <ServicesDetailModal
        isServicesDetailOpen={data.isServicesDetailOpen}
        setIsServicesDetailOpen={data.setIsServicesDetailOpen}
        activeQuotation={data.activeQuotation}
        router={router}
        selectedLead={data.selectedLead}
      />

      <CancelPlanModal
        isOpen={data.isCancelPlanOpen}
        onOpenChange={data.setIsCancelPlanOpen}
        selectedLead={data.selectedLead}
        clientData={data.clientData}
        handleCancelPlan={data.handleCancelPlan}
      />

      {/* Modal: Editar Perfil */}
      <ProfileEditorModal
        isOpen={data.isEditingProfile}
        onOpenChange={data.setIsEditingProfile}
        editableProfile={data.editableProfile}
        setEditableProfile={data.setEditableProfile}
        handleSaveProfile={data.handleSaveProfile}
        isProcessing={data.isProcessing}
        industries={data.industries}
      />

      <BriefingWizardModal
        isOpen={data.isBriefingDialogOpen}
        onOpenChange={data.setIsBriefingDialogOpen}
        briefingStep={data.briefingStep}
        setBriefingStep={data.setBriefingStep}
        briefingData={data.briefingData}
        setBriefingData={data.setBriefingData}
        industries={data.industries}
        PLATFORMS={data.PLATFORMS}
        motivations={data.motivations}
        mainGoals={data.mainGoals}
        handleToggleBriefingSelection={data.handleToggleBriefingSelection}
        expectations={data.expectations}
        contactSources={data.contactSources}
        handleSaveBriefing={data.handleSaveBriefing}
        isProcessing={data.isProcessing}
      />

      {/* MODAL: PREVIEW DE PROPUESTA/COTIZACION */}
      <QuotationPreviewModal
        isOpen={data.isPreviewOpen}
        onOpenChange={data.setIsPreviewOpen}
        previewQuotation={data.previewQuotation}
        handlePrint={data.handlePrint}
        handleDownload={data.handleDownload}
        isProcessing={data.isProcessing}
        handleSharePdf={data.handleSharePdf}
        handleShareWhatsApp={data.handleShareWhatsApp}
        selectedLead={data.selectedLead}
        leadUser={data.leadUser}
        companySettings={data.companySettings}
      />
    </div>
  );
}
