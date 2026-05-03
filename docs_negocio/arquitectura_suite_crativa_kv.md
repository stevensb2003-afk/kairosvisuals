# **Blueprint de Ingeniería: Evolución del Motor de Composición Híbrido**

**Proyecto:** Suite Creativa \- Kairós Visuals

**Objetivo:** Transicionar de un sistema de maquetación basado en plantillas rígidas (Canvas puro) a un Motor de Composición Híbrido impulsado por IA Generativa (Gemini Pro \+ Imagen 3\) con posicionamiento espacial dinámico, respetando estrictamente la identidad de marca (Brand Book).

## **1\. El Diagnóstico del Problema Actual**

Actualmente, la Suite Creativa funciona como un "armador de rompecabezas". El *Vision Engine* elige entre plantillas rígidas predefinidas (ej. split-left, center, bottom-heavy) y rellena el texto.

**Limitación:** El resultado, aunque funcional y alineado a la marca, se siente genérico, cuadriculado y carece de libertad creativa real.

## **2\. La Solución: El Modelo de Composición Híbrido**

La IA no debe generar la imagen final completa con texto (ya que fallará en la exactitud tipográfica y en los colores HEX precisos de la marca). En su lugar, se implementará una arquitectura donde **Gemini actúa como Arquitecto Espacial** y **React ejecuta la Composición Final**.

### **Los Pilares del Nuevo Modelo:**

1. **Generación de Activos (Imagen 3):** Creación de fondos fotográficos, texturas o elementos visuales únicos, sin texto (Clean Backgrounds).  
2. **Posicionamiento Espacial Absoluto (Generative UI):** La IA define coordenadas exactas (top, left, width, tamaños de fuente) para cada elemento de texto basado en el "espacio en blanco" de la imagen generada.  
3. **Renderizado de Marca (React/CSS):** El frontend superpone la tipografía .ttf/.otf oficial y los colores HEX exactos sobre el activo generado.

## **3\. Flujo de Trabajo Técnico (Paso a Paso)**

### **PASO 3.1: Actualización del "Vision Engine" (Backend \- Gemini Pro)**

Se debe modificar el *System Prompt* y el esquema de respuesta JSON para que Gemini deje de seleccionar plantillas y empiece a diseñar escenarios.

**Nuevo Prompting Editorial:**

*"Eres un Director de Arte Editorial Senior. Tu trabajo es analizar el briefing y la marca, redactar el copy, definir la jerarquía visual y diseñar un fondo fotográfico o artístico que potencie el mensaje, usando la paleta de colores de la marca como guía base para la generación. Aplica contraste extremo en la tipografía. Atrévete a romper la simetría. NUNCA centres todo el texto, alinea a los bordes para crear tensión visual."*

**Nuevo Esquema de Respuesta (JSON Híbrido):**

{  
  "copywriting": {  
    "headline": "Tu Título Impactante",  
    "body": "El texto descriptivo aquí...",  
    "cta": "Llamado a la acción"  
  },  
  "visualDirection": {  
    "compositionType": "layered",  
    "imageGeneratorPrompt": "A hyper-realistic cinematic shot of a modern barista pouring latte art, clean composition, natural lighting, subtle hints of \#FF5733 in the background details, minimalist style, 8k.",  
    "negativePrompt": "text, watermark, blurry, messy, ugly, typography, letters",  
    "targetAspectRatio": "1:1"  
  },  
  "uiOverlayMapping": {  
    "textContainer": {  
      "position": "absolute",  
      "top": "10%",  
      "left": "5%",  
      "width": "40%",  
      "textAlign": "left",  
      "textColor": "\#1A1A1A",  
      "backgroundColorOverlay": "rgba(255,255,255,0.1)"  
    },  
    "headlineSize": "64px",  
    "bodySize": "18px",  
    "letterSpacing": "-0.02em"  
  }  
}

### **PASO 3.2: Integración de la Generación de Imagen (Backend \- Next.js Proxy)**

El proxy /api/gemini ahora realizará dos acciones secuenciales:

1. Llamar a **Gemini Pro** (o modelo de texto) para procesar el Briefing \+ Brand Book y obtener el JSON estructurado detallado arriba.  
2. Extraer el campo visualDirection.imageGeneratorPrompt y realizar una **segunda llamada a la API de Google AI Studio / Vertex AI**, específicamente al modelo imagen-3.0-generate-001.  
3. Retornar al frontend el JSON original concatenado con la URL (o Base64) de la imagen fotorrealista devuelta por Imagen 3\.

### **PASO 3.3: Actualización del "Content Studio" (Frontend \- React)**

Eliminar los componentes de layouts rígidos (\<SplitLayout\>, etc.) y crear un \<DynamicSceneComposer\>.

**Estructura del \<DynamicSceneComposer\>:**

1. **Capa Z-Index 0 (Fondo):** Renderiza la imagen generada por Imagen 3 ocupando el 100% del canvas.  
2. **Capa Z-Index 1 (SVGs Dinámicos \- Opcional):** Inyección de formas vectoriales puras generadas por Gemini (ruido visual, gradientes complejos) para sumar textura.  
3. **Capa Z-Index 2 (Marca y Texto):** Creación de elementos \<div\> posicionados absolutamente usando las variables de uiOverlayMapping. Se aplican estilos en línea estrictos vinculados al estado de Firestore (Brand Book).

## **4\. Implementación del Panel de "Instrucciones Avanzadas" (Modo Pro)**

Para otorgar máxima libertad creativa a los diseñadores en casos específicos, se implementará un "Switch" en la UI que despliegue las configuraciones nativas de la API de Imagen 3\.

### **Mapeo de Interfaz de Usuario a API:**

1. **Dimensiones y Encuadre (aspectRatio)**  
   * *UI:* Dropdown de selección de formato.  
   * *Valores Exactos Soportados por Imagen 3 (Mapeo API):*  
     * **1:1** (Cuadrado \- 1024x1024): Formato estándar para posts de Instagram y Facebook.  
     * **3:4** (Vertical Clásico \- 896x1280): Ideal para retratos y fotografía de producto.  
     * **4:3** (Horizontal Clásico \- 1280x896): Formato fotográfico tradicional.  
     * **9:16** (Vertical Extremo \- 768x1408): Optimizado para Reels, Stories, TikToks y YouTube Shorts.  
     * **16:9** (Panorámico \- 1408x768): Ideal para miniaturas de YouTube, banners y presentaciones.  
2. **Control Negativo (negativePrompt)**  
   * *UI:* Checkboxes (Ej: \[x\] Sin Personas, \[x\] Sin Texto) o Input de texto libre.  
   * *Función:* Vital para generar "Clean Backgrounds" para el Canvas. Se inyecta por defecto: "text, watermark, typography, letters".  
3. **Generación de Personas (personGeneration)**  
   * *UI:* Selector de permisos.  
   * *Valores API:* "dont\_allow", "allow\_adult", "allow\_all".  
4. **Semilla de Reproducibilidad (seed)**  
   * *UI:* Input numérico y botón "Fijar Semilla / Bloquear Estilo".  
   * *Función:* Mantiene la estructura de la imagen idéntica mientras se cambian micro-detalles del prompt.  
5. **Cantidad de Variaciones (sampleCount)**  
   * *UI:* Slider del 1 al 4\.  
   * *Función:* Genera múltiples opciones simultáneas para que el usuario elija su fondo favorito antes del renderizado del texto.

**Ejemplo de Payload JSON para Google AI Studio (Imagen 3):**

{  
  "instances": \[  
    {  
      "prompt": "Un escritorio minimalista premium, café negro, luz natural cinematográfica..."  
    }  
  \],  
  "parameters": {  
    "sampleCount": 4,  
    "aspectRatio": "9:16",  
    "negativePrompt": "text, letters, watermark, messy, ugly",  
    "personGeneration": "dont\_allow",  
    "seed": 849302,  
    "outputOptions": {  
      "mimeType": "image/jpeg",  
      "compressionQuality": 90  
    }  
  }  
}

## **5\. Manejo de Formatos Especiales (El Workaround para Instagram 3:5)**

Dado que la API de Imagen 3 **NO soporta** proporciones personalizadas como 3:5 (solo los 5 formatos estándar mencionados en la sección anterior), se utilizará una estrategia de recorte dinámico en el frontend.

**Flujo del Workaround:**

1. **Petición Back-end:** Si el usuario elige "IG 3:5", el backend solicita a Imagen 3 el formato inmediato superior que cubra el área (en este caso, "9:16").  
2. **Contenedor Front-end:** El lienzo principal (\<DynamicSceneComposer\>) en React se fija estrictamente en la proporción solicitada por el usuario (aspect-ratio: 3 / 5;).  
3. **Recorte CSS (Magia Visual):** La imagen 9:16 se coloca como fondo con CSS object-fit: cover;.  
   .ia-background-layer {  
     width: 100%;  
     height: 100%;  
     object-fit: cover;  
     object-position: center;   
   }

*Resultado:* La imagen se recorta limpiamente en los ejes excedentes sin deformación, y el texto de la marca (colocado en posición absoluta) permanece intacto y legible.

## **6\. Proyección de Costos y Escalabilidad (Facturación Modelo Pay-as-you-go)**

* **Fase de Desarrollo / Sandbox:**  
  * **Costo:** $0 USD.  
  * **Plataforma:** Uso directo de API Key en Google AI Studio.  
  * **Límites:** Sujeto a cuotas de uso gratuitas (ideal para testing del nuevo JSON, maquetación de React y pruebas de Prompts).  
* **Fase de Producción (Vertex AI o AI Studio Facturable):**  
  * **Modelo de cobro:** Por imagen generada (sin importar el formato).  
  * **Imagen 3 Fast (Prioridad en Velocidad: 3-6 segs):** \~$0.02 USD por imagen.  
  * **Imagen 3 Standard (Prioridad en Calidad/Fotorrealismo: 8-15 segs):** \~$0.03 a $0.04 USD por imagen.  
  * *Ejemplo Operativo:* 1,000 artes finales de alta calidad generados por clientes consumirán un aproximado de $30 a $40 USD mensuales en backend de imágenes.