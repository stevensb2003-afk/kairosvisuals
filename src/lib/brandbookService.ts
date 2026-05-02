import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  type Firestore,
} from 'firebase/firestore';
import type { BrandBook } from './types';

export type CreateBrandBookInput = Omit<BrandBook, 'id' | 'createdAt' | 'updatedAt'>;

export async function createBrandBook(
  firestore: Firestore,
  input: CreateBrandBookInput
): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(firestore, 'brandBooks'), {
    ...input,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateBrandBook(
  firestore: Firestore,
  id: string,
  data: Partial<CreateBrandBookInput>
): Promise<void> {
  await updateDoc(doc(firestore, 'brandBooks', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteBrandBook(firestore: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(firestore, 'brandBooks', id));
}

export async function getBrandBooks(firestore: Firestore): Promise<BrandBook[]> {
  const q = query(collection(firestore, 'brandBooks'), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BrandBook));
}

export async function getBrandBookById(firestore: Firestore, id: string): Promise<BrandBook | null> {
  const docRef = doc(firestore, 'brandBooks', id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as BrandBook;
}
