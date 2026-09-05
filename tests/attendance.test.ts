import { describe, expect, it } from "vitest";
import { classifyRecord, minutesBetween, normalizeImportedRows } from "../lib/attendance";
import { seedData } from "../lib/seed";

describe("reglas de asistencia", () => {
  it("calcula minutos trabajados", () => {
    expect(minutesBetween("08:00", "16:15")).toBe(495);
    expect(minutesBetween("08:00", null)).toBe(0);
  });

  it("clasifica retardos respetando la tolerancia", () => {
    const shift = seedData.shifts[0];
    expect(classifyRecord({ checkIn: "08:10", checkOut: "16:00" }, shift)).toBe("Correcto");
    expect(classifyRecord({ checkIn: "08:11", checkOut: "16:00" }, shift)).toBe("Retardo");
    expect(classifyRecord({ checkIn: "08:00", checkOut: null }, shift)).toBe("Incompleto");
  });

  it("importa filas y conserva el registro original", () => {
    const rows = [
      ["numero", "fecha", "entrada", "salida"],
      ["DIIP-001", "2026-09-03", "08:00", "16:00"],
    ];
    const result = normalizeImportedRows(rows, seedData.employees, seedData.shifts, []);
    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].original.employeeNumber).toBe("DIIP-001");
  });

  it("reporta colaboradores desconocidos sin perder el resto del lote", () => {
    const rows = [
      ["numero", "fecha", "entrada", "salida"],
      ["NO-EXISTE", "2026-09-03", "08:00", "16:00"],
      ["DIIP-002", "2026-09-03", "08:00", "16:00"],
    ];
    const result = normalizeImportedRows(rows, seedData.employees, seedData.shifts, []);
    expect(result.errors).toHaveLength(1);
    expect(result.records).toHaveLength(1);
  });
});
