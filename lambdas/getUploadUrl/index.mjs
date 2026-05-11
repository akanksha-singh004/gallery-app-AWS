import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({});
const BUCKET = process.env.ORIGINALS_BUCKET;

export const handler = async (event) => {
  try {
    const { fileName, contentType } = JSON.parse(event.body || '{}');
    const userId = event.requestContext.authorizer.jwt.claims.sub;
    
    // Create a unique key for the photo inside a folder named after the user's ID
    const key = `${userId}/${Date.now()}-${fileName}`;
    
    const cmd = new PutObjectCommand({ 
      Bucket: BUCKET, 
      Key: key, 
      ContentType: contentType 
    });
    
    // Generate a pre-signed URL valid for 5 minutes
    const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, key })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
