const token = localStorage.getItem('usame_token');
const regId = localStorage.getItem('usame_reg_id');

const API_BASE = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') 
    ? 'http://localhost:3001' 
    : '';

if (!token || !regId) {
    window.location.href = 'index.html';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => { toast.className = 'toast'; }, 3000);
}

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('btn-rev-back')?.addEventListener('click', () => {
        window.location.href = 'application.html';
    });
    
    document.getElementById('btn-rev-back-2')?.addEventListener('click', () => {
        window.location.href = 'application.html';
    });
    
    document.getElementById('btn-rev-dash')?.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    
    document.getElementById('btn-final-submit')?.addEventListener('click', finalSubmit);
    document.getElementById('btn-dl-pdf')?.addEventListener('click', downloadPDF);
    document.getElementById('btn-view-submitted')?.addEventListener('click', () => {
        document.getElementById('success-container').style.display = 'none';
        document.getElementById('review-content').style.display = 'block';
    });
    
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = 'application.html';
        });
    });

    try {
        const res = await fetch(`${API_BASE}/api/applications/${regId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data) {
            populateReview(data.draft_data || {});
            
            // If already submitted, hide edit/submit buttons and show PDF button
            if (data.status !== 'draft') {
                document.getElementById('btn-rev-back').style.display = 'none';
                document.getElementById('btn-rev-back-2').style.display = 'none';
                document.getElementById('btn-final-submit').style.display = 'none';
                
                document.querySelectorAll('.btn-edit').forEach(btn => btn.style.display = 'none');
                
                // Add a download button next to the back button if we want, or just rely on dashboard
                // Let's change the header text
                const header = document.querySelector('.page-header h1');
                if (header) header.innerText = 'Application Details (Submitted)';
                const warningBanner = document.querySelector('.warning-banner');
                if (warningBanner) warningBanner.style.display = 'none';
                
                const dlBtn = document.getElementById('btn-dl-pdf-submitted');
                if (dlBtn) {
                    dlBtn.style.display = 'inline-flex';
                    dlBtn.addEventListener('click', downloadPDF);
                }
            }
        } else {
            showToast("Failed to load application data.", "error");
        }
    } catch (err) {
        console.error(err);
        showToast("Error fetching application.", "error");
    }
});

function populateReview(d) {
    let hasMissingData = false;

    function checkMissing(val) {
        if (val === undefined || val === null || String(val).trim() === '') {
            hasMissingData = true;
            return '<span style="background:#fef2f2; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600; color:#ef4444; border: 1px solid #fecaca;">Not Filled</span>';
        }
        return val;
    }

    // Basic mapping
    const basicMapping = {
        'rev_q1': d.q1_name,
        'rev_q2': d.q2_address,
        'rev_q3': d.q3_year,
        'rev_q4': d.q4_rec_details,
        'rev_q5': d.q5_rec_no_date,
        'rev_q6': d.q6_renewal,
        'rev_q7': d.q7_society,
        'rev_q8': d.q8_gst,
        'rev_q10': d.q10_land,
        'rev_q11': d.q11_bank,
        'rev_q12': d.q12_manager,
        'rev_q13': d.q13_status,
        'rev_q18': d.q18_fees || d.q18_fee,
        'rev_q20': d.q20_other
    };

    Object.keys(basicMapping).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Some fields might be optional, but for now we mark empty ones as missing. 
            // The prompt says: "if user don't fill all data we not force to fill all of we can proceed but before submission when we give the user to review your application so the these deatiles are missing".
            // GST and Other might be optional, let's treat only q8 and q20 as optional.
            if (id === 'rev_q8' || id === 'rev_q20') {
                el.innerHTML = basicMapping[id] || '<span style="color:var(--text-muted);">Not Provided</span>';
            } else {
                el.innerHTML = checkMissing(basicMapping[id]);
            }
        }
    });

    // Render Members Table
    const t9 = document.getElementById('rev_q9_table').querySelector('tbody');
    if (d.q9_members && d.q9_members.length > 0) {
        d.q9_members.forEach(m => {
            t9.innerHTML += `<tr><td>${m.name}</td><td>${m.fname}</td><td>${m.dob}</td><td>${m.designation}</td><td>${m.address}</td><td>${m.phone}</td><td>${m.qualification}</td><td>${m.experience || 'N/A'}</td></tr>`;
        });
    } else {
        hasMissingData = true;
        t9.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 20px;"><span style="background:#fef2f2; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600; color:#ef4444; border: 1px solid #fecaca;">Not Filled</span></td></tr>`;
    }

    // Render Staff Table
    const t15 = document.getElementById('rev_q15_table').querySelector('tbody');
    if (d.q15_staff && d.q15_staff.length > 0) {
        d.q15_staff.forEach(m => {
            t15.innerHTML += `<tr><td>${m.name}</td><td>${m.designation}</td><td>${m.address}</td><td>${m.profession}</td></tr>`;
        });
    } else {
        hasMissingData = true;
        t15.innerHTML = `<tr><td colspan="4" class="text-center" style="padding: 20px;"><span style="background:#fef2f2; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600; color:#ef4444; border: 1px solid #fecaca;">Not Filled</span></td></tr>`;
    }

    // Render Class Table
    const t19 = document.getElementById('rev_q19_table').querySelector('tbody');
    if (d.q19_classes && d.q19_classes.length > 0) {
        d.q19_classes.forEach(m => {
            t19.innerHTML += `<tr>
                <td>${m.className}</td>
                <td class="text-center">${m.minority_boys || '0'}</td><td class="text-center">${m.minority_girls || '0'}</td><td class="text-center"><b>${m.minority_total || '0'}</b></td>
                <td class="text-center">${m.others_boys || '0'}</td><td class="text-center">${m.others_girls || '0'}</td><td class="text-center"><b>${m.others_total || '0'}</b></td>
                <td class="text-center"><b>${m.grand_total || '0'}</b></td>
            </tr>`;
        });
    } else {
        hasMissingData = true;
        t19.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 20px;"><span style="background:#fef2f2; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600; color:#ef4444; border: 1px solid #fecaca;">Not Filled</span></td></tr>`;
    }

    // Render Files
    const docsBox = document.getElementById('docs-box');
    const fileFields = {
        'q5_upload': 'Recognition Letter',
        'q7_upload': 'Society Bylaws',
        'q8_upload': 'GST Certificate (Optional)',
        'q10_upload': 'Land Documents',
        'q11_upload': 'Bank Details',
        'q14_upload': 'Affidavit Rs 10 (No Religious Compulsion)',
        'q16_upload': 'Affidavit Rs 10 (Communal Harmony)',
        'q17_upload': 'Affidavit Rs 10 (TMA Pai Foundation)'
    };
    
    Object.keys(fileFields).forEach(key => {
        if (d[key]) {
            docsBox.innerHTML += `
                <a href="${d[key]}" target="_blank" class="file-chip">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    ${fileFields[key]}
                </a>
            `;
        } else {
            if (key !== 'q8_upload') {
                hasMissingData = true;
                docsBox.innerHTML += `
                    <div class="file-chip missing">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        Missing: ${fileFields[key]}
                    </div>
                `;
            }
        }
    });

    if (docsBox.innerHTML.trim() === '') {
        docsBox.innerHTML = '<p style="color: var(--text-muted); font-size: 0.95rem;">No documents uploaded.</p>';
    }

    if (hasMissingData) {
        document.getElementById('missing-data-banner').style.display = 'flex';
        const submitBtn = document.getElementById('btn-final-submit');
        submitBtn.innerHTML = 'Submit Application (with missing data)';
    }
}

function finalSubmit() {
    document.getElementById('btn-final-submit').innerText = "Submitting...";
    document.getElementById('btn-final-submit').disabled = true;

    fetch(`${API_BASE}/api/applications/${regId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }).then(async r => {
        const res = await r.json();
        if(res.ok) {
            document.getElementById('review-content').style.display = 'none';
            document.getElementById('success-container').style.display = 'block';
        } else {
            showToast(res.error || "Error submitting application.", "error");
            document.getElementById('btn-final-submit').innerText = "Acknowledge & Final Submit";
            document.getElementById('btn-final-submit').disabled = false;
        }
    }).catch(err => {
        showToast("Server error", "error");
        document.getElementById('btn-final-submit').innerText = "Acknowledge & Final Submit";
        document.getElementById('btn-final-submit').disabled = false;
    });
}

async function downloadPDF() {
    showToast("Generating PDF...");
    document.getElementById('btn-dl-pdf').innerText = "Downloading...";
    document.getElementById('btn-dl-pdf').disabled = true;

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
            showToast("Download started!");
        } else {
            showToast("Failed to download PDF", "error");
        }
    } catch(err) {
        showToast("Server error", "error");
    } finally {
        document.getElementById('btn-dl-pdf').innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download Official PDF`;
        document.getElementById('btn-dl-pdf').disabled = false;
    }
}
