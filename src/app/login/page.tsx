'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, Sparkles, ShieldCheck, ChevronRight, LayoutGrid } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCodeVerification, setShowCodeVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [tempUser, setTempUser] = useState<any>(null);

  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleGoogleTeamLogin = async () => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already has a role
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));

      if (userDoc.exists() && userDoc.data().role !== 'Cliente') {
        // User is already team, proceed
        router.push('/');
        return;
      }

      // If not team, ask for code
      setTempUser(user);
      setShowCodeVerification(true);
      toast({
        title: "Autenticación Exitosa",
        description: "Por favor, introduce el código de confirmación del equipo.",
      });
    } catch (error: any) {
      console.error("Google Login Error:", error);
      toast({
        variant: "destructive",
        title: "Error de Autenticación",
        description: "No se pudo completar el inicio de sesión con Google.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!firestore || !tempUser) return;
    setIsLoading(true);

    try {
      const securityDoc = await getDoc(doc(firestore, 'config', 'security'));
      const actualTeamCode = securityDoc.exists() ? securityDoc.data().TEAM_CODE : 'KAIROS-TEAM-2026';

      if (verificationCode === actualTeamCode) {
        const userDocRef = doc(firestore, 'users', tempUser.uid);
        await setDocumentNonBlocking(userDocRef, {
          id: tempUser.uid,
          email: tempUser.email,
          firstName: tempUser.displayName?.split(' ')[0] || '',
          lastName: tempUser.displayName?.split(' ').slice(1).join(' ') || '',
          role: 'Administrativo',
          type: 'team'
        }, { merge: true });

        toast({
          title: "Acceso Concedido",
          description: "Bienvenido al equipo de Kairos Visuals.",
        });
        router.push('/');
      } else {
        toast({
          variant: "destructive",
          title: "Código Incorrecto",
          description: "El código de confirmación no es válido.",
        });
      }
    } catch (error) {
      console.error("Error setting role:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (showCodeVerification) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-primary/20 shadow-xl shadow-primary/5">
          <CardHeader className="text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-primary animate-pulse" />
            <CardTitle className="mt-4">Verificación de Equipo</CardTitle>
            <CardDescription>Hola {tempUser?.displayName}, introduce la clave secreta de Kairos Visuals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Código de Confirmación"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="text-center text-lg tracking-widest font-mono"
            />
            <Button onClick={handleVerifyCode} className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar y Entrar
            </Button>
            <Button variant="ghost" onClick={() => setShowCodeVerification(false)} className="w-full text-muted-foreground">
              Cancelar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-20%] w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />

      <div className="w-full max-w-xl relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="mb-6 flex items-center justify-center">
            <Logo className="w-20 h-20 md:w-24 md:h-24 text-primary relative z-10 drop-shadow-xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight mb-3">
            Kairos Visuals
          </h1>
          <p className="text-muted-foreground text-lg max-w-md">
            Estrategia y producción visual para marcas que buscan el siguiente nivel.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Primary Action: Client Request */}
          <Button
            asChild
            className="w-full h-24 md:h-32 text-xl font-bold flex items-center justify-between px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 group relative overflow-hidden"
          >
            <Link href="/solicitud">
              <div className="flex items-center gap-6">
                <div className="bg-primary-foreground/10 p-4 rounded-xl backdrop-blur-md">
                  <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <span className="block text-2xl">Trabajemos Juntos</span>
                  <span className="text-sm font-normal opacity-70">Solicita una cotización hoy mismo</span>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />

              {/* Subtle Sparkle background effect */}
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform">
                <Sparkles className="w-24 h-24" />
              </div>
            </Link>
          </Button>

          {/* Secondary Action: Team Access */}
          <div className="flex items-center justify-center mt-4">
            <Button
              variant="ghost"
              onClick={handleGoogleTeamLogin}
              disabled={isLoading}
              className="h-12 px-6 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all gap-3"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LayoutGrid className="w-4 h-4" />}
              Acceso Equipo (Google)
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-0 right-0 text-center text-xs text-muted-foreground">
        © 2026 Kairos Visuals. Todos los derechos reservados.
      </div>
    </div>
  );
}
