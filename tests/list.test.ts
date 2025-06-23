/**
 * @file tests/list.test.ts
 * @author Gianpiero Benvenuto
 * @description Pruebas unitarias para el caso de uso `ListAppointments`, que verifican la devolución de citas por asegurado y el manejo de errores, usando mocks de `DynamoDBService` y registros en CloudWatch.
 */

import { ListAppointments } from "../src/usecases/ListAppointments";
import * as DynamoDBMod from "../src/services/DynamoDBService";
import { Appointment } from "../src/models/Appointment";
import { logToCloudWatch } from "../src/utils/cloudwatchLogger";

jest.mock("../src/utils/cloudwatchLogger", () => ({
  logToCloudWatch: jest.fn().mockResolvedValue(undefined),
}));

describe("ListAppointments Use Case", () => {
  const fakeAppointments: Appointment[] = [
    {
      appointmentId: "id-1",
      insuredId: "123",
      scheduleId: 42,
      countryISO: "PE",
      status: "pending",
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest
      .spyOn(DynamoDBMod.DynamoDBService.prototype, "listByInsured")
      .mockResolvedValue(fakeAppointments);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return an array of appointments for a given insuredId", async () => {
    const uc = new ListAppointments();
    const result = await uc.execute("123");

    expect(result).toBe(fakeAppointments);
    expect(
      DynamoDBMod.DynamoDBService.prototype.listByInsured
    ).toHaveBeenCalledWith("123");
    expect(logToCloudWatch).toHaveBeenCalledWith(
      "Ejecutando ListAppointments para insuredId=123",
      "INFO"
    );
    expect(logToCloudWatch).toHaveBeenCalledWith(
      `ListAppointments completado: found=${fakeAppointments.length} para insuredId=123`,
      "INFO"
    );
  });

  it("should throw if underlying service errors", async () => {
    const errorMessage = "DDB failure";
    jest
      .spyOn(DynamoDBMod.DynamoDBService.prototype, "listByInsured")
      .mockRejectedValue(new Error(errorMessage));

    const uc = new ListAppointments();
    await expect(uc.execute("123")).rejects.toThrow(
      `ListAppointments failed: ${errorMessage}`
    );
    expect(logToCloudWatch).toHaveBeenCalledWith(
      `Error en ListAppointments: ${errorMessage}`,
      "ERROR"
    );
  });
});
