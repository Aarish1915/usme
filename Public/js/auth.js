const API_BASE = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') 
    ? 'http://localhost:3001' 
    : '';

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => { toast.className = 'toast'; }, 3000);
}

function setButtonLoading(btnId, isLoading, originalText = '') {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (isLoading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner"></span>';
        btn.disabled = true;
    } else {
        btn.innerHTML = btn.dataset.originalText || originalText;
        btn.disabled = false;
    }
}

// UI State Management
function switchTab(tab) {
    document.getElementById('form-login').classList.add('hidden');
    document.getElementById('form-admin').classList.add('hidden');
    document.getElementById('form-register').classList.add('hidden');
    document.getElementById('form-forgot-password').classList.add('hidden');
    document.getElementById('form-forgot-reg-id').classList.add('hidden');
    
    // Left panel branding switch
    const leftDefault = document.getElementById('left-content-default');
    const leftAdmin = document.getElementById('left-content-admin');
    
    if (leftDefault && leftAdmin) {
        if (tab === 'admin') {
            leftDefault.classList.add('hidden');
            leftAdmin.classList.remove('hidden');
        } else {
            leftAdmin.classList.add('hidden');
            leftDefault.classList.remove('hidden');
        }
    }

    if (tab === 'login') {
        document.getElementById('form-login').classList.remove('hidden');
        const pwdMode = document.getElementById('mode-password');
        if (pwdMode) {
            pwdMode.checked = true;
            toggleLoginMode('password');
        }
    } else if (tab === 'admin') {
        document.getElementById('form-admin').classList.remove('hidden');
    } else if (tab === 'register') {
        document.getElementById('form-register').classList.remove('hidden');
        resetReg();
    }
}

function toggleLoginMode(mode) {
    document.getElementById('login-password-mode').classList.toggle('hidden', mode !== 'password');
    document.getElementById('login-otp-mode').classList.toggle('hidden', mode !== 'otp');
    if (mode === 'otp') {
        document.getElementById('login-otp-step1').classList.remove('hidden');
        document.getElementById('login-otp-step2').classList.add('hidden');
    }
}

function showForgotPassword() {
    document.getElementById('form-login').classList.add('hidden');
    document.getElementById('form-forgot-password').classList.remove('hidden');
    document.getElementById('fp-step1').classList.remove('hidden');
    document.getElementById('fp-step2').classList.add('hidden');
}

function showForgotRegId() {
    document.getElementById('form-login').classList.add('hidden');
    document.getElementById('form-forgot-reg-id').classList.remove('hidden');
    document.getElementById('frid-step1').classList.remove('hidden');
    document.getElementById('frid-step2').classList.add('hidden');
    document.getElementById('frid-step3').classList.add('hidden');
}

function updateStepProgress(step) {
    const sp1 = document.getElementById('sp-1');
    const sp2 = document.getElementById('sp-2');
    const sp3 = document.getElementById('sp-3');
    const line1 = document.getElementById('sp-line-1');
    const line2 = document.getElementById('sp-line-2');
    
    if(!sp1) return;

    if (step === 1) {
        sp1.className = 'step-progress-item active';
        sp2.className = 'step-progress-item';
        sp3.className = 'step-progress-item';
        line1.className = 'step-progress-line';
        line2.className = 'step-progress-line';
    } else if (step === 2) {
        sp1.className = 'step-progress-item completed';
        sp2.className = 'step-progress-item active';
        sp3.className = 'step-progress-item';
        line1.className = 'step-progress-line active';
        line2.className = 'step-progress-line';
    } else if (step === 3) {
        sp1.className = 'step-progress-item completed';
        sp2.className = 'step-progress-item completed';
        sp3.className = 'step-progress-item active';
        line1.className = 'step-progress-line active';
        line2.className = 'step-progress-line active';
    }
}

function resetReg() {
    document.getElementById('reg-part1').classList.remove('hidden');
    document.getElementById('reg-part2').classList.add('hidden');
    document.getElementById('reg-step2').classList.add('hidden');
    document.getElementById('reg-step-num').textContent = '1';
    document.getElementById('reg-title').textContent = 'Institution Registration';
    document.getElementById('reg-subtitle').textContent = 'Please provide the primary details of the educational institution.';
    updateStepProgress(1);
}

function regNext() {
    const inst = document.getElementById('reg_institution_name');
    const addr = document.getElementById('reg_address');
    const year = document.getElementById('reg_established_year');
    
    if (inst.reportValidity() && addr.reportValidity() && year.reportValidity()) {
        document.getElementById('reg-part1').classList.add('hidden');
        document.getElementById('reg-part2').classList.remove('hidden');
        document.getElementById('reg-step-num').textContent = '2';
        document.getElementById('reg-title').textContent = 'Applicant Details';
        document.getElementById('reg-subtitle').textContent = 'Provide your personal information to create the account.';
        updateStepProgress(2);
    }
}

function regBack1() {
    document.getElementById('reg-part1').classList.remove('hidden');
    document.getElementById('reg-part2').classList.add('hidden');
    document.getElementById('reg-step-num').textContent = '1';
    document.getElementById('reg-title').textContent = 'Institution Registration';
    document.getElementById('reg-subtitle').textContent = 'Please provide the primary details of the educational institution.';
    updateStepProgress(1);
}

function togglePassword(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if (input.type === "password") {
        input.type = "text";
        btn.innerHTML = "&#128064;"; // open eye
    } else {
        input.type = "password";
        btn.innerHTML = "&#128065;"; // closed eye
    }
}


// --- Registration ---
async function handleRegisterOtp(e) {
    e.preventDefault();
    const name = document.getElementById('reg_name').value;
    const mobile = document.getElementById('reg_mobile').value;
    const password = document.getElementById('reg_password').value;
    const institution_name = document.getElementById('reg_institution_name').value;
    const address = document.getElementById('reg_address').value;
    const established_year = document.getElementById('reg_established_year').value;

    setButtonLoading('btn-reg-otp', true);
    try {
        const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mobile, password, institution_name, address, established_year })
        });
        const data = await res.json();
        if (data.success) {
            showToast('OTP Sent!');
            document.getElementById('reg-part1').classList.add('hidden');
            document.getElementById('reg-part2').classList.add('hidden');
            document.getElementById('reg-step2').classList.remove('hidden');
            
            // Hide header content in step 3
            document.getElementById('reg-header').classList.add('hidden');
            updateStepProgress(3);
        } else showToast(data.error || 'Failed to send OTP', 'error');
    } catch (err) { showToast('Server error', 'error'); }
    setButtonLoading('btn-reg-otp', false, 'Create Account');
}

async function verifyRegisterOtp() {
    const mobile = document.getElementById('reg_mobile').value;
    const otp = document.getElementById('reg_otp').value;

    setButtonLoading('btn-reg-verify', true);
    try {
        const res = await fetch(`${API_BASE}/api/auth/verify-register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, otp })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('usame_token', data.data.token);
            localStorage.setItem('usame_reg_id', data.data.registrationId);
            alert(`Registration Successful!\n\nYour Registration ID is: ${data.data.registrationId}\n\nPlease save this ID! You can use it to log in.`);
            window.location.href = 'dashboard.html';
        } else showToast(data.error || 'Invalid OTP', 'error');
    } catch (err) { showToast('Server error', 'error'); }
    setButtonLoading('btn-reg-verify', false, 'Verify & Register');
}

// --- Login (Password) ---
async function handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('login_identifier').value;
    const password = document.getElementById('login_password').value;
    
    setButtonLoading('btn-login-submit', true);
    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('usame_token', data.data.token);
            localStorage.setItem('usame_reg_id', data.data.registrationId);
            showToast('Login Successful!');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
        } else showToast(data.error || 'Login failed', 'error');
    } catch (err) { showToast('Server error during login', 'error'); }
    setButtonLoading('btn-login-submit', false, 'Sign In &rarr;');
}

// --- Admin Login ---
async function handleAdminLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('admin_mobile').value;
    const password = document.getElementById('admin_password').value;
    
    setButtonLoading('btn-admin-submit', true);
    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('usame_token', data.data.token);
            // Decode JWT to verify role
            try {
                const payload = JSON.parse(atob(data.data.token.split('.')[1]));
                if (payload.role !== 'admin') {
                    showToast('Unauthorized: Not an admin', 'error');
                    setButtonLoading('btn-admin-submit', false, 'Sign In &rarr;');
                    return;
                }
            } catch(e) {}
            
            showToast('Admin Login Successful!');
            setTimeout(() => { window.location.href = 'admin.html'; }, 1000);
        } else showToast(data.error || 'Login failed', 'error');
    } catch (err) { showToast('Server error during admin login', 'error'); }
    setButtonLoading('btn-admin-submit', false, 'Sign In &rarr;');
}

// --- Login (OTP) ---
async function handleLoginSendOtp() {
    const mobile = document.getElementById('login_mobile').value;
    
    setButtonLoading('btn-login-send-otp', true);
    try {
        const res = await fetch(`${API_BASE}/api/auth/login-send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Login OTP Sent!');
            document.getElementById('login-otp-step1').classList.add('hidden');
            document.getElementById('login-otp-step2').classList.remove('hidden');
        } else showToast(data.error || 'Failed to send OTP', 'error');
    } catch (err) { showToast('Server error', 'error'); }
    setButtonLoading('btn-login-send-otp', false, 'Send OTP &rarr;');
}

async function handleLoginVerifyOtp() {
    const mobile = document.getElementById('login_mobile').value;
    const otp = document.getElementById('login_otp').value;
    
    setButtonLoading('btn-login-verify-otp', true);
    try {
        const res = await fetch(`${API_BASE}/api/auth/login-verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, otp })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('usame_token', data.data.token);
            localStorage.setItem('usame_reg_id', data.data.registrationId);
            showToast('Login Successful!');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
        } else showToast(data.error || 'Invalid OTP', 'error');
    } catch (err) { showToast('Server error', 'error'); }
    setButtonLoading('btn-login-verify-otp', false, 'Verify & Sign In');
}

// --- Forgot Password ---
async function handleFpSendOtp() {
    const mobile = document.getElementById('fp_mobile').value;
    try {
        const res = await fetch(`${API_BASE}/api/auth/forgot-password-send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Reset OTP Sent!');
            document.getElementById('fp-step1').classList.add('hidden');
            document.getElementById('fp-step2').classList.remove('hidden');
        } else showToast(data.error || 'User not found', 'error');
    } catch (err) { showToast('Server error', 'error'); }
}

async function handleFpVerifyOtp() {
    const mobile = document.getElementById('fp_mobile').value;
    const otp = document.getElementById('fp_otp').value;
    const newPassword = document.getElementById('fp_new_password').value;
    try {
        const res = await fetch(`${API_BASE}/api/auth/forgot-password-verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, otp, newPassword })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Password Reset Successfully!');
            setTimeout(() => { switchTab('login'); }, 1500);
        } else showToast(data.error || 'Invalid OTP', 'error');
    } catch (err) { showToast('Server error', 'error'); }
}

// --- Forgot Reg ID ---
async function handleFridSendOtp() {
    const mobile = document.getElementById('frid_mobile').value;
    try {
        const res = await fetch(`${API_BASE}/api/auth/recover-registration-id-send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Recovery OTP Sent!');
            document.getElementById('frid-step1').classList.add('hidden');
            document.getElementById('frid-step2').classList.remove('hidden');
        } else showToast(data.error || 'User not found', 'error');
    } catch (err) { showToast('Server error', 'error'); }
}

async function handleFridVerifyOtp() {
    const mobile = document.getElementById('frid_mobile').value;
    const otp = document.getElementById('frid_otp').value;
    try {
        const res = await fetch(`${API_BASE}/api/auth/recover-registration-id-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, otp })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('frid-step2').classList.add('hidden');
            document.getElementById('frid-step3').classList.remove('hidden');
        } else showToast(data.error || 'Invalid OTP', 'error');
    } catch (err) { showToast('Server error', 'error'); }
}

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Navigation / Tab Switching
    document.getElementById('btn-switch-to-login-1').addEventListener('click', () => switchTab('login'));
    document.getElementById('btn-switch-to-login-2').addEventListener('click', () => switchTab('login'));
    document.getElementById('btn-switch-to-login-3').addEventListener('click', () => switchTab('login'));
    document.getElementById('btn-switch-to-login-4').addEventListener('click', () => switchTab('login'));
    document.getElementById('btn-switch-to-login-5').addEventListener('click', () => switchTab('login'));
    
    document.getElementById('btn-switch-to-register').addEventListener('click', () => switchTab('register'));
    
    document.getElementById('btn-switch-to-admin-1').addEventListener('click', () => switchTab('admin'));
    document.getElementById('btn-switch-to-admin-2').addEventListener('click', () => switchTab('admin'));

    // Pill Toggle for Login
    const modePwd = document.getElementById('mode-password');
    const modeOtp = document.getElementById('mode-otp');
    if(modePwd) modePwd.addEventListener('change', (e) => { if(e.target.checked) toggleLoginMode('password'); });
    if(modeOtp) modeOtp.addEventListener('change', (e) => { if(e.target.checked) toggleLoginMode('otp'); });

    // Registration Flow
    document.getElementById('btn-reg-next').addEventListener('click', regNext);
    document.getElementById('btn-reg-back-1').addEventListener('click', regBack1);
    document.getElementById('form-register').addEventListener('submit', handleRegisterOtp);
    document.getElementById('btn-reg-verify').addEventListener('click', verifyRegisterOtp);
    document.getElementById('btn-reg-back-2').addEventListener('click', () => {
        document.getElementById('reg-step2').classList.add('hidden');
        document.getElementById('reg-part2').classList.remove('hidden');
        document.getElementById('reg-header').classList.remove('hidden');
        updateStepProgress(2);
    });

    // Password Visibility Toggles
    const toggleRegPwd = document.getElementById('btn-toggle-reg-pwd');
    if(toggleRegPwd) toggleRegPwd.addEventListener('click', () => togglePassword('reg_password', 'btn-toggle-reg-pwd'));
    
    const toggleLoginPwd = document.getElementById('btn-toggle-login-pwd');
    if(toggleLoginPwd) toggleLoginPwd.addEventListener('click', () => togglePassword('login_password', 'btn-toggle-login-pwd'));
    
    const toggleAdminPwd = document.getElementById('btn-toggle-admin-pwd');
    if(toggleAdminPwd) toggleAdminPwd.addEventListener('click', () => togglePassword('admin_password', 'btn-toggle-admin-pwd'));

    // Login Flow
    document.getElementById('form-login').addEventListener('submit', (e) => {
        if (!document.getElementById('login-password-mode').classList.contains('hidden')) {
            handleLogin(e);
        } else {
            e.preventDefault();
        }
    });
    
    // Login OTP Flow
    document.getElementById('btn-login-send-otp').addEventListener('click', handleLoginSendOtp);
    document.getElementById('btn-login-verify-otp').addEventListener('click', handleLoginVerifyOtp);
    document.getElementById('btn-login-back').addEventListener('click', () => {
        document.getElementById('login-otp-step2').classList.add('hidden');
        document.getElementById('login-otp-step1').classList.remove('hidden');
    });

    // Admin Login Flow
    document.getElementById('form-admin').addEventListener('submit', handleAdminLogin);

    // Forgot Password Flow
    document.getElementById('btn-forgot-password').addEventListener('click', showForgotPassword);
    document.getElementById('btn-fp-send').addEventListener('click', handleFpSendOtp);
    document.getElementById('btn-fp-verify').addEventListener('click', handleFpVerifyOtp);
    document.getElementById('btn-fp-back').addEventListener('click', () => {
        document.getElementById('fp-step2').classList.add('hidden');
        document.getElementById('fp-step1').classList.remove('hidden');
    });

    // Forgot Registration ID Flow
    document.getElementById('btn-forgot-reg-id').addEventListener('click', showForgotRegId);
    document.getElementById('btn-frid-send').addEventListener('click', handleFridSendOtp);
    document.getElementById('btn-frid-verify').addEventListener('click', handleFridVerifyOtp);
    document.getElementById('btn-frid-back').addEventListener('click', () => {
        document.getElementById('frid-step2').classList.add('hidden');
        document.getElementById('frid-step1').classList.remove('hidden');
    });

    switchTab('register');
});
