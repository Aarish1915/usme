const twilio = require('twilio');
const { twilioAccountSid, twilioAuthToken, twilioPhoneNumber } = require('../config');

// Initialize Twilio client only if credentials are provided
const client = (twilioAccountSid && twilioAuthToken) ? twilio(twilioAccountSid, twilioAuthToken) : null;

async function sendSms(to, body) {
    if (!client) {
        console.warn('\n[WARNING] Twilio credentials missing in .env. SMS simulated:');
        console.log(`[DEV SMS to ${to}]:\n${body}\n`);
        return true;
    }
    
    try {
        const message = await client.messages.create({
            body: body,
            from: twilioPhoneNumber,
            to: to.startsWith('+') ? to : '+91' + to // Defaulting to +91 (India) if no country code provided
        });
        console.log(`SMS sent to ${to}, SID: ${message.sid}`);
        return message;
    } catch (error) {
        console.error('Error sending SMS via Twilio:', error.message);
        return false;
    }
}

module.exports = { sendSms };
