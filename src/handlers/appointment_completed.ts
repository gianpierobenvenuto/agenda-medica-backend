/**
 * @file src/handlers/appointment_completed.ts
 * @author Gianpiero Benvenuto
 * @description Procesa mensajes de SQS que indican citas completadas, actualiza el estado de la cita en DynamoDB y en la base de datos relacional (RDS), y registra la actividad en CloudWatch.
 */

import { SQSEvent, Context, Callback, APIGatewayProxyResult } from "aws-lambda";
import { UpdateAppointmentStatus } from "../usecases/UpdateAppointmentStatus";
import { logToCloudWatch } from "../utils/cloudwatchLogger";
import { AppointmentEvent } from "../services/EventBridgeService";

export const handler = async (
  event: SQSEvent,
  _context: Context,
  _callback: Callback<APIGatewayProxyResult>
): Promise<void> => {
  const updater = new UpdateAppointmentStatus();

  await logToCloudWatch(
    `Procesando ${event.Records.length} mensajes de citas completadas`,
    "INFO"
  );

  for (const record of event.Records) {
    // 1) Analizar el cuerpo de SQS, que es el sobre de EventBridge
    const envelope = JSON.parse(record.body);

    // 2) Extraer la carga útil real del evento de cita
    const payload: AppointmentEvent = envelope.detail;

    try {
      // 3) Actualizar el estado en DynamoDB (por appointmentId) y en RDS
      await updater.execute({
        appointmentId: payload.appointmentId,
        status: "completed",
        countryISO: payload.countryISO,
      });

      await logToCloudWatch(
        `Cita ${payload.appointmentId} marcada como completed`,
        "INFO"
      );
    } catch (err: any) {
      await logToCloudWatch(
        `Error procesando completed para ${payload.appointmentId}: ${err.message}`,
        "ERROR"
      );
      // Volver a lanzar para que SQS pueda reintentar o enviar a la DLQ
      throw err;
    }
  }
};
