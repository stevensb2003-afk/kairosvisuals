import { useMemo, useState, useEffect } from 'react';
import { collection, doc, query, where, onSnapshot } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';

export function useInvoicingData() {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();

  // 1. Clients
  const clientsQuery = useMemo(() =>
    firestore && !isUserLoading ? collection(firestore, 'clients') : null,
  [firestore, isUserLoading]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<any>(clientsQuery);

  // 2. Users (for client names reconciliation)
  const usersQuery = useMemo(() =>
    firestore && !isUserLoading ? query(collection(firestore, 'users'), where('type', '==', 'client')) : null,
  [firestore, isUserLoading]);
  const { data: usersData, isLoading: isLoadingUsers } = useCollection<any>(usersQuery);

  // 3. Services
  const servicesQuery = useMemo(() =>
    firestore && !isUserLoading ? collection(firestore, 'services') : null,
  [firestore, isUserLoading]);
  const { data: services, isLoading: isLoadingServices } = useCollection<any>(servicesQuery);

  // 4. Predefined Plans
  const plansQuery = useMemo(() =>
    firestore && !isUserLoading ? collection(firestore, 'predefined_plans') : null,
  [firestore, isUserLoading]);
  const { data: predefinedPlans, isLoading: isLoadingPlans } = useCollection<any>(plansQuery);

  // 5. Settings (IVA)
  const [settings, setSettings] = useState<any>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    const unsub = onSnapshot(doc(firestore, 'settings', 'general'), (snap) => {
      if (snap.exists()) setSettings(snap.data());
      setIsLoadingSettings(false);
    });
    return () => unsub();
  }, [firestore]);

  // Client Map for quick lookup
  const clientMap = useMemo(() => {
    if (!clients || !usersData) return new Map();
    const map = new Map();
    
    // First, populate with clients from the 'clients' collection
    clients.forEach(c => {
      map.set(c.id, {
        id: c.id,
        name: c.clientName || c.name || 'Cliente sin nombre',
        email: c.contactEmail || c.email,
        phone: c.contactPhone || c.phone,
        isLegacy: false
      });
    });

    // Then, augment or add from users collection (legacy or shared)
    usersData.forEach(u => {
      const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.company || u.email;
      if (map.has(u.id)) {
        const existing = map.get(u.id);
        map.set(u.id, { ...existing, name: existing.name !== 'Cliente sin nombre' ? existing.name : name });
      } else {
        map.set(u.id, {
          id: u.id,
          name: name,
          email: u.email,
          phone: u.phone,
          isLegacy: true
        });
      }
    });

    return map;
  }, [clients, usersData]);

  // Sorted Lists
  const sortedServices = useMemo(() => {
    if (!services) return [];
    return [...services].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [services]);

  const sortedPlans = useMemo(() => {
    if (!predefinedPlans) return [];
    return [...predefinedPlans].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [predefinedPlans]);

  const sortedClients = useMemo(() => {
    if (!clients) return [];
    return [...clients].sort((a, b) => (
      (a.clientName || a.name || '').localeCompare(b.clientName || b.name || '')
    ));
  }, [clients]);

  return {
    clients: sortedClients,
    usersData,
    services: sortedServices,
    predefinedPlans: sortedPlans,
    settings,
    clientMap,
    isLoading: isLoadingClients || isLoadingUsers || isLoadingServices || isLoadingPlans || isLoadingSettings
  };
}
