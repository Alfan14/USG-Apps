import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

const R2_ENDPOINT = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

let _client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _client;
}

/**
 * Uploads a local file to Cloudflare R2.
 * @param localPath - Absolute path to the local file.
 * @param key - The object key (filename) inside the R2 bucket.
 * @returns The public URL of the uploaded object.
 */
export async function uploadToR2(localPath: string, key: string): Promise<string> {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME!;

  const fileStream = fs.createReadStream(localPath);
  const fileSize = fs.statSync(localPath).size;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileStream,
      ContentLength: fileSize,
      ContentType: "video/mp4",
    })
  );

  // Construct URL — use public URL if configured, otherwise use R2 endpoint
  const baseUrl = process.env.R2_PUBLIC_URL
    ? process.env.R2_PUBLIC_URL.replace(/\/$/, "")
    : `${R2_ENDPOINT}/${bucket}`;

  return `${baseUrl}/${key}`;
}
