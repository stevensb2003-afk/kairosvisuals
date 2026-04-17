# Plan de Automatización: Briefing a WhatsApp (Vía Make.com)

Este documento describe el procedimiento para conectar la base de datos de Firestore con WhatsApp sin escribir código, utilizando **Make.com** como plataforma de integración.

## 1. Preparación en Google Cloud (Firebase)
Para que Make pueda monitorear los nuevos briefings, requiere permisos de lectura.
1. Acceder a la [Consola de Google Cloud](https://console.cloud.google.com/).
2. Seleccionar el proyecto `Kairos Visuals`.
3. Navegar a **IAM y administración** > **Cuentas de servicio**.
4. Crear una nueva cuenta de servicio llamada `make-automation`.
5. Asignar el rol: **Visor de Cloud Datastore** (permite leer documentos de Firestore).
6. En la pestaña **Claves**, seleccionar **Agregar clave** > **Crear clave nueva** (formato JSON).
7. Descargar y guardar el archivo de forma segura; se utilizará en el Paso 3.

## 2. Configuración en Make.com
1. Crear una cuenta o iniciar sesión en [Make.com](https://www.make.com/).
2. Crear un nuevo escenario (**Create a new scenario**).
3. Añadir el módulo de **Firebase Cloud Firestore**.

## 3. Configuración del Disparador (Trigger)
1. Seleccionar el evento: **Watch Documents**.
2. Crear una nueva conexión cargando el archivo JSON descargado en el Paso 1.
3. Configurar los parámetros del módulo:
   - **Collection Path**: `service_requests`
   - **Limit**: 1
4. Establecer el inicio de monitoreo como "From now on".

## 4. Estructura del Mensaje
Mapear los campos obtenidos de Firestore para construir la notificación.
- **Campos disponibles:** `firstName`, `lastName`, `companyName`, `phone`, `aboutBusiness`.
- **Ejemplo de mensaje sugerido:**
  > 🚀 *¡Nuevo Briefing recibido en Kairos Visuals!*
  > 👤 **Cliente:** `{{firstName}} {{lastName}}`
  > 🏢 **Empresa:** `{{companyName}}`
  > 📞 **Teléfono:** `{{phone}}`
  > 📄 **Interés:** `{{aboutBusiness}}`
  >
  > _Revisar detalles completos en el panel administrativo._

## 5. Envío a WhatsApp
Existen dos rutas principales para el envío:

### A. WhatsApp Business API (Oficial de Meta)
- Requiere el módulo **WhatsApp Business Cloud API** en Make.
- Necesita configuración de `Phone Number ID` y `WABA ID`.
- Los mensajes deben basarse en plantillas aprobadas por Meta si se inicia la conversación.

### B. APIs de Terceros (Ultramsg / Whapi / Twilio)
- Utilizar el módulo **HTTP > Make a request** o el módulo específico del proveedor.
- Configurar la URL de la API y el token proporcionado por el servicio.
- Permite mayor libertad en el formato del mensaje sin validación de plantillas previa.

## 6. Validación y Activación
1. Ejecutar una prueba manual haciendo clic en **Run once** en Make.
2. Enviar un briefing de prueba desde el formulario de la aplicación.
3. Confirmar la recepción correcta del mensaje en WhatsApp.
4. Una vez validado, activar el interruptor de **SCHEDULING** a **ON**.

---
**Nota de Seguridad:** El archivo JSON de la cuenta de servicio concede acceso a los datos de los clientes. No debe compartirse ni subirse a repositorios públicos.
