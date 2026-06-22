// S3 presign helpers
module.exports = {};
const AWS = require('aws-sdk');
const { s3Bucket, awsRegion, awsAccessKey, awsSecretKey, awsEndpoint } = require('../config');

const s3 = new AWS.S3({
    region: awsRegion,
    endpoint: awsEndpoint ? new AWS.Endpoint(awsEndpoint) : undefined,
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretKey,
    s3ForcePathStyle: true, // Required for Supabase S3
    signatureVersion: 'v4'
});

function presignPut(key, expires = 300) {
    return s3.getSignedUrlPromise('putObject', {
        Bucket: s3Bucket,
        Key: key,
        Expires: expires,
        ACL: 'private'
    });
}

function presignGet(key, expires = 300) {
    return s3.getSignedUrlPromise('getObject', {
        Bucket: s3Bucket,
        Key: key,
        Expires: expires
    });
}

module.exports = { s3, presignPut, presignGet };
