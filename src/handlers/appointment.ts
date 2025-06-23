/**
 * @file src/handlers/appointment.ts
 * @author Gianpiero Benvenuto
 * @description Gestiona las solicitudes HTTP a `/appointments`: registra el inicio del handler en CloudWatch, maneja **POST** para registrar citas con `RegisterAppointment` (devolviendo 201 o errores 400/500) y **GET** para listar citas con `ListAppointments`, devolviendo respuestas adecuadas según el método.
 */

import { APIGatewayProxyHandler } from "aws-lambda";
import { RegisterAppointment } from "../usecases/RegisterAppointment";
import { ListAppointments } from "../usecases/ListAppointments";
import { success, error } from "../utils/response";
import { logToCloudWatch } from "../utils/cloudwatchLogger";

export const handler: APIGatewayProxyHandler = async (event) => {
  await logToCloudWatch(
    `Inicio handler /appointments: method=${event.httpMethod}`,
    "INFO"
  );

  try {
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");

      try {
        // Ejecuto el use case; si countryISO es inválido, aquí saltará el error
        const result = await new RegisterAppointment().execute({
          insuredId: String(body.insuredId),
          scheduleId: body.scheduleId,
          countryISO: String(body.countryISO),
        });
        return success(result, 201);
      } catch (usecaseError: any) {
        const msg = usecaseError.message || "Error registrando cita";
        await logToCloudWatch(`Error en RegisterAppointment: ${msg}`, "WARN");

        // Si fue invalid countryISO, devuelvo 400
        if (msg.startsWith("countryISO no válido")) {
          return error(msg, 400);
        }
        // En cualquier otro caso, 500
        return error(msg, 500);
      }
    } else if (event.httpMethod === "GET") {
      const insuredId = event.pathParameters!.insuredId!;
      const items = await new ListAppointments().execute(insuredId);
      return success(items);
    } else {
      return error("Método no permitido", 405);
    }
  } catch (err: any) {
    const msg = err.message || "Error interno";
    await logToCloudWatch(`Error handler /appointments: ${msg}`, "ERROR");
    return error(msg, 500);
  }
};
