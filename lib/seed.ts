import type { AppData } from "./types";

const today = new Date();
const iso = (offset: number) => {
  const date = new Date(today);
  date.setDate(today.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export const seedData: AppData = {
  projects: [
    { id: "metro", name: "Proyecto Metro", service: "Mantenimiento de sistemas ferroviarios", location: "Talleres Zaragoza, Ciudad de México", responsible: "Carlos Mendoza", latitude: 19.3852, longitude: -99.0824, radiusMeters: 250, active: true },
    { id: "mexicable", name: "Proyecto Mexicable", service: "Supervisión de infraestructura", location: "Ecatepec, Estado de México", responsible: "Paola Jiménez", latitude: 19.601, longitude: -99.0505, radiusMeters: 300, active: true },
    { id: "mexibus", name: "Proyecto Mexibús", service: "Mantenimiento preventivo", location: "Ciudad Azteca, Estado de México", responsible: "Roberto Salas", latitude: 19.5347, longitude: -99.0275, radiusMeters: 220, active: true },
    { id: "rams", name: "RAMS", service: "Análisis RAMS y documentación", location: "Corporativo DIIP", responsible: "Mariana Soto", latitude: 19.4326, longitude: -99.1332, radiusMeters: 150, active: true },
  ],
  shifts: [
    { id: "matutino", name: "Matutino", start: "08:00", end: "16:00", toleranceMinutes: 10, workDays: [1, 2, 3, 4, 5], specialDays: [{ date: iso(14), label: "Día de capacitación", working: false }] },
    { id: "vespertino", name: "Vespertino", start: "14:00", end: "22:00", toleranceMinutes: 10, workDays: [1, 2, 3, 4, 5] },
    { id: "nocturno", name: "Nocturno", start: "22:00", end: "06:00", toleranceMinutes: 10, workDays: [1, 2, 3, 4, 5] },
  ],
  employees: [
    { id: "e1", employeeNumber: "DIIP-001", name: "Ana Martínez", email: "ana@diip.mx", projectId: "metro", shiftId: "matutino", active: true, startDate: iso(-120), assignmentHistory: [{ projectId: "metro", shiftId: "matutino", from: iso(-120) }] },
    { id: "e2", employeeNumber: "DIIP-002", name: "Luis Hernández", email: "luis@diip.mx", projectId: "mexicable", shiftId: "matutino", active: true, startDate: iso(-90), assignmentHistory: [{ projectId: "mexicable", shiftId: "matutino", from: iso(-90) }] },
    { id: "e3", employeeNumber: "DIIP-003", name: "Sofía Ramírez", email: "sofia@diip.mx", projectId: "metro", shiftId: "vespertino", active: true, startDate: iso(-60), assignmentHistory: [{ projectId: "metro", shiftId: "vespertino", from: iso(-60) }] },
    { id: "e4", employeeNumber: "DIIP-004", name: "Miguel Torres", email: "miguel@diip.mx", projectId: "mexibus", shiftId: "nocturno", active: true, startDate: iso(-45), assignmentHistory: [{ projectId: "mexibus", shiftId: "nocturno", from: iso(-45) }] },
    { id: "e5", employeeNumber: "DIIP-005", name: "Diana López", email: "diana@diip.mx", projectId: "rams", shiftId: "matutino", active: false, startDate: iso(-300), endDate: iso(-20), assignmentHistory: [{ projectId: "rams", shiftId: "matutino", from: iso(-300), to: iso(-20) }] },
  ],
  attendance: [
    { id: "a1", employeeId: "e1", projectId: "metro", shiftId: "matutino", date: iso(0), checkIn: "07:56", checkOut: null, source: "App móvil", status: "Incompleto", workedMinutes: 0, original: {}, checkInLocation: { latitude: 19.3853, longitude: -99.0823, accuracy: 12, distanceMeters: 18, withinRadius: true } },
    { id: "a2", employeeId: "e2", projectId: "mexicable", shiftId: "matutino", date: iso(0), checkIn: "08:14", checkOut: null, source: "App móvil", status: "Retardo", workedMinutes: 0, original: {}, checkInLocation: { latitude: 19.6013, longitude: -99.0506, accuracy: 18, distanceMeters: 36, withinRadius: true } },
    { id: "a3", employeeId: "e3", date: iso(-1), checkIn: "13:55", checkOut: "22:03", source: "Importación", status: "Correcto", workedMinutes: 488, original: {} },
    { id: "a4", employeeId: "e1", date: iso(-1), checkIn: "08:02", checkOut: "16:08", source: "Importación", status: "Correcto", workedMinutes: 486, original: {} },
    { id: "a5", employeeId: "e4", date: iso(-1), checkIn: "22:18", checkOut: "06:05", source: "Manual", status: "Retardo", workedMinutes: 467, original: {} },
    { id: "a6", employeeId: "e2", date: iso(-2), checkIn: "08:01", checkOut: null, source: "Importación", status: "Incompleto", workedMinutes: 0, original: {} },
  ],
  incidents: [
    { id: "i1", attendanceId: "a6", employeeId: "e2", type: "Salida faltante", description: "El colaborador reporta falla de conectividad al terminar su turno.", status: "Pendiente", createdAt: new Date().toISOString(), history: [{ action: "Incidencia creada", by: "Sistema", at: new Date().toISOString() }] },
  ],
  policy: { maxDailyRecords: 1, maxMonthlyRecords: 31, defaultRadiusMeters: 250, timezone: "America/Mexico_City", retentionDays: 730, incidentTypes: ["Aclaración", "Vacaciones", "Permiso", "Incapacidad", "Falta", "Corrección de horario"] },
};
