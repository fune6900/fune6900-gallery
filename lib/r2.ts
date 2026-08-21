import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Cloudflare R2 は S3 互換なので AWS SDK で扱える。
// endpoint に R2 のエンドポイントを指定するのがポイント。
export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!, // 例: https://<accountid>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;
const PUBLIC_BASE = process.env.R2_PUBLIC_BASE_URL!; // 例: https://xxxx.r2.dev または独自ドメイン

// ファイルをR2にアップして、公開URLを返す
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  // 公開バケットのURLを組み立てて返す
  return `${PUBLIC_BASE}/${key}`;
}
