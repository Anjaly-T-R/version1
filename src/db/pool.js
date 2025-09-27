import pkg from 'pg';
import { getParam } from '../config/paramStore.js';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
const { Pool } = pkg;

let pool;

async function initPool() {
  if (!pool) {
    // fetch DB_NAME from Parameter Store 
    const dbName = await getParam("/group40/db-name");
    const client = new SecretsManagerClient({ region: "ap-southeast-2" });
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: "group40/postgres-credentials", 
      })
    );
    const secret = JSON.parse(response.SecretString);


    pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      user: secret.DB_USER,
      password: secret.DB_PASSWORD,
      database: dbName,  
      max: 5,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function getConn() {
  const db = await initPool();
  return db.connect();
}
export { pool };


