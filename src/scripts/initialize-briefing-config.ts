import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Ensure .env is loaded
import dotenv from 'dotenv';
dotenv.config({ path: join(process.cwd(), '.env.local') });

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

const db = getFirestore(app);

const DEFAULT_BRIEFING_CONFIG = {
  industries: [
    "Bienes Raíces", "Marcas Personales", "E-commerce", "Salud y Bienestar", "Gastronomía", 
    "Tecnología / SaaS", "Educación", "Servicios Profesionales", "Construcción / Arquitectura", "Otro"
  ],
  expectations: [
    "Crear y Fidelizar una Comunidad Activa",
    "Generar más Leads y Consultas de Clientes",
    "Educación de Audiencia sobre mis Servicios",
    "Identidad de Marca Coherente",
    "Diseño Visual de Alto Impacto",
    "Estrategia de Contenido Clara"
  ],
  mainGoals: [
    "Escalar Ventas en un 50% o más",
    "Posicionarme como Referente No. 1 en mi Nicho",
    "Automatizar Marketing para Liberar mi Tiempo",
    "Lanzar un Nuevo Producto o Servicio",
    "Internacionalizar mi Marca",
    "Mejorar el Enganche (Engagement)"
  ],
  motivations: [
    "Delegar las redes porque no tengo tiempo",
    "Mi marca actual se ve anticuada",
    "Acabo de iniciar un nuevo proyecto",
    "No estoy logrando resultados con mi imagen actual",
    "Quiero llevar mi negocio al siguiente nivel"
  ],
  contactSources: [
    "Instagram", "TikTok", "Facebook", "LinkedIn", "Referido por un amigo", 
    "Google / Búsqueda", "Publicidad Pagada", "Otro"
  ]
};

const DEFAULT_SECURITY_CONFIG = {
  TEAM_CODE: 'KAIROS-TEAM-2026'
};

async function main() {
  try {
    console.log("Initializing Briefing Config...");
    await setDoc(doc(db, 'settings', 'briefing'), DEFAULT_BRIEFING_CONFIG);
    console.log("✅ Briefing Config initialized successfully.");

    console.log("Initializing Security Config...");
    await setDoc(doc(db, 'config', 'security'), DEFAULT_SECURITY_CONFIG);
    console.log("✅ Security Config initialized successfully.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing configs:", error);
    process.exit(1);
  }
}

main();
