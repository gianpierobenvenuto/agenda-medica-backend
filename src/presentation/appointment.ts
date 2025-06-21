import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { BookAppointment } from "../application/bookAppointment";
import { SNS, EventBridge } from "aws-sdk";
import { DynamoRepository } from "../infrastructure/DynamoRepository";

const repo = new DynamoRepository();
const book = new BookAppointment(repo);
const sns = new SNS();
const eb = new EventBridge();

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing body" }),
    };
  }

  // 1. Parsear payload y reservar
  const { insuredId, scheduleId, countryISO } = JSON.parse(event.body) as {
    insuredId: string;
    scheduleId: number;
    countryISO: "PE" | "CL";
  };
  const appointment = await book.execute(insuredId, scheduleId, countryISO);

  // 2. Publicar en SNS
  const topicArn =
    countryISO === "PE" ? process.env.SNS_TOPIC_PE! : process.env.SNS_TOPIC_CL!;
  await sns
    .publish({ TopicArn: topicArn, Message: JSON.stringify(appointment) })
    .promise();

  // 3. Emitir evento de confirmación en EventBridge
  await eb
    .putEvents({
      Entries: [
        {
          Source: "application.appointment",
          DetailType: "AppointmentCompleted",
          Detail: JSON.stringify(appointment),
          EventBusName: process.env.EVENT_BUS!,
        },
      ],
    })
    .promise();

  // 4. Responder al cliente
  return {
    statusCode: 200,
    body: JSON.stringify(appointment),
  };
};
