/**
 * @file tests/SNSService.test.ts
 * @author Gianpiero Benvenuto
 * @description Pruebas unitarias para `SNSService`, que verifican la publicación de notificaciones en AWS SNS según el `countryISO` (PE y CL) usando mocks de `logToCloudWatch` y del cliente de AWS SDK.
 */

import { SNSService } from "../src/services/SNSService";
import { ScheduleKey } from "../src/models/Appointment";

// Mock global de logToCloudWatch para evitar llamadas reales
jest.mock("../src/utils/cloudwatchLogger", () => ({
  logToCloudWatch: jest.fn().mockResolvedValue(undefined),
}));

// Mock de AWS SDK SNS.publish
const publishMock = jest
  .fn()
  .mockReturnValue({ promise: () => Promise.resolve() });

jest.mock("aws-sdk", () => ({
  SNS: jest.fn(() => ({ publish: publishMock })),
}));

describe("SNSService", () => {
  const OLD_ENV = process.env;

  beforeAll(() => {
    // Configurar ARNs de SNS antes de instanciar el servicio
    process.env = {
      ...OLD_ENV,
      SNS_PE_ARN: "arn:aws:sns:us-east-1:123456789012:appointments-pe-topic",
      SNS_CL_ARN: "arn:aws:sns:us-east-1:123456789012:appointments-cl-topic",
    };
  });

  afterAll(() => {
    // Restaurar ambiente
    process.env = OLD_ENV;
    jest.resetAllMocks();
  });

  beforeEach(() => {
    publishMock.mockClear();
  });

  it('publish() con countryISO="PE" debe usar SNS_PE_ARN y payload completo', async () => {
    const svc = new SNSService();
    const payload = {
      appointmentId: "apt-001",
      insuredId: "ins-001",
      scheduleId: 42,
      countryISO: "PE" as const,
      status: "pending" as const,
      createdAt: "2025-06-23T10:00:00Z",
    };

    await expect(svc.publish(payload)).resolves.toBeUndefined();

    expect(publishMock).toHaveBeenCalledWith({
      TopicArn: process.env.SNS_PE_ARN,
      Message: JSON.stringify(payload),
    });
  });

  it('publish() con countryISO="CL" debe usar SNS_CL_ARN y payload completo con objeto scheduleId', async () => {
    const svc = new SNSService();
    const scheduleObj: ScheduleKey = {
      scheduleId: 100,
      centerId: 1,
      specialtyId: 2,
      medicId: 3,
      date: "2025-07-01T12:00:00Z",
    };
    const payload = {
      appointmentId: "apt-002",
      insuredId: "ins-002",
      scheduleId: scheduleObj,
      countryISO: "CL" as const,
      status: "completed" as const,
      createdAt: "2025-06-24T15:30:00Z",
    };

    await expect(svc.publish(payload)).resolves.toBeUndefined();

    expect(publishMock).toHaveBeenCalledWith({
      TopicArn: process.env.SNS_CL_ARN,
      Message: JSON.stringify(payload),
    });
  });
});
