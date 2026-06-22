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

    const btnNewApp = document.getElementById('btn-new-app');
    
    // UI Elements
    const loadingSection = document.getElementById('loading-section');
    const newAppGrid = document.getElementById('new-app-grid');
    const existingAppSection = document.getElementById('existing-app-section');
    
    const displayRegId = document.getElementById('display-reg-id');
    const displayInstName = document.getElementById('display-inst-name');
    const displayStatus = document.getElementById('display-status');
    
    const btnResumeApp = document.getElementById('btn-resume-app');
    const btnViewApp = document.getElementById('btn-view-app');
    const btnDownloadPdf = document.getElementById('btn-download-pdf');

    async function loadUserApplication() {
        try {
            const res = await fetch(`/api/applications/${regId}`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            
            loadingSection.style.display = 'none';

            if (res.status === 404) {
                // No application exists, show the New App button
                newAppGrid.style.display = 'grid';
                return;
            }

            if (!res.ok) throw new Error('Failed to fetch');

            const app = await res.json();
            
            // App exists!
            existingAppSection.style.display = 'block';
            displayRegId.innerText = regId;
            
            // Institution name
            if (app.institution_name) {
                displayInstName.innerText = app.institution_name;
            } else if (app.draft_data && app.draft_data.q1_name) {
                displayInstName.innerText = app.draft_data.q1_name;
            }

            // Status Styling
            let statusText = app.status.toUpperCase().replace(/_/g, ' ');
            displayStatus.innerText = statusText;
            
            if (app.status === 'draft') {
                displayStatus.style.backgroundColor = '#e2e8f0';
                displayStatus.style.color = '#475569';
                btnResumeApp.style.display = 'block';
            } else if (app.status === 'approved') {
                displayStatus.style.backgroundColor = '#dcfce7';
                displayStatus.style.color = '#166534';
                btnViewApp.style.display = 'block';
                btnDownloadPdf.style.display = 'block';
            } else if (app.status === 'rejected') {
                displayStatus.style.backgroundColor = '#fee2e2';
                displayStatus.style.color = '#991b1b';
                btnViewApp.style.display = 'block';
            } else {
                // Submitted, under review, override pending
                displayStatus.style.backgroundColor = '#e0e7ff';
                displayStatus.style.color = '#3730a3';
                btnViewApp.style.display = 'block';
                btnDownloadPdf.style.display = 'block';
            }

        } catch (err) {
            console.error(err);
            loadingSection.style.display = 'none';
            newAppGrid.style.display = 'grid';
        }
    }

    // Initialize Page
    loadUserApplication();

    btnNewApp.addEventListener('click', async () => {
        try {
            await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            window.location.href = 'application.html';
        } catch (err) {
            window.location.href = 'application.html';
        }
    });

    btnResumeApp.addEventListener('click', () => {
        window.location.href = 'application.html';
    });

    btnViewApp.addEventListener('click', () => {
        window.location.href = 'review.html';
    });

    btnDownloadPdf.addEventListener('click', () => {
        window.open(`/api/applications/${regId}/pdf?token=${token}`, '_blank');
    });
});
