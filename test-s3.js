const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
    region: 'us-east-1',
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
});

const params = {
    Bucket: process.env.S3_BUCKET,
    Key: 'test-file.txt',
    Body: 'Hello World from Supabase S3!'
};

s3.putObject(params, (err, data) => {
    if (err) console.error("Upload Error:", err.message, err.code);
    else console.log("Success! Uploaded test file:", data);
});
