# DIIP Asistencia

Aplicación web para registrar asistencia con fotografía, validar archivos y gestionar aclaraciones. Interfaz adaptable, API de Next.js y persistencia transaccional SQLite. Ya no depende de localStorage ni de una selección de rol en el navegador.

## Ejecutar

Requiere Node.js 22.16 o posterior (se comprobó con 22.21.1).

```powershell
npm install
npm run dev
```

Abre http://localhost:2560. En desarrollo se crean cuentas de demostración:

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | admin@diip.mx | demo123 |
| Supervisor | supervisor@diip.mx | demo123 |
| Analista | analista@diip.mx | demo123 |
| Colaborador | colaborador@diip.mx | demo123 |

El colaborador de ejemplo está vinculado a Ana Martínez. Los nuevos usuarios requieren contraseñas de 12 a 128 caracteres. La etiqueta Demostración identifica este entorno.

## Flujos incluidos

- Entrada y salida con cámara o fotografía adjunta, compresión, vista previa y confirmación. La cámara se cierra al salir del flujo. La hora se obtiene del servidor en America/Mexico_City.
- Colaboradores con foto de perfil, proyecto, turno, alta y baja. La baja conserva historial.
- Proyectos editables y desactivables. Turnos con horas, tolerancia y días laborales, incluidos turnos nocturnos.
- Importación CSV/XLSX con selección de hoja, vista previa y confirmación. Detección de duplicados, nulos, retardos, jornadas cortas y cantidades anormales. Los lotes conservan todas las filas y errores.
- Solicitudes de permiso, vacaciones, incapacidad, falta y corrección. Evidencias, respuestas, solicitud de información, autorización y rechazo con motivo. Una corrección autorizada conserva el original y agrega historial.
- Usuarios con permisos comprobados en el servidor. El colaborador solo recibe su propia información.
- Reportes por periodo, proyecto, empleado, turno y estados. KPI, ausencias y exportaciones CSV para Power BI.
- Bitácora de operaciones, límites configurables y PWA instalable. El modo sin conexión informa que guardar requiere conexión; no simula sincronizaciones.

## Verificación

```powershell
npm run lint
npm run test
npm run build
node scripts/review.mjs
```

La revisión visual requiere un servidor en 127.0.0.1:2560 y Edge en la ruta configurada en el script. Usa cámara simulada, no accede a la cámara real. Capturas y resultados: `.qa/revision/`. Las pruebas de API pueden ejecutarse con `node scripts/api_qa.mjs` contra un servidor de pruebas; ver el encabezado del script.

## Producción

```powershell
$env:DIIP_ADMIN_EMAIL='administracion@tu-empresa.mx'
$env:DIIP_ADMIN_PASSWORD='una-contraseña-larga-y-única'
$env:DIIP_PUBLIC_ORIGIN='https://asistencia.tu-empresa.mx'
npm run build
npm start
```

Configura estos valores mediante el gestor de secretos del servidor; no los guardes en Git. La primera ejecución crea un administrador y una base vacía. Las credenciales iniciales solo se usan cuando aún no hay base inicializada. Después, administra contraseñas en Usuarios y permisos.

- Desarrollo: `.data/demo/diip.sqlite`.
- Producción: `.data/production/diip.sqlite`.
- `DIIP_DATA_DIR` permite escoger otro directorio persistente.
- `DIIP_DEMO=true` habilita expresamente una demostración en un build de producción. Nunca habilitarlo en una instalación con datos reales.
- Despliegue: proceso Node con disco persistente y HTTPS. No usar almacenamiento efímero ni múltiples réplicas independientes de SQLite.
- Tras un proxy HTTPS, define `DIIP_PUBLIC_ORIGIN` con el origen público exacto, sin `/` final, y conserva los encabezados de host/protocolo.
- Para un respaldo simple, detén el servidor y copia el directorio completo de datos. Reinicia después. No copies únicamente el archivo principal mientras esté activo en modo WAL.

## Límites explícitos

La implementación está lista para ejecutarse y demostrarse localmente; no se desplegó un servicio público ni se validó una política empresarial real. La cámara en teléfonos requiere HTTPS (o localhost en computadora). Debe comprobarse también con los dispositivos finales y permisos del navegador.

CSV y XLSX están soportados. Convierte los archivos XLS antiguos a XLSX. Cada hoja admite hasta 10,000 filas; las solicitudes al servidor tienen un límite adicional de 8 MB. Las fotos se comprimen a JPEG, hasta 375 KB aproximadamente por imagen. Las evidencias se guardan en la base junto al registro, sin URLs públicas.

Los KPI de días programados usan el calendario laboral vigente y las fechas de alta y baja; no reconstruyen cambios históricos de calendario, festivos ni asignaciones pasadas sin registros. Los registros nuevos sí conservan una copia del turno y proyecto al capturarse. La asistencia válida requiere entrada y salida; una entrada incompleta no se considera ausencia. Ausentismo usa días sin entrada y sin ausencia autorizada. Las horas adicionales no autorizan pago. El descuento es una indicación para revisión de nómina, no un cálculo monetario.

La exportación prepara archivos para Power BI; no hay conexión directa a una cuenta de Power BI. Las actividades académicas de Trello, Scrum, presentación y aceptación del usuario no se ejecutan desde esta app.

La información que pudiera existir en el localStorage de la versión anterior permanece en el navegador; no se borra ni se migra automáticamente a la nueva base. Los datos nuevos se guardan únicamente en el servidor.

Consulta `docs/COBERTURA.md`, `docs/MANUAL.md` y `docs/ARQUITECTURA.md`.
