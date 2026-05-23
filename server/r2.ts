import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const requiredVars = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
] as const;

function getConfig() {
  const missing = requiredVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing R2 environment variables: ${missing.join(", ")}`);
  }
  return {
    accountId: process.env.R2_ACCOUNT_ID!,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    bucket: process.env.R2_BUCKET_NAME!,
    publicUrl: process.env.R2_PUBLIC_URL!.replace(/\/+$/, ""),
  };
}

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    const cfg = getConfig();
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    });
  }
  return _client;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateImage(mimetype: string, size: number): string | null {
  if (!ALLOWED_MIME_TYPES.has(mimetype)) {
    return `Unsupported file type: ${mimetype}. Allowed: image/jpeg, image/png, image/webp, image/gif`;
  }
  if (size > MAX_FILE_SIZE) {
    return `File too large: ${(size / 1024 / 1024).toFixed(1)}MB. Maximum: 5MB`;
  }
  return null;
}

export async function uploadImage(
  buffer: Buffer,
  mimetype: string,
  fileName?: string,
): Promise<UploadResult> {
  try {
    const cfg = getConfig();
    const ext = mimetype.split("/")[1] || "jpg";
    const key = fileName || `uploads/${crypto.randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    });

    await getClient().send(command);

    return {
      success: true,
      url: `${cfg.publicUrl}/${key}`,
      key,
    };
  } catch (error: any) {
    console.error("R2 upload error:", error);
    return {
      success: false,
      error: error.message || "Upload failed",
    };
  }
}

export function isR2Configured(): boolean {
  try {
    getConfig();
    return true;
  } catch {
    return false;
  }
}

const DATA_URI_PREFIX = "data:image/";

export function isBase64Image(url: string): boolean {
  return url.startsWith(DATA_URI_PREFIX);
}

export function isLegacyImage(url: string): boolean {
  return url.startsWith(DATA_URI_PREFIX);
}

export function isR2Image(url: string): boolean {
  return url.startsWith("http") && !url.startsWith(DATA_URI_PREFIX);
}

/**
 * Takes image URLs from the request body and uploads any base64 data URIs to R2.
 * HTTP URLs (existing R2 or external images) are returned unchanged.
 * Falls back gracefully if R2 isn't configured.
 */
export async function processImages(urls: string[]): Promise<string[]> {
  const results: string[] = [];
  for (const url of urls) {
    if (url.startsWith("http") && !url.startsWith(DATA_URI_PREFIX)) {
      results.push(url);
    } else if (url.startsWith(DATA_URI_PREFIX)) {
      if (!isR2Configured()) {
        results.push(url);
        continue;
      }
      const match = url.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) {
        results.push(url);
        continue;
      }
      const mimetype = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, "base64");
      const uploadResult = await uploadImage(buffer, mimetype);
      if (uploadResult.success && uploadResult.url) {
        results.push(uploadResult.url);
      } else {
        results.push(url);
      }
    } else {
      results.push(url);
    }
  }
  return results;
}
