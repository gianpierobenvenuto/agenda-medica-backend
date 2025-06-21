// src/infrastructure/MysqlRepository.ts

import { createPool, Pool } from "mysql2/promise";

export interface InsertResult {
  insertId: number;
}

export class MysqlRepository {
  private pool: Pool;

  constructor() {
    this.pool = createPool({
      host: process.env.MYSQL_HOST!,
      user: process.env.MYSQL_USER!,
      password: process.env.MYSQL_PASSWORD!,
      database: process.env.MYSQL_DATABASE!,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }

  /** Inserta un objeto en la tabla `appointments` y devuelve el insertId */
  async insertAppointment(payload: Record<string, any>): Promise<InsertResult> {
    const [result] = await this.pool.execute("INSERT INTO appointments SET ?", [
      payload,
    ]);
    // El resultado es un OkPacket que incluye insertId
    const ok = result as any;
    return { insertId: ok.insertId as number };
  }
}
