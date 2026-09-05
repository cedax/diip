export type Role = "Administrador" | "Supervisor" | "Analista" | "Colaborador";
export type AttendanceStatus = "Correcto" | "Retardo" | "Incompleto" | "Duplicado";
export type IncidentStatus = "Pendiente" | "Autorizada" | "Rechazada" | "Información requerida";

export interface UserSession {
  id?: string;
  employeeId?: string;
  name: string;
  email: string;
  role: Role;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  active: boolean;
}

export interface Shift {
  id: string;
  name: string;
  start: string;
  end: string;
  toleranceMinutes: number;
  workDays?: number[];
}

export interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  projectId: string;
  shiftId: string;
  active: boolean;
  photo?: string;
  startDate?: string;
  endDate?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  source: "Manual" | "Importación" | "App móvil";
  status: AttendanceStatus;
  workedMinutes: number;
  original: Record<string, string | number | null>;
  checkInPhoto?: string;
  checkOutPhoto?: string;
  projectId?: string;
  shiftId?: string;
  shiftSnapshot?: Shift;
  flags?: string[];
  history?: { action: string; by: string; at: string }[];
}

export interface Incident {
  id: string;
  attendanceId: string;
  employeeId: string;
  type: string;
  description: string;
  evidence?: string;
  status: IncidentStatus;
  createdAt: string;
  history: { action: string; by: string; at: string }[];
  date?: string;
  endDate?: string;
  attachments?: { id: string; name: string; image: string; by: string; at: string }[];
  proposedCheckIn?: string;
  proposedCheckOut?: string;
  deduction?: boolean;
}

export interface AppData {
  employees: Employee[];
  projects: Project[];
  shifts: Shift[];
  attendance: AttendanceRecord[];
  incidents: Incident[];
  users?: ManagedUser[];
  audit?: { id: string; action: string; by: string; at: string }[];
  imports?: { id: string; name: string; by: string; at: string; rows: unknown[][]; errors: string[]; count: number }[];
  policy?: { maxDailyRecords: number; maxMonthlyRecords: number };
}

export interface ManagedUser extends UserSession { id: string; active: boolean }

export type Action =
  | { type: "clock"; employeeId: string; photo: string; direction: "in" | "out" }
  | { type: "employee"; employee: Employee }
  | { type: "project"; project: Project }
  | { type: "shift"; shift: Shift }
  | { type: "incident"; incident: Pick<Incident, "employeeId" | "attendanceId" | "type" | "description" | "date" | "endDate" | "proposedCheckIn" | "proposedCheckOut">; photo?: string }
  | { type: "decision"; id: string; status: IncidentStatus; comment: string; deduction: boolean }
  | { type: "reply"; id: string; comment: string; photo?: string }
  | { type: "import"; name: string; rows: unknown[][] }
  | { type: "policy"; maxDailyRecords: number; maxMonthlyRecords: number }
  | { type: "user"; user: ManagedUser; password?: string };

export type ViewKey = "dashboard" | "attendance" | "employees" | "catalogs" | "incidents" | "import" | "reports" | "settings" | "users";
