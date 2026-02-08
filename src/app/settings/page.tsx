import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Palette, Package, SlidersHorizontal } from "lucide-react";

const settingsCards = [
    { title: "Gestor de Usuarios", description: "Crea perfiles y asigna roles.", icon: Users },
    { title: "Gestor de Tasks", description: "Define tipos de tarea y sus colores.", icon: Palette },
    { title: "Gestor de Packs", description: "Configura planes mensuales y precios.", icon: Package },
    { title: "Ajustes de App (PWA)", description: "Personaliza íconos y webhooks.", icon: SlidersHorizontal },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Configuraciones</h1>
        <p className="text-muted-foreground">Administración general para personalizar y escalar el negocio.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCards.map((setting) => (
            <Card key={setting.title}>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <setting.icon className="w-8 h-8 text-primary"/>
                    <div>
                        <CardTitle className="font-headline">{setting.title}</CardTitle>
                        <CardDescription>{setting.description}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground text-sm">Próximamente...</p>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}
