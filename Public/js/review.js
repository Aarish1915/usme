const token = localStorage.getItem('usame_token');
const regId = localStorage.getItem('usame_reg_id');

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
    document.getElementById('btn-rev-back').addEventListener('click', () => {
        window.location.href = 'application.html';
    });
    
    document.getElementById('btn-rev-dash').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    
    document.getElementById('btn-final-submit').addEventListener('click', finalSubmit);
    document.getElementById('btn-dl-pdf').addEventListener('click', downloadPDF);

    try {
        const res = await fetch(`/api/applications/${regId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data && data.draft_data) {
            populateReview(data.draft_data);
        } else {
            showToast("Failed to load application data.", "error");
        }
    } catch (err) {
        console.error(err);
        showToast("Error fetching application.", "error");
    }
});

function populateReview(d) {
    const textFields = [
        'q1', 'q2', 'q3', 'q4', 'q5', 'q6',
        'q7', 'q8', 'q10',
        'q11', 'q12', 'q13',
        'q18', 'q20'
    ];
    
    // Fill text fields
    textFields.forEach(id => {
        const el = document.getElementById('rev_' + id);
        if (el) {
            el.innerText = d[id + (id === 'q1' ? '_name' : id === 'q2' ? '_address' : id === 'q3' ? '_year' : id === 'q4' ? '_rec_details' : id === 'q5' ? '_rec_no_date' : id === 'q6' ? '_renewal' : id === 'q7' ? '_society' : id === 'q8' ? '_gst' : id === 'q10' ? '_land' : id === 'q11' ? '_bank' : id === 'q12' ? '_manager' : id === 'q13' ? '_status' : id === 'q18' ? '_fee' : id === 'q20' ? '_other' : '')] || 'Not provided';
        }
    });
    
    // Exact mapping because my variable logic above is messy:
    document.getElementById('rev_q1').innerText = d.q1_name || 'Not provided';
    document.getElementById('rev_q2').innerText = d.q2_address || 'Not provided';
    document.getElementById('rev_q3').innerText = d.q3_year || 'Not provided';
    document.getElementById('rev_q4').innerText = d.q4_rec_details || 'Not provided';
    document.getElementById('rev_q5').innerText = d.q5_rec_no_date || 'Not provided';
    document.getElementById('rev_q6').innerText = d.q6_renewal || 'Not provided';
    document.getElementById('rev_q7').innerText = d.q7_society || 'Not provided';
    document.getElementById('rev_q8').innerText = d.q8_gst || 'Not provided';
    document.getElementById('rev_q10').innerText = d.q10_land || 'Not provided';
    document.getElementById('rev_q11').innerText = d.q11_bank || 'Not provided';
    document.getElementById('rev_q12').innerText = d.q12_manager || 'Not provided';
    document.getElementById('rev_q13').innerText = d.q13_status || 'Not provided';
    document.getElementById('rev_q18').innerText = d.q18_fee || 'Not provided';
    document.getElementById('rev_q20').innerText = d.q20_other || 'Not provided';

    // Render Members Table
    const t9 = document.getElementById('rev_q9_table').querySelector('tbody');
    (d.q9_members || []).forEach(m => {
        t9.innerHTML += `<tr><td>${m.name}</td><td>${m.fname}</td><td>${m.dob}</td><td>${m.designation}</td><td>${m.address}</td><td>${m.phone}</td><td>${m.qualification}</td><td>${m.experience || 'N/A'}</td></tr>`;
    });

    // Render Staff Table
    const t15 = document.getElementById('rev_q15_table').querySelector('tbody');
    (d.q15_staff || []).forEach(m => {
        t15.innerHTML += `<tr><td>${m.name}</td><td>${m.designation}</td><td>${m.address}</td><td>${m.profession}</td></tr>`;
    });

    // Render Class Table
    const t19 = document.getElementById('rev_q19_table').querySelector('tbody');
    (d.q19_classes || []).forEach(m => {
        t19.innerHTML += `<tr>
            <td>${m.className}</td>
            <td>${m.minority_boys || '0'}</td><td>${m.minority_girls || '0'}</td><td>${m.minority_total || '0'}</td>
            <td>${m.others_boys || '0'}</td><td>${m.others_girls || '0'}</td><td>${m.others_total || '0'}</td>
            <td><b>${m.grand_total || '0'}</b></td>
        </tr>`;
    });

    // Render Files
    const docsBox = document.getElementById('docs-box');
    const fileFields = {
        'q5_upload': 'Recognition Letter',
        'q7_upload': 'Society Bylaws',
        'q8_upload': 'GST Certificate',
        'q10_upload': 'Land Documents',
        'q11_upload': 'Bank Details',
        'q14_upload': 'Affidavit (Not force religion)',
        'q16_upload': 'Affidavit (Communal harmony)',
        'q17_upload': 'Affidavit (TMA Pai)',
        'justification_upload': '15% Rule Justification (Admin Override Request)'
    };
    
    Object.keys(fileFields).forEach(key => {
        if (d[key]) {
            docsBox.innerHTML += `<div class="review-item"><div class="review-label">${fileFields[key]}</div><div class="review-value" style="color: var(--success);">✅ <a href="${d[key]}" target="_blank">View File</a></div></div>`;
        }
    });
}

function finalSubmit() {
    document.getElementById('btn-final-submit').innerText = "Submitting...";
    document.getElementById('btn-final-submit').disabled = true;

    fetch(`/api/applications/${regId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }).then(async r => {
        const res = await r.json();
        if(res.ok) {
            document.getElementById('review-container').style.display = 'none';
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
        const res = await fetch(`/api/applications/${regId}/pdf`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to download PDF");
        
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `USAME_Application_${regId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast("PDF Downloaded successfully!");
    } catch (err) {
        showToast("Error generating PDF", "error");
    } finally {
        document.getElementById('btn-dl-pdf').innerText = "📄 Download Official PDF";
        document.getElementById('btn-dl-pdf').disabled = false;
    }
}
