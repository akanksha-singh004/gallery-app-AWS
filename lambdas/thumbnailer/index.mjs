import sharp from 'sharp';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const THUMBS = process.env.THUMBS_BUCKET;

export const handler = async (event) => {
  for (const rec of event.Records) {
    try {
      const srcBucket = rec.s3.bucket.name;
      const key = decodeURIComponent(rec.s3.object.key.replace(/\+/g, ' '));
      
      // PREVENT LOOP: If this is already a thumbnail, ignore it!
      if (key.startsWith('thumbnails/')) {
        console.log(`Skipping thumbnail: ${key}`);
        continue;
      }
      
      console.log(`Processing: s3://${srcBucket}/${key}`);
      
      // Fetch the original image
      let obj;
      try {
        obj = await s3.send(new GetObjectCommand({ Bucket: srcBucket, Key: key }));
        console.log(`Successfully fetched original image: ${key}`);
      } catch (e) {
        console.error(`ERROR fetching original: ${e.message}`);
        throw e;
      }

      const buf = await obj.Body.transformToByteArray();
      
      // Generate thumbnail
      const image = sharp(buf).resize({ width: 800, withoutEnlargement: true });
      const contentType = key.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      
      const out = key.toLowerCase().endsWith('.png') 
        ? await image.png({ palette: true }).toBuffer() 
        : await image.jpeg({ quality: 85 }).toBuffer();
      
      console.log(`Thumbnail generated in memory for: ${key}`);
        
      // Upload thumbnail
      await s3.send(new PutObjectCommand({
        Bucket: THUMBS, 
        Key: `thumbnails/${key}`, 
        Body: out,
        ContentType: contentType
      }));
      
      console.log(`SUCCESS: Thumbnail uploaded to thumbnails/${key}`);
    } catch (err) {
      console.error(`Failed processing record:`, err);
    }
  }
  
  return { statusCode: 200 };
};
