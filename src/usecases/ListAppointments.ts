/**
 * @file src/usecases/ListAppointments.ts
 * @author Gianpiero Benvenuto
 * @description Caso de uso que lista todas las citas de un asegurado mediante `DynamoDBService.listByInsured`, registrando el inicio, el resultado y posibles errores en CloudWatch.
 */

import { DynamoDBService } from "../services/DynamoDBService";
import { Appointment } from "../models/Appointment";
import { logToCloudWatch } from "../utils/cloudwatchLogger";

/**
 * Caso de uso para listar todas las citas de un asegurado.
 */
export class ListAppointments {
  async execute(insuredId: string): Promise<Appointment[]> {
    await logToCloudWatch(
      `Ejecutando ListAppointments para insuredId=${insuredId}`,
      "INFO"
    );
    try {
      // <-- aquí cambiamos `.list` por `.listByInsured`
      const appointments = await new DynamoDBService().listByInsured(insuredId);
      await logToCloudWatch(
        `ListAppointments completado: found=${appointments.length} para insuredId=${insuredId}`,
        "INFO"
      );
      return appointments;
    } catch (err: any) {
      await logToCloudWatch(
        `Error en ListAppointments: ${err.message}`,
        "ERROR"
      );
      throw new Error(`ListAppointments failed: ${err.message}`);
    }
  }
}
