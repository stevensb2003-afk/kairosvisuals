import React from 'react';
import { Globe, Instagram, Facebook, Music2, Linkedin, Twitter, Youtube, AtSign, Copy, ExternalLink, X, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SocialPresenceProps {
  leadOnboarding: any;
  isEditingSocials: boolean;
  editableSocials: any[];
  isProcessing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onUpdateField: (index: number, field: string, value: string) => void;
  copyToClipboard: (text: string, label: string) => void;
}

const PLATFORMS = ["Instagram", "Facebook", "TikTok", "LinkedIn", "YouTube", "X (Twitter)", "Threads", "Pinterest", "Website", "Otro"];

export const SocialPresence: React.FC<SocialPresenceProps> = ({
  leadOnboarding,
  isEditingSocials,
  editableSocials,
  isProcessing,
  onStartEdit,
  onCancelEdit,
  onSave,
  onAddRow,
  onRemoveRow,
  onUpdateField,
  copyToClipboard,
}) => {
  return (
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
            onClick={onStartEdit}
          >
            Editar
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] font-bold text-muted-foreground hover:bg-muted gap-1.5"
              onClick={onCancelEdit}
            >
              <X className="w-3 h-3" /> Cancelar
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-7 px-2 text-[10px] font-bold bg-primary hover:bg-primary/90 text-white gap-1.5 shadow-sm"
              onClick={onSave}
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
            {editableSocials.map((social, idx) => (
              <div key={idx} className="flex gap-2 items-start bg-muted/20 p-2 rounded-lg border border-border/50 relative group">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase px-1">Plataforma</p>
                    <Select value={social.platform} onValueChange={(val) => onUpdateField(idx, "platform", val)}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase px-1">Usuario / Handle</p>
                    <Input
                      className="h-9 text-xs bg-background"
                      placeholder="@usuario"
                      value={social.handle}
                      onChange={(e) => onUpdateField(idx, "handle", e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase px-1">Enlace Directo (Opcional)</p>
                    <div className="flex gap-2">
                      <Input
                        className="h-9 text-xs bg-background flex-1"
                        placeholder="https://..."
                        value={social.url || ""}
                        onChange={(e) => onUpdateField(idx, "url", e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                        onClick={() => onRemoveRow(idx)}
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
            onClick={onAddRow}
          >
            <Plus className="w-3.5 h-3.5" /> Agregar Red Social
          </Button>
        </div>
      )}
    </div>
  );
};
