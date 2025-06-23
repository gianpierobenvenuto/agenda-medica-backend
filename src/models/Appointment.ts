/**
 * @file src/models/Appointment.ts
 * @author Gianpiero Benvenuto
 * @description Define las interfaces `ScheduleKey` (conjunto de campos que identifican un espacio de cita) y `Appointment` (estructura de datos de una cita médica), incluyendo tipos y metadatos como IDs, estado y timestamps.
 */

/**
 * “Llave” completa para agendar:
 * conjunto de 5 campos que definen un espacio:
 *   - scheduleId
 *   - centerId
 *   - specialtyId
 *   - medicId
 *   - date (ISO 8601)
 */
export interface ScheduleKey {
  scheduleId: number;
  centerId: number;
  specialtyId: number;
  medicId: number;
  date: string;
}

/**
 * Representa una cita médica o agendamiento.
 */
export interface Appointment {
  /** ID único de la cita, generado en el momento de crearla */
  appointmentId: string;

  /** Identificador único del asegurado */
  insuredId: string;

  /**
   * Identificador del horario:
   * puede ser un número o la “llave” completa de tipo ScheduleKey.
   */
  scheduleId: number | ScheduleKey;

  /** Código ISO del país (PE, CL, etc.). */
  countryISO: "PE" | "CL" | string;

  /** Estado de la cita: pending o completed. */
  status: "pending" | "completed";

  /** Fecha y hora de creación (ISO 8601). */
  createdAt: string;

  /** Fecha y hora de última actualización (ISO 8601), opcional. */
  updatedAt?: string;
}
