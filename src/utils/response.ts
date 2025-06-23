/**
 * @file src/utils/response.ts
 * @author Gianpiero Benvenuto
 * @description Genera respuestas HTTP de éxito y de error con cuerpo JSON, establece el header `Content-Type`, define el código de estado y registra cada respuesta en CloudWatch.
 */

import { logToCloudWatch } from "../utils/cloudwatchLogger";

/**
 * Genera una respuesta HTTP de éxito con cuerpo JSON.
 * @param body Objeto a serializar en el cuerpo de la respuesta.
 * @param statusCode Código de estado HTTP (por defecto 200).
 */
export const success = (body: any, statusCode = 200) => {
  const response = {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
  // Log de la respuesta de éxito
  logToCloudWatch(
    `Response success: statusCode=${statusCode}, body=${JSON.stringify(body)}`,
    "INFO"
  );
  return response;
};

/**
 * Genera una respuesta HTTP de error con cuerpo JSON.
 * @param message Mensaje de error a incluir en el cuerpo.
 * @param statusCode Código de estado HTTP (por defecto 500).
 */
export const error = (message: string, statusCode = 500) => {
  const response = {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ error: message }),
  };
  // Log de la respuesta de error
  logToCloudWatch(
    `Response error: statusCode=${statusCode}, message=${message}`,
    "ERROR"
  );
  return response;
};
