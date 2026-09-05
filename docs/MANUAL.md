# Manual de uso

## Primer acceso

En desarrollo usa una cuenta demo. En un servidor real usa la cuenta que entregue administración. El menú muestra únicamente las funciones disponibles para tu rol. El botón Actualizar recupera cambios hechos desde otras sesiones; la campana abre las incidencias pendientes.

## Registrar asistencia

1. Abre Registros. El colaborador solo puede registrar su propia asistencia; administración y supervisión pueden seleccionar personal activo.
2. Revisa proyecto y turno. Pulsa Tomar foto y permite el acceso a cámara, o Adjuntar foto para elegir una imagen.
3. Pulsa Capturar foto. Puedes cambiarla antes de confirmar.
4. Pulsa Registrar entrada o Registrar salida y confirma. La foto y hora se guardan en el servidor.
5. Ver detalle muestra las fotos, observaciones, datos originales e historial.

Si se deniega el permiso, revisa los permisos de cámara del sitio o adjunta una imagen. No se permite enviar un registro sin foto. Si ya existe la jornada, usa Incidencias para pedir una corrección.

## Importar Excel o CSV

Descarga la plantilla en Importar. Columnas: numero, fecha, entrada, salida. Escribe fechas como 2026-09-01 y horas como 08:00. Un campo de hora vacío se conserva como registro incompleto.

Selecciona o arrastra el archivo; elige la hoja en Excel, revisa la vista previa y los errores. Confirma el lote con el resumen. Las anomalías generan solicitudes pendientes. Los duplicados se conservan y se excluyen de los KPI de horas. El historial permite descargar el lote original como JSON, incluidas las filas que no pudieron vincularse a un colaborador.

## Solicitudes e incidencias

Pulsa Nueva solicitud. Elige colaborador, tipo y fechas; puedes vincular una jornada y proponer horas corregidas. Explica el motivo y adjunta evidencia si corresponde. Permisos, vacaciones e incapacidades pueden registrarse sin una jornada relacionada.

En Abrir seguimiento se muestran todas las respuestas y fotos. Si piden información, escribe una respuesta y envíala; vuelve a Pendiente. El administrador o supervisor escribe un motivo y confirma su decisión. Si hay una foto adicional, primero se guarda la evidencia y después se confirma la decisión. Autorizar una corrección actualiza la jornada y conserva el original. Rechazar puede indicar descuento para revisión de nómina, sin calcular importes.

## Administración

Crea proyectos y turnos antes de dar de alta colaboradores. Configura horario, tolerancia y días laborales. Una salida anterior a la entrada corresponde al día siguiente. Cambiar un turno no reescribe las copias de horario en registros existentes.

En Colaboradores puedes cambiar datos, fotografía, proyecto, turno y fechas. Dar de baja conserva el historial. En Usuarios y permisos puedes crear y editar cuentas, establecer contraseñas y desactivar accesos. Los colaboradores requieren una vinculación a su ficha; las contraseñas nuevas necesitan al menos 12 caracteres. No puedes quitar tu propio acceso de administrador.

## Reportes

Selecciona un periodo de hasta 366 días, proyecto, persona y turno. Los KPI usan estos filtros; los filtros de estado se aplican al detalle. Abre Cómo se calculan estos indicadores para consultar las fórmulas y supuestos. Exporta asistencia, ausencias e incidencias por separado. Importa los CSV en Power BI mediante Obtener datos → Texto/CSV, con codificación UTF-8.

## Conexión y errores

Guardar necesita conexión al servidor. No se muestra éxito si la operación falla. Ante un conflicto de otra sesión, la información se actualiza y el formulario permanece abierto para revisar y volver a intentar. No recargues el navegador con una foto o formulario sin enviar si deseas conservarlo; los borradores aún no se guardan.
