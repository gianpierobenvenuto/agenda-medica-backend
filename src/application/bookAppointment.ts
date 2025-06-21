import { DynamoRepository } from "../infrastructure/DynamoRepository";
import { Appointment } from "../domain/Appointment";
import { v4 as uuid } from "uuid";

export class BookAppointment {
  constructor(private repo: DynamoRepository) {}
  async execute(
    insuredId: string,
    scheduleId: number,
    countryISO: "PE" | "CL"
  ) {
    const appointment: Appointment = {
      appointmentId: uuid(),
      insuredId,
      scheduleId,
      countryISO,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    await this.repo.save(appointment);
    return appointment;
  }
}
