import type { AppData } from "./types";

const today = new Date();
const iso = (offset: number) => {
  const date = new Date(today);
  date.setDate(today.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export const seedData: AppData = {
  projects: [
    { id: "metro", name: "Proyecto Metro", location: "Ciudad de México", active: true },
    { id: "mexicable", name: "Proyecto Mexicable", location: "Estado de México", active: true },
    { id: "mexibus", name: "Proyecto Mexibús", location: "Estado de México", active: true },
    { id: "rams", name: "RAMS", location: "Corporativo", active: true },
  ],
  shifts: [
    { id: "matutino", name: "Matutino", start: "08:00", end: "16:00", toleranceMinutes: 10 },
    { id: "vespertino", name: "Vespertino", start: "14:00", end: "22:00", toleranceMinutes: 10 },
    { id: "nocturno", name: "Nocturno", start: "22:00", end: "06:00", toleranceMinutes: 10 },
  ],
  employees: [
    { id: "e1", employeeNumber: "DIIP-001", name: "Ana Martínez", email: "ana@diip.mx", projectId: "metro", shiftId: "matutino", active: true },
    { id: "e2", employeeNumber: "DIIP-002", name: "Luis Hernández", email: "luis@diip.mx", projectId: "mexicable", shiftId: "matutino", active: true },
    { id: "e3", employeeNumber: "DIIP-003", name: "Sofía Ramírez", email: "sofia@diip.mx", projectId: "metro", shiftId: "vespertino", active: true },
    { id: "e4", employeeNumber: "DIIP-004", name: "Miguel Torres", email: "miguel@diip.mx", projectId: "mexibus", shiftId: "nocturno", active: true },
    { id: "e5", employeeNumber: "DIIP-005", name: "Diana López", email: "diana@diip.mx", projectId: "rams", shiftId: "matutino", active: false },
  ],
  attendance: [
    { id: "a1", employeeId: "e1", date: iso(0), checkIn: "07:56", checkOut: null, source: "App móvil", status: "Incompleto", workedMinutes: 0, original: {} },
    { id: "a2", employeeId: "e2", date: iso(0), checkIn: "08:14", checkOut: null, source: "App móvil", status: "Retardo", workedMinutes: 0, original: {} },
    { id: "a3", employeeId: "e3", date: iso(-1), checkIn: "13:55", checkOut: "22:03", source: "Importación", status: "Correcto", workedMinutes: 488, original: {} },
    { id: "a4", employeeId: "e1", date: iso(-1), checkIn: "08:02", checkOut: "16:08", source: "Importación", status: "Correcto", workedMinutes: 486, original: {} },
    { id: "a5", employeeId: "e4", date: iso(-1), checkIn: "22:18", checkOut: "06:05", source: "Manual", status: "Retardo", workedMinutes: 467, original: {} },
    { id: "a6", employeeId: "e2", date: iso(-2), checkIn: "08:01", checkOut: null, source: "Importación", status: "Incompleto", workedMinutes: 0, original: {} },
  ],
  incidents: [
    { id: "i1", attendanceId: "a6", employeeId: "e2", type: "Salida faltante", description: "El colaborador reporta falla de conectividad al terminar su turno.", status: "Pendiente", createdAt: new Date().toISOString(), history: [{ action: "Incidencia creada", by: "Sistema", at: new Date().toISOString() }] },
  ],
};
