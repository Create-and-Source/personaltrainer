import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ok, error } from '../shared/response.mjs';
import { getTrainerId } from '../shared/auth.mjs';

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-west-2' });
const BUCKET = process.env.S3_BUCKET || 'forge-pt-uploads';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return ok({});

  const trainerId = getTrainerId(event);
  const method = event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    if (method === 'POST') {
      const { fileName, contentType, folder } = body;

      if (!fileName || !contentType) {
        return error(400, 'fileName and contentType are required');
      }

      // Build S3 key: trainerId/folder/timestamp-filename
      const safeFolder = folder || 'general';
      const timestamp = Date.now();
      const key = `${trainerId}/${safeFolder}/${timestamp}-${fileName}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

      return ok({
        uploadUrl,
        key,
        publicUrl: `https://${BUCKET}.s3.amazonaws.com/${key}`,
      });
    }

    return error(400, 'Invalid request — use POST with fileName and contentType');
  } catch (err) {
    console.error(err);
    return error(500, err.message);
  }
}
