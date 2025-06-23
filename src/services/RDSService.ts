/**
 * @file src/services/RDSService.ts
 * @author Gianpiero Benvenuto
 * @description Gestiona pools de conexión a RDS (MySQL) usando credenciales de SecretsManager, e implementa métodos para insertar citas y actualizar su estado en la tabla correspondiente según el país, registrando cada operación en CloudWatch.
 */

import { SecretsManager } from "aws-sdk";
import mysql from "mysql2/promise";
import { logToCloudWatch } from "../utils/cloudwatchLogger";

type PoolMap = Record<string, Promise<mysql.Pool>>;
const pools: PoolMap = {};

/**
 * Crea un pool de conexiones a RDS para la base de datos indicada.
 */
async function createPool(database: string): Promise<mysql.Pool> {
  await logToCloudWatch(
    `Obteniendo credenciales RDS para DB=${database}`,
    "INFO"
  );
  const sm = new SecretsManager();
  const secret = await sm
    .getSecretValue({ SecretId: process.env.RDS_SECRET_ARN! })
    .promise();
  if (!secret.SecretString)
    throw new Error("RDS secret no contiene SecretString");
  const creds = JSON.parse(secret.SecretString);

  const host = creds.host || process.env.RDS_HOST!;
  const port = creds.port || Number(process.env.RDS_PORT!);
  const user = creds.username;
  const password = creds.password;

  await logToCloudWatch(
    `Inicializando pool RDS host=${host} db=${database}`,
    "INFO"
  );
  const pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 5,
  });
  await logToCloudWatch(`Pool RDS inicializado para DB=${database}`, "INFO");
  return pool;
}

export default class RDSService {
  /**
   * Devuelve (o crea) el pool para el país indicado.
   */
  private getPool(countryISO: string): Promise<mysql.Pool> {
    const dbName =
      countryISO === "CL"
        ? process.env.RDS_DATABASE_CL!
        : process.env.RDS_DATABASE_PE!;
    if (!pools[dbName]) pools[dbName] = createPool(dbName);
    return pools[dbName];
  }

  /**
   * Inserta una nueva cita en la tabla correspondiente.
   * scheduleId puede ser un número o un objeto con metadatos.
   */
  async insertAppointment(input: {
    appointmentId: string;
    insuredId: string;
    scheduleId: number | Record<string, any>;
    countryISO: string;
    status: "pending" | "completed";
    createdAt: string;
  }): Promise<void> {
    const tableName =
      input.countryISO === "CL" ? "appointments_cl" : "appointments_pe";
    const scheduleJson = JSON.stringify(input.scheduleId);

    const sql = `
      INSERT INTO \`${tableName}\`
        (appointment_id, insured_id, schedule_id, country_iso, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const pool = await this.getPool(input.countryISO);
    await logToCloudWatch(
      `INSERT RDS ${tableName}: appointmentId=${input.appointmentId}`,
      "INFO"
    );
    await pool.execute(sql, [
      input.appointmentId,
      input.insuredId,
      scheduleJson,
      input.countryISO,
      input.status,
      input.createdAt,
    ]);
    await logToCloudWatch(
      `Cita insertada en RDS tabla=${tableName}: appointmentId=${input.appointmentId}`,
      "INFO"
    );
  }

  /**
   * Actualiza el estado de una cita en la tabla correspondiente,
   * identificando la fila por appointment_id.
   */
  async updateStatus(
    appointmentId: string,
    status: "completed",
    countryISO: string
  ): Promise<void> {
    const tableName =
      countryISO === "CL" ? "appointments_cl" : "appointments_pe";
    const sql = `
      UPDATE \`${tableName}\`
         SET status = ?, updated_at = NOW()
       WHERE appointment_id = ?
    `;
    const pool = await this.getPool(countryISO);
    await logToCloudWatch(
      `UPDATE RDS ${tableName}: appointmentId=${appointmentId}, status=${status}`,
      "INFO"
    );
    await pool.execute(sql, [status, appointmentId]);
    await logToCloudWatch(
      `Estado actualizado en RDS tabla=${tableName}: appointmentId=${appointmentId}`,
      "INFO"
    );
  }
}
