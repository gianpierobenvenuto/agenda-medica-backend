/**
 * @file src/services/SNSService.ts
 * @author Gianpiero Benvenuto
 * @description Define la interfaz `SnsAppointmentPayload` y ofrece el servicio `SNSService` para publicar notificaciones de citas en AWS SNS según el país, validando el `countryISO`, construyendo el mensaje completo y registrando cada paso en CloudWatch.
 */

import { SNS } from "aws-sdk";
import { ScheduleKey } from "../models/Appointment";
import { logToCloudWatch } from "../utils/cloudwatchLogger";

/**
 * Payload completo para SNS cuando se crea una cita.
 */
export interface SnsAppointmentPayload {
  appointmentId: string;
  insuredId: string;
  scheduleId: number | ScheduleKey;
  countryISO: "PE" | "CL" | string;
  status: "pending" | "completed";
  createdAt: string;
}

/**
 * Servicio para publicar notificaciones de citas en AWS SNS por país.
 */
export class SNSService {
  private client = new SNS();
  private topics: Record<"PE" | "CL", string> = {
    PE: process.env.SNS_PE_ARN!,
    CL: process.env.SNS_CL_ARN!,
  };

  /**
   * Publica un mensaje en el topic SNS correspondiente al país.
   * Ahora acepta todo el payload de cita, incluido appointmentId, status y createdAt.
   */
  async publish(input: SnsAppointmentPayload): Promise<void> {
    // Validar que exista un topic para este countryISO
    const iso = input.countryISO as "PE" | "CL";
    const topicArn = this.topics[iso];
    if (!topicArn) {
      throw new Error(
        `Invalid countryISO for SNS publish: ${input.countryISO}`
      );
    }

    // Construir el mensaje completo
    const message = {
      appointmentId: input.appointmentId,
      insuredId: input.insuredId,
      scheduleId: input.scheduleId,
      countryISO: input.countryISO,
      status: input.status,
      createdAt: input.createdAt,
    };

    await logToCloudWatch(
      `Publicando mensaje SNS: topicArn=${topicArn}, payload=${JSON.stringify(
        message
      )}`,
      "INFO"
    );

    await this.client
      .publish({
        TopicArn: topicArn,
        Message: JSON.stringify(message),
      })
      .promise();

    await logToCloudWatch(
      `Mensaje SNS publicado correctamente: appointmentId=${input.appointmentId}`,
      "INFO"
    );
  }
}
