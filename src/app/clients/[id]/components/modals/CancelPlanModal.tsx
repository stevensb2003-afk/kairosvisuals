import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface CancelPlanModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLead: any;
  clientData: any;
  handleCancelPlan: () => void;
}

export function CancelPlanModal({
  isOpen,
  onOpenChange,
  selectedLead,
  clientData,
  handleCancelPlan
}: CancelPlanModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Confirmar Cancelación de Plan
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>Estás a punto de cancelar el plan mensual de <strong>{selectedLead?.clientName}</strong>.</p>
            {clientData?.activePlan && (() => {
              const tDay = new Date().getDate();
              const planStartDay = clientData.activePlan.planStartDay || 30;
              let isLate = false;
              if (planStartDay === 15) {
                if (tDay > 15) isLate = true;
              } else {
                if (tDay === 31 || (tDay >= 1 && tDay <= 15)) isLate = true;
              }

              if (isLate) {
                return (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-800 text-sm">
                    <strong>⚠️ Cancelación Tardía (Día {tDay}):</strong> La fecha máxima para cancelar este ciclo sin recargo ha expirado. Al confirmar, se generará <strong>automáticamente una factura por el 50%</strong> de la mensualidad (una quincena) como recargo por penalización.
                  </div>
                );
              } else {
                return (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-800 text-sm">
                    <strong>✅ Cancelación a Tiempo (Día {tDay}):</strong> Estás dentro de la fecha límite para cancelar el próximo ciclo sin ningún recargo adicional.
                  </div>
                );
              }
            })()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Volver</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancelPlan} className="bg-red-600 hover:bg-red-700 text-white">
            Confirmar Cancelación
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
