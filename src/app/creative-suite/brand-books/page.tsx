'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore, useUser } from '@/firebase/provider';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { BrandBook } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Search, Palette, Loader2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function BrandBooksPage() {
  const [brandBooks, setBrandBooks] = useState<BrandBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const db = useFirestore();
  const { user, userData, isUserLoading } = useUser();

  useEffect(() => {
    const fetchBrandBooks = async () => {
      if (!db || !user) return;
      try {
        const isTeam = 
          userData?.type === 'team' || 
          ['Administrador', 'Administrativo', 'Creativo', 'admin', 'manager', 'designer', 'editor'].includes(userData?.role) || 
          ['stevensb.2003@gmail.com', 'kairosvisuals@gmail.com'].includes(user.email || '');

        let q;
        if (isTeam) {
          q = query(collection(db, 'brandBooks'), orderBy('createdAt', 'desc'));
        } else {
          q = query(collection(db, 'brandBooks'), where('clientId', '==', user.uid), orderBy('createdAt', 'desc'));
        }

        const querySnapshot = await getDocs(q);
        const booksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BrandBook[];
        setBrandBooks(booksData);
      } catch (error) {
        console.error('Error fetching brand books:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isUserLoading) {
      if (user) {
        fetchBrandBooks();
      } else {
        setIsLoading(false);
      }
    }
  }, [db, user, userData, isUserLoading]);

  const filteredBooks = brandBooks.filter(book => 
    book.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (book.industry && book.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            Brand Books
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona la identidad visual y directrices de marca para tus clientes y proyectos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/creative-suite/brand-books/create')} className="shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Brand Book
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-card/50 backdrop-blur-sm p-4 rounded-xl border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o industria..." 
            className="pl-10 bg-background/50 border-white/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card/30 rounded-2xl border border-dashed border-muted-foreground/20">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-primary/60" />
          </div>
          <h3 className="text-xl font-bold mb-2">No hay Brand Books</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {searchTerm ? 'No se encontraron resultados para tu búsqueda.' : 'Crea tu primer Brand Book para estandarizar la generación de creatividades de una marca.'}
          </p>
          {!searchTerm && (
            <Button onClick={() => router.push('/creative-suite/brand-books/create')} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Crear el primero
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <Link href={`/creative-suite/brand-books/${book.id}`} key={book.id}>
              <Card className="h-full hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 group cursor-pointer overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="h-2 w-full" style={{ backgroundColor: book.visualIdentity?.primaryColor || 'var(--primary)' }} />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold line-clamp-1">{book.name}</CardTitle>
                  </div>
                  <CardDescription className="line-clamp-1">
                    {book.industry || 'Industria no especificada'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Paleta de colores</span>
                  </div>
                  <div className="flex gap-2">
                    {[
                      book.visualIdentity?.primaryColor,
                      book.visualIdentity?.secondaryColor,
                      book.visualIdentity?.tertiaryColor
                    ].filter(Boolean).map((color, idx) => (
                      <div 
                        key={idx} 
                        className="w-8 h-8 rounded-full border shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    {(!book.visualIdentity?.primaryColor) && (
                      <span className="text-xs text-muted-foreground italic">No definida</span>
                    )}
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-1">
                    {book.tone?.slice(0, 3).map((t, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[10px] bg-secondary/50">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t border-border/50 bg-muted/20">
                  <span className="text-sm text-primary font-medium flex items-center group-hover:underline">
                    Ver detalles <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
