import { describe, expect, it } from "vitest";
import { seedData } from "../lib/seed";
import { applyAction, visibleData } from "../lib/domain";
import { csvEscape, localDate, metrics, minutesBetween, normalizeImportedRows, parseCsv, validDate } from "../lib/attendance";
import type { AppData, UserSession } from "../lib/types";
const admin: UserSession = { id: "admin", name: "Admin", email: "admin@test.mx", role: "Administrador" };
const employee: UserSession = { id: "worker", name: "Ana", email: "ana@test.mx", role: "Colaborador", employeeId: "e1" };
const supervisor: UserSession = { id: "boss", name: "Jefatura", email: "jefe@test.mx", role: "Supervisor" };
const director: UserSession = { id: "director", name: "Dirección", email: "director@test.mx", role: "Director general" };
const ti: UserSession = { id: "ti", name: "TI", email: "ti@test.mx", role: "Gestor TI" };
const now = new Date("2026-09-05T16:00:00Z");
const photo = "data:image/jpeg;base64,/9j/AA==";
const location = { latitude: 19.4326, longitude: -99.1332, accuracy: 10, distanceMeters: 15, withinRadius: true };
const fresh = (): AppData => ({ ...structuredClone(seedData), attendance: [], incidents: [], audit: [], imports: [], users: [] });
describe("flujo operativo y permisos", () => {
  it("rechaza registros de otro colaborador desde el servidor", () => {
    expect(() => applyAction(fresh(), { type: "clock", employeeId: "e2", photo, direction: "in" }, employee, now)).toThrow("propia");
    expect(visibleData(seedData, employee).attendance.every(r => r.employeeId === "e1")).toBe(true);
  });
  it("requiere foto, guarda entrada/salida y previene doble entrada", () => {
    expect(() => applyAction(fresh(), { type: "clock", employeeId: "e1", photo: "", direction: "in" }, employee, now)).toThrow("foto");
    const entered = applyAction(fresh(), { type: "clock", employeeId: "e1", photo, location, direction: "in" }, employee, now);
    expect(entered.attendance[0].checkInPhoto).toBe(photo);
    expect(() => applyAction(entered, { type: "clock", employeeId: "e1", photo, location, direction: "in" }, employee, now)).toThrow("jornada");
    const closed = applyAction(entered, { type: "clock", employeeId: "e1", photo, location, direction: "out" }, employee, new Date("2026-09-06T00:00:00Z"));
    expect(closed.attendance[0].workedMinutes).toBe(480);
    expect(closed.attendance[0].checkOutPhoto).toBe(photo);
    expect(closed.attendance[0].original.checkOut).toBeNull();
  });
  it("registra correctamente una salida nocturna al día siguiente", () => {
    const entered = applyAction(fresh(), { type: "clock", employeeId: "e4", photo, location, direction: "in" }, admin, new Date("2026-09-05T04:00:00Z"));
    const closed = applyAction(entered, { type: "clock", employeeId: "e4", photo, location, direction: "out" }, admin, new Date("2026-09-05T12:00:00Z"));
    expect(closed.attendance[0].workedMinutes).toBe(480);
    expect(closed.attendance[0].date).toBe("2026-09-04");
  });
  it("conserva lotes y crea incidencias de duplicados y datos nulos", () => {
    const rows = [["numero", "fecha", "entrada", "salida"], ["DIIP-001", "2026-09-01", "08:00", null], ["DIIP-001", "2026-09-01", "08:00", null], ["INVALID", "2026-09-01", "08:00", "16:00"]];
    const result = applyAction(fresh(), { type: "import", name: "prueba.csv", rows }, admin, now);
    expect(result.imports?.[0].rows).toEqual(rows);
    expect(result.imports?.[0].errors).toHaveLength(1);
    expect(result.attendance).toHaveLength(2);
    expect(result.incidents.some(i => i.type === "Duplicado")).toBe(true);
    expect(result.incidents.some(i => i.type === "Salida faltante")).toBe(true);
    expect(result.incidents.some(i => i.type === "Cantidad anormal de registros")).toBe(true);
  });
  it("el analista no puede autorizar, y la corrección conserva originales", () => {
    let d = applyAction(fresh(), { type: "import", name: "a.csv", rows: [["numero", "fecha", "entrada", "salida"], ["DIIP-001", "2026-09-01", "08:00", null]] }, admin, now);
    d = applyAction(d, { type: "incident", incident: { employeeId: "e1", attendanceId: d.attendance[0].id, type: "Corrección de horario", description: "Olvidé registrar la salida", date: "2026-09-01", proposedCheckOut: "16:00" } }, employee, now);
    const id = d.incidents[0].id;
    expect(() => applyAction(d, { type: "decision", id, status: "Autorizada", comment: "Validado", deduction: false }, { ...admin, role: "Analista" }, now)).toThrow("permiso");
    d = applyAction(d, { type: "decision", id, status: "Información requerida", comment: "Adjunta evidencia", deduction: false }, admin, now);
    d = applyAction(d, { type: "reply", id, comment: "Adjunto foto", photo }, employee, now);
    expect(d.incidents[0].status).toBe("Pendiente");
    d = applyAction(d, { type: "decision", id, status: "Propuesta de ajuste", comment: "Validado por jefatura", deduction: false }, supervisor, now);
    d = applyAction(d, { type: "decision", id, status: "Autorizada", comment: "Autorizado por Dirección", deduction: false }, director, now);
    expect(d.attendance[0].checkOut).toBeNull();
    d = applyAction(d, { type: "decision", id, status: "Aplicada", comment: "Aplicado por TI", deduction: false }, ti, now);
    expect(d.attendance[0].checkOut).toBe("16:00"); expect(d.attendance[0].original.checkOut).toBeNull();
    expect(d.attendance[0].history?.[0].action).toContain("Corrección aplicada");
    expect(d.incidents[0].history).toHaveLength(6);
    expect(() => applyAction(d, { type: "decision", id, status: "Rechazada", comment: "Otro", deduction: false }, admin, now)).toThrow("resuelta");
  });
});
describe("importación y métricas", () => {
  it("detecta fechas imposibles y horas inválidas", () => {
    expect(validDate("2026-02-30")).toBe(false);
    const r = normalizeImportedRows([["numero", "fecha", "entrada", "salida"], ["DIIP-001", "2026-09-01", "25:30", "16:00"]], seedData.employees, seedData.shifts, []);
    expect(r.records).toHaveLength(0); expect(r.errors).toHaveLength(1);
  });
  it("maneja CSV con comas, saltos, comillas escapadas y separador punto y coma", () => {
    expect(parseCsv('a,b\r\n"Ana, María","dijo ""hola"""')).toEqual([["a", "b"], ["Ana, María", 'dijo "hola"']]);
    expect(parseCsv('a;b\n1;"dos\nlineas"')).toEqual([["a", "b"], ["1", "dos\nlineas"]]);
    expect(() => parseCsv('a,b\n"oops')).toThrow();
    expect(csvEscape("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
  });
  it("calcula jornadas nocturnas y fecha de México", () => {
    expect(minutesBetween("22:00", "06:00")).toBe(480);
    expect(minutesBetween("08:00", "08:00")).toBe(0);
    expect(localDate(new Date("2026-09-05T02:00:00Z"))).toBe("2026-09-04");
  });
  it("no cuenta una entrada sin salida como ausencia ni duplica horas", () => {
    const d = fresh(); d.employees = [{ ...d.employees[0], startDate: "2026-09-01" }];
    const imported = normalizeImportedRows([["numero", "fecha", "entrada", "salida"], ["DIIP-001", "2026-09-01", "08:00", null], ["DIIP-001", "2026-09-02", "08:00", "16:00"], ["DIIP-001", "2026-09-02", "08:00", "16:00"]], d.employees, d.shifts, []);
    d.attendance = imported.records;
    const m = metrics(d, d.attendance, d.employees, "2026-09-01", "2026-09-03");
    expect(m.minutes).toBe(480); expect(m.absences).toHaveLength(1); expect(m.absences[0].date).toBe("2026-09-03"); expect(m.incomplete).toBe(1);
  });
  it("una ausencia autorizada no eleva el ausentismo injustificado", () => {
    let d = fresh(); d.employees = [d.employees[0]];
    d = applyAction(d, { type: "incident", incident: { employeeId: "e1", attendanceId: "", type: "Vacaciones", description: "Vacaciones solicitadas", date: "2026-09-01", endDate: "2026-09-03" } }, employee, now);
    d = applyAction(d, { type: "decision", id: d.incidents[0].id, status: "Autorizada", comment: "Autorizadas", deduction: false }, admin, now);
    const m = metrics(d, [], d.employees, "2026-09-01", "2026-09-03"); expect(m.absenteeism).toBe(0); expect(m.absences.every(a => a.justified)).toBe(true);
  });
});
