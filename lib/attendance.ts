import type { AppData, AttendanceRecord, AttendanceStatus, Employee, Shift } from "./types";
export function localDate(date = new Date()): string { return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Mexico_City" }).format(date); }
export function localTime(date = new Date()): string { return new Intl.DateTimeFormat("en-GB", { timeZone: "America/Mexico_City", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date); }
export function validDate(value: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value; }
export function validTime(value: string): boolean { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
export function timeMinutes(value: string): number { const [h, m] = value.split(":").map(Number); return h * 60 + m; }
export function minutesBetween(start: string | null, end: string | null): number {
  if (!start || !end || !validTime(start) || !validTime(end)) return 0;
  const delta = timeMinutes(end) - timeMinutes(start); return delta < 0 ? delta + 1440 : delta;
}
export function late(record: Pick<AttendanceRecord, "checkIn">, shift?: Shift): boolean {
  if (!record.checkIn || !shift) return false;
  let delta = timeMinutes(record.checkIn) - timeMinutes(shift.start);
  if (shift.end < shift.start && delta < -720) delta += 1440;
  return delta > shift.toleranceMinutes;
}
export function classifyRecord(record: Pick<AttendanceRecord, "checkIn" | "checkOut">, shift?: Shift, duplicated = false): AttendanceStatus {
  if (duplicated) return "Duplicado";
  if (!record.checkIn || !record.checkOut) return "Incompleto";
  return late(record, shift) ? "Retardo" : "Correcto";
}
export function recordFlags(record: Pick<AttendanceRecord, "checkIn" | "checkOut">, shift?: Shift): string[] {
  const flags: string[] = [];
  if (!record.checkIn) flags.push("Entrada faltante"); if (!record.checkOut) flags.push("Salida faltante");
  if (late(record, shift)) flags.push("Retardo");
  if (record.checkIn && record.checkOut && shift && minutesBetween(record.checkIn, record.checkOut) < minutesBetween(shift.start, shift.end)) flags.push("Jornada incompleta");
  return flags;
}
export function normalizeImportedRows(rows: unknown[][], employees: Employee[], shifts: Shift[], existing: AttendanceRecord[]): { records: AttendanceRecord[]; errors: string[] } {
  if (rows.length < 2) return { records: [], errors: ["El archivo no contiene registros."] };
  const headers = rows[0].map(v => String(v ?? "").replace(/^\uFEFF/, "").trim().toLowerCase());
  const aliases = [["numero", "número", "no empleado", "empleado", "employee_number"], ["fecha", "date"], ["entrada", "hora entrada", "checkin", "check_in"], ["salida", "hora salida", "checkout", "check_out"]];
  const [employeeIndex, dateIndex, inIndex, outIndex] = aliases.map(names => headers.findIndex(h => names.includes(h)));
  if ([employeeIndex, dateIndex, inIndex, outIndex].some(i => i < 0)) return { records: [], errors: ["Incluye las columnas numero, fecha, entrada y salida."] };
  const records: AttendanceRecord[] = [], errors: string[] = [];
  const parseTime = (v: unknown) => {
    if (v === null || v === undefined || v === "") return null;
    if (v instanceof Date) return v.toISOString().slice(11, 16);
    if (typeof v === "number" && v >= 0 && v < 1) { const m = Math.round(v * 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }
    const s = String(v).trim(); return /^\d{1,2}:\d{2}(:\d{2})?$/.test(s) ? s.split(":").slice(0, 2).map(x => x.padStart(2, "0")).join(":") : s;
  };
  rows.slice(1).forEach((row, index) => {
    if (row.every(v => v === null || v === "")) return;
    const number = String(row[employeeIndex] ?? "").trim(), employee = employees.find(e => e.employeeNumber === number);
    if (!employee) { errors.push(`Fila ${index + 2}: no existe el colaborador ${number || "sin número"}. La fila queda en el lote original.`); return; }
    const raw = row[dateIndex], date = raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw ?? "").trim();
    const checkIn = parseTime(row[inIndex]), checkOut = parseTime(row[outIndex]);
    if (!validDate(date) || (checkIn !== null && !validTime(checkIn)) || (checkOut !== null && !validTime(checkOut))) { errors.push(`Fila ${index + 2}: usa fecha AAAA-MM-DD y horas HH:MM válidas. La fila queda en el lote original.`); return; }
    const shift = shifts.find(s => s.id === employee.shiftId);
    const duplicate = [...existing, ...records].some(r => r.employeeId === employee.id && r.date === date && r.checkIn === checkIn && r.checkOut === checkOut);
    const original: AttendanceRecord["original"] = { employeeNumber: number, date, checkIn, checkOut };
    headers.forEach((h, i) => { original[`columna_${i + 1}_${h}`] = row[i] instanceof Date ? (row[i] as Date).toISOString() : typeof row[i] === "number" ? row[i] as number : row[i] == null ? null : String(row[i]); });
    records.push({ id: crypto.randomUUID(), employeeId: employee.id, projectId: employee.projectId, shiftId: employee.shiftId, shiftSnapshot: shift ? { ...shift } : undefined, date, checkIn, checkOut, source: "Importación", status: classifyRecord({ checkIn, checkOut }, shift, duplicate), workedMinutes: minutesBetween(checkIn, checkOut), original, flags: [...recordFlags({ checkIn, checkOut }, shift), ...(duplicate ? ["Duplicado"] : [])] });
  }); return { records, errors };
}
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cell = "", quoted = false;
  const delimiter = text.split(/\r?\n/)[0].includes(";") ? ";" : ",";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (c === delimiter && !quoted) { row.push(cell); cell = ""; }
    else if ((c === "\n" || c === "\r") && !quoted) { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (quoted) throw new Error("El CSV tiene comillas sin cerrar.");
  row.push(cell); if (row.some(Boolean)) rows.push(row); return rows;
}
export function csvEscape(value: unknown): string { let text = String(value ?? ""); if (/^[\s]*[=+@-]/.test(text)) text = "'" + text; return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
export function shiftFor(data: AppData, record: AttendanceRecord): Shift | undefined { return record.shiftSnapshot ?? data.shifts.find(s => s.id === (record.shiftId ?? data.employees.find(e => e.id === record.employeeId)?.shiftId)); }
export function metrics(data: AppData, records: AttendanceRecord[], employees: Employee[], from: string, to: string) {
  const unique = records.filter(r => r.status !== "Duplicado"), entries = unique.filter(r => r.checkIn), complete = unique.filter(r => r.checkIn && r.checkOut);
  const minutes = complete.reduce((sum, r) => sum + r.workedMinutes, 0), workedDays = new Set(complete.map(r => r.employeeId + r.date)).size;
  const tardy = new Set(entries.filter(r => late(r, shiftFor(data, r))).map(r => r.employeeId + r.date)).size, entryDays = new Set(entries.map(r => r.employeeId + r.date)).size;
  const absences: { employeeId: string; date: string; justified: boolean }[] = []; let scheduled = 0, present = 0;
  if (validDate(from) && validDate(to) && from <= to) {
    for (let day = new Date(`${from}T12:00:00Z`), n = 0; day.toISOString().slice(0, 10) <= to && n < 367; day.setUTCDate(day.getUTCDate() + 1), n++) {
      const date = day.toISOString().slice(0, 10); if (date >= localDate()) continue;
      for (const employee of employees) {
        if ((!employee.active && !employee.endDate) || (employee.startDate && date < employee.startDate) || (employee.endDate && date > employee.endDate)) continue;
        const shift = data.shifts.find(s => s.id === employee.shiftId); if (!(shift?.workDays ?? [1, 2, 3, 4, 5]).includes(day.getUTCDay())) continue;
        scheduled++;
        if (complete.some(r => r.employeeId === employee.id && r.date === date)) present++;
        else { const justified = data.incidents.some(i => i.employeeId === employee.id && i.status === "Autorizada" && ["Vacaciones", "Permiso", "Incapacidad", "Falta"].includes(i.type) && (i.date ?? "") <= date && (i.endDate ?? i.date ?? "") >= date); absences.push({ employeeId: employee.id, date, justified }); }
      }
    }
  }
  const expected = complete.reduce((sum, r) => { const s = shiftFor(data, r); return sum + (s ? minutesBetween(s.start, s.end) : 0); }, 0);
  const extra = complete.reduce((sum, r) => { const s = shiftFor(data, r); return sum + (s ? Math.max(0, r.workedMinutes - minutesBetween(s.start, s.end)) : 0); }, 0);
  const ratio = (n: number, d: number) => d ? Math.round(n / d * 100) : null;
  return { minutes, average: workedDays ? Math.round(minutes / workedDays) : 0, punctuality: ratio(entryDays - tardy, entryDays), lateRate: ratio(tardy, entryDays), attendance: ratio(present, scheduled), absenteeism: ratio(absences.filter(a => !a.justified).length, scheduled), compliance: ratio(minutes, expected), extra, scheduled, absences, short: complete.filter(r => { const s = shiftFor(data, r); return s && r.workedMinutes < minutesBetween(s.start, s.end); }).length, incomplete: unique.filter(r => !r.checkIn || !r.checkOut).length };
}
