$path = 'src/components/layout/app-layout.tsx'
$content = Get-Content $path -Raw
$content = $content -replace 'Wallet,', 'Wallet, Palette,'
$button = '          <SidebarMenu>
            <SidebarMenuItem className="px-2 pb-2">
              <Link href="/creative-suite" passHref>
                <SidebarMenuButton 
                  isActive={pathname.startsWith(''/creative-suite'')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 shadow-md transition-all font-bold"
                  tooltip="Suite creativa"
                >
                  <Palette className="w-5 h-5" />
                  <span>Suite creativa</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>'
$content = $content -replace '<SidebarFooter>', "<SidebarFooter>`r`n$button"
Set-Content -Path $path -Value $content

$pageContent = '"use client";

import React from "react";
import { Palette } from "lucide-react";

export default function CreativeSuitePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 p-4">
      <div className="flex flex-col items-center text-center space-y-4 max-w-2xl">
        <div className="p-4 bg-primary/10 rounded-full">
          <Palette className="w-12 h-12 text-primary animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight font-headline sm:text-5xl">Suite Creativa</h1>
        <p className="text-muted-foreground text-xl">
          Bienvenido al centro de innovación. Estamos preparando herramientas de diseño y creación impulsadas por IA para potenciar tu flujo de trabajo.
        </p>
      </div>
      
      <div className="w-full max-w-5xl aspect-video border-2 border-dashed rounded-2xl bg-muted/20 flex flex-col items-center justify-center gap-4 transition-all hover:bg-muted/30">
        <div className="flex flex-col items-center gap-2">
           <p className="text-muted-foreground font-medium text-lg">Esperando Mockup HTML...</p>
           <p className="text-xs text-muted-foreground/60">Sube tu archivo a docs/creative_suite/ para continuar.</p>
        </div>
      </div>
    </div>
  );
}'
Set-Content -Path 'src/app/creative-suite/page.tsx' -Value $pageContent
