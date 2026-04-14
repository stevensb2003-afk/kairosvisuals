import { Firestore, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Valida si un email o teléfono ya están registrados en la colección `clients`.
 * @returns { isUnique: true } si los datos están disponibles.
 * @returns { isUnique: false, conflictField: 'email' | 'phone', existingClientId: string } si hay conflicto.
 */
export async function validateClientUniqueness(
  firestore: Firestore,
  email: string | null | undefined,
  phone: string | null | undefined
): Promise<{ isUnique: boolean; conflictField?: 'email' | 'phone'; existingClientId?: string }> {
  if (!email && !phone) {
    return { isUnique: true };
  }

  // Validate Email
  if (email && email.trim() !== '') {
    const qEmail = query(collection(firestore, 'clients'), where('clientEmail', '==', email.trim()));
    const snap = await getDocs(qEmail);
    if (!snap.empty) {
      return { isUnique: false, conflictField: 'email', existingClientId: snap.docs[0].id };
    }
  }

  // Validate Phone
  if (phone && phone.trim() !== '') {
    const qPhone = query(collection(firestore, 'clients'), where('clientPhone', '==', phone.trim()));
    const snap = await getDocs(qPhone);
    if (!snap.empty) {
      return { isUnique: false, conflictField: 'phone', existingClientId: snap.docs[0].id };
    }
  }

  return { isUnique: true };
}
