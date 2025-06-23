/**
 * @file src/handlers/appointment_pe.ts
 * @author Gianpiero Benvenuto
 * @description Procesa lotes de mensajes SQS que contienen datos de citas, inserta cada cita en la base de datos RDS, publica un evento de cita completada en EventBridge y registra toda la actividad en CloudWatch (Perú).
 */

import { SQSHandler } from "aws-lambda";
import RDSService from "../services/RDSService";
import { EventBridgeService } from "../services/EventBridgeService";
import { logToCloudWatch } from "../utils/cloudwatchLogger";

/**
 * Handler principal para el procesamiento de eventos SQS.
 * @param event Evento entrante con uno o más mensajes SQS.
 */
export const handler: SQSHandler = async (event) => {
  // Inicializar servicios
  const rds = new RDSService();
  const eb = new EventBridgeService();

  // Log de inicio de batch
  await logToCloudWatch(
    `Procesando lote de ${event.Records.length} registros SQS`,
    "INFO"
  );

  // Procesar todos los mensajes en paralelo
  await Promise.all(
    event.Records.map(async (record, index) => {
      try {
        await logToCloudWatch(
          `Iniciando procesamiento del record #${index}`,
          "INFO"
        );

        // Parsear el payload JSON de la cola
        const payload = JSON.parse(record.body);

        // Insertar cita en la base de datos RDS
        await rds.insertAppointment(payload);
        await logToCloudWatch(
          `Cita insertada en RDS para insuredId=${payload.insuredId}, scheduleId=${payload.scheduleId}`,
          "INFO"
        );

        // Enviar evento a EventBridge
        await eb.publishCompleted(payload);
        await logToCloudWatch(
          `Evento enviado a EventBridge para insuredId=${payload.insuredId}`,
          "INFO"
        );
      } catch (error) {
        // Log del error sin detener otros registros
        const errMsg =
          error instanceof Error ? error.message : JSON.stringify(error);
        await logToCloudWatch(
          `Error procesando record #${index}: ${errMsg}`,
          "ERROR"
        );
      }
    })
  );

  // Log de finalización de batch
  await logToCloudWatch("Procesamiento de lote SQS completado", "INFO");
};
