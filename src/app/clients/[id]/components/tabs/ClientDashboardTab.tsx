import React from 'react';
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
<TabsContent value="dashboard" className="outline-none m-0 space-y-6">
            {/* ALERTA DE BRIEFING PENDIENTE (Premium Design) */}
            {leadOnboarding?.onboardingType === 'direct' && !leadOnboarding?.isMigrated && (
              <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-6 shadow-xl shadow-amber-500/5 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="bg-amber-500/20 p-3 rounded-2xl border border-amber-500/30 group-hover:scale-110 transition-transform duration-500">
                      <Sparkles className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-amber-500 uppercase tracking-tighter font-headline">Perfil Estratégico Pendiente</h4>
                      <p className="text-sm text-muted-foreground/80 font-medium max-w-md">Para ofrecer una estrategia personalizada, necesitamos conocer los objetivos y el valor diferencial de la marca.</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleOpenBriefing}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-black h-12 px-8 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 gap-2 w-full md:w-auto"
                  >
                    <Sparkles className="w-4 h-4" />
                    Completar Formulario de Briefing
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <ActivePlansCard
                  activePlans={activePlans}
                  activeProjects={activeProjects}
                  clientData={clientData}
                  selectedLead={selectedLead}
                  router={router}
                  setPreviewQuotation={setPreviewQuotation}
                  setIsPreviewOpen={setIsPreviewOpen}
                />
              </div>

              {/* ESTADO DE CUENTA */}
              <div className="space-y-6">
                <Card className={isAccountPending ? "border-amber-500/30 bg-amber-500/5 shadow-sm" : (isAccountOk ? "border-emerald-500/20 bg-emerald-500/5 shadow-sm" : "border-border/50 bg-card shadow-sm")}>
                  <CardHeader className="pb-2">
                    <CardTitle className={isAccountPending ? "text-xs font-bold uppercase text-amber-600 flex items-center gap-2" : (isAccountOk ? "text-xs font-bold uppercase text-emerald-600 flex items-center gap-2" : "text-xs font-bold uppercase text-muted-foreground flex items-center gap-2")}>
                      <Receipt className="w-4 h-4" /> Estado de Cuenta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold font-headline">
                        {accountStatusLabel}
                      </p>
                      <p className={`${isAccountPending ? 'text-amber-600/80' : (isAccountOk ? 'text-emerald-600/80' : 'text-muted-foreground/80')} text-xs font-medium`}>
                        {accountStatusDescription}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-500/20 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-blue-600 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" /> Interacción
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center text-sm border-b pb-2 border-border/50">
                        <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-500" /> Registro:</span>
                        <span className="font-bold text-foreground">{(() => {
                          try {
                            return selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleDateString() : 'Sin fecha';
                          } catch (e) { return 'Fecha inválida'; }
                        })()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-blue-500" /> Preferencia:</span>
                        <span className="font-bold uppercase text-foreground">{selectedLead.preference || 'No especificada'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* TRACKING DEL PLAN COMPONENT */}
              {clientData?.activePlan?.status === 'active' && (
                <Card className="md:col-span-3 border-emerald-500/20 bg-card overflow-hidden shadow-sm">
                  <CardHeader className="bg-emerald-500/5 pb-4 border-b border-emerald-500/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2 m-0">
                      <Zap className="w-4 h-4 shrink-0" /> Tracking de Plan (Ciclo de Facturación)
                    </CardTitle>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-white shadow-sm whitespace-nowrap">{clientData.activePlan.services?.length || 0} Servicios</Badge>
                      <Button variant="outline" size="sm" onClick={() => setIsServicesDetailOpen(true)} className="h-7 text-[11px] font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 whitespace-nowrap">Ver Detalle</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col justify-center p-5 border border-border/50 rounded-xl bg-muted/30">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Mes Operativo</p>
                        <Badge variant="outline" className="font-bold border-emerald-500/30 text-emerald-700 bg-emerald-500/10">
                          Día de Corte: {clientData.activePlan.planStartDay === 15 ? '15/30' : '30/15'}
                        </Badge>
                      </div>
                      <p className="font-bold text-xl text-foreground">
                        {clientData.activePlan.currentCycleMonth === 1 ? 'Mes 1 (Setup)' : `Ciclo Recurrente`}
                      </p>
                    </div>

                    <div className="p-5 border rounded-xl bg-primary/5 border-primary/20 relative overflow-hidden group flex flex-col justify-center">
                      <div className="absolute -top-4 -right-4 p-4 opacity-10 blur-sm pointer-events-none">
                        <Zap className="w-24 h-24 text-primary" />
                      </div>
                      <div className="flex justify-between items-center relative z-10">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-primary uppercase tracking-wider">Control de Pago</p>
                          <p className="text-sm font-medium text-foreground">
                            {clientData.activePlan.currentCycleMonth === 1
                              ? (clientData.activePlan.isMonth1Part2Paid ? 'Mes 1 Completado' : 'Parte 1 de 2 Pagada')
                              : 'Ciclo 15/30 Activo'}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {clientData.activePlan.currentCycleMonth === 1 && clientData.activePlan.isMonth1Part1Paid && !clientData.activePlan.isMonth1Part2Paid && (
                            <Button size="sm" className="h-8 text-[10px] font-bold" onClick={handleGenerateMonth1Part2}>
                              <Receipt className="w-3 h-3 mr-1" /> Generar Parte 2
                            </Button>
                          )}
                          {clientData.activePlan.isMonth1Part2Paid && clientData.activePlan.currentCycleMonth === 1 && (
                            <Badge className="bg-emerald-500 text-white border-0 shadow-sm"><CheckCircle className="w-3 h-3 mr-1" /> Completado</Badge>
                          )}
                          {clientData.activePlan.currentCycleMonth > 1 && (
                            <Badge variant="outline" className="border-blue-500/30 text-blue-600 bg-blue-500/5 shadow-sm">Ciclo Recurrente</Badge>
                          )}
                          <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold border-red-500/30 text-red-600 hover:bg-red-500/10" onClick={() => setIsCancelPlanOpen(true)}>
                            Cancelar Plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
  );
}
