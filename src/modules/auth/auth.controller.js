const prisma = require('../../common/database/prismaClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../../common/config');
const { sendSms } = require('../../common/utils/twilio');

// In-memory OTP store for testing (Use Redis in production)
const otpStore = new Map();

function generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// ==========================================
// REGISTRATION
// ==========================================
async function sendOtp(req, res) {
    const { name, mobile, password, institution_name, address, established_year } = req.body;
    if (!mobile || !password || !name || !institution_name || !address || !established_year) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await prisma.users.findUnique({ where: { mobile } });
    if (existingUser) return res.status(409).json({ error: 'User with this mobile already exists' });

    const otp = generateOtp();
    otpStore.set(mobile, { otp, name, password, institution_name, address, established_year, type: 'register' });
    
    console.log(`\n=========================================\n[DEV] REGISTRATION OTP for ${mobile}: ${otp}\n=========================================\n`);
    await sendSms(mobile, `Welcome to USAME! Your registration OTP is: ${otp}`);
    return res.json({ success: true, message: 'OTP sent successfully to ' + mobile, devOtp: otp });
}

async function verifyOtpAndRegister(req, res) {
    try {
        const { mobile, otp } = req.body;
        
        const pendingData = otpStore.get(mobile);
        if (!pendingData || pendingData.type !== 'register') return res.status(400).json({ error: 'No pending registration for this mobile' });
        if (pendingData.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

        const hash = await bcrypt.hash(pendingData.password, 12);
        
        let user;
        await prisma.$transaction(async (tx) => {
            user = await tx.users.create({
                data: { 
                    name: pendingData.name,
                    mobile, 
                    password_hash: hash 
                }
            });

            // Automatically create draft application with pre-filled details
            await tx.applications.create({
                data: {
                    user_id: user.id,
                    status: 'draft',
                    current_step: 1,
                    draft_data: {
                        q1_name: pendingData.institution_name,
                        q2_address: pendingData.address,
                        q3_year: pendingData.established_year
                    }
                }
            });
        });

        otpStore.delete(mobile);

        const token = jwt.sign({ sub: user.id, role: user.role, registration_id: user.registration_id }, jwtSecret, { expiresIn: '1d' });
        res.cookie('accessToken', token, { 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return res.status(201).json({ 
            success: true, 
            message: 'Registration verified!',
            data: { token, registrationId: user.registration_id }
        });
    } catch (error) {
        console.error(error);
        if (error.code === 'P2002') return res.status(409).json({ error: 'Duplicate user' });
        return res.status(500).json({ error: String(error) });
    }
}

// ==========================================
// LOGIN (PASSWORD)
// ==========================================
async function login(req, res) {
    try {
        const { identifier, password } = req.body; // typically registration_id
        if (!identifier || !password) return res.status(400).json({ error: 'Registration ID/Mobile and password required' });

        const user = await prisma.users.findFirst({
            where: {
                OR: [
                    { mobile: identifier },
                    { registration_id: identifier }
                ]
            }
        });
        
        if (!user) return res.status(404).json({ error: 'Not registered: The provided mobile number or Registration ID does not exist.' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials: Incorrect password.' });

        const token = jwt.sign({ sub: user.id, role: user.role, registration_id: user.registration_id }, jwtSecret, { expiresIn: '1d' });
        res.cookie('accessToken', token, { 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return res.status(200).json({ 
            success: true, 
            data: { token, registrationId: user.registration_id }
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

// ==========================================
// LOGIN (OTP)
// ==========================================
async function sendLoginOtp(req, res) {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ error: 'Mobile required' });

    const user = await prisma.users.findUnique({ where: { mobile } });
    if (!user) return res.status(404).json({ error: 'User not found with this mobile number' });

    const otp = generateOtp();
    otpStore.set(mobile, { otp, type: 'login' });
    
    console.log(`\n=========================================\n[DEV] LOGIN OTP for ${mobile}: ${otp}\n=========================================\n`);
    await sendSms(mobile, `Your USAME login OTP is: ${otp}`);
    return res.json({ success: true, message: 'Login OTP sent successfully', devOtp: otp });
}

async function verifyLoginOtp(req, res) {
    try {
        const { mobile, otp } = req.body;
        
        const pendingData = otpStore.get(mobile);
        if (!pendingData || pendingData.type !== 'login') return res.status(400).json({ error: 'No pending login for this mobile' });
        if (pendingData.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

        const user = await prisma.users.findUnique({ where: { mobile } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        otpStore.delete(mobile);

        const token = jwt.sign({ sub: user.id, role: user.role, registration_id: user.registration_id }, jwtSecret, { expiresIn: '1d' });
        res.cookie('accessToken', token, { 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return res.status(200).json({ 
            success: true, 
            message: 'Login successful!',
            data: { token, registrationId: user.registration_id }
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

// ==========================================
// FORGOT PASSWORD
// ==========================================
async function forgotPasswordSendOtp(req, res) {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ error: 'Mobile required' });

    const user = await prisma.users.findUnique({ where: { mobile } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const otp = generateOtp();
    otpStore.set(mobile, { otp, type: 'reset_password' });
    
    console.log(`\n=========================================\n[DEV] RESET PASSWORD OTP for ${mobile}: ${otp}\n=========================================\n`);
    await sendSms(mobile, `Your USAME password reset OTP is: ${otp}`);
    return res.json({ success: true, message: 'Password reset OTP sent successfully', devOtp: otp });
}

async function resetPassword(req, res) {
    try {
        const { mobile, otp, newPassword } = req.body;
        if (!mobile || !otp || !newPassword) return res.status(400).json({ error: 'Mobile, OTP, and new password required' });
        
        const pendingData = otpStore.get(mobile);
        if (!pendingData || pendingData.type !== 'reset_password') return res.status(400).json({ error: 'No pending password reset for this mobile' });
        if (pendingData.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

        const hash = await bcrypt.hash(newPassword, 12);
        await prisma.users.update({
            where: { mobile },
            data: { password_hash: hash }
        });

        otpStore.delete(mobile);

        return res.status(200).json({ success: true, message: 'Password reset successfully!' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

// ==========================================
// RECOVER REGISTRATION ID
// ==========================================
async function recoverRegistrationIdSendOtp(req, res) {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ error: 'Mobile required' });

    const user = await prisma.users.findUnique({ where: { mobile } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const otp = generateOtp();
    otpStore.set(mobile, { otp, type: 'recover_id' });
    
    await sendSms(mobile, `Your USAME Registration ID recovery OTP is: ${otp}`);
    return res.json({ success: true, message: 'Recovery OTP sent successfully', devOtp: otp });
}

async function recoverRegistrationIdVerify(req, res) {
    try {
        const { mobile, otp } = req.body;
        
        const pendingData = otpStore.get(mobile);
        if (!pendingData || pendingData.type !== 'recover_id') return res.status(400).json({ error: 'No pending recovery for this mobile' });
        if (pendingData.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

        const user = await prisma.users.findUnique({ where: { mobile } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        otpStore.delete(mobile);

        // Send Registration ID via SMS as well, for good measure
        await sendSms(mobile, `Your USAME Registration ID is: ${user.registration_id}`);

        return res.status(200).json({ 
            success: true, 
            message: 'Registration ID recovered successfully!',
            data: { registrationId: user.registration_id }
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = { 
    sendOtp, verifyOtpAndRegister, login,
    sendLoginOtp, verifyLoginOtp,
    forgotPasswordSendOtp, resetPassword,
    recoverRegistrationIdSendOtp, recoverRegistrationIdVerify
};
