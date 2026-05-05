import sql from "mssql";

const config: sql.config = {
  server: process.env.MSSQL_HOST || "bigshare.tr",
  port: parseInt(process.env.MSSQL_PORT || "8000"),
  user: process.env.MSSQL_USER || "bilgehan",
  password: process.env.MSSQL_PASSWORD,
  database: process.env.MSSQL_DATABASE || "bigshare",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

export const pool = new sql.ConnectionPool(config);
export const poolConnect = pool.connect();

pool.on("error", (err) => {
  console.error("MSSQL pool error:", err);
});

export { sql };
