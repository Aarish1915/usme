document.addEventListener('DOMContentLoaded', () => {
    // Check Auth
    const token = localStorage.getItem('usame_token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    const regId = localStorage.getItem('usame_reg_id');
    document.getElementById('user-info').innerText = "Reg ID: " + regId;

    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    document.getElementById('btn-new-app').addEventListener('click', async () => {
        try {
            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });
            const data = await res.json();
            // It might return 409 or similar if draft already exists, but the service handles it
            // Actually, wait, let's just go to application.html directly, 
            // The frontend will load the draft on page load.
            window.location.href = 'application.html';
        } catch (err) {
            console.error('Failed to create draft:', err);
            // Fallback, just go to page
            window.location.href = 'application.html';
        }
    });
});
