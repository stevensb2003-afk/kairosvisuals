'use client';

import * as React from 'react';
import type { ReactNode } from 'react';

// @ts-ignore - Bypassing persistent type resolution issues for React hooks
const { useState, useEffect, useMemo, useContext, createContext } = React;
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

// Internal state for user authentication and profile
interface UserAuthState {
  user: User | null;
  userData: any | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  user: User | null;
  userData: any | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  user: User | null;
  userData: any | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser()
export interface UserHookResult {
  user: User | null;
  userData: any | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}: FirebaseProviderProps): any => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    userData: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!auth) {
      setUserAuthState({ user: null, userData: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          // Fetch user document from Firestore
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
            setUserAuthState({
              user: firebaseUser,
              userData: docSnap.exists() ? docSnap.data() : null,
              isUserLoading: false,
              userError: null,
            });
          }, (err) => {
            console.error("Firestore user doc error:", err);
            setUserAuthState((prev: UserAuthState) => ({ ...prev, user: firebaseUser, isUserLoading: false }));
          });
        } else {
          if (unsubscribeDoc) unsubscribeDoc();
          setUserAuthState({ user: null, userData: null, isUserLoading: false, userError: null });
        }
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, userData: null, isUserLoading: false, userError: error });
      }
    );

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && storage);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      storage: servicesAvailable ? storage : null,
      user: userAuthState.user,
      userData: userAuthState.userData,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, storage, userAuthState]);

  const Provider = FirebaseContext.Provider as any;
  return (
    <Provider value={contextValue}>
      {children}
    </Provider>
  ) as any;
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase must be used within a FirebaseProvider.');
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }
  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage!,
    user: context.user,
    userData: context.userData,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = (): Auth => useFirebase().auth;
export const useFirestore = (): Firestore => useFirebase().firestore;
export const useFirebaseApp = (): FirebaseApp => useFirebase().firebaseApp;
export const useStorage = (): FirebaseStorage => useFirebase().storage;

export const useUser = (): UserHookResult => {
  const { user, userData, isUserLoading, userError } = useFirebase();
  return { user, userData, isUserLoading, userError };
};
