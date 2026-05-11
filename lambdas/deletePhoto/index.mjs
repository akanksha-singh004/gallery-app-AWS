import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

const s3 = new S3Client({});
const ddb = new DynamoDBClient({});

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.jwt.claims.sub;
    const photoId = decodeURIComponent(event.pathParameters.photoId);

    // Verify the photo belongs to the user
    if (!photoId.startsWith(`${userId}/`)) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // Delete from originals bucket
    await s3.send(new DeleteObjectCommand({ 
      Bucket: process.env.ORIGINALS_BUCKET, 
      Key: photoId 
    }));
    
    // Delete from thumbs bucket (in the thumbnails/ folder)
    await s3.send(new DeleteObjectCommand({ 
      Bucket: process.env.THUMBS_BUCKET, 
      Key: `thumbnails/${photoId}` 
    }));
    
    // Delete metadata from DynamoDB
    await ddb.send(new DeleteItemCommand({
      TableName: process.env.TABLE,
      Key: { 
        userId: { S: userId }, 
        photoId: { S: photoId } 
      }
    }));
    
    return { 
      statusCode: 200, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }) 
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
