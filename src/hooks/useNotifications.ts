'use client';

/**
 * useNotifications.ts
 * Hook que suscribe en tiempo real a las notificaciones del usuario actual.
 * Escucha notificaciones donde targetUserId == uid del usuario O == 'all'.
 *
 * Limitaciones de Firestore OR queries:
 * Se hace UNA sola query con `in` operator: [userId, 'all']
 */

import { useEffect, useState, useCallback } from 'react';
import {
  collection, query, where, orderBy, onSnapshot, limit,
} from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import {
  markNotificationRead,
  markAllNotificationsRead,
  archiveNotification,
  archiveAllNotifications,
} from '@/lib/notificationService';
import type { AppNotification } from '@/lib/types';

const MAX_FETCH = 60;

interface UseNotificationsReturn {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  archive: (id: string) => Promise<void>;
  archiveAll: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore || isUserLoading || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Query: notificaciones destinadas a este usuario O a 'all'
    const q = query(
      collection(firestore, 'notifications'),
      where('targetUserId', 'in', [user.uid, 'all']),
      orderBy('createdAt', 'desc'),
      limit(MAX_FETCH)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
        } as AppNotification));

        // Filtro client-side para evitar problemas con documentos antiguos sin el campo 'archived'
        // y para evitar requerir índices compuestos complejos de inmediato.
        setNotifications(notifs.filter(n => !n.archived));
        setIsLoading(false);
      },
      (err) => {
        console.error('[useNotifications] Error:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, user, isUserLoading]);

  const markRead = useCallback(async (id: string) => {
    if (!firestore) return;
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    try {
      await markNotificationRead(firestore, id);
    } catch (err) {
      console.error('[useNotifications] Error markRead:', err);
    }
  }, [firestore]);

  const markAllRead = useCallback(async () => {
    if (!firestore || !user) return;
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead(firestore, user.uid);
    } catch (err) {
      console.error('[useNotifications] Error markAllRead:', err);
    }
  }, [firestore, user]);

  const archive = useCallback(async (id: string) => {
    if (!firestore) return;
    // Optimistic update (remover de la lista local)
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await archiveNotification(firestore, id);
    } catch (err) {
      console.error('[useNotifications] Error archive:', err);
    }
  }, [firestore]);

  const archiveAll = useCallback(async () => {
    if (!firestore || !user) return;
    // Optimistic update
    setNotifications([]);
    try {
      await archiveAllNotifications(firestore, user.uid);
    } catch (err) {
      console.error('[useNotifications] Error archiveAll:', err);
    }
  }, [firestore, user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { 
    notifications, 
    unreadCount, 
    isLoading, 
    markRead, 
    markAllRead,
    archive,
    archiveAll 
  };
}
