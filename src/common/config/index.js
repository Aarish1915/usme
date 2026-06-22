require('dotenv').config();
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [new winston.transports.Console()]
});

module.exports = {
    port: process.env.PORT || 3001,
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
    databaseUrl: process.env.DATABASE_URL,
    s3Bucket: process.env.S3_BUCKET,
    awsRegion: process.env.AWS_REGION,
    awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
    awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsEndpoint: process.env.AWS_ENDPOINT,
    redisUrl: process.env.REDIS_URL,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
    logger
};
