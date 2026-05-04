import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { User, Edit2, Globe, Mail, Sparkles } from "lucide-react";

interface ProfileEditorModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editableProfile: {
    clientName: string;
    company: string;
    clientEmail: string;
    clientPhone: string;
    industry: string;
  };
  setEditableProfile: React.Dispatch<React.SetStateAction<any>>;
  handleSaveProfile: () => void;
  isProcessing: boolean;
  industries: string[];
}

export function ProfileEditorModal({
  isOpen,
  onOpenChange,
  editableProfile,
  setEditableProfile,
  handleSaveProfile,
  isProcessing,
  industries
}: ProfileEditorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card/95 border border-primary/20 shadow-2xl p-0 overflow-hidden rounded-3xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-br from-primary/30 via-primary/5 to-transparent p-5 text-white relative border-b border-white/5">
          <div className="absolute top-0 right-0 p-5 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
            <User className="w-12 h-12 text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 transition-all uppercase tracking-[0.2em] text-[8px] font-black px-2 py-0">Maestro</Badge>
              <div className="h-1 w-1 rounded-full bg-primary/40" />
            </div>
            <DialogTitle className="text-xl font-black font-headline tracking-tighter flex items-center gap-2.5">
              <div className="p-2 bg-primary rounded-lg shadow-lg shadow-primary/30 scale-100 hover:scale-110 transition-transform">
                <Edit2 className="w-4 h-4 text-white" />
              </div>
              Editar Perfil
            </DialogTitle>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="clientName" className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Nombre Completo</Label>
              <div className="relative group">
                <Input
                  id="clientName"
                  value={editableProfile.clientName}
                  onChange={(e) => setEditableProfile((prev: any) => ({ ...prev, clientName: e.target.value }))}
                  className="h-11 bg-background/40 border-primary/10 rounded-xl focus:ring-primary/20 transition-all group-hover:border-primary/30 pl-11 font-medium bg-muted/20"
                  placeholder="Nombre del cliente"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Nombre de Empresa</Label>
              <div className="relative group">
                <Input
                  id="company"
                  value={editableProfile.company}
                  onChange={(e) => setEditableProfile((prev: any) => ({ ...prev, company: e.target.value }))}
                  className="h-11 bg-background/40 border-primary/10 rounded-xl focus:ring-primary/20 transition-all group-hover:border-primary/30 pl-11 font-medium bg-muted/20"
                  placeholder="Ej: Kairos Visuals"
                />
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Email de Contacto</Label>
              <div className="relative group">
                <Input
                  id="email"
                  type="email"
                  value={editableProfile.clientEmail}
                  onChange={(e) => setEditableProfile((prev: any) => ({ ...prev, clientEmail: e.target.value }))}
                  className="h-11 bg-background/40 border-primary/10 rounded-xl focus:ring-primary/20 transition-all group-hover:border-primary/30 pl-11 text-sm bg-muted/20"
                  placeholder="correo@ejemplo.com"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">WhatsApp / Teléfono Internacional</Label>
              <div className="group phone-input-kairos">
                <PhoneInput
                  id="phone"
                  value={editableProfile.clientPhone}
                  onChange={(val) => setEditableProfile((prev: any) => ({ ...prev, clientPhone: val || "" }))}
                  className="kairos-phone-input"
                  placeholder="Número telefónico"
                  defaultCountry="CR"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="industry" className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Segmento de Mercado</Label>
              <div className="relative group">
                <Select value={editableProfile.industry} onValueChange={(val) => setEditableProfile((prev: any) => ({ ...prev, industry: val }))}>
                  <SelectTrigger className="h-11 bg-background/40 border-primary/10 rounded-xl focus:ring-primary/20 transition-all group-hover:border-primary/30 pl-11 bg-muted/20">
                    <SelectValue placeholder="Seleccionar industria" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-primary/20 max-h-[300px] rounded-2xl overflow-hidden shadow-2xl">
                    {industries.map((ind: string) => <SelectItem key={ind} value={ind} className="hover:bg-primary/10 focus:bg-primary/10 transition-colors py-3 px-4 text-sm">{ind}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              variant="ghost"
              className="flex-1 h-10 rounded-xl font-bold text-muted-foreground hover:bg-white/5 transition-all text-[10px] uppercase tracking-widest"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-[1.5] h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-black gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-xs"
              onClick={handleSaveProfile}
              disabled={isProcessing}
            >
              Guardar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
