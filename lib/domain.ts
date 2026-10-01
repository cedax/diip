import type { Action, AppData, AttendanceRecord, UserSession } from "./types";
import { classifyRecord, localDate, localTime, minutesBetween, normalizeImportedRows, recordFlags, shiftFor, validDate, validTime } from "./attendance";
export function requireRole(user: UserSession, roles: string[]) { if (!roles.includes(user.role)) throw new Error("Tu rol no tiene permiso para realizar esta acción."); }
function requireText(value: string, label: string, max = 2000) { if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`${label}: completa el campo (máximo ${max} caracteres).`); }
function validatePhoto(value?: string) { if (value && (!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(value) || value.length > 500000)) throw new Error("Usa una foto JPEG de hasta 375 KB."); }
export function applyAction(source: AppData, action: Action, user: UserSession, now = new Date()): AppData {
  const data = structuredClone(source), at = now.toISOString(), by = user.name, date = localDate(now), time = localTime(now);
  const own = (employeeId: string) => { if (user.role === "Colaborador" && employeeId !== user.employeeId) throw new Error("Solo puedes gestionar tu propia asistencia."); if (!data.employees.some(e => e.id === employeeId)) throw new Error("No existe el colaborador."); };
  const history = (text: string) => ({ action: text, by, at });
  const incidentFor = (record: AttendanceRecord, type: string) => {
    if (data.incidents.some(i => i.attendanceId === record.id && i.type === type)) return;
    data.incidents.unshift({ id: crypto.randomUUID(), attendanceId: record.id, employeeId: record.employeeId, date: record.date, type, description: `Se detectó ${type.toLowerCase()}. Revisa el registro original y agrega una aclaración.`, status: "Pendiente", createdAt: at, history: [history("Anomalía detectada automáticamente")] });
  };
  switch (action.type) {
    case "clock": {
      requireRole(user, ["Administrador", "Supervisor", "Colaborador", "Recursos Humanos"]); own(action.employeeId);
      if (!action.photo) throw new Error("Toma o adjunta una foto antes de confirmar."); validatePhoto(action.photo);
      if (!action.location || ![action.location.latitude, action.location.longitude, action.location.accuracy, action.location.distanceMeters].every(Number.isFinite)) throw new Error("Obtén la ubicación GPS antes de confirmar.");
      const employee = data.employees.find(e => e.id === action.employeeId)!;
      if (!employee.active || !data.projects.some(p => p.id === employee.projectId && p.active)) throw new Error("El colaborador o su proyecto están inactivos.");
      const shift = data.shifts.find(s => s.id === employee.shiftId);
      if (!shift) throw new Error("Asigna un turno antes de registrar asistencia.");
      const yesterday = localDate(new Date(now.getTime() - 86400000));
      const open = data.attendance.find(r => r.employeeId === employee.id && r.checkIn && !r.checkOut && r.status !== "Duplicado" && (r.date === date || (r.date === yesterday && (shiftFor(data, r)?.end ?? "") < (shiftFor(data, r)?.start ?? ""))));
      if (action.direction === "out") {
        if (!open) throw new Error("No hay una entrada abierta. Actualiza los registros.");
        if (open.date === date && time < open.checkIn!) throw new Error("La salida no puede ser anterior a la entrada.");
        open.checkOut = time; open.checkOutPhoto = action.photo; open.checkOutLocation = action.location;
        open.workedMinutes = minutesBetween(open.checkIn, time); open.status = classifyRecord(open, shiftFor(data, open)); open.flags = recordFlags(open, shiftFor(data, open));
        if (!action.location.withinRadius) open.flags.push("Fuera de la ubicación autorizada");
        open.history = [...(open.history ?? []), history(`Salida registrada a las ${time}`)];
        open.flags.forEach(flag => incidentFor(open, flag));
      } else {
        if (open || data.attendance.some(r => r.employeeId === employee.id && r.date === date)) throw new Error("Ya existe una jornada para hoy. Si necesitas corregirla, crea una aclaración.");
        const record: AttendanceRecord = { id: crypto.randomUUID(), employeeId: employee.id, projectId: employee.projectId, shiftId: employee.shiftId, shiftSnapshot: { ...shift }, date, checkIn: time, checkOut: null, checkInPhoto: action.photo, checkInLocation: action.location, workedMinutes: 0, source: "App móvil", status: "Incompleto", original: { date, checkIn: time, checkOut: null }, history: [history(`Entrada registrada a las ${time}`)], flags: action.location.withinRadius ? [] : ["Fuera de la ubicación autorizada"] };
        data.attendance.unshift(record);
        [...recordFlags(record, shift).filter(f => f === "Retardo"), ...(record.flags ?? [])].forEach(f => incidentFor(record, f));
      }
      break;
    }
    case "employee": {
      requireRole(user, ["Administrador", "Supervisor", "Recursos Humanos"]); const e = action.employee;
      requireText(e.name, "Nombre", 120); requireText(e.employeeNumber, "Número", 40);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email)) throw new Error("Escribe un correo válido.");
      if (data.employees.some(x => x.id !== e.id && (x.employeeNumber === e.employeeNumber || x.email.toLowerCase() === e.email.toLowerCase()))) throw new Error("El número o correo ya pertenece a otro colaborador.");
      if (!data.projects.some(p => p.id === e.projectId) || !data.shifts.some(s => s.id === e.shiftId)) throw new Error("Selecciona un proyecto y un turno válidos.");
      if (e.startDate && !validDate(e.startDate) || e.endDate && (!validDate(e.endDate) || e.startDate && e.endDate < e.startDate)) throw new Error("Revisa las fechas de alta y baja.");
      validatePhoto(e.photo); const index = data.employees.findIndex(x => x.id === e.id);
      if (index >= 0) {
        const previous = data.employees[index];
        if (previous.projectId !== e.projectId || previous.shiftId !== e.shiftId) {
          const changed = localDate(now), assignmentHistory = [...(previous.assignmentHistory ?? [{ projectId: previous.projectId, shiftId: previous.shiftId, from: previous.startDate ?? changed }])];
          const last = assignmentHistory[assignmentHistory.length - 1]; if (last && !last.to) last.to = changed;
          e.assignmentHistory = [...assignmentHistory, { projectId: e.projectId, shiftId: e.shiftId, from: changed }];
        }
        data.employees[index] = e;
      } else { e.assignmentHistory = [{ projectId: e.projectId, shiftId: e.shiftId, from: e.startDate ?? date }]; data.employees.unshift(e); } break;
    }
    case "project": {
      requireRole(user, ["Administrador", "Gestor TI"]); const p = action.project; requireText(p.name, "Proyecto", 120); requireText(p.location, "Ubicación", 180); requireText(p.service ?? "", "Servicio", 160); requireText(p.responsible ?? "", "Responsable", 120);
      if (![p.latitude, p.longitude, p.radiusMeters].every(Number.isFinite) || (p.radiusMeters ?? 0) < 10 || (p.radiusMeters ?? 0) > 10000) throw new Error("Configura coordenadas y un radio entre 10 y 10,000 metros.");
      if (data.projects.some(x => x.id !== p.id && x.name.toLowerCase() === p.name.toLowerCase())) throw new Error("Ya existe un proyecto con ese nombre.");
      const i = data.projects.findIndex(x => x.id === p.id); if (i >= 0) data.projects[i] = p; else data.projects.push(p); break;
    }
    case "shift": {
      requireRole(user, ["Administrador", "Gestor TI"]); const s = action.shift; requireText(s.name, "Turno", 80);
      if (!validTime(s.start) || !validTime(s.end) || s.start === s.end || !Number.isInteger(s.toleranceMinutes) || s.toleranceMinutes < 0 || s.toleranceMinutes > 120 || !s.workDays?.length || s.workDays.some(d => !Number.isInteger(d) || d < 0 || d > 6)) throw new Error("Revisa horas, días laborales y tolerancia (0 a 120 minutos).");
      const i = data.shifts.findIndex(x => x.id === s.id); if (i >= 0) data.shifts[i] = s; else data.shifts.push(s); break;
    }
    case "incident": {
      const input = action.incident; own(input.employeeId); requireText(input.description, "Aclaración"); requireText(input.type, "Tipo", 80); validatePhoto(action.photo);
      if (!input.date || !validDate(input.date) || (input.endDate && (!validDate(input.endDate) || input.endDate < input.date))) throw new Error("Revisa el periodo de la incidencia.");
      if (input.attendanceId && !data.attendance.some(r => r.id === input.attendanceId && r.employeeId === input.employeeId)) throw new Error("El registro no corresponde al colaborador.");
      if (input.proposedCheckIn && !validTime(input.proposedCheckIn) || input.proposedCheckOut && !validTime(input.proposedCheckOut)) throw new Error("Revisa las horas propuestas.");
      data.incidents.unshift({ ...input, id: crypto.randomUUID(), status: "Pendiente", createdAt: at, history: [history("Solicitud creada")], attachments: action.photo ? [{ id: crypto.randomUUID(), name: "Evidencia fotográfica", image: action.photo, by, at }] : [] }); break;
    }
    case "decision": {
      requireText(action.comment, "Motivo de la decisión");
      const i = data.incidents.find(i => i.id === action.id); if (!i) throw new Error("La incidencia no existe.");
      if (action.status === "Propuesta de ajuste") {
        requireRole(user, ["Administrador", "Supervisor", "Recursos Humanos"]);
        if (!["Pendiente", "Información requerida"].includes(i.status)) throw new Error("La incidencia ya fue revisada.");
        i.status = action.status; i.reviewedBy = by;
      } else if (["Autorizada", "Rechazada", "Información requerida"].includes(action.status)) {
        requireRole(user, ["Administrador", "Director general"]);
        if (!["Pendiente", "Propuesta de ajuste", "Información requerida"].includes(i.status)) throw new Error("La incidencia ya fue resuelta.");
        i.status = action.status; i.authorizedBy = by; i.deduction = action.status === "Rechazada" && !!action.deduction;
      } else if (action.status === "Aplicada") {
        requireRole(user, ["Administrador", "Gestor TI"]);
        if (i.status !== "Autorizada") throw new Error("Dirección debe autorizar el ajuste antes de aplicarlo.");
        i.status = action.status; i.appliedBy = by;
      } else throw new Error("Selecciona una decisión válida.");
      i.history.push(history(`${action.status}: ${action.comment}${i.deduction ? " · Descuento indicado para revisión de nómina" : ""}`));
      if (action.status === "Aplicada" && i.attendanceId && (i.proposedCheckIn || i.proposedCheckOut)) {
        const r = data.attendance.find(r => r.id === i.attendanceId)!;
        if (!Object.keys(r.original).length) r.original = { date: r.date, checkIn: r.checkIn, checkOut: r.checkOut };
        const before = `${r.checkIn ?? "—"} / ${r.checkOut ?? "—"}`;
        r.checkIn = i.proposedCheckIn || r.checkIn; r.checkOut = i.proposedCheckOut || r.checkOut;
        r.workedMinutes = minutesBetween(r.checkIn, r.checkOut); r.status = classifyRecord(r, shiftFor(data, r), r.status === "Duplicado"); r.flags = recordFlags(r, shiftFor(data, r));
        r.history = [...(r.history ?? []), history(`Corrección aplicada: ${before} → ${r.checkIn ?? "—"} / ${r.checkOut ?? "—"}. Motivo: ${action.comment}`)];
      } break;
    }
    case "reply": {
      const i = data.incidents.find(i => i.id === action.id); if (!i) throw new Error("No existe la incidencia."); own(i.employeeId);
      if (!["Pendiente", "Información requerida", "Propuesta de ajuste"].includes(i.status)) throw new Error("Esta incidencia ya está resuelta.");
      requireText(action.comment, "Respuesta"); validatePhoto(action.photo); i.history.push(history(`Aclaración: ${action.comment}`));
      if (action.photo) i.attachments = [...(i.attachments ?? []), { id: crypto.randomUUID(), name: "Evidencia adicional", image: action.photo, by, at }];
      i.status = "Pendiente"; break;
    }
    case "finance": {
      requireRole(user, ["Administrador", "Finanzas"]); const i = data.incidents.find(i => i.id === action.id);
      if (!i || !i.deduction || i.status !== "Rechazada") throw new Error("No hay un efecto de nómina pendiente para esta incidencia.");
      i.payrollApplied = true; i.history.push(history("Finanzas confirmó la aplicación del efecto en nómina")); break;
    }
    case "import": {
      requireRole(user, ["Administrador", "Analista", "Gestor TI"]); requireText(action.name, "Nombre del archivo", 200);
      if (!Array.isArray(action.rows) || action.rows.length > 10001 || action.rows.some(r => !Array.isArray(r) || r.length > 100)) throw new Error("Carga hasta 10,000 filas y 100 columnas por lote.");
      const result = normalizeImportedRows(action.rows, data.employees, data.shifts, data.attendance);
      if (!result.records.length) throw new Error(result.errors[0] ?? "El lote no contiene registros válidos.");
      data.attendance.unshift(...result.records);
      for (const r of result.records) {
        const daily = data.attendance.filter(x => x.employeeId === r.employeeId && x.date === r.date).length;
        const monthly = data.attendance.filter(x => x.employeeId === r.employeeId && x.date.slice(0, 7) === r.date.slice(0, 7)).length;
        if (daily > (data.policy?.maxDailyRecords ?? 1) || monthly > (data.policy?.maxMonthlyRecords ?? 31)) r.flags = [...(r.flags ?? []), "Cantidad anormal de registros"];
        r.flags?.forEach(flag => incidentFor(r, flag));
      }
      data.imports = [{ id: crypto.randomUUID(), name: action.name, by, at, rows: action.rows, errors: result.errors, count: result.records.length }, ...(data.imports ?? [])]; break;
    }
    case "policy": {
      requireRole(user, ["Administrador", "Gestor TI"]);
      if (![action.maxDailyRecords, action.maxMonthlyRecords].every(n => Number.isInteger(n) && n >= 1 && n <= 1000)) throw new Error("Los límites deben ser enteros entre 1 y 1,000.");
      if (action.defaultRadiusMeters !== undefined && (!Number.isInteger(action.defaultRadiusMeters) || action.defaultRadiusMeters < 10 || action.defaultRadiusMeters > 10000)) throw new Error("El radio predeterminado debe estar entre 10 y 10,000 metros.");
      if (action.retentionDays !== undefined && (!Number.isInteger(action.retentionDays) || action.retentionDays < 30 || action.retentionDays > 3650)) throw new Error("La conservación debe estar entre 30 y 3,650 días.");
      data.policy = { maxDailyRecords: action.maxDailyRecords, maxMonthlyRecords: action.maxMonthlyRecords, defaultRadiusMeters: action.defaultRadiusMeters ?? data.policy?.defaultRadiusMeters, timezone: action.timezone ?? data.policy?.timezone, retentionDays: action.retentionDays ?? data.policy?.retentionDays, incidentTypes: action.incidentTypes ?? data.policy?.incidentTypes }; break;
    }
    case "export": requireRole(user, ["Administrador", "Supervisor", "Analista", "Director general", "Recursos Humanos", "Finanzas"]); requireText(action.report, "Reporte", 120); break;
    case "user": throw new Error("Usa la operación de usuarios del servidor.");
    default: throw new Error("Acción no reconocida.");
  }
  for (const r of data.attendance) if (r.date < localDate(new Date(now.getTime() - 86400000)) && (!r.checkIn || !r.checkOut)) recordFlags(r, shiftFor(data, r)).forEach(f => incidentFor(r, f));
  data.audit = [{ id: crypto.randomUUID(), ...history(`Operación: ${action.type}`) }, ...(data.audit ?? [])];
  return data;
}
export function visibleData(data: AppData, user: UserSession): AppData {
  const result = structuredClone(data);
  if (!["Administrador", "Gestor TI"].includes(user.role)) result.users = [];
  if (!["Administrador", "Gestor TI", "Director general"].includes(user.role)) result.audit = [];
  if (!["Administrador", "Analista", "Gestor TI"].includes(user.role)) result.imports = [];
  if (user.role === "Colaborador") {
    result.employees = result.employees.filter(e => e.id === user.employeeId);
    result.attendance = result.attendance.filter(r => r.employeeId === user.employeeId);
    result.incidents = result.incidents.filter(i => i.employeeId === user.employeeId);
    result.projects = result.projects.filter(p => result.employees.some(e => e.projectId === p.id));
    result.shifts = result.shifts.filter(s => result.employees.some(e => e.shiftId === s.id));
  }
  return result;
}
