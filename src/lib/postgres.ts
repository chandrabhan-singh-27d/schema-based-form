import { Pool } from "pg";

declare global {
  var __schemaFormPgPool: Pool | undefined;
}

const createPool = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it in .env.local.");
  }

  return new Pool({
    connectionString,
  });
};

export const getPostgresPool = () => {
  if (!global.__schemaFormPgPool) {
    global.__schemaFormPgPool = createPool();
  }

  return global.__schemaFormPgPool;
};

