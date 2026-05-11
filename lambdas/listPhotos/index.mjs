import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';

const ddb = new DynamoDBClient({});

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.jwt.claims.sub;
    const sortBy = event.queryStringParameters?.sortBy || 'uploadedAt';
    const folder = event.queryStringParameters?.folder;
    
    // Determine which GSI to query based on sort preference
    const indexName = sortBy === 'size' ? 'bySize' : 'byUploadedAt';

    const params = {
      TableName: process.env.TABLE,
      IndexName: indexName,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': { S: userId } },
      ScanIndexForward: false
    };

    if (folder) {
      params.FilterExpression = 'folderName = :f';
      params.ExpressionAttributeValues[':f'] = { S: folder };
    }

    const result = await ddb.send(new QueryCommand(params));

    const photos = result.Items.map(i => ({
      photoId:    i.photoId.S,
      caption:    i.caption?.S || '',
      size:       Number(i.size?.N || 0),
      width:      Number(i.width?.N || 0),
      height:     Number(i.height?.N || 0),
      uploadedAt: Number(i.uploadedAt?.N || 0),
      // Direct link to S3 thumbnails
      thumbUrl:   `https://gallery-deploy-bucket-akanksha.s3.eu-north-1.amazonaws.com/thumbnails/${i.photoId.S}`
    }));

    return { 
      statusCode: 200, 
      headers: { 
        'Content-Type': 'application/json',
        'X-Build-Id': '2026-05-11-FINAL-V3'
      },
      body: JSON.stringify(photos) 
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
