/**
 * @file tests/DynamoDBService.test.ts
 * @author Gianpiero Benvenuto
 * @description Pruebas unitarias para `DynamoDBService`, que validan la inserción de ítems (`put`), la actualización de estado (`updateStatus`) y la consulta por asegurado (`listByInsured`), utilizando mocks de AWS SDK y de `logToCloudWatch`.
 */

import { DynamoDBService } from "../src/services/DynamoDBService";
import { logToCloudWatch } from "../src/utils/cloudwatchLogger";
import { Appointment } from "../src/models/Appointment";

// Mock logToCloudWatch so we don't spam CloudWatch during tests
jest.mock("../src/utils/cloudwatchLogger", () => ({
  logToCloudWatch: jest.fn().mockResolvedValue(undefined),
}));

// Prepare mocks for DynamoDB.DocumentClient methods
const putMock = jest.fn().mockReturnValue({ promise: () => Promise.resolve() });
const updateMock = jest
  .fn()
  .mockReturnValue({ promise: () => Promise.resolve() });
const queryMock = jest.fn().mockReturnValue({
  promise: () =>
    Promise.resolve({
      Items: [
        {
          appointmentId: "appt-1",
          insuredId: "12345",
          scheduleId: 10,
          countryISO: "PE",
          status: "pending",
          createdAt: "2025-01-01T00:00:00Z",
        },
      ],
    }),
});

// When aws-sdk is imported, replace DynamoDB.DocumentClient with our stub
jest.mock("aws-sdk", () => ({
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      put: putMock,
      update: updateMock,
      query: queryMock,
    })),
  },
}));

describe("DynamoDBService", () => {
  let svc: DynamoDBService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.APPOINTMENTS_TABLE = "test-table";
    svc = new DynamoDBService();
  });

  it("put() should write the item and return it", async () => {
    const item: Appointment = {
      appointmentId: "appt-123",
      insuredId: "12345",
      scheduleId: {
        scheduleId: 100,
        centerId: 1,
        specialtyId: 2,
        medicId: 3,
        date: "2025-01-01T10:00:00Z",
      },
      countryISO: "CL",
      status: "pending",
      createdAt: "2025-01-01T00:00:00Z",
    };

    const result = await svc.put(item);

    // Should return the same object
    expect(result).toEqual(item);

    // Should call put with correct parameters
    expect(putMock).toHaveBeenCalledWith({
      TableName: "test-table",
      Item: item,
    });

    // Should log before and after
    expect(logToCloudWatch).toHaveBeenCalledWith(
      `PutItem en DynamoDB: appointmentId=${item.appointmentId}`,
      "INFO"
    );
    expect(logToCloudWatch).toHaveBeenCalledWith(
      `Item insertado exitosamente: appointmentId=${item.appointmentId}`,
      "INFO"
    );
  });

  it("updateStatus() should update only status and updatedAt", async () => {
    const apptId = "appt-456";
    await svc.updateStatus(apptId, "completed");

    // Should call update with correct key and expressions
    expect(updateMock).toHaveBeenCalledWith({
      TableName: "test-table",
      Key: { appointmentId: apptId },
      UpdateExpression: "SET #s = :status, updatedAt = :now",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: expect.objectContaining({
        ":status": "completed",
        ":now": expect.any(String),
      }),
    });

    // Should log before and after
    expect(logToCloudWatch).toHaveBeenCalledWith(
      `UpdateItem en DynamoDB: appointmentId=${apptId}, status=completed`,
      "INFO"
    );
    expect(logToCloudWatch).toHaveBeenCalledWith(
      `Estado actualizado exitosamente: appointmentId=${apptId}`,
      "INFO"
    );
  });

  it("listByInsured() should query the GSI and return items", async () => {
    const insuredId = "12345";
    const items = await svc.listByInsured(insuredId);

    // Should return the items from the mock
    expect(items).toEqual([
      {
        appointmentId: "appt-1",
        insuredId: "12345",
        scheduleId: 10,
        countryISO: "PE",
        status: "pending",
        createdAt: "2025-01-01T00:00:00Z",
      },
    ]);

    // Should call query with correct parameters
    expect(queryMock).toHaveBeenCalledWith({
      TableName: "test-table",
      IndexName: "InsuredIndex",
      KeyConditionExpression: "insuredId = :id",
      ExpressionAttributeValues: { ":id": insuredId },
    });

    // Should log before and after
    expect(logToCloudWatch).toHaveBeenCalledWith(
      `Query DynamoDB por insuredId=${insuredId}`,
      "INFO"
    );
    expect(logToCloudWatch).toHaveBeenCalledWith(
      `Query completado: found=${items.length} para insuredId=${insuredId}`,
      "INFO"
    );
  });
});
