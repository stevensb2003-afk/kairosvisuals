"use client";

import * as React from "react";
import { Check, ChevronsUpDown, UserPlus, Search, Loader2, Building2, Mail, Phone, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, addDoc, setDoc, doc } from "firebase/firestore";
import { validateClientUniqueness } from "@/lib/client_utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PhoneInput } from "@/components/ui/phone-input";

export interface ClientSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClientCreated?: (clientId: string) => void;
}

export function ClientSelect({ value, onChange, placeholder = "Seleccionar cliente..." }: ClientSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  // Fetch clients
  const clientsQuery = React.useMemo(() => 
    firestore ? query(
      collection(firestore, "clients"), 
      where("isArchived", "==", false)
    ) : null,
  [firestore]);
  
  const { data: clients, isLoading } = useCollection<any>(clientsQuery);

  const [newClient, setNewClient] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
  });

  const selectedClient = React.useMemo(() => 
    clients?.find((client) => client.id === value || client.clientName === value || client.company === value),
  [clients, value]);

  const handleCreateClient = async () => {
    if (!firestore) return;
    if (!newClient.firstName || !newClient.lastName || !newClient.phone) {
      toast({
        title: "Error",
        description: "El nombre, apellidos y el teléfono son obligatorios.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { isUnique, conflictField } = await validateClientUniqueness(firestore, newClient.email, newClient.phone);
      if (!isUnique) {
        toast({
          title: "Cliente duplicado",
          description: `Ya existe un cliente con este ${conflictField === 'email' ? 'correo electrónico' : 'número de teléfono'}. Por favor búscalo y selecciónalo de la lista.`,
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }

      const id = `cli_${Date.now()}`;
      const now = new Date().toISOString();
      const unifiedName = `${newClient.firstName} ${newClient.lastName}`.trim();
      
      // Initialize client business document (Standardized schema)
      await setDoc(doc(firestore, "clients", id), {
        id,
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        clientName: unifiedName,
        clientEmail: newClient.email || '',
        clientPhone: newClient.phone,
        company: newClient.company || null,
        isArchived: false,
        portalAccessActive: false,
        source: 'quick_add',
        onboardingType: 'direct',
        createdAt: now,
        updatedAt: now,
      });
      
      onChange(id); // Select the new client
      setIsDialogOpen(false);
      setNewClient({ firstName: "", lastName: "", email: "", company: "", phone: "" });
      toast({
        title: "¡Éxito!",
        description: "Cliente registrado y listo para gestión.",
      });
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el cliente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="flex gap-2">
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between font-normal"
            >
              {value ? (
                <span className="truncate text-left">
                  {selectedClient 
                    ? `${selectedClient.clientName}${selectedClient.company ? ` - (${selectedClient.company})` : ''}` 
                    : value}
                </span>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <Button 
            type="button"
            variant="outline" 
            size="icon" 
            className="shrink-0 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 group"
            onClick={() => setIsDialogOpen(true)}
            title="Nuevo Cliente Express"
          >
            <UserPlus className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </Button>
        </div>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar cliente..." />
            <CommandList>
              <CommandEmpty>No se encontró el cliente.</CommandEmpty>
              <CommandGroup heading="Clientes Existentes">
                {isLoading ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin mb-2" />
                    Cargando clientes...
                  </div>
                ) : (
                  clients?.map((client) => {
                    const searchableText = `${client.clientName} ${client.company || ""} ${client.clientEmail || ""}`.toLowerCase();
                    return (
                      <CommandItem
                        key={client.id}
                        value={searchableText}
                        onSelect={() => {
                          onChange(client.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === client.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {client.clientName}
                            {client.company && (
                              <span className="text-muted-foreground font-normal ml-1">
                                - ({client.company})
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {client.clientEmail}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })
                )}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setIsDialogOpen(true);
                  }}
                  className="text-primary font-medium"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Agregar Nuevo Cliente
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente Express</DialogTitle>
            <DialogDescription>
              Agrega un cliente rápidamente para esta tarea.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="firstName">Nombre</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cl-first-name"
                    name="cl-first-name"
                    autoComplete="off"
                    value={newClient.firstName}
                    onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                    placeholder="Ej: John"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Apellidos</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cl-last-name"
                    name="cl-last-name"
                    autoComplete="off"
                    value={newClient.lastName}
                    onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                    placeholder="Ej: Doe"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Empresa (Opcional)</Label>
              <div className="relative">
                <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cl-company"
                  name="cl-company"
                  autoComplete="off"
                  value={newClient.company}
                  onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                  placeholder="Ej: Acme Corp"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cl-email"
                  name="cl-email"
                  autoComplete="off"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="john@example.com"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <PhoneInput
                defaultCountry="CR"
                placeholder="Introducir número"
                value={newClient.phone}
                onChange={val => setNewClient({ ...newClient, phone: val })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateClient} 
              disabled={isSaving || !newClient.firstName || !newClient.lastName || !newClient.phone}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear y Seleccionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

