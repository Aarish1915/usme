document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') 
        ? 'http://localhost:3001' 
        : '';
        
    // Check Auth
    const token = localStorage.getItem('usame_token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    const regId = localStorage.getItem('usame_reg_id');
    document.getElementById('user-reg-id').innerText = "ID: " + regId;

    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    const btnNewApp = document.getElementById('btn-new-app');
    const appsList = document.getElementById('applications-list');

    // Helper to format date
    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); // e.g. 12 Oct 2024
    }

    async function loadUserApplication() {
        try {
            const res = await fetch(`${API_BASE}/api/applications/${regId}`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            
            if (res.status === 404) {
                // No application exists
                appsList.innerHTML = `
                    <div class="text-center" style="padding: 40px; color: var(--text-muted); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg);">
                        <div style="font-size: 3rem; margin-bottom: 16px;">📝</div>
                        <h3 style="color: var(--text-dark); margin-bottom: 8px;">No Applications Yet</h3>
                        <p>Click 'Start New Application' to begin your institution recognition process.</p>
                    </div>
                `;
                return;
            }

            if (!res.ok) throw new Error('Failed to fetch');

            const app = await res.json();
            
            // Institution name
            let instName = 'Unknown Institution';
            if (app.institution_name) {
                instName = app.institution_name;
            } else if (app.draft_data && app.draft_data.q1_name) {
                instName = app.draft_data.q1_name;
            }

            // Status Badge
            let badgeClass = 'badge-muted';
            let statusText = app.status.toUpperCase().replace(/_/g, ' ');
            
            if (app.status === 'approved') badgeClass = 'badge-success';
            else if (app.status === 'rejected') badgeClass = 'badge-danger';
            else if (app.status === 'submitted' || app.status === 'under_review') badgeClass = 'badge-warning';
            else if (app.status === 'override_pending') badgeClass = 'badge-info';

            // Buttons HTML
            let buttonsHtml = '';
            if (app.status === 'draft') {
                buttonsHtml = `<button class="btn btn-primary" id="btn-resume-draft">Resume Draft &rarr;</button>`;
            } else {
                buttonsHtml = `
                    <button class="btn btn-outline" id="btn-view-details">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        View Form Details
                    </button>
                    ${(app.status === 'approved' || app.status === 'submitted') ? `
                    <button class="btn btn-outline" style="color: var(--success); border-color: var(--success);" id="btn-dash-dl-pdf">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Download PDF
                    </button>
                    ` : ''}
                `;
            }

            // Render Card
            appsList.innerHTML = `
                <div class="app-card">
                    <div class="app-card-header">
                        <div>
                            <span class="app-id">APP ID: USAME-${app.id.substring(0, 4).toUpperCase()} <span class="badge ${badgeClass}" style="margin-left: 8px;">${statusText}</span></span>
                            <h3 class="app-title">Institution Recognition</h3>
                            <p class="app-subtitle">${instName}</p>
                        </div>
                        <div class="app-date">
                            ${app.status === 'draft' ? 'Last Updated' : 'Submitted On'}
                            <span>${formatDate(app.updated_at)}</span>
                        </div>
                    </div>
                    
                    ${app.status === 'draft' ? `
                    <div class="step-progress" style="margin: 24px 0 0 0;">
                        <span class="step-progress-item completed">Start</span>
                        <span class="step-progress-line active" style="flex: 1;"></span>
                        <span class="step-progress-item active" style="color: var(--primary-saffron);">Draft Saved</span>
                        <span class="step-progress-line" style="flex: 1;"></span>
                        <span class="step-progress-item">Submission</span>
                    </div>
                    ` : ''}

                    <div class="app-actions">
                        ${buttonsHtml}
                    </div>
                </div>
            `;

        } catch (err) {
            console.error(err);
            appsList.innerHTML = `
                <div class="text-center" style="padding: 40px; color: var(--danger);">
                    Failed to load applications. Please refresh the page.
                </div>
            `;
        }

        // Add event listeners for dynamic buttons
        const btnResumeDraft = document.getElementById('btn-resume-draft');
        if (btnResumeDraft) {
            btnResumeDraft.addEventListener('click', () => { window.location.href = 'application.html'; });
        }
        const btnViewDetails = document.getElementById('btn-view-details');
        if (btnViewDetails) {
            btnViewDetails.addEventListener('click', () => { window.location.href = 'review.html'; });
        }
        
        const btnDashDlPdf = document.getElementById('btn-dash-dl-pdf');
        if (btnDashDlPdf) {
            btnDashDlPdf.addEventListener('click', async () => {
                btnDashDlPdf.innerHTML = 'Downloading...';
                btnDashDlPdf.disabled = true;
                try {
                    const res = await fetch(`${API_BASE}/api/applications/${regId}/pdf`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const blob = await res.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.style.display = 'none';
                        a.href = url;
                        a.download = `USAME_Application_${regId}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                    } else {
                        alert("Failed to download PDF");
                    }
                } catch(err) {
                    alert("Server error during download");
                } finally {
                    btnDashDlPdf.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download PDF`;
                    btnDashDlPdf.disabled = false;
                }
            });
        }
    }

    // Initialize Page
    loadUserApplication();

    btnNewApp.addEventListener('click', async () => {
        try {
            await fetch(`${API_BASE}/api/applications`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            window.location.href = 'application.html';
        } catch (err) {
            window.location.href = 'application.html';
        }
    });
});
