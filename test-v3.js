const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
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
        const command = new ListBucketsCommand({});
        const response = await client.send(command);
        console.log("Buckets found in your Supabase:", response.Buckets.map(b => b.Name));
    } catch (err) {
        console.error("V3 Error:", err.message, err.name);
    }
}
run();
