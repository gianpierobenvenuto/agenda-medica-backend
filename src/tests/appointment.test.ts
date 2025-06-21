import { handler } from "../presentation/appointment";
import { SNS } from "aws-sdk";
import { DynamoRepository } from "../infrastructure/DynamoRepository";

// Mocks
jest.mock("aws-sdk", () => ({
  SNS: jest.fn().mockImplementation(() => ({
    publish: jest.fn().mockReturnThis(),
    promise: jest.fn().mockResolvedValue({}),
  })),
}));
jest.mock("../infrastructure/DynamoRepository");

describe("appointment handler", () => {
  const saveMock = jest.fn().mockResolvedValue(undefined);

  beforeAll(() => {
    // Mock del repositorio para usar saveMock
    (DynamoRepository as jest.Mock).mockImplementation(() => ({
      save: saveMock,
    }));
  });

  it("debe crear un appointment y publicarlo en SNS", async () => {
    // Evento simulado (cast a any para evitar errores de tipo)
    const event = {
      body: JSON.stringify({
        insuredId: "00001",
        scheduleId: 100,
        countryISO: "PE",
      }),
    } as any;

    // Ejecutar handler
    const result = await handler(event);

    // Cast a any para acceder a statusCode y body sin errores de tipos
    const response = result as any;
    expect(response.statusCode).toBe(200);

    const appointment = JSON.parse(response.body);
    expect(appointment.insuredId).toBe("00001");
    expect(appointment.status).toBe("pending");

    // Verificar llamadas
    expect(saveMock).toHaveBeenCalled();
    const publishMock = new SNS().publish as jest.Mock;
    expect(publishMock).toHaveBeenCalled();
  });
});
