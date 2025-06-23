/**
 * @file src/utils/cloudwatchLogger.ts
 * @author Gianpiero Benvenuto
 * @description Envía registros a CloudWatch Logs usando AWS SDK v3, formateando el nivel de severidad (INFO, WARN, ERROR), validando las variables de entorno y gestionando errores internos al loguear.
 */

import { CloudWatchLogs } from "@aws-sdk/client-cloudwatch-logs";

// Inicializa el cliente de CloudWatch Logs
const cloudWatchLogs = new CloudWatchLogs({});

/**
 * Envía un mensaje al grupo y stream de CloudWatch Logs configurados.
 * @param message Texto descriptivo del evento a registrar.
 * @param level Nivel de severidad (INFO, WARN, ERROR). Por defecto INFO.
 */
export const logToCloudWatch = async (
  message: string,
  level: string = "INFO"
): Promise<void> => {
  const logGroupName = process.env.CLOUDWATCH_LOG_GROUP;
  const logStreamName = process.env.CLOUDWATCH_LOG_STREAM;

  // Validar configuración
  if (!logGroupName || !logStreamName) {
    console.error(
      `CloudWatchLogs: faltan variables de entorno CLOUDWATCH_LOG_GROUP o CLOUDWATCH_LOG_STREAM`
    );
    return;
  }

  const logEvent = {
    logGroupName,
    logStreamName,
    logEvents: [
      {
        message: `${level}: ${message}`,
        timestamp: Date.now(),
      },
    ],
  };

  try {
    await cloudWatchLogs.putLogEvents(logEvent);
    console.log(`Log enviado a CloudWatch [${level}]: ${message}`);
  } catch (err: any) {
    console.error(`Error al registrar log en CloudWatch: ${err.message}`);
  }
};
