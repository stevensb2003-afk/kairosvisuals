# Guía de Despliegue: Kairos Visuals con Firebase App Hosting

Esta guía detalla los pasos necesarios para publicar tu aplicación utilizando la infraestructura moderna de **Firebase App Hosting**, que permite despliegues automáticos cada vez que subes cambios a **GitHub**.

## 🚀 Requisitos Previos

1.  **Cuenta de GitHub**: Necesitas un repositorio donde esté alojado el código.
2.  **Proyecto Firebase**: Ya tienes uno configurado (`studio-2320133454-60570`).
3.  **Plan Blaze (Pay-as-you-go)**: App Hosting requiere que el proyecto de Firebase tenga habilitada la facturación (aunque tiene una capa gratuita generosa).

---

## Paso 1: Subir el código a GitHub

Si aún no tienes el código en GitHub, sigue estos comandos en tu terminal. Esto creará el vínculo inicial:

1.  **Inicializar Git** (si no lo has hecho):
    ```powershell
    git init
    git add .
    git commit -m "Preparando para App Hosting"
    ```
2.  **Crear el repositorio en GitHub** (manualmente en [github.com/new](https://github.com/new)).
3.  **Vincular y subir**:
    ```powershell
    git remote add origin https://github.com/TU_USUARIO/KAIROS_VISUALS.git
    git branch -M main
    git push -u origin main
    ```

---

## Paso 2: Crear el Backend en Firebase Console

1.  Ve a la [Consola de Firebase](https://console.firebase.google.com/).
2.  Selecciona tu proyecto: `studio-2320133454-60570`.
3.  En el menú lateral, ve a **Build** > **App Hosting**.
4.  Haz clic en **Get Started**.
5.  **Conectar a GitHub**: Firebase te pedirá autorización para acceder a tus repositorios.
6.  **Seleccionar Repositorio**: Elige el repositorio que acabas de subir.
7.  **Configuración de Despliegue**:
    *   **Backend ID**: Escribe `kairos-visuals` (esto generará tu URL: `kairos-visuals.web.app`).
    *   **Branch**: Selecciona `main`.
    *   **Root Directory**: Déjalo como `./`.

---

## Paso 3: Configurar Secretos y Variables de Entorno

Si tu aplicación utiliza variables en un archivo `.env` (como API Keys de servicios externos), debes registrarlas en la consola:

1.  En la pestaña de **App Hosting** en la consola, selecciona tu backend recién creado.
2.  Ve a la pestaña de **Settings** > **Environment variables**.
3.  Añade las variables necesarias. Si son sensibles, Firebase te permitirá guardarlas como "Secrets" de Google Cloud.

---

## Paso 4: Despliegue automático

Una vez termines la configuración en la consola:

1.  Firebase realizará un primer despliegue automáticamente.
2.  **Importante**: Cada vez que hagas un `git push` a tu rama `main`, Firebase reconstruirá tu aplicación y la publicará automáticamente. No necesitas volver a correr comandos de despliegue manual.

---

## 🛠️ Notas Técnicas

> [!IMPORTANT]
> **Plan de Facturación**: Asegúrate de que el proyecto esté en el **Plan Blaze**. App Hosting utiliza Cloud Run y Artifact Registry, que requieren facturación activa.

### Archivos de Configuración en este Proyecto
He actualizado o verificado estos archivos para que el despliegue sea fluido:
*   `apphosting.yaml`: Define límites de recursos (instancias, memoria).
*   `firebase.json`: Ahora incluye el bloque `apphosting` vinculando el backend `kairos-visuals`.

---

¡Tu aplicación estará lista y escalable en segundos!
