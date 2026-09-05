# DIIP Asistencia

Aplicación web progresiva (PWA) para validar y dar seguimiento a los registros de asistencia del personal operativo de DIIP Soluciones Ferroviarias.

## Funciones incluidas

- Inicio de sesión demo con roles de administrador, supervisor, analista y colaborador.
- Dashboard con indicadores de puntualidad, jornadas e incidencias.
- Registro rápido de entrada y salida desde computadora o teléfono.
- Administración de colaboradores, proyectos y turnos.
- Importación de archivos CSV, XLS y XLSX con detección de duplicados, datos incompletos y retardos.
- Flujo de incidencias con autorización, rechazo e historial de decisiones.
- Reportes filtrables y exportación CSV compatible con Power BI.
- Persistencia local y soporte PWA instalable con pantalla offline.

## Ejecutar localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Accesos demo

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | admin@diip.mx | demo123 |
| Supervisor | supervisor@diip.mx | demo123 |
| Analista | analista@diip.mx | demo123 |
| Colaborador | colaborador@diip.mx | demo123 |

## Instalar en un teléfono

En producción la aplicación debe publicarse con HTTPS. Abre la URL desde Chrome o Edge en Android y usa **Instalar aplicación**. En iOS abre la URL en Safari, toca **Compartir** y selecciona **Agregar a pantalla de inicio**.

## Alcance técnico

Esta primera versión es local-first: los datos se almacenan en `localStorage`, por lo que funciona inmediatamente y permite una demostración completa sin infraestructura. Para producción multiusuario se recomienda sustituir esta capa por PostgreSQL, autenticación segura y una API desplegada, conservando la interfaz y las reglas de negocio existentes.
