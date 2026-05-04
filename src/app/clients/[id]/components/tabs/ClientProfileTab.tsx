import React from 'react';
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
<TabsContent value="profile" className="outline-none m-0 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Specs */}
              <div className="space-y-6">
                {/* Contact Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-primary flex items-center justify-between gap-2 uppercase tracking-wider">
                    <span className="flex items-center gap-2"><Contact className="w-4 h-4" /> Datos de Identificación</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenEditProfile}
                      className="h-7 text-[10px] font-bold text-primary hover:bg-primary/5 border border-primary/10 gap-1.5"
                    >
                      <Edit2 className="w-3 h-3" /> Editar Perfil
                    </Button>
                  </h4>
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Nombre y/o Empresa</p>
                        <p className="font-bold text-lg text-foreground">{leadUser ? `${leadUser.firstName} ${leadUser.lastName}` : selectedLead.clientName}</p>
                        <p className="text-sm font-medium text-muted-foreground mt-0.5">{leadUser?.company || selectedLead.company || 'Sin registro de empresa'}</p>
                      </div>
                      <div className="w-full h-px bg-border/50" />

                      <div className="space-y-4">
                        <div className="group">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 px-1">Correo Electrónico</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2 justify-between bg-muted/30 p-2.5 rounded-xl border border-transparent group-hover:border-primary/20 transition-all">
                              <span className="text-xs font-bold truncate pl-1" title={leadUser?.email || selectedLead.clientEmail}>
                                {leadUser?.email || selectedLead.clientEmail || 'No proporcionado'}
                              </span>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" onClick={() => copyToClipboard(leadUser?.email || selectedLead.clientEmail || "", "Email")}>
                                {copiedField === "Email" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </Button>
                            </div>
                          </div>
                          {(leadUser?.email || selectedLead.clientEmail) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-2 h-9 text-[11px] font-bold text-primary hover:bg-primary/5 rounded-lg flex items-center gap-2 transition-colors border border-primary/10"
                              onClick={() => window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${leadUser?.email || selectedLead.clientEmail}`, '_blank')}
                            >
                              <Mail className="w-3.5 h-3.5" /> Redactar Correo en Gmail
                            </Button>
                          )}
                        </div>

                        <Separator className="opacity-50" />

                        <div className="group">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 px-1">Teléfono Móvil</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2 justify-between bg-muted/30 p-2.5 rounded-xl border border-transparent group-hover:border-primary/20 transition-all">
                              <span className="text-xs font-bold truncate tracking-wider pl-1">
                                {formatPhone(leadUser?.phone || selectedLead.clientPhone) || '-'}
                              </span>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" onClick={() => copyToClipboard(leadUser?.phone || selectedLead.clientPhone || "", "Teléfono")}>
                                {copiedField === "Teléfono" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </Button>
                            </div>
                          </div>
                          {(leadUser?.phone || selectedLead.clientPhone) && (
                            <Button
                              size="sm"
                              className="w-full mt-2 h-9 text-[11px] font-bold bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg flex items-center gap-2 transition-all shadow-sm shadow-green-500/10"
                              onClick={() => window.open(`https://wa.me/${(leadUser?.phone || selectedLead.clientPhone || '').replace(/\D/g, '')}`, '_blank')}
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Enviar WhatsApp
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Briefing: Contexto */}
                {leadOnboarding && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold flex items-center justify-between gap-2 uppercase tracking-wider text-muted-foreground transition-all">
                      <span>Ecosistema Comercial</span>
                      {leadOnboarding?.onboardingType === 'direct' && !leadOnboarding?.isMigrated && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleOpenBriefing}
                          className="h-7 text-[10px] font-bold text-amber-600 hover:bg-amber-50 border border-amber-200 gap-1.5"
                        >
                          <Sparkles className="w-3 h-3" /> Completar Briefing
                        </Button>
                      )}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Segmento de Mercado</h4>
                        <p className="font-semibold text-sm">{leadOnboarding.sector || 'Sin definir'}</p>
                      </div>
                      <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Canal de Atracción</h4>
                        <p className="font-semibold text-sm">{leadOnboarding.contactSource || 'Orgánico'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Narrative */}
              {leadOnboarding && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" /> Briefing Estratégico
                    </h4>

                    <Card className="border-border/50 shadow-sm">
                      <CardContent className="p-5 space-y-5">
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5"><FileText className="w-3 h-3" /> Descripción y Narrativa</p>
                          <div className="text-sm leading-relaxed text-foreground/90 italic bg-muted/30 p-3 rounded-lg border-l-2 border-primary/40">
                            "{leadOnboarding.businessDetails || 'No se brindaron detalles en el Briefing.'}"
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> Motivación Primaria</p>
                          {leadOnboarding.motivation ? (
                            <p className="text-sm font-semibold text-foreground/90 pl-1">{leadOnboarding.motivation}</p>
                          ) : (
                            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3">
                              <p className="text-[11px] text-amber-600/80 font-medium italic">Pendiente de completar el briefing estratégico.</p>
                              <Button
                                onClick={handleOpenBriefing}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black h-8 rounded-lg"
                              >
                                <Sparkles className="w-3 h-3 mr-2" /> Completar Ahora
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                          <div className="space-y-2">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Objetivos Específicos</p>
                            {Array.isArray(leadOnboarding.mainGoal) && leadOnboarding.mainGoal.length > 0 ? (
                              <ul className="grid gap-1.5">
                                {leadOnboarding.mainGoal.map((g: string, i: number) => (
                                  <li key={i} className="flex gap-2 text-xs bg-primary/5 p-2 rounded-lg items-start border border-primary/10">
                                    <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-px" /> <span className="font-medium text-foreground/80">{g}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-muted-foreground italic pl-1">No hay metas registradas.</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Exigencias (Expectativas)</p>
                            {Array.isArray(leadOnboarding.expectations) && leadOnboarding.expectations.length > 0 ? (
                              <ul className="grid gap-1.5">
                                {leadOnboarding.expectations.map((e: string, i: number) => (
                                  <li key={i} className="flex gap-2 text-xs bg-accent/5 p-2 rounded-lg items-start border border-accent/10">
                                    <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0 mt-px" /> <span className="font-medium text-foreground/80">{e}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-muted-foreground italic pl-1">No hay expectativas registradas.</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                              <Globe className="w-3 h-3" /> Presencia Digital Validada
                            </p>
                            {!isEditingSocials ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[10px] font-bold text-primary hover:bg-primary/5 gap-1.5"
                                onClick={handleStartEditSocials}
                              >
                                <Edit2 className="w-3 h-3" /> Editar
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[10px] font-bold text-muted-foreground hover:bg-muted gap-1.5"
                                  onClick={handleCancelEditSocials}
                                >
                                  <X className="w-3 h-3" /> Cancelar
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-7 px-2 text-[10px] font-bold bg-primary hover:bg-primary/90 text-white gap-1.5 shadow-sm"
                                  onClick={handleSaveSocials}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Guardar
                                </Button>
                              </div>
                            )}
                          </div>

                          {!isEditingSocials ? (
                            <div className="flex flex-col gap-3 pt-1">
                              {Array.isArray(leadOnboarding?.socials) && leadOnboarding.socials.length > 0 ? (
                                leadOnboarding.socials.map((social: any, idx: number) => {
                                  const platform = social.platform.toLowerCase();
                                  let Icon = Globe;
                                  let colorClasses = "text-primary bg-primary/10 border-primary/20";
                                  let iconContainerClass = "bg-primary text-white";
                                  let gradientOverlay = "from-primary/10";

                                  if (platform.includes('instagram')) {
                                    Icon = Instagram;
                                    colorClasses = "text-pink-600 bg-pink-50 hover:border-pink-300";
                                    iconContainerClass = "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white";
                                    gradientOverlay = "from-pink-50";
                                  } else if (platform.includes('facebook')) {
                                    Icon = Facebook;
                                    colorClasses = "text-blue-700 bg-blue-50 hover:border-blue-300";
                                    iconContainerClass = "bg-blue-600 text-white";
                                    gradientOverlay = "from-blue-50";
                                  } else if (platform.includes('tiktok')) {
                                    Icon = Music2;
                                    colorClasses = "text-slate-900 bg-slate-50 hover:border-slate-300";
                                    iconContainerClass = "bg-slate-900 text-white";
                                    gradientOverlay = "from-slate-100";
                                  } else if (platform.includes('linkedin')) {
                                    Icon = Linkedin;
                                    colorClasses = "text-blue-800 bg-blue-50 hover:border-blue-400";
                                    iconContainerClass = "bg-[#0077b5] text-white";
                                    gradientOverlay = "from-[#0077b5]/5";
                                  } else if (platform.includes('x ') || platform.includes('twitter')) {
                                    Icon = Twitter;
                                    colorClasses = "text-slate-900 bg-slate-50 hover:border-slate-300";
                                    iconContainerClass = "bg-black text-white px-2.5";
                                    gradientOverlay = "from-slate-100";
                                  } else if (platform.includes('youtube')) {
                                    Icon = Youtube;
                                    colorClasses = "text-red-600 bg-red-50 hover:border-red-300";
                                    iconContainerClass = "bg-red-600 text-white";
                                    gradientOverlay = "from-red-50";
                                  } else if (platform.includes('threads')) {
                                    Icon = AtSign;
                                    colorClasses = "text-slate-900 bg-slate-50 hover:border-slate-300";
                                    iconContainerClass = "bg-black text-white";
                                    gradientOverlay = "from-slate-100";
                                  }

                                  return (
                                    <div
                                      key={idx}
                                      className={`group relative flex items-center gap-4 p-3 rounded-2xl border border-border/40 transition-all duration-300 overflow-hidden ${colorClasses} hover:shadow-md hover:-translate-y-0.5`}
                                    >
                                      <div className={`absolute inset-0 bg-gradient-to-r ${gradientOverlay} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm z-10 transition-transform duration-500 group-hover:scale-110 ${iconContainerClass}`}>
                                        <Icon className="w-5 h-5" />
                                      </div>
                                      <div className="flex-1 min-w-0 z-10">
                                        <div className="flex items-center gap-2">
                                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{social.platform}</p>
                                          {social.url && (
                                            <Badge variant="outline" className="h-4 px-1.5 text-[8px] font-bold border-current/20 bg-current/5 whitespace-nowrap">Link Validado</Badge>
                                          )}
                                        </div>
                                        <p className="text-sm font-black truncate text-foreground group-hover:text-primary transition-colors mt-0.5">{social.handle || 'Sin usuario'}</p>
                                      </div>
                                      <div className="flex items-center gap-1.5 z-10">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 rounded-full bg-white/50 hover:bg-white hover:text-primary border border-transparent hover:border-primary/20 transition-all"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(social.handle, social.platform);
                                          }}
                                          title="Copiar usuario"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </Button>
                                        {social.url && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full bg-primary text-white hover:bg-primary/90 shadow-sm transition-all hover:scale-110"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(social.url, '_blank');
                                            }}
                                            title="Ir al perfil"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-muted/10 rounded-2xl border border-dashed border-border/50">
                                  <div className="p-3 bg-background rounded-full shadow-sm mb-3">
                                    <Globe className="w-6 h-6 text-muted-foreground/40" />
                                  </div>
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sin Presencia Digital</p>
                                  <p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">Añade redes sociales para gestionar el contenido del cliente.</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3 pt-1">
                              <div className="grid gap-2">
                                {editableSocials.map((social: any, idx: number) => (
                                  <div key={idx} className="flex gap-2 items-start bg-muted/20 p-2 rounded-lg border border-border/50 relative group">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
                                      <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase px-1">Plataforma</p>
                                        <Select value={social.platform} onValueChange={(val) => handleUpdateSocialField(idx, "platform", val)}>
                                          <SelectTrigger className="h-9 text-xs bg-background">
                                            <SelectValue placeholder="Seleccionar" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {PLATFORMS.map((p: string) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase px-1">Usuario / Handle</p>
                                        <Input
                                          className="h-9 text-xs bg-background"
                                          placeholder="@usuario"
                                          value={social.handle}
                                          onChange={(e) => handleUpdateSocialField(idx, "handle", e.target.value)}
                                        />
                                      </div>
                                      <div className="md:col-span-2 space-y-1">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase px-1">Enlace Directo (Opcional)</p>
                                        <div className="flex gap-2">
                                          <Input
                                            className="h-9 text-xs bg-background flex-1"
                                            placeholder="https://..."
                                            value={social.url || ""}
                                            onChange={(e) => handleUpdateSocialField(idx, "url", e.target.value)}
                                          />
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                                            onClick={() => handleRemoveSocialRow(idx)}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-9 border-dashed border-primary/30 text-primary hover:bg-primary/5 gap-2 text-xs font-bold"
                                onClick={handleAddSocialRow}
                              >
                                <Plus className="w-3.5 h-3.5" /> Agregar Red Social
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
  );
}
