import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({});
const BUCKET = process.env.ORIGINALS_BUCKET;

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.jwt.claims.sub;
    const photoId = decodeURIComponent(event.pathParameters.photoId);

    // Verify the user is only requesting their own photo
    if (!photoId.startsWith(`${userId}/`)) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: photoId });
    // URL valid for 1 hour to allow the user to view/download the original image
    const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
