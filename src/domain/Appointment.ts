export interface Appointment {
  appointmentId: string;
  insuredId: string;
  scheduleId: number;
  countryISO: "PE" | "CL";
  status: "pending" | "completed";
  createdAt: string; // ISO timestamp
}
