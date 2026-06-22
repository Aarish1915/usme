let authToken = '';
let registrationId = '';

async function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, mobile: Date.now().toString().slice(-10) })
    });
    const data = await res.json();
    
    if (data.success || data.data?.token) {
        authToken = data.data.token;
        registrationId = data.data.registrationId;
        document.getElementById('auth-result').innerText = "Logged in! Reg ID: " + registrationId;
        document.getElementById('step1-box').style.display = 'block';
        document.getElementById('step2-box').style.display = 'block';
        document.getElementById('submit-box').style.display = 'block';
    } else {
        document.getElementById('auth-result').innerText = "Error: " + JSON.stringify(data);
    }
}

async function saveStep(stepNum) {
    let payload = {};
    if (stepNum === 1) {
        payload.institutionName = document.getElementById('institution_name').value;
        payload.establishedYear = document.getElementById('establishment_year').value;
    } else if (stepNum === 2) {
        payload.gstNumber = document.getElementById('gst_number').value;
    }

    try {
        const res = await fetch(`/api/applications/${registrationId}/step/${stepNum}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        document.getElementById(`step${stepNum}-result`).innerText = "Server Response:\n" + JSON.stringify(data, null, 2);
    } catch (err) {
        document.getElementById(`step${stepNum}-result`).innerText = "Error:\n" + String(err);
    }
}

async function submitApp() {
    try {
        const res = await fetch(`/api/applications/${registrationId}/submit`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await res.json();
        document.getElementById('submit-result').innerText = "Server Response:\n" + JSON.stringify(data, null, 2);
    } catch (err) {
        document.getElementById('submit-result').innerText = "Error:\n" + String(err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-register').addEventListener('click', register);
    document.getElementById('btn-save-step1').addEventListener('click', () => saveStep(1));
    document.getElementById('btn-save-step2').addEventListener('click', () => saveStep(2));
    document.getElementById('btn-submit').addEventListener('click', submitApp);
});
