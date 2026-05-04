import React from "react";
import { Zap, Eye, CheckCircle, Calendar, AlertTriangle, Target } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ActivePlansCardProps {
  activePlans: any[];
  activeProjects: any[];
  clientData: any;
  selectedLead: any;
  router: any;
  setPreviewQuotation: (q: any) => void;
  setIsPreviewOpen: (open: boolean) => void;
}

export function ActivePlansCard({
  activePlans,
  activeProjects,
  clientData,
  selectedLead,
  router,
  setPreviewQuotation,
  setIsPreviewOpen
}: ActivePlansCardProps) {
  return (
    <div className="space-y-6">
      {/* PLANES PREMIUM / SUSCRIPCIONES */}
      <Card className="overflow-hidden border-emerald-500/20 shadow-sm">
        <CardHeader className="bg-emerald-500/5 pb-4 border-b border-emerald-500/10 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2 m-0 mt-2">
            <Zap className="w-4 h-4" /> Mi Plan Premium
          </CardTitle>
          <div className="flex items-center mt-0">
            <Button variant="outline" size="sm" onClick={() => {
              setPreviewQuotation(activePlans.length > 0 ? activePlans[0] : null);
              setIsPreviewOpen(true);
            }} className="h-6 text-[10px] font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 gap-1" disabled={activePlans.length === 0}>
              <Eye className="w-3 h-3" /> Ver Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {activePlans.length > 0 ? (
            <div className="space-y-4">
              {activePlans.map((plan: any, i: number) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{plan.title || 'Plan de Suscripción'}</h3>
                      <div className="flex flex-col gap-1 mt-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500" /> Aprobado el {(() => {
                            try {
                              const dateVal = plan.updatedAt || plan.createdAt || plan.acceptedAt;
                              return dateVal ? new Date(dateVal).toLocaleDateString() : 'N/A';
                            } catch (e) { return 'Invalid Date'; }
                          })()}
                        </p>
                        {clientData?.billingPeriodStart && (
                          <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Inicio de Ciclo: {new Date(clientData.billingPeriodStart + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div>
                        <p className="text-2xl font-black text-emerald-600 leading-none">
                          ₡{(plan.grandTotal || plan.totalAmount || plan.total || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-emerald-600/70 font-medium mt-1">
                          ₡{Math.round((plan.grandTotal || plan.totalAmount || plan.total || 0) / 2).toLocaleString()} <span className="text-muted-foreground/60">/ quincenal</span>
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 capitalize mt-1">
                        Suscripción Recurrente
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Servicios Incluidos:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {plan.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/40 shadow-sm hover:border-emerald-500/30 transition-colors">
                          <div className="mt-0.5 p-1 bg-emerald-500/10 rounded-md shrink-0">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-foreground leading-tight">{item.serviceName || item.description}</p>
                            {item.serviceName && item.description && item.serviceName !== item.description && (
                              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{item.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.quantity > 1 && (
                                <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">× {item.quantity} uds.</span>
                              )}
                              {item.quantity === 1 && (
                                <span className="inline-flex items-center text-[10px] font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">× 1</span>
                              )}
                              {(item.discount > 0) && (
                                <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">-₡{Number(item.discount).toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {i < activePlans.length - 1 && <Separator className="my-6" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-secondary/50 rounded-xl border border-dashed border-border">
              <AlertTriangle className="w-10 h-10 text-muted-foreground mb-3" />
              <h4 className="font-semibold mb-1">Sin Plan Activo</h4>
              <p className="text-xs text-muted-foreground max-w-[250px]">Este cliente no tiene una suscripción vigente.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push(`/solicitudes/create?leadId=${selectedLead.id}&clientId=${selectedLead.clientId}`)}>Crear Plan</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PROYECTOS ADICIONALES / EXTRAS */}
      <Card className="overflow-hidden border-blue-500/20 shadow-sm">
        <CardHeader className="bg-blue-500/5 pb-4 border-b border-blue-500/10 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2 m-0 mt-2">
            <Target className="w-4 h-4" /> Proyectos Adicionales / Extras
          </CardTitle>
          <div className="flex items-center mt-0">
            <Button variant="outline" size="sm" onClick={() => {
              setPreviewQuotation(activeProjects.length > 0 ? activeProjects[0] : null);
              setIsPreviewOpen(true);
            }} className="h-6 text-[10px] font-bold border-blue-500/30 text-blue-600 hover:bg-blue-50 gap-1" disabled={activeProjects.length === 0}>
              <Eye className="w-3 h-3" /> Ver Proyecto
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {activeProjects.length > 0 ? (
            <div className="space-y-4">
              {activeProjects.map((project: any, i: number) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{project.title || 'Proyecto Adicional'}</h3>
                      <div className="flex flex-col gap-1 mt-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-blue-500" /> Aprobado el {(() => {
                            try {
                              const dateVal = project.updatedAt || project.createdAt || project.acceptedAt;
                              return dateVal ? new Date(dateVal).toLocaleDateString() : 'N/A';
                            } catch (e) { return 'Invalid Date'; }
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">₡{project.grandTotal?.toLocaleString() || project.total?.toLocaleString()}</p>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 capitalize mt-2">
                        Proyecto Único
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Servicios Incluidos:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {project.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/40 shadow-sm hover:border-blue-500/30 transition-colors">
                          <div className="mt-0.5 p-1 bg-blue-500/10 rounded-md shrink-0">
                            <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-foreground leading-tight">{item.serviceName || item.description}</p>
                            {item.serviceName && item.description && item.serviceName !== item.description && (
                              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{item.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.quantity > 1 && (
                                <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-500/20">× {item.quantity} uds.</span>
                              )}
                              {item.quantity === 1 && (
                                <span className="inline-flex items-center text-[10px] font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">× 1</span>
                              )}
                              {(item.discount > 0) && (
                                <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">-₡{Number(item.discount).toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {i < activeProjects.length - 1 && <Separator className="my-6" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-secondary/50 rounded-xl border border-dashed border-border">
              <AlertTriangle className="w-8 h-8 text-muted-foreground/60 mb-3" />
              <h4 className="font-semibold text-sm mb-1 text-muted-foreground/80">Sin Proyectos Adicionales</h4>
              <p className="text-xs text-muted-foreground/60 max-w-[250px]">No hay servicios extra facturados actualmente.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
