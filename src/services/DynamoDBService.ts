/**
 * @file src/services/DynamoDBService.ts
 * @author Gianpiero Benvenuto
 * @description Proporciona métodos para insertar citas en DynamoDB, actualizar su estado (`completed`) y listar citas por asegurado (insuredId), registrando cada operación en CloudWatch.
 */

import { DynamoDB } from "aws-sdk";
import { Appointment } from "../models/Appointment";
import { logToCloudWatch } from "../utils/cloudwatchLogger";

export class DynamoDBService {
  private client = new DynamoDB.DocumentClient();
  private tableName = process.env.APPOINTMENTS_TABLE!;

  /**
   * Inserta una nueva cita en DynamoDB.
   * La PK es appointmentId. Se guarda scheduleId (número u objeto) tal cual.
   */
  async put(item: Appointment): Promise<Appointment> {
    await logToCloudWatch(
      `PutItem en DynamoDB: appointmentId=${item.appointmentId}`,
      "INFO"
    );
    await this.client
      .put({
        TableName: this.tableName,
        Item: item,
      })
      .promise();
    await logToCloudWatch(
      `Item insertado exitosamente: appointmentId=${item.appointmentId}`,
      "INFO"
    );
    return item;
  }

  /**
   * Actualiza únicamente el status y updatedAt de una cita,
   * identificada por appointmentId.
   */
  async updateStatus(
    appointmentId: string,
    status: "completed"
  ): Promise<void> {
    const now = new Date().toISOString();
    await logToCloudWatch(
      `UpdateItem en DynamoDB: appointmentId=${appointmentId}, status=${status}`,
      "INFO"
    );
    await this.client
      .update({
        TableName: this.tableName,
        Key: { appointmentId },
        UpdateExpression: "SET #s = :status, updatedAt = :now",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":status": status,
          ":now": now,
        },
      })
      .promise();
    await logToCloudWatch(
      `Estado actualizado exitosamente: appointmentId=${appointmentId}`,
      "INFO"
    );
  }

  /**
   * Lista todas las citas de un asegurado usando un GSI sobre insuredId.
   * Necesitas definir en CloudFormation/Serverless un GSI:
   *   IndexName: "InsuredIndex", KeySchema: [{ AttributeName: "insuredId", KeyType: "HASH" }]
   */
  async listByInsured(insuredId: string): Promise<Appointment[]> {
    await logToCloudWatch(`Query DynamoDB por insuredId=${insuredId}`, "INFO");
    const result = await this.client
      .query({
        TableName: this.tableName,
        IndexName: "InsuredIndex",
        KeyConditionExpression: "insuredId = :id",
        ExpressionAttributeValues: { ":id": insuredId },
      })
      .promise();
    const items = (result.Items as Appointment[]) || [];
    await logToCloudWatch(
      `Query completado: found=${items.length} para insuredId=${insuredId}`,
      "INFO"
    );
    return items;
  }
}
