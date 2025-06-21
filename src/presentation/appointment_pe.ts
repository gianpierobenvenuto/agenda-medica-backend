// src/presentation/appointment_pe.ts
import { SNSEvent, Context } from "aws-lambda";
import { MysqlRepository } from "../infrastructure/MysqlRepository";
import { EventBridge } from "aws-sdk";

const mysqlRepo = new MysqlRepository();
const eb = new EventBridge();

export const handler = async (event: SNSEvent, context: Context) => {
  for (const record of event.Records) {
    const payload = JSON.parse(record.Sns.Message);
    const { insertId } = await mysqlRepo.insertAppointment(payload);
    const appointmentId = payload.appointmentId ?? insertId;

    // Publicamos la confirmación en EventBridge
    await eb
      .putEvents({
        Entries: [
          {
            Source: "application.appointment",
            DetailType: "AppointmentConfirmed",
            Detail: JSON.stringify({ appointmentId }),
            EventBusName: process.env.EVENT_BUS!,
          },
        ],
      })
      .promise();
  }
};
