/**
 * @file src/usecases/RegisterAppointment.ts
 * @author Gianpiero Benvenuto
 * @description Caso de uso para registrar una nueva cita: valida el countryISO, genera un appointmentId y timestamp, persiste la cita en DynamoDB y publica un evento en SNS, registrando cada paso en CloudWatch.
 */

import { v4 as uuidv4 } from "uuid";
import { DynamoDBService } from "../services/DynamoDBService";
import { SNSService } from "../services/SNSService";
import { logToCloudWatch } from "../utils/cloudwatchLogger";
import { Appointment, ScheduleKey } from "../models/Appointment";

interface Input {
  insuredId: string;
  // Puede ser un número simple o la “llave” completa
  scheduleId: number | ScheduleKey;
  countryISO: string;
}

/**
 * Caso de uso para registrar una nueva cita:
 *  1) Validar countryISO **antes** de tocar cualquier persistencia.
 *  2) Generar un appointmentId único.
 *  3) Persistir en DynamoDB, usando appointmentId como PK.
 *  4) Publicar en SNS incluyendo el appointmentId.
 */
export class RegisterAppointment {
  async execute(input: Input): Promise<Appointment> {
    // 1) Validación temprana de país
    const iso = input.countryISO.toUpperCase();
    if (iso !== "PE" && iso !== "CL") {
      throw new Error(`Invalid countryISO: ${input.countryISO}`);
    }

    // 2) Generar appointmentId y timestamp
    const appointmentId = uuidv4();
    const now = new Date().toISOString();

    await logToCloudWatch(
      `Inicio RegisterAppointment: appointmentId=${appointmentId}, insuredId=${input.insuredId}, countryISO=${iso}`,
      "INFO"
    );

    // 3) Guardar en DynamoDB
    const item = await new DynamoDBService().put({
      appointmentId,
      insuredId: input.insuredId,
      scheduleId: input.scheduleId,
      countryISO: iso,
      status: "pending",
      createdAt: now,
    });
    await logToCloudWatch(
      `Cita guardada en DynamoDB: appointmentId=${appointmentId}`,
      "INFO"
    );

    // 4) Publicar en SNS para downstream processing
    await logToCloudWatch(
      `Publicando cita en SNS: appointmentId=${appointmentId}`,
      "INFO"
    );
    await new SNSService().publish({
      appointmentId,
      insuredId: input.insuredId,
      scheduleId: input.scheduleId,
      countryISO: iso,
      status: "pending",
      createdAt: now,
    });
    await logToCloudWatch(
      `Cita publicada en SNS correctamente: appointmentId=${appointmentId}`,
      "INFO"
    );

    return item;
  }
}
