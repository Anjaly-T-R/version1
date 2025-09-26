import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

async function test() {
  try {
    const result = await s3.send(new ListBucketsCommand({}));
    console.log("✅ Connected to S3:", result.Buckets.map(b => b.Name));
  } catch (err) {
    console.error("❌ S3 test failed:", err);
  }
}

test();
