/**
 * @file tests/EventBridgeService.test.ts
 * @author Gianpiero Benvenuto
 * @description Pruebas unitarias para `EventBridgeService`, que verifican la publicación de eventos `AppointmentCreated` y `AppointmentCompleted` en EventBridge usando mocks de AWS SDK.
 */

import {
  EventBridgeService,
  AppointmentEvent,
} from "../src/services/EventBridgeService";
import { EventBridge } from "aws-sdk";

// Mock aws-sdk's EventBridge client
const putEventsMock = jest.fn().mockReturnValue({
  promise: () => Promise.resolve({ FailedEntryCount: 0, Entries: [] }),
});

jest.mock("aws-sdk", () => ({
  EventBridge: jest.fn(() => ({
    putEvents: putEventsMock,
  })),
}));

describe("EventBridgeService", () => {
  const OLD_ENV = process.env;

  beforeAll(() => {
    // Set the bus name env var
    process.env.EVENT_BUS_NAME = "test-bus";
  });

  afterAll(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleEvent: AppointmentEvent = {
    appointmentId: "appt-123",
    insuredId: "user-456",
    scheduleId: 42,
    countryISO: "PE",
    status: "pending",
    createdAt: "2025-06-22T00:00:00Z",
  };

  it("publishCreated() should call putEvents with AppointmentCreated detail", async () => {
    const svc = new EventBridgeService();
    await expect(svc.publishCreated(sampleEvent)).resolves.toBeUndefined();

    expect(EventBridge).toHaveBeenCalledTimes(1);
    expect(putEventsMock).toHaveBeenCalledWith({
      Entries: [
        {
          EventBusName: "test-bus",
          Source: "appointments.pe",
          DetailType: "AppointmentCreated",
          Detail: JSON.stringify(sampleEvent),
        },
      ],
    });
  });

  it("publishCompleted() should call putEvents with AppointmentCompleted detail", async () => {
    const svc = new EventBridgeService();
    await expect(svc.publishCompleted(sampleEvent)).resolves.toBeUndefined();

    expect(putEventsMock).toHaveBeenCalledWith({
      Entries: [
        {
          EventBusName: "test-bus",
          Source: "appointments.pe",
          DetailType: "AppointmentCompleted",
          Detail: JSON.stringify(sampleEvent),
        },
      ],
    });
  });
});
