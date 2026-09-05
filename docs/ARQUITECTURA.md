# Arquitectura y API

## Componentes

- `components/DiipApp.tsx`: sesión, navegación, peticiones y feedback.
- `components/PhotoCapture.tsx`: getUserMedia, limpieza de streams y compresión JPEG mediante canvas.
- `components/AttendanceModules.tsx`: asistencia, solicitudes, evidencia e historial.
- `components/AdminModules.tsx`: personal, proyectos, turnos y usuarios.
- `components/ReportingModules.tsx`: lectura CSV/XLSX y reportes.
- `lib/attendance.ts`: reglas puras de fechas, horarios, importación y métricas.
- `lib/domain.ts`: operaciones permitidas por rol, validación y transformaciones auditadas.
- `lib/server/store.ts`: transacciones SQLite, credenciales, sesiones y control de versiones.

## Base de datos

SQLite en disco persistente, WAL y transacciones `BEGIN IMMEDIATE`. El dominio se guarda como documento JSON versionado en `state`; credenciales y sesiones están separadas. Este esquema simplifica la instalación de una instancia y no pretende ser una base analítica de gran volumen.

| Tabla | Contenido |
| --- | --- |
| state | Fila id=1, versión y documento con personal, proyectos, turnos, registros, incidencias, usuarios públicos, lotes y bitácora |
| credentials | Identificador, correo único, salt aleatorio y hash scrypt; nunca se incluye en respuestas API |
| sessions | Hash SHA-256 del token aleatorio, usuario y expiración de ocho horas |
| attempts | Intentos fallidos por correo; bloqueo temporal tras ocho fallos |

Cada escritura valida la versión recibida. Si otro cliente guardó, la operación se rechaza sin sobrescribir sus cambios. La interfaz actualiza y conserva el formulario. Las bajas no eliminan el historial. La bitácora se conserva íntegra; la pantalla muestra los últimos cien movimientos.

## API

Todas las respuestas usan JSON. Las mutaciones requieren Origin igual al origen público configurado o al Host de la petición y protocolo correspondiente. Cookie `diip-session`: HttpOnly, SameSite=Strict, Secure en HTTPS. El proxy debe conservar el protocolo o configurar `DIIP_PUBLIC_ORIGIN`.

| Ruta | Método | Datos | Resultado |
| --- | --- | --- | --- |
| /api/session | GET | Cookie opcional | Usuario actual y disponibilidad de modo demo |
| /api/session | POST | email, password | Sesión en cookie y perfil público |
| /api/session | DELETE | Cookie | Revoca sesión y elimina cookie |
| /api/data | GET | Cookie obligatoria | Datos filtrados por rol, versión y perfil |
| /api/action | POST | action, version | Datos autorizados actualizados y nueva versión |

Acciones: clock, employee, project, shift, incident, decision, reply, import, policy y user. Los contratos TypeScript están en `lib/types.ts`. El servidor vuelve a verificar permisos y reglas; no confía en los controles visibles de la interfaz. Los errores se devuelven como `{ "error": "mensaje" }`.

El service worker solo almacena recursos públicos y una página offline. No almacena `/api/`, datos personales ni evidencias. Las fotos son datos JPEG privados dentro del documento; su acceso se limita con el resto del registro. No existe reconocimiento facial ni geolocalización.

## Operación y ampliación

Desplegar en Node con almacenamiento persistente y HTTPS. Para varias instancias, consultas de gran volumen o evidencias numerosas, separar tablas de dominio y fotografías y migrar a una base compartida. Añadir calendario con vigencias y festivos antes de usar indicadores para decisiones históricas de nómina. Automatizar backups y recuperación según las necesidades reales de la empresa.
