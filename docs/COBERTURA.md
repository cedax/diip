# Cobertura de Documentación_Equipo2.pdf

Fuente: PDF de 38 páginas ubicado en la carpeta superior del proyecto. Revisión de los apartados 1.4–1.6, 2.1.1, 2.2.1–2.2.3 y anexos. Las páginas 25–26 contienen flujos visuales de entrada y salida. Los apartados III–V son plantillas académicas sin requisitos detallados adicionales.

| Requisito y ubicación | Implementación | Verificación / alcance |
| --- | --- | --- |
| Usuarios, roles y permisos (p. 7, 29–30) | Usuarios y permisos; sesiones por cookie; autorización del servidor | Colaborador recibe solo sus datos; analista no autoriza; altas, edición y desactivación |
| Colaboradores, proyectos, turnos y horarios (p. 7, 16) | Catálogos y colaboradores editables, altas/bajas, días laborales y tolerancia | Identificadores duplicados rechazados; referencias validadas |
| Entrada y salida (p. 16, 24–26) | Registros con confirmación, hora de servidor, prevención de doble registro | Turnos nocturnos y fotografías comprobados con cámara simulada |
| Fotografía (ampliación solicitada por el usuario) | Cámara, adjunto, repetición, vista previa, entrada/salida y evidencias | Manejo de permisos y formato; probar hardware final |
| Importación sin separar meses (p. 7, 16–17) | CSV/XLSX, selección de hoja, vista previa y confirmación | Hasta 10,000 filas por hoja; XLS requiere conversión |
| Duplicados, nulos, entrada sin salida, anomalías de cantidad (p. 6–9, 36) | Reglas en servidor, incidencias automáticas, límites en Configuración | Los originales y las filas con errores permanecen en el lote |
| Retardos, faltas y jornadas incompletas (p. 7–9) | Tolerancia, comparación de jornada, calendario y reporte de ausencias | Las faltas se derivan al consultar el reporte; no se crean automáticamente permisos o descuentos |
| Horas por día y periodo (p. 7, 16–17) | Cálculo nocturno, totales y promedios sin duplicados | Pruebas unitarias para medianoche, nulos y duplicados |
| Aclaración, evidencia y decisión del jefe (p. 7, 37) | Nueva solicitud, respuesta, pedir información, autorizar/rechazar y motivo | Solo administrador/supervisor resuelven; solicitudes resueltas quedan cerradas |
| Original e historial (p. 6–9) | Lote original, original por registro, historial de corrección y decisiones | Corregir no sobrescribe el dato recibido |
| Reportes por colaborador, proyecto, periodo, turno y estado (p. 7, 17) | Filtros combinados; CSV de asistencia, ausencias e incidencias | Detalle de registros y resumen por colaborador |
| KPI: puntualidad, retardo, asistencia, ausentismo (p. 8) | Porcentajes con denominadores explícitos | Solo días cerrados para asistencia/ausencia; calendario vigente |
| KPI: promedio, cumplimiento, adicionales, jornadas cortas, incompletos e incidencias (p. 8) | Panel de doce indicadores y reportes | Horas adicionales no equivalen a pago autorizado |
| Power BI (p. 7–9, 17) | CSV con identificadores, dimensiones, estados y valores originales | Archivo interoperable; no conexión directa al servicio |
| Identidad, colores, Segoe UI, interfaz modular (p. 20–24) | Azul #2563EB, blanco y gris; navegación con texto; tarjetas y tablas | Revisión visual en 1440 px y 390 px |
| UX, prevención, retroalimentación y accesibilidad (p. 23–24) | Modales con foco nativo, validaciones, confirmación, mensajes y navegación por teclado | Estados con texto, foco visible, búsqueda, tablas paginadas |
| API y base de datos (p. 29–30) | Next.js, SQLite transaccional, control de versión y sesiones | Persistencia entre recargas; conflictos concurrentes rechazados |
| Pruebas y documentación (p. 19–20, 28–29) | Unitarias, prueba de navegador, manual y arquitectura | Ver scripts y resultados locales |
| Puesta en producción, aceptación y entrega (p. 31–33) | Instrucciones y configuración disponibles | Pendiente: servidor/dominio real, HTTPS público, política empresarial, aceptación y presentación |

## Precisiones

El sistema descrito inicialmente complementa las aplicaciones de registro existentes (p. 7). La captura con foto es una ampliación pedida en esta conversación. Gestiona, tickets, SharePoint, Access y documentación ISO son contexto de la empresa (p. 5–6, 37–38), no módulos incluidos en el alcance de asistencia de p. 7–9.

Para afirmar cumplimiento empresarial completo, aún se requieren calendario autorizado, políticas de permisos y deducciones, validación de turnos reales, criterios de retención de fotos y prueba en los teléfonos de uso final. No se han inventado estas políticas. Los indicadores explican sus supuestos en la interfaz y el README.
