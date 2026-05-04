'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, cn } from '@/lib/utils';

interface InvoiceItemsListProps {
  items: any[];
  totalAmount: number;
}

export function InvoiceItemsList({ items, totalAmount }: InvoiceItemsListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!items?.length) return null;

  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Desglose de Ítems
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30">
          {items.map((item: any, i: number) => {
            const isExpanded = expandedIndex === i;
            const hasLongDesc = item.description && item.description.length > 60;

            return (
              <div key={i} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  {/* Left: name + meta */}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm leading-snug">{item.serviceName || '—'}</p>
                    {item.description && (
                      <p className={cn(
                        'text-xs text-muted-foreground mt-0.5 transition-all',
                        isExpanded ? '' : 'line-clamp-1'
                      )}>
                        {item.description}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>

                  {/* Right: total + expand toggle */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <p className="font-black text-primary tabular-nums text-sm">
                      {formatCurrency(item.total)}
                    </p>
                    {hasLongDesc && (
                      <button
                        onClick={() => setExpandedIndex(isExpanded ? null : i)}
                        className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
                        aria-label={isExpanded ? 'Colapsar descripción' : 'Expandir descripción'}
                      >
                        {isExpanded
                          ? <><ChevronUp className="w-3 h-3" /> Menos</>
                          : <><ChevronDown className="w-3 h-3" /> Más</>
                        }
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Total row */}
          <div className="px-4 py-3 flex items-center justify-between bg-secondary/20">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Total Factura
            </p>
            <p className="text-2xl font-black text-primary tabular-nums">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
