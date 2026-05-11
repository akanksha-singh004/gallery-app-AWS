import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const ddb = new DynamoDBClient({});

export const handler = async (event) => {
  try {
    const { key, caption, size, width, height, folder } = JSON.parse(event.body || '{}');
    const userId = event.requestContext.authorizer.jwt.claims.sub;
    
    const item = {
      userId:     { S: userId },
      photoId:    { S: key },
      caption:    { S: caption || '' },
      size:       { N: String(size || 0) },
      width:      { N: String(width || 0) },
      height:     { N: String(height || 0) },
      uploadedAt: { N: String(Date.now()) },
      folderName: { S: folder || '' }
    };
    
    await ddb.send(new PutItemCommand({ 
      TableName: process.env.TABLE, 
      Item: item 
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
