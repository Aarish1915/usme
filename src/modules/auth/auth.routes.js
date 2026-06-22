const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const rateLimit = require('express-rate-limit');

// Strict Rate Limiter for OTP routes to prevent SMS Toll Fraud
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 OTP requests per windowMs
    message: { error: 'Too many OTP requests from this IP, please try again after 15 minutes' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Registration
router.post('/send-otp', otpLimiter, authController.sendOtp);
router.post('/verify-register', authController.verifyOtpAndRegister);

// Login
router.post('/login', authController.login);
router.post('/login-send-otp', otpLimiter, authController.sendLoginOtp);
router.post('/login-verify-otp', authController.verifyLoginOtp);

// Forgot Password
router.post('/forgot-password-send-otp', otpLimiter, authController.forgotPasswordSendOtp);
router.post('/reset-password', authController.resetPassword);

// Recover Registration ID
router.post('/recover-registration-id-send-otp', otpLimiter, authController.recoverRegistrationIdSendOtp);
router.post('/recover-registration-id-verify', authController.recoverRegistrationIdVerify);

module.exports = router;
