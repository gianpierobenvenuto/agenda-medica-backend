import { DynamoDB } from "aws-sdk";
import { Appointment } from "../domain/Appointment";
export class DynamoRepository {
  private table = process.env.DYNAMODB_TABLE!;
  private client = new DynamoDB.DocumentClient();
  async save(item: Appointment) {
    await this.client.put({ TableName: this.table, Item: item }).promise();
  }
  async listByInsured(insuredId: string) {
    const res = await this.client
      .query({
        TableName: this.table,
        IndexName: "insuredId-index",
        KeyConditionExpression: "insuredId = :i",
        ExpressionAttributeValues: { ":i": insuredId },
      })
      .promise();
    return res.Items as Appointment[];
  }
}
