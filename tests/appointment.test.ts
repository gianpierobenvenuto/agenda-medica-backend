/**
 * @file tests/appointment.test.ts
 * @author Gianpiero Benvenuto
 * @description Pruebas unitarias para el handler de `/appointments`: verifica el comportamiento en POST (creación exitosa y error por countryISO inválido), GET (listado de citas) y métodos no permitidos (405), usando mocks de `RegisterAppointment`, `ListAppointments` y `logToCloudWatch`.
 */

import { handler } from "../src/handlers/appointment";
import { RegisterAppointment } from "../src/usecases/RegisterAppointment";
import { ListAppointments } from "../src/usecases/ListAppointments";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

// Silenciar logs de CloudWatch y errores en consola durante los tests
jest.mock("../src/utils/cloudwatchLogger", () => ({
  logToCloudWatch: jest.fn().mockResolvedValue(undefined),
}));
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

// Mock de los use cases
jest.mock("../src/usecases/RegisterAppointment");
jest.mock("../src/usecases/ListAppointments");

const mockRegister =
  RegisterAppointment.prototype as jest.Mocked<RegisterAppointment>;
const mockList = ListAppointments.prototype as jest.Mocked<ListAppointments>;

describe("appointment handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /appointments → 201 + body", async () => {
    const fake = {
      appointmentId: "aaa",
      insuredId: "123",
      scheduleId: 1,
      countryISO: "PE",
      status: "pending",
      createdAt: "2025-06-22T00:00:00.000Z",
    };
    mockRegister.execute = jest.fn().mockResolvedValue(fake);

    const event = {
      httpMethod: "POST",
      body: JSON.stringify({
        insuredId: "123",
        scheduleId: 1,
        countryISO: "PE",
      }),
    } as unknown as APIGatewayProxyEvent;

    // El handler devuelve void | APIGatewayProxyResult, así que casteamos
    const result = (await handler(
      event,
      {} as any,
      () => {}
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body)).toEqual(fake);
    expect(mockRegister.execute).toHaveBeenCalledWith({
      insuredId: "123",
      scheduleId: 1,
      countryISO: "PE",
    });
  });

  it("POST /appointments with bad ISO → 400", async () => {
    mockRegister.execute = jest
      .fn()
      .mockRejectedValue(new Error("Invalid countryISO: XX"));

    const event = {
      httpMethod: "POST",
      body: JSON.stringify({
        insuredId: "123",
        scheduleId: 1,
        countryISO: "XX",
      }),
    } as unknown as APIGatewayProxyEvent;

    const result = (await handler(
      event,
      {} as any,
      () => {}
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: "Invalid countryISO: XX",
    });
  });

  it("GET /appointments/{insuredId} → 200 + list", async () => {
    const items = [
      {
        appointmentId: "a1",
        insuredId: "123",
        scheduleId: 1,
        countryISO: "CL",
        status: "pending",
        createdAt: "2025-06-22T00:00:00.000Z",
      },
    ];
    mockList.execute = jest.fn().mockResolvedValue(items);

    const event = {
      httpMethod: "GET",
      pathParameters: { insuredId: "123" },
    } as unknown as APIGatewayProxyEvent;

    const result = (await handler(
      event,
      {} as any,
      () => {}
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(items);
    expect(mockList.execute).toHaveBeenCalledWith("123");
  });

  it("other HTTP methods → 405", async () => {
    const event = { httpMethod: "PUT" } as unknown as APIGatewayProxyEvent;
    const result = (await handler(
      event,
      {} as any,
      () => {}
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(405);
    expect(JSON.parse(result.body)).toEqual({ error: "Method not allowed" });
  });
});
