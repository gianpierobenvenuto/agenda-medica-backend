/**
 * @file tests/RDSService.test.ts
 * @author Gianpiero Benvenuto
 * @description Pruebas unitarias para `RDSService`, que verifican la obtención de credenciales vía SecretsManager, la inicialización del pool de conexiones y la ejecución de los métodos `insertAppointment` (INSERT en la tabla PE) y `updateStatus` (UPDATE en la tabla CL), usando mocks de AWS SDK y mysql2.
 */

import RDSService from "../src/services/RDSService";
import { SecretsManager } from "aws-sdk";
import mysql from "mysql2/promise";

jest.mock("../src/utils/cloudwatchLogger", () => ({
  logToCloudWatch: jest.fn().mockResolvedValue(undefined),
}));

const getSecretValueMock = jest.fn().mockReturnValue({
  promise: () =>
    Promise.resolve({
      SecretString: JSON.stringify({
        host: "test-host",
        port: 3306,
        username: "user",
        password: "pass",
      }),
    }),
});
jest.mock("aws-sdk", () => ({
  SecretsManager: jest.fn().mockImplementation(() => ({
    getSecretValue: getSecretValueMock,
  })),
}));

describe("RDSService", () => {
  const executeMock = jest.fn().mockResolvedValue([]);
  let createPoolSpy: jest.SpyInstance;

  beforeAll(() => {
    // Spy on mysql.createPool to return an object with execute method
    createPoolSpy = jest
      .spyOn(mysql, "createPool")
      .mockImplementation(() => ({ execute: executeMock } as any));
    process.env.RDS_SECRET_ARN = "arn:secret";
    process.env.RDS_DATABASE_PE = "db_pe";
    process.env.RDS_DATABASE_CL = "db_cl";
    process.env.RDS_HOST = "fallback-host";
    process.env.RDS_PORT = "3306";
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should initialize pool and insertAppointment into PE table", async () => {
    const svc = new RDSService();
    const payload = {
      appointmentId: "apt-1",
      insuredId: "ins-1",
      scheduleId: 123,
      countryISO: "PE",
      status: "pending" as const,
      createdAt: "2025-01-01T00:00:00Z",
    };

    await svc.insertAppointment(payload);

    // SecretsManager called once
    expect(SecretsManager).toHaveBeenCalled();
    expect(getSecretValueMock).toHaveBeenCalledWith({
      SecretId: "arn:secret",
    });

    // Pool created with parsed credentials
    expect(createPoolSpy).toHaveBeenCalledWith({
      host: "test-host",
      port: 3306,
      user: "user",
      password: "pass",
      database: "db_pe",
      waitForConnections: true,
      connectionLimit: 5,
    });

    // execute called with correct SQL and params
    expect(executeMock).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO `appointments_pe`"),
      [
        payload.appointmentId,
        payload.insuredId,
        JSON.stringify(payload.scheduleId),
        payload.countryISO,
        payload.status,
        payload.createdAt,
      ]
    );
  });

  it("should updateStatus by appointment_id in CL table", async () => {
    const svc = new RDSService();
    await svc.updateStatus("apt-2", "completed", "CL");

    expect(executeMock).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE `appointments_cl`"),
      ["completed", "apt-2"]
    );
  });
});
