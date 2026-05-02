'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase/provider';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import * as PopoverPrimitive from '@radix-ui/react-popover';

interface Client {
  id: string;
  clientName: string;
  company?: string;
}

interface DarkClientSelectProps {
  value?: string;
  onChange: (value: string, name: string) => void;
  onClear?: () => void;
}

export function DarkClientSelect({ value, onChange, onClear }: DarkClientSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const db = useFirestore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!db) return;
    setIsLoading(true);
    getDocs(query(
      collection(db, 'clients'),
      where('isArchived', '==', false),
      orderBy('clientName', 'asc')
    ))
      .then((snap) => {
        setClients(snap.docs.map((d) => ({
          id: d.id,
          clientName: d.data().clientName as string,
          company: d.data().company as string | undefined,
        })));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [db]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [open]);

  const selectedClient = useMemo(() => clients.find((c) => c.id === value), [clients, value]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter((c) =>
      `${c.clientName} ${c.company ?? ''}`.toLowerCase().includes(q)
    );
  }, [clients, search]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'group w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border text-left transition-all outline-none text-[12px]',
            'bg-white/[0.03] border-white/10',
            'hover:border-white/20 hover:bg-white/[0.05]',
            open ? 'border-[#FF5C2B]/50 bg-white/5 shadow-lg shadow-[#FF5C2B]/5' : ''
          )}
        >
          <span className={cn('truncate', selectedClient ? 'text-white/90' : 'text-white/35')}>
            {selectedClient
              ? `${selectedClient.clientName}${selectedClient.company ? ` · ${selectedClient.company}` : ''}`
              : 'Seleccionar cliente...'}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {value && onClear && (
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </span>
            )}
            <ChevronsUpDown className={cn('w-3.5 h-3.5 text-white/20 transition-colors', open && 'text-[#FF5C2B]')} />
          </div>
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={6}
          align="start"
          className={cn(
            'z-[200] overflow-hidden rounded-2xl border border-white/10 bg-[#0A1929] shadow-2xl shadow-black/60 backdrop-blur-2xl',
            'w-[var(--radix-popover-trigger-width)]',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-2',
            'duration-200'
          )}
        >
          <div className="p-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.07]">
              <Search className="w-3.5 h-3.5 text-white/25 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full bg-transparent text-[11px] text-white placeholder:text-white/25 outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-white/20 hover:text-white/50 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto p-1.5">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-white/30">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-[10px] font-medium">Cargando...</span>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-6 text-[10px] text-white/25 italic">Sin resultados</p>
            ) : (
              filtered.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => {
                    const name = `${client.clientName}${client.company ? ` · ${client.company}` : ''}`;
                    onChange(client.id, name);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150',
                    'hover:bg-white/[0.06]',
                    value === client.id ? 'bg-[#FF5C2B]/10' : ''
                  )}
                >
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0 transition-all',
                    value === client.id ? 'bg-[#FF5C2B]' : 'bg-white/10'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-[11px] font-semibold truncate transition-colors',
                      value === client.id ? 'text-white' : 'text-white/60'
                    )}>
                      {client.clientName}
                    </p>
                    {client.company && (
                      <p className="text-[9px] text-white/30 truncate mt-0.5">{client.company}</p>
                    )}
                  </div>
                  {value === client.id && (
                    <Check className="w-3 h-3 text-[#FF5C2B] shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
