// js/admin.js

// JWT Parser
function parseJwt(token) {
    try {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch(e) { return {}; }
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('usame_token');
    
    // Core Elements
    const tableBody = document.getElementById('applicationsTableBody');
    const modal = document.getElementById('reviewModal');
    const modalBody = document.getElementById('modalBody');
    const pdfViewer = document.getElementById('pdfViewer');
    const closeBtn = document.getElementById('btn-close-modal');
    
    let currentPdfBlobUrl = null;

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // ==========================================
    // 1. DATA FETCHING & RENDERING (Applications)
    // ==========================================
    async function loadApplications() {
        try {
            const res = await fetch('/api/review/applications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                if(res.status === 401 || res.status === 403) {
                    alert('Session expired or unauthorized. Please login again.');
                    localStorage.removeItem('usame_token');
                    window.location.href = 'index.html';
                    return;
                }
                throw new Error(`HTTP Error: ${res.status}`);
            }

            const payload = await res.json();
            if(payload.ok || payload.success) {
                renderTable(payload.data);
            } else {
                throw new Error(payload.error || 'Failed to load applications');
            }

        } catch (error) {
            console.error('Fetch Error:', error);
            showToast('Failed to load applications', 'error');
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444; padding: 40px;">Failed to load data: ${escapeHTML(error.message)}</td></tr>`;
        }
    }

    function renderTable(applications) {
        let countTotal = applications.length;
        let countPending = 0;
        let countApproved = 0;
        let countOverride = 0;

        if (countTotal === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">No applications found in the queue.</td></tr>';
            updateStatsDOM(countTotal, countPending, countOverride, countApproved);
            return;
        }

        tableBody.innerHTML = applications.map(app => {
            if (app.status === 'submitted') countPending++;
            if (app.status === 'approved') countApproved++;
            if (app.status === '15_percent_override') countOverride++;

            let statusBadge = '';
            if(app.status === 'submitted') statusBadge = '<span class="badge badge-warning">Under Review</span>';
            else if(app.status === 'approved') statusBadge = '<span class="badge badge-success">Approved</span>';
            else if(app.status === 'rejected') statusBadge = '<span class="badge badge-danger">Rejected</span>';
            else if(app.status === '15_percent_override') statusBadge = '<span class="badge badge-info">Override Required</span>';

            return `
                <tr style="border-bottom: 1px solid var(--border-light); transition: var(--transition);">
                    <td style="padding: 16px; color: var(--primary-navy); font-family: monospace; font-weight: 500;">${escapeHTML(app.user.registration_id)}</td>
                    <td style="padding: 16px; font-weight: 500; color: var(--text-dark);">${escapeHTML(app.institution_name || 'N/A')}</td>
                    <td style="padding: 16px; color: var(--text-muted);">${new Date(app.created_at).toLocaleDateString()}</td>
                    <td style="padding: 16px;">${statusBadge}</td>
                    <td style="padding: 16px; text-align: right;">
                        <button class="btn btn-outline review-trigger" style="padding: 6px 12px; font-size: 0.85rem;" data-app-id="${escapeHTML(app.id)}">
                            Review &rarr;
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        updateStatsDOM(countTotal, countPending, countOverride, countApproved);
    }

    function updateStatsDOM(total, pending, override, approved) {
        document.getElementById('stat-total').innerText = total;
        document.getElementById('stat-pending').innerText = pending;
        document.getElementById('stat-override').innerText = override;
        document.getElementById('stat-approved').innerText = approved;
    }

    // ==========================================
    // 2. MODAL LOGIC & PDF FETCHING
    // ==========================================
    async function openReviewModal(appId, triggerButton) {
        const originalBtnHTML = triggerButton.innerHTML;
        triggerButton.disabled = true;
        triggerButton.innerHTML = `<span class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></span> Loading...`;

        try {
            const res = await fetch(`/api/review/applications/${appId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
            
            const payload = await res.json();
            if (!(payload.ok || payload.success)) throw new Error(payload.error || 'Failed to fetch details');
            
            const app = payload.data;
            document.getElementById('modal-app-id').innerText = app.user.registration_id;
            
            let statusBadge = '';
            if(app.status === 'submitted') statusBadge = '<span class="badge badge-warning">Under Review</span>';
            else if(app.status === 'approved') statusBadge = '<span class="badge badge-success">Approved</span>';
            else if(app.status === 'rejected') statusBadge = '<span class="badge badge-danger">Rejected</span>';
            else if(app.status === '15_percent_override') statusBadge = '<span class="badge badge-info">Override Required</span>';

            modalBody.innerHTML = `
                <div class="info-group">
                    <label>Institution Name</label>
                    <p>${escapeHTML(app.institution_name || 'N/A')}</p>
                </div>
                <div class="info-group">
                    <label>Registration ID</label>
                    <p style="font-family: monospace; color: var(--primary-navy);">${escapeHTML(app.user.registration_id)}</p>
                </div>
                <div class="info-group">
                    <label>Current Status</label>
                    <p style="margin-top: 4px;">${statusBadge}</p>
                </div>
                
                <hr style="border: none; border-top: 1px dashed var(--border); margin: 24px 0;">
                
                <h4 style="font-size: 0.95rem; color: var(--primary-navy); margin-bottom: 16px;">Registered Entities</h4>
                <div class="info-group" style="margin-bottom: 8px;">
                    <p style="font-size: 0.95rem;">👥 Management: <strong>${app.management_committee?.length || 0}</strong> members</p>
                </div>
                <div class="info-group" style="margin-bottom: 8px;">
                    <p style="font-size: 0.95rem;">👨‍🏫 Staff: <strong>${app.staff_roster?.length || 0}</strong> members</p>
                </div>
                <div class="info-group">
                    <p style="font-size: 0.95rem;">🎓 Classes: <strong>${app.student_demographics?.length || 0}</strong> registered</p>
                </div>

                <hr style="border: none; border-top: 1px dashed var(--border); margin: 24px 0;">
                
                <h4 style="font-size: 0.95rem; color: var(--primary-navy); margin-bottom: 16px;">Attached Documents</h4>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${app.documents && app.documents.length > 0 ? 
                        app.documents.map(doc => `
                            <a href="${escapeHTML(doc.secure_url)}" target="_blank" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--bg-light); border: 1px solid var(--border); border-radius: 6px; text-decoration: none; color: var(--text-dark); font-size: 0.85rem; transition: var(--transition);">
                                <span>📄 ${escapeHTML(doc.document_type.replace(/_/g, ' '))}</span>
                                <span style="color: var(--text-muted);">&nearr;</span>
                            </a>
                        `).join('')
                        : '<p style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">No documents attached.</p>'
                    }
                </div>

                <div class="decision-box">
                    <h4 style="font-size: 1.1rem; color: var(--text-dark); margin-bottom: 12px;">Admin Decision</h4>
                    <textarea id="decisionRemarks" rows="4" placeholder="Enter remarks (mandatory for approval/rejection)"></textarea>
                    <div style="display: flex; gap: 12px; margin-top: 16px;" id="decisionButtonsContainer">
                        <button class="btn btn-success decision-trigger" style="flex: 1;" data-app-id="${escapeHTML(app.id)}" data-decision="approved">Approve</button>
                        <button class="btn btn-danger decision-trigger" style="flex: 1;" data-app-id="${escapeHTML(app.id)}" data-decision="rejected">Reject</button>
                    </div>
                </div>
            `;

            pdfViewer.src = `/api/review/applications/${appId}/pdf?token=${token}`;
            modal.style.display = 'block';

        } catch (error) {
            console.error(error);
            showToast('Error loading application details', 'error');
        } finally {
            triggerButton.disabled = false;
            triggerButton.innerHTML = originalBtnHTML;
        }
    }

    function closeModal() {
        modal.style.display = 'none';
        pdfViewer.src = '';
        if (currentPdfBlobUrl) {
            URL.revokeObjectURL(currentPdfBlobUrl);
            currentPdfBlobUrl = null;
        }
    }

    // ==========================================
    // 3. DECISION SUBMISSION
    // ==========================================
    async function handleDecision(appId, status, buttonEl) {
        const remarks = document.getElementById('decisionRemarks').value;
        if (!remarks.trim()) {
            alert('Remarks are mandatory!');
            return;
        }

        const originalBtnHTML = buttonEl.innerHTML;
        buttonEl.disabled = true;
        buttonEl.innerHTML = `<span class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></span>`;

        try {
            const res = await fetch(`/api/review/applications/${appId}/decision`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status, remarks })
            });
            
            const payload = await res.json();

            if (payload.ok) {
                showToast(payload.message);
                closeModal();
                loadApplications(); // Refresh queue
            } else {
                alert(payload.error || 'Failed to record decision');
            }
        } catch (error) {
            console.error(error);
            showToast('Error recording decision', 'error');
        } finally {
            buttonEl.disabled = false;
            buttonEl.innerHTML = originalBtnHTML;
        }
    }

    // ==========================================
    // 4. EVENT DELEGATION
    // ==========================================
    
    // Table Action Buttons
    tableBody.addEventListener('click', (event) => {
        const reviewBtn = event.target.closest('.review-trigger');
        if (reviewBtn && !reviewBtn.disabled) {
            const appId = reviewBtn.getAttribute('data-app-id');
            openReviewModal(appId, reviewBtn);
        }
    });

    // Decision Buttons
    modalBody.addEventListener('click', (event) => {
        const decisionBtn = event.target.closest('.decision-trigger');
        if (decisionBtn && !decisionBtn.disabled) {
            const appId = decisionBtn.getAttribute('data-app-id');
            const status = decisionBtn.getAttribute('data-decision'); // 'approved' or 'rejected'
            handleDecision(appId, status, decisionBtn);
        }
    });

    // Modal Close Triggers
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });

    // Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('usame_token');
            window.location.href = 'index.html';
        });
    }

    // ==========================================
    // 5. UTILITIES
    // ==========================================
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = String(message); // Coerce to prevent DOM insertion errors
        toast.className = 'toast show ' + type;
        setTimeout(() => { toast.className = 'toast'; }, 3000);
    }

    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Init
    loadApplications();
});
