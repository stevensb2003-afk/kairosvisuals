import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where,
  type Firestore,
} from 'firebase/firestore';
import type { SavedScript } from './types';

export type CreateScriptInput = Omit<SavedScript, 'id' | 'createdAt'>;

function sanitize<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

export async function saveScript(
  firestore: Firestore,
  input: CreateScriptInput
): Promise<string> {
  const payload = sanitize({
    ...input,
    createdAt: new Date().toISOString(),
  });
  const ref = await addDoc(collection(firestore, 'scripts'), payload);
  return ref.id;
}

export async function getScripts(
  firestore: Firestore,
  userId: string
): Promise<SavedScript[]> {
  const q = query(
    collection(firestore, 'scripts'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedScript));
}

export async function deleteScript(
  firestore: Firestore,
  id: string
): Promise<void> {
  await deleteDoc(doc(firestore, 'scripts', id));
}
