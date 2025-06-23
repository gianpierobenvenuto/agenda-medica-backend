/**
 * @file src/usecases/UpdateAppointmentStatus.ts
 * @author Gianpiero Benvenuto
 * @description Caso de uso que actualiza el estado de una cita en DynamoDB y, si corresponde al país (PE o CL), también en RDS, registrando cada operación en CloudWatch.
 */

import { DynamoDBService } from "../services/DynamoDBService";
import RDSService from "../services/RDSService";

interface Input {
  appointmentId: string;
  status: "completed";
  countryISO: string;
}

export class UpdateAppointmentStatus {
  async execute({ appointmentId, status, countryISO }: Input) {
    // 1) Actualiza sólo el status en DynamoDB
    await new DynamoDBService().updateStatus(appointmentId, status);

    // 2) Si usas RDS, haz un segundo UPDATE en la base correspondiente
    if (countryISO === "PE" || countryISO === "CL") {
      // Crea una instancia de RDSService y llama a updateStatus
      await new RDSService().updateStatus(appointmentId, status, countryISO);
      // No hace falta pasar database al método porque tu pool ya se inicializa
      // con el valor de process.env.RDS_DATABASE del .env o del SecretString.
    }

    return { appointmentId, status };
  }
}
