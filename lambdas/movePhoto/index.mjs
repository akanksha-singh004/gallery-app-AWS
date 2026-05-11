import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const ddb = new DynamoDBClient({});

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.jwt.claims.sub;
    const { photoId, folder } = JSON.parse(event.body || '{}');

    // Verify ownership
    if (!photoId.startsWith(`${userId}/`)) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    await ddb.send(new UpdateItemCommand({
      TableName: process.env.TABLE,
      Key: { 
        userId: { S: userId }, 
        photoId: { S: photoId } 
      },
      UpdateExpression: 'SET folderName = :f',
      ExpressionAttributeValues: {
        ':f': { S: folder }
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
