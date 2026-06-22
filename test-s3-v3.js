const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const client = new S3Client({
    forcePathStyle: true,
    region: 'us-east-1',
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function run() {
    try {
        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET.toLowerCase(),
            Key: 'test-v3.txt',
            Body: 'Hello World from SDK v3'
        });
        const response = await client.send(command);
        console.log("Success v3!", response);
    } catch (err) {
        console.error("V3 Error:", err.message);
    }
}
run();
