/**
 * @file src/services/EventBridgeService.ts
 * @author Gianpiero Benvenuto
 * @description Define la interfaz `AppointmentEvent` y ofrece métodos para publicar eventos de cita (AppointmentCreated y AppointmentCompleted) en Amazon EventBridge utilizando el bus configurado.
 */

import { EventBridge } from "aws-sdk";
import { ScheduleKey } from "../models/Appointment";

/**
 * Payload de evento para AppointmentCreated y AppointmentCompleted
 */
export interface AppointmentEvent {
  appointmentId: string;
  insuredId: string;
  scheduleId: number | ScheduleKey;
  countryISO: "PE" | "CL" | string;
  status: "pending" | "completed";
  createdAt: string;
}

/**
 * Servicio para publicar eventos en EventBridge relacionados a citas.
 */
export class EventBridgeService {
  private client = new EventBridge();
  private busName = process.env.EVENT_BUS_NAME!;

  /**
   * Publica un evento indicando que se creó una cita.
   */
  async publishCreated(payload: AppointmentEvent): Promise<void> {
    await this.client
      .putEvents({
        Entries: [
          {
            EventBusName: this.busName,
            Source: `appointments.${payload.countryISO.toLowerCase()}`,
            DetailType: "AppointmentCreated",
            Detail: JSON.stringify(payload),
          },
        ],
      })
      .promise();
  }

  /**
   * Publica un evento indicando que se completó una cita.
   */
  async publishCompleted(payload: AppointmentEvent): Promise<void> {
    await this.client
      .putEvents({
        Entries: [
          {
            EventBusName: this.busName,
            Source: `appointments.${payload.countryISO.toLowerCase()}`,
            DetailType: "AppointmentCompleted",
            Detail: JSON.stringify(payload),
          },
        ],
      })
      .promise();
  }
}
