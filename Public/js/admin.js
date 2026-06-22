// js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('usame_token');
    
    // Core Elements
    const tableBody = document.getElementById('appTableBody');
    const modal = document.getElementById('reviewModal');
    const modalBody = document.getElementById('modalBody');
    const decisionButtonsContainer = document.getElementById('decisionButtonsContainer');
    const decisionRemarks = document.getElementById('decisionRemarks');
    const pdfFrame = document.getElementById('pdfFrame');
    const closeBtn = document.querySelector('.close');
    
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

        if (countTotal === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">No applications found in the queue.</td></tr>';
            
            // Update stats
            updateStatsDOM(countTotal, countPending, countApproved);
            return;
        }

        tableBody.innerHTML = applications.map(app => {
            if (app.status === 'submitted' || app.status === '15_percent_override') countPending++;
            if (app.status === 'approved') countApproved++;

            let statusClass = '';
            if(app.status === 'submitted') statusClass = 'status-submitted';
            else if(app.status === 'approved') statusClass = 'status-approved';
            else if(app.status === 'rejected') statusClass = 'status-rejected';
            else if(app.status === '15_percent_override') statusClass = 'status-override';

            return `
                <tr>
                    <td style="color: var(--primary); font-family: monospace;">${escapeHTML(app.user.registration_id)}</td>
                    <td style="font-weight: 500;">${escapeHTML(app.institution_name || 'N/A')}</td>
                    <td style="color: #64748b;">${new Date(app.created_at).toLocaleDateString()}</td>
                    <td><span class="status-badge ${statusClass}">${escapeHTML(app.status.toUpperCase().replace(/_/g, ' '))}</span></td>
                    <td>
                        <button class="action-btn review-trigger" data-app-id="${escapeHTML(app.id)}">
                            <i class="fa-solid fa-eye"></i> Review
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        updateStatsDOM(countTotal, countPending, countApproved);
    }

    function updateStatsDOM(total, pending, approved) {
        document.getElementById('stat-total').innerText = total;
        document.getElementById('stat-pending').innerText = pending;
        document.getElementById('stat-approved').innerText = approved;
    }

    // ==========================================
    // 2. MODAL LOGIC & PDF FETCHING
    // ==========================================
    async function openReviewModal(appId, triggerButton) {
        // Idempotency: Disable button and show spinner
        const originalBtnHTML = triggerButton.innerHTML;
        triggerButton.disabled = true;
        triggerButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Loading...`;

        try {
            // Fetch Details
            const res = await fetch(`/api/review/applications/${appId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
            
            const payload = await res.json();
            if (!(payload.ok || payload.success)) throw new Error(payload.error || 'Failed to fetch details');
            
            const app = payload.data;
            
            let statusClass = '';
            if(app.status === 'submitted') statusClass = 'status-submitted';
            else if(app.status === 'approved') statusClass = 'status-approved';
            else if(app.status === 'rejected') statusClass = 'status-rejected';
            else if(app.status === '15_percent_override') statusClass = 'status-override';

            modalBody.innerHTML = `
                <div class="info-group">
                    <label>Registration ID</label>
                    <p style="color: var(--primary); font-family: monospace; font-size: 18px;">${escapeHTML(app.user.registration_id)}</p>
                </div>
                <div class="info-group">
                    <label>Institution Name</label>
                    <p>${escapeHTML(app.institution_name || 'N/A')}</p>
                </div>
                <div class="info-group">
                    <label>Current Status</label>
                    <p><span class="status-badge ${statusClass}">${escapeHTML(app.status.toUpperCase().replace(/_/g, ' '))}</span></p>
                </div>
                <hr style="margin: 25px 0; border: none; border-top: 1px dashed #cbd5e1;">
                <h4 style="margin-bottom: 15px; color: #475569; font-size: 14px; text-transform: uppercase;"><i class="fa-solid fa-list-check"></i> Registered Entities</h4>
                <div class="info-group" style="margin-bottom: 10px;">
                    <p style="font-size: 14px;"><i class="fa-solid fa-users-gear" style="color: #64748b; width: 20px;"></i> Management: <strong style="color: #10b981;">${app.management_committee.length}</strong> members</p>
                </div>
                <div class="info-group" style="margin-bottom: 10px;">
                    <p style="font-size: 14px;"><i class="fa-solid fa-chalkboard-user" style="color: #64748b; width: 20px;"></i> Staff: <strong style="color: #10b981;">${app.staff_roster.length}</strong> members</p>
                </div>
                <div class="info-group">
                    <p style="font-size: 14px;"><i class="fa-solid fa-graduation-cap" style="color: #64748b; width: 20px;"></i> Classes: <strong style="color: #10b981;">${app.student_demographics.length}</strong> registered</p>
                </div>
                
                <hr style="margin: 25px 0; border: none; border-top: 1px dashed #cbd5e1;">
                <h4 style="margin-bottom: 15px; color: #475569; font-size: 14px; text-transform: uppercase;"><i class="fa-solid fa-paperclip"></i> Uploaded Documents</h4>
                <div class="documents-grid" style="display: flex; flex-direction: column; gap: 8px;">
                    ${app.documents && app.documents.length > 0 ? 
                        app.documents.map(doc => `
                            <a href="${escapeHTML(doc.secure_url)}" target="_blank" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; text-decoration: none; color: #334155; font-size: 13px; transition: all 0.2s;">
                                <span><i class="fa-solid fa-file-pdf" style="color: #ef4444; margin-right: 8px;"></i> ${escapeHTML(doc.document_type.replace(/_/g, ' '))}</span>
                                <i class="fa-solid fa-arrow-up-right-from-square" style="color: #94a3b8;"></i>
                            </a>
                        `).join('')
                        : '<p style="font-size: 13px; color: #64748b; font-style: italic;">No documents uploaded.</p>'
                    }
                </div>
            `;

            // Inject Stateless ID into Decision Buttons
            document.querySelectorAll('.decision-trigger').forEach(btn => {
                btn.setAttribute('data-app-id', escapeHTML(app.id));
            });

            // Use direct URL with secure token query parameter instead of Blob
            // This prevents browsers from blocking Blob URLs or downloading them incorrectly.
            pdfFrame.src = `/api/review/applications/${appId}/pdf?token=${token}`;

            modal.style.display = 'block';

        } catch (error) {
            console.error(error);
            showToast('Error loading application details', 'error');
        } finally {
            // Restore button state
            triggerButton.disabled = false;
            triggerButton.innerHTML = originalBtnHTML;
        }
    }

    function closeModal() {
        modal.style.display = 'none';
        decisionRemarks.value = '';
        pdfFrame.src = '';
        
        // Prevent memory leaks
        if (currentPdfBlobUrl) {
            URL.revokeObjectURL(currentPdfBlobUrl);
            currentPdfBlobUrl = null;
        }
    }

    // ==========================================
    // 3. DECISION SUBMISSION
    // ==========================================
    async function handleDecision(appId, status, buttonEl) {
        const remarks = decisionRemarks.value;
        if (!remarks.trim()) {
            alert('Remarks are mandatory!');
            return;
        }

        const originalBtnHTML = buttonEl.innerHTML;
        buttonEl.disabled = true;
        buttonEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;

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
    decisionButtonsContainer.addEventListener('click', (event) => {
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
    const btnLogout = document.getElementById('btnLogout');
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
        if (str === null || str === undefined) return '';
        // Strict coercion to string before regex replacements (prevents TypeError)
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ==========================================
    // INIT
    // ==========================================
    loadApplications();
});
