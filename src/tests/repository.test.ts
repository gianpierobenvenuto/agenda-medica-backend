import { DynamoRepository } from "../infrastructure/DynamoRepository";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

jest.mock("aws-sdk", () => ({
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      put: jest.fn().mockReturnThis(),
      query: jest.fn().mockReturnThis(),
      promise: jest.fn().mockResolvedValue({ Items: [] }),
    })),
  },
}));

describe("DynamoRepository", () => {
  const repo = new DynamoRepository();
  const docClient = repo["client"] as unknown as DocumentClient;

  it("save() debe llamar a put()", async () => {
    const item = {
      appointmentId: "1",
      insuredId: "00001",
      scheduleId: 1,
      countryISO: "PE",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    await repo.save(item as any);
    expect(docClient.put).toHaveBeenCalledWith({
      TableName: expect.any(String),
      Item: item,
    });
  });

  it("listByInsured() debe retornar lista vacía", async () => {
    const result = await repo.listByInsured("00001");
    expect(docClient.query).toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
