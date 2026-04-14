'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFirestore, setDocumentNonBlocking, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, UserCheck, Shield, ShieldCheck, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const registerSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido.'),
  lastName: z.string().min(1, 'El apellido es requerido.'),
  email: z.string().email('Por favor, introduce un correo electrónico válido.'),
  role: z.enum(['Administrador', 'Creativo']),
});

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: 'Creativo',
    },
  });

  // Auto-fill from Google session
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      const names = user.displayName?.split(' ') || [];
      form.reset({
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        email: user.email || '',
        role: 'Creativo',
      });
    }
  }, [user, isUserLoading, form, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('team_verified') === 'true') {
        setIsVerified(true);
      }
    }
  }, []);

  const handleVerifyCode = async () => {
    if (!firestore) return;
    setIsVerifying(true);

    try {
      const securityDoc = await getDoc(doc(firestore, 'config', 'security'));
      const actualTeamCode = securityDoc.exists() ? securityDoc.data().TEAM_CODE : 'KAIROS-TEAM-2026';

      if (verificationCode === actualTeamCode) {
        setIsVerified(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('team_verified', 'true');
        }
        toast({
          title: "Código Correcto",
          description: "Has sido verificado como miembro del equipo.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Código Incorrecto",
          description: "La clave de equipo no es válida.",
        });
      }
    } catch (error) {
      console.error("Error al verificar código:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Error de Sistema",
        description: "No se detectó una sesión activa de Google.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create or update user document in Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDocumentNonBlocking(userDocRef, {
        id: user.uid,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        role: values.role,
        photoURL: user.photoURL || null,
        type: 'team',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({
        title: "¡Perfil Completado!",
        description: "Bienvenido al equipo de Kairos Visuals.",
      });

      router.push('/');

    } catch (error: any) {
      console.error("Profile Completion Error:", error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudo completar tu perfil. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-accent/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-md relative z-10 transition-all duration-500 ease-in-out">
        {!isVerified ? (
          <Card className="border-primary/20 shadow-2xl animate-in fade-in zoom-in duration-300">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Seguridad de Equipo</CardTitle>
              <CardDescription>
                Hola {user?.displayName}, introduce la clave secreta de Kairos Visuals para continuar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                placeholder="Código de Acceso"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                className="text-center text-2xl tracking-[0.5em] font-mono h-16 border-primary/20"
              />
              <Button onClick={handleVerifyCode} disabled={isVerifying} className="w-full h-14 text-lg font-bold group">
                {isVerifying ? <Loader2 className="animate-spin w-6 h-6" /> : (
                  <>
                    Verificar Identidad
                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
                Acceso restringido solo a personal autorizado
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/20 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex items-center justify-center gap-2">
                <div className="bg-primary/10 p-2 rounded-lg w-12 h-12 flex items-center justify-center">
                  <Logo className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-headline font-bold">Kairos Visuals</h1>
              </div>
              <CardTitle className="text-2xl">Confirma tu Perfil</CardTitle>
              <CardDescription>
                Identidad verificada. Por favor, confirma tus datos finales.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex items-center gap-4 p-3 bg-secondary/50 rounded-xl border border-primary/10">
                <div className="relative">
                  <img
                    src={user?.photoURL || "https://picsum.photos/seed/user/40/40"}
                    alt="Profile"
                    className="w-12 h-12 rounded-full border-2 border-primary/20"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-primary text-white p-0.5 rounded-full">
                    <Shield className="w-3 h-3" />
                  </div>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-semibold truncate">{user?.displayName}</span>
                  <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Perfil en el Equipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-16 border-primary/20 bg-secondary/30 text-lg font-medium">
                              <SelectValue placeholder="Selecciona tu función" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Administrador" className="py-4 cursor-pointer focus:bg-primary/5 focus:text-primary">
                              <div className="flex flex-col items-start gap-1 p-1">
                                <span className="font-bold text-base leading-none">Administrador</span>
                                <span className="text-xs text-muted-foreground leading-tight">Gestión, finanzas y control total del OS.</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="Creativo" className="py-4 cursor-pointer focus:bg-primary/5 focus:text-primary">
                              <div className="flex flex-col items-start gap-1 p-1">
                                <span className="font-bold text-base leading-none">Creativo</span>
                                <span className="text-xs text-muted-foreground leading-tight">Producción visual, diseño y estrategia creativa.</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full h-16 text-xl font-bold group shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <UserCheck className="mr-2 h-6 w-6 group-hover:rotate-12 transition-transform" />
                    )}
                    Finalizar y Entrar
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
