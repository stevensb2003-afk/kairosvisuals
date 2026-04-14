
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedConfig() {
  const configRef = doc(db, "config", "briefing");
  
  const initialData = {
    industries: [
      "Agencia de Viajes", "Alimentos y Bebidas", "Arquitectura y Diseño", "Automotriz",
      "Belleza y Cuidado Personal", "Bienes Raíces", "Consultoría y Servicios Profesionales",
      "Educación y Formación", "Entretenimiento", "Eventos y Bodas", "Farmacéutica y Salud",
      "Finanzas y Seguros", "Fitness y Deportes", "Gastronomía / Restaurantes", 
      "Hotelería y Turismo", "Inmobiliaria", "Logística y Transporte", "Manufactura",
      "Moda y Accesorios", "Música y Arte", "ONG / Sin Fines de Lucro", "Publicidad y Marketing",
      "Retail / Comercio Minorista", "Tecnología y Software", "Telecomunicaciones", "Otro"
    ].sort(),
    expectations: [
      "Crear y Fidelizar una Comunidad Activa",
      "Generar más Leads y Consultas de Clientes",
      "Educación de Audiencia sobre mis Servicios",
      "Mejorar el Engagement y Alcance Orgánico",
      "Lanzar un Nuevo Producto o Servicio",
      "Aumentar Tráfico al Sitio Web",
      "Reforzar Identidad Visual en Redes",
      "Contenido más Profesional y Estético"
    ],
    mainGoals: [
      "Escalar Ventas en un 50% o más",
      "Posicionarme como Referente No. 1 en mi Nicho",
      "Automatizar Marketing para Liberar mi Tiempo",
      "Expansión a Nuevos Mercados / Países",
      "Optimizar el Retorno de Inversión (ROI)",
      "Crear un Embudo de Ventas Predecible",
      "Delegar Gestión de Redes por Completo",
      "Construir una Marca Personal de Alto Impacto"
    ],
    motivations: [
      "Delegar las redes porque no tengo tiempo",
      "No sé qué publicar ni cómo crear contenido",
      "Mis redes actuales no se ven profesionales",
      "Necesito una estrategia clara para crecer",
      "Quiero mejores resultados con mi inversión",
      "Me siento estancado con mi marca actual"
    ],
    contactSources: [
      "Instagram",
      "Facebook",
      "LinkedIn",
      "TikTok",
      "Referencia de un colega/amigo",
      "Publicidad Online",
      "Búsqueda en Google",
      "Conocido de Kairos Visuals",
      "Otro"
    ]
  };

  try {
    await setDoc(configRef, initialData);
    console.log("Configuration seeded successfully!");
  } catch (error) {
    console.error("Error seeding configuration:", error);
  }
}

seedConfig();
