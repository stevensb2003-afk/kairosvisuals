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
import type { SavedCopy } from './types';

export type CreateCopyInput = Omit<SavedCopy, 'id' | 'createdAt'>;

function sanitize<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

export async function saveCopy(
  firestore: Firestore,
  input: CreateCopyInput
): Promise<string> {
  const payload = sanitize({
    ...input,
    createdAt: new Date().toISOString(),
  });
  const ref = await addDoc(collection(firestore, 'copys'), payload);
  return ref.id;
}

export async function getCopys(
  firestore: Firestore,
  userId: string
): Promise<SavedCopy[]> {
  const q = query(
    collection(firestore, 'copys'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedCopy));
}

export async function deleteCopy(
  firestore: Firestore,
  id: string
): Promise<void> {
  await deleteDoc(doc(firestore, 'copys', id));
}
