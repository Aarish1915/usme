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
        btn.innerHTML = '<span class="spinner"></span> Loading...';
        btn.disabled = true;
    } else {
        btn.innerHTML = btn.dataset.originalText || originalText;
        btn.disabled = false;
    }
}

function switchTab(tab) {
    document.getElementById('tab-login')?.classList.toggle('active', tab === 'login');
    document.getElementById('tab-admin')?.classList.toggle('active', tab === 'admin');
    document.getElementById('tab-register')?.classList.toggle('active', tab === 'register');

    document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
    document.getElementById('form-admin').classList.toggle('hidden', tab !== 'admin');
    document.getElementById('form-register').classList.toggle('hidden', tab !== 'register');
    document.getElementById('form-forgot-password').classList.add('hidden');
    document.getElementById('form-forgot-reg-id').classList.add('hidden');

    if (tab === 'login') {
        document.querySelector('input[name="login_mode"][value="password"]').checked = true;
        toggleLoginMode('password');
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
    document.getElementById('frid-result').classList.add('hidden');
}

function resetReg() {
    document.getElementById('reg-step1').classList.remove('hidden');
    document.getElementById('reg-step2').classList.add('hidden');
}

// --- Registration ---
async function handleRegisterOtp() {
    const name = document.getElementById('reg_name').value;
    const mobile = document.getElementById('reg_mobile').value;
    const password = document.getElementById('reg_password').value;
    const institution_name = document.getElementById('reg_institution_name').value;
    const address = document.getElementById('reg_address').value;
    const established_year = document.getElementById('reg_established_year').value;

    setButtonLoading('btn-reg-otp', true);
    try {
        const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mobile, password, institution_name, address, established_year })
        });
        const data = await res.json();
        if (data.success) {
            showToast('OTP Sent!');
            document.getElementById('reg-step1').classList.add('hidden');
            document.getElementById('reg-step2').classList.remove('hidden');
        } else showToast(data.error || 'Failed to send OTP', 'error');
    } catch (err) { showToast('Server error', 'error'); }
    setButtonLoading('btn-reg-otp', false, 'Send OTP');
}

async function verifyRegisterOtp() {
    const mobile = document.getElementById('reg_mobile').value;
    const otp = document.getElementById('reg_otp').value;

    setButtonLoading('btn-reg-verify', true);
    try {
        const res = await fetch('/api/auth/verify-register', {
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
async function handleLogin() {
    const identifier = document.getElementById('login_identifier').value;
    const password = document.getElementById('login_password').value;
    
    setButtonLoading('btn-login-submit', true);
    try {
        const res = await fetch('/api/auth/login', {
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
    setButtonLoading('btn-login-submit', false, 'Login Securely');
}

// --- Login (OTP) ---
async function handleLoginSendOtp() {
    const mobile = document.getElementById('login_mobile').value;
    
    setButtonLoading('btn-login-send-otp', true);
    try {
        const res = await fetch('/api/auth/login-send-otp', {
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
    setButtonLoading('btn-login-send-otp', false, 'Send OTP');
}

async function handleLoginVerifyOtp() {
    const mobile = document.getElementById('login_mobile').value;
    const otp = document.getElementById('login_otp').value;
    
    setButtonLoading('btn-login-verify-otp', true);
    try {
        const res = await fetch('/api/auth/login-verify-otp', {
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
    setButtonLoading('btn-login-verify-otp', false, 'Verify & Login');
}

// --- Forgot Password ---
async function handleFpSendOtp() {
    const mobile = document.getElementById('fp_mobile').value;
    try {
        const res = await fetch('/api/auth/forgot-password-send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Password Reset OTP Sent!');
            document.getElementById('fp-step1').classList.add('hidden');
            document.getElementById('fp-step2').classList.remove('hidden');
        } else showToast(data.error || 'Failed to send OTP', 'error');
    } catch (err) { showToast('Server error', 'error'); }
}

async function handleFpVerify() {
    const mobile = document.getElementById('fp_mobile').value;
    const otp = document.getElementById('fp_otp').value;
    const newPassword = document.getElementById('fp_new_password').value;
    try {
        const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, otp, newPassword })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Password reset successfully! Please login.');
            setTimeout(() => switchTab('login'), 1500);
        } else showToast(data.error || 'Failed to reset password', 'error');
    } catch (err) { showToast('Server error', 'error'); }
}

// --- Recover Registration ID ---
async function handleFridSendOtp() {
    const mobile = document.getElementById('frid_mobile').value;
    try {
        const res = await fetch('/api/auth/recover-registration-id-send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Recovery OTP Sent!');
            document.getElementById('frid-step1').classList.add('hidden');
            document.getElementById('frid-step2').classList.remove('hidden');
        } else showToast(data.error || 'Failed to send OTP', 'error');
    } catch (err) { showToast('Server error', 'error'); }
}

async function handleFridVerify() {
    const mobile = document.getElementById('frid_mobile').value;
    const otp = document.getElementById('frid_otp').value;
    try {
        const res = await fetch('/api/auth/recover-registration-id-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, otp })
        });
        const data = await res.json();
        if (data.success) {
            showToast('ID Recovered!');
            document.getElementById('frid-step2').classList.add('hidden');
            document.getElementById('frid-result').classList.remove('hidden');
            document.getElementById('frid_display').textContent = data.data.registrationId;
        } else showToast(data.error || 'Failed to verify', 'error');
    } catch (err) { showToast('Server error', 'error'); }
}

function initAuth() {
    // Tabs
    document.getElementById('tab-login')?.addEventListener('click', () => switchTab('login'));
    document.getElementById('tab-register')?.addEventListener('click', () => switchTab('register'));

    // Login Modes
    document.querySelectorAll('input[name="login_mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => toggleLoginMode(e.target.value));
    });

    // Forgot links
    document.getElementById('btn-forgot-password')?.addEventListener('click', showForgotPassword);
    document.getElementById('btn-forgot-reg-id')?.addEventListener('click', showForgotRegId);

    // Registration Form
    document.getElementById('form-register')?.addEventListener('submit', (e) => { e.preventDefault(); handleRegisterOtp(); });
    document.getElementById('btn-reg-verify')?.addEventListener('click', verifyRegisterOtp);
    document.getElementById('btn-reg-back')?.addEventListener('click', resetReg);

    // Login Form (Password)
    document.getElementById('form-login')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const mode = document.querySelector('input[name="login_mode"]:checked').value;
        if (mode === 'password') handleLogin();
    });

    // Login Form (OTP)
    document.getElementById('btn-login-send-otp')?.addEventListener('click', handleLoginSendOtp);
    document.getElementById('btn-login-verify-otp')?.addEventListener('click', handleLoginVerifyOtp);
    document.getElementById('btn-login-back')?.addEventListener('click', () => {
        document.getElementById('login-otp-step1').classList.remove('hidden');
        document.getElementById('login-otp-step2').classList.add('hidden');
    });

    // Forgot Password
    document.getElementById('btn-fp-send')?.addEventListener('click', handleFpSendOtp);
    document.getElementById('btn-fp-verify')?.addEventListener('click', handleFpVerify);
    document.getElementById('btn-fp-back')?.addEventListener('click', () => {
        document.getElementById('fp-step1').classList.remove('hidden');
        document.getElementById('fp-step2').classList.add('hidden');
    });

    // Recover Reg ID
    document.getElementById('btn-frid-send')?.addEventListener('click', handleFridSendOtp);
    document.getElementById('btn-frid-verify')?.addEventListener('click', handleFridVerify);
    document.getElementById('btn-frid-back')?.addEventListener('click', () => {
        document.getElementById('frid-step1').classList.remove('hidden');
        document.getElementById('frid-step2').classList.add('hidden');
    });
}

initAuth();
