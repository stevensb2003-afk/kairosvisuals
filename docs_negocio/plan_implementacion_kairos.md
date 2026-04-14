# Plan de Implementación Kairos Visuals

Este documento detalla la hoja de ruta estratégica para la digitalización y automatización de Kairos Visuals, asegurando el cumplimiento de los Términos y Condiciones y el Acuerdo de Colaboración Interna.

---

## ✅ Fase 1: Cimientos de Esquema (Finalizada)
*Enfoque: Estructura de datos robusta y alineación legal.*

- **Fuente de Verdad Central**: Implementación de `src/lib/types.ts` con todos los modelos de negocio.
- **Seguridad Firestore**: Reglas granulares para proteger la privacidad del cliente y restringir acciones internas.
- **Gestión de Tareas**: Actualización de Backlog y Kanban con campos críticos (Plan/Extra, Talento, D.O.D.).
- **Visualización de Clientes**: Implementación de estados de mora y suspensión automática en el listado de clientes.

---

## ✅ Fase 2: Portal de Cliente Robusto (Finalizada)
*Enfoque: Experiencia de usuario para el cliente y automatización de enrollment.*

- **Dashboard de Cliente**: Visualización de consumo, timeline de actividades y estado de cuenta.
- **Centro de Revisiones**: Interfaz interactiva para aprobación de entregables con control de rondas de revisión.
- **Smart Routing**: Sistema de login inteligente que redirige según el progreso del cliente (Onboarding → Cotización → Dashboard).
- **Auto-Enrollment**: Creación automática del expediente financiero del cliente al aceptar una cotización.
- **Módulos de Apoyo**: Páginas de Facturación y Soporte funcionalmente integradas.

---

## 🚀 Fase 3: Operación y Automatización (En Progreso)
*Enfoque: Control financiero, gestión de talento y utilidades.*

1. **Dashboard de Equipo (Admin)**:
   - Resumen global de métricas: Ingresos Brutos, Gastos, Utilidad Neta.
   - Monitor de carga de trabajo del equipo.
2. **Sistema de Sprints**:
   - Apertura y cierre automático de sprints quincenales.
   - Bloqueo de tareas entre sprints para mantener el flujo de trabajo.
3. **Gestión de Gastos y Egresos**:
   - Registro de gastos operativos para el cálculo de utilidades.
   - Separación de "Inversión de Marca" vs "Gasto Directo".
4. **Liquidaciones Automáticas**:
   - Cálculo automático de pagos para el talento (Sharon / Otros) basado en el split 70/30.
   - Generación de reportes de pago por sprint.
5. **Lógica de Consumo Automática**:
   - Al completar una tarea marcada como "Plan", el contador `currentConsumption` del cliente se actualiza automáticamente.

---

## 💎 Fase 4: Inteligencia Artificial y Pulido Ergonómico
*Enfoque: Valor agregado con Genkit y optimización de UX.*

1. **Resúmenes de Feedback por IA**:
   - Resumir hilos de comentarios en revisiones para el equipo creativo.
2. **Reportes Automáticos para Clientes**:
   - Generación mensual de PDFs de impacto y consumo.
3. **Asistente de Soporte Inteligente**:
   - Chatbot basado en RAG usando la documentación de Kairos para responder dudas frecuentes de clientes.
4. **Modos de Visualización Avanzados**:
   - Gráficas de tendencias financieras y productividad por talento.

---

## 📌 Documentos de Referencia
- `docs/blueprint.md`: Visión técnica original.
- `docs_negocio/terminos_y_condiciones_servicio.md`: Marco legal.
- `docs_negocio/acuerdo_colaboracion_interna.md`: Marco operativo de talento.
