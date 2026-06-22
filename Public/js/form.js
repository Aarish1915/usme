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

const staticFields = [
    'q1_name', 'q2_address', 'q3_year', 'q4_rec_details', 'q5_rec_no_date', 'q6_renewal',
    'q7_society', 'q8_gst', 'q10_land', 'q11_bank', 'q12_manager', 'q13_status', 'q18_fee', 'q20_other'
];

const fileFields = [
    'q5_upload', 'q7_upload', 'q8_upload', 'q10_upload', 'q11_upload', 'q14_upload', 'q16_upload', 'q17_upload'
];

let draftData = {};

async function loadDraft() {
    try {
        const res = await fetch(`/api/applications/${regId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data && data.draft_data) {
            draftData = data.draft_data;
            
            staticFields.forEach(id => {
                const el = document.getElementById(id);
                if (el && draftData[id]) el.value = draftData[id];
            });
            
            fileFields.forEach(id => {
                const el = document.getElementById(id);
                if (el && draftData[id]) {
                    const p = document.createElement('p');
                    p.innerHTML = `✅ <a href="${draftData[id]}" target="_blank">View Uploaded File</a>`;
                    p.style.color = '#10b981';
                    p.style.fontSize = '12px';
                    p.style.marginTop = '5px';
                    el.parentNode.appendChild(p);
                }
            });
            
            populateTable('table-q9', draftData.q9_members || []);
            populateTable('table-q15', draftData.q15_staff || []);
            populateTable('table-q19', draftData.q19_classes || []);
            
            if (data.current_step) goToStep(data.current_step);
        }
    } catch (err) {
        console.error('Failed to load draft:', err);
    }
}

function populateTable(tableId, rowsData) {
    const tbody = document.getElementById(tableId).querySelector('tbody');
    tbody.innerHTML = '';
    rowsData.forEach(rowData => {
        addTableRow(tableId, rowData);
    });
}

function addTableRow(tableId, data = null) {
    const tbody = document.getElementById(tableId).querySelector('tbody');
    const tr = document.createElement('tr');
    
    let html = '';
    if(tableId === 'table-q9') {
        html = `<td><input type="text" placeholder="Name" value="${data ? data.name : ''}"></td>
                <td><input type="text" placeholder="Father" value="${data ? data.fname : ''}"></td>
                <td><input type="text" placeholder="DOB" value="${data ? data.dob : ''}"></td>
                <td><input type="text" placeholder="Position" value="${data ? data.designation : ''}"></td>
                <td><input type="text" placeholder="Address" value="${data ? data.address : ''}"></td>
                <td><input type="text" placeholder="Phone" value="${data ? data.phone : ''}"></td>
                <td><input type="text" placeholder="Qualification" value="${data ? data.qualification : ''}"></td>
                <td><input type="text" placeholder="Experience" value="${data ? data.experience : ''}"></td>`;
    } else if(tableId === 'table-q15') {
        html = `<td><input type="text" placeholder="Name" value="${data ? data.name : ''}"></td>
                <td><input type="text" placeholder="Designation" value="${data ? data.designation : ''}"></td>
                <td><input type="text" placeholder="Address" value="${data ? data.address : ''}"></td>
                <td><input type="text" placeholder="Profession" value="${data ? data.profession : ''}"></td>`;
    } else if(tableId === 'table-q19') {
        html = `<td><input type="text" placeholder="Class" value="${data ? data.className : ''}"></td>
                <td><input type="text" class="tbl-input-num min-b" placeholder="0" value="${data ? data.minority_boys : '0'}"></td>
                <td><input type="text" class="tbl-input-num min-g" placeholder="0" value="${data ? data.minority_girls : '0'}"></td>
                <td><input type="text" class="tbl-input-num min-t" placeholder="0" value="${data ? data.minority_total : '0'}" readonly style="background:#f3f4f6;"></td>
                <td><input type="text" class="tbl-input-num oth-b" placeholder="0" value="${data ? data.others_boys : '0'}"></td>
                <td><input type="text" class="tbl-input-num oth-g" placeholder="0" value="${data ? data.others_girls : '0'}"></td>
                <td><input type="text" class="tbl-input-num oth-t" placeholder="0" value="${data ? data.others_total : '0'}" readonly style="background:#f3f4f6;"></td>
                <td><input type="text" class="tbl-input-num grand-t" placeholder="0" value="${data ? data.grand_total : '0'}" readonly style="background:#e5e7eb; font-weight:bold;"></td>`;
    }
    
    html += `<td><button type="button" class="row-del-btn" onclick="this.closest('tr').remove()">X</button></td>`;
    tr.innerHTML = html;
    
    // Add event listeners for auto-calc on table-q19
    if (tableId === 'table-q19') {
        const inputs = tr.querySelectorAll('input:not([readonly])');
        inputs.forEach(inp => {
            inp.addEventListener('input', () => {
                const mb = parseInt(tr.querySelector('.min-b').value) || 0;
                const mg = parseInt(tr.querySelector('.min-g').value) || 0;
                const ob = parseInt(tr.querySelector('.oth-b').value) || 0;
                const og = parseInt(tr.querySelector('.oth-g').value) || 0;
                
                tr.querySelector('.min-t').value = mb + mg;
                tr.querySelector('.oth-t').value = ob + og;
                tr.querySelector('.grand-t').value = (mb + mg) + (ob + og);
                
                checkNonMinorityPct();
            });
        });
    }

    tbody.appendChild(tr);
}

function checkNonMinorityPct() {
    const data = getTableData('table-q19');
    let minT = 0, othT = 0;
    data.forEach(d => {
        minT += parseInt(d.minority_total) || 0;
        othT += parseInt(d.others_total) || 0;
    });
    const total = minT + othT;
    const jGroup = document.getElementById('justification-group');
    if (total > 0 && (othT / total * 100) > 15) {
        jGroup.style.display = 'block';
    } else {
        jGroup.style.display = 'none';
    }
}

function getTableData(tableId) {
    const rows = document.getElementById(tableId).querySelectorAll('tbody tr');
    const data = [];
    
    rows.forEach(tr => {
        const inputs = tr.querySelectorAll('input');
        let obj = {};
        
        if(tableId === 'table-q9') {
            obj = {
                name: inputs[0].value, fname: inputs[1].value, dob: inputs[2].value,
                designation: inputs[3].value, address: inputs[4].value, phone: inputs[5].value,
                qualification: inputs[6].value, experience: inputs[7].value
            };
        } else if(tableId === 'table-q15') {
            obj = {
                name: inputs[0].value, designation: inputs[1].value,
                address: inputs[2].value, profession: inputs[3].value
            };
        } else if(tableId === 'table-q19') {
            obj = {
                className: inputs[0].value,
                minority_boys: inputs[1].value,
                minority_girls: inputs[2].value,
                minority_total: inputs[3].value,
                others_boys: inputs[4].value,
                others_girls: inputs[5].value,
                others_total: inputs[6].value,
                grand_total: inputs[7].value
            };
        }
        data.push(obj);
    });
    return data;
}

async function uploadFile(fileInputId) {
    const fileInput = document.getElementById(fileInputId);
    if (!fileInput.files.length) return null;
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    showToast('Uploading file...', 'success');
    try {
        const res = await fetch('/api/documents/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            showToast('File uploaded successfully!');
            return data.url;
        } else {
            showToast('File upload failed', 'error');
            return null;
        }
    } catch(err) {
        showToast('File upload error', 'error');
        return null;
    }
}

async function saveStep(stepNum) {
    let payload = {};
    if (stepNum === 1) {
        payload.q1_name = document.getElementById('q1_name').value;
        payload.q2_address = document.getElementById('q2_address').value;
        payload.q3_year = document.getElementById('q3_year').value;
        payload.q4_rec_details = document.getElementById('q4_rec_details').value;
        payload.q5_rec_no_date = document.getElementById('q5_rec_no_date').value;
        payload.q6_renewal = document.getElementById('q6_renewal').value;
        
        if (document.getElementById('q5_upload').files.length) {
            const url = await uploadFile('q5_upload');
            if (url) payload.q5_upload = url;
        } else if (draftData.q5_upload) payload.q5_upload = draftData.q5_upload;
    } else if (stepNum === 2) {
        payload.q7_society = document.getElementById('q7_society').value;
        payload.q8_gst = document.getElementById('q8_gst').value;
        payload.q10_land = document.getElementById('q10_land').value;
        
        for (let id of ['q7_upload', 'q8_upload', 'q10_upload']) {
            if (document.getElementById(id).files.length) {
                const url = await uploadFile(id);
                if (url) payload[id] = url;
            } else if (draftData[id]) payload[id] = draftData[id];
        }
    } else if (stepNum === 3) {
        payload.q11_bank = document.getElementById('q11_bank').value;
        payload.q12_manager = document.getElementById('q12_manager').value;
        payload.q13_status = document.getElementById('q13_status').value;
        
        if (document.getElementById('q11_upload').files.length) {
            const url = await uploadFile('q11_upload');
            if (url) payload.q11_upload = url;
        } else if (draftData.q11_upload) payload.q11_upload = draftData.q11_upload;
        
        payload.q9_members = getTableData('table-q9');
    } else if (stepNum === 4) {
        payload.q18_fee = document.getElementById('q18_fee').value;
        payload.q20_other = document.getElementById('q20_other').value;
        
        for (let id of ['q14_upload', 'q16_upload', 'q17_upload', 'justification_upload']) {
            const el = document.getElementById(id);
            if (el && el.files.length) {
                const url = await uploadFile(id);
                if (url) payload[id] = url;
            } else if (draftData[id]) {
                payload[id] = draftData[id];
            }
        }
        
        payload.q15_staff = getTableData('table-q15');
        payload.q19_classes = getTableData('table-q19');
    }

    try {
        const res = await fetch(`/api/applications/${regId}/step/${stepNum}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.ok) {
            showToast(`Step ${stepNum} Auto-Saved!`);
            Object.assign(draftData, payload);
            return true;
        } else {
            if (data.details) {
                const msgs = data.details.map(d => d.message).join(', ');
                alert(`Validation Error on Step ${stepNum}:\n\n` + msgs);
            } else {
                showToast(data.error || 'Failed to save step', 'error');
            }
            return false;
        }
    } catch (err) {
        showToast('Server error while saving', 'error');
        return false;
    }
}

async function nextStep(current) {
    const success = await saveStep(current);
    if (!success) return; 
    goToStep(current + 1);
}

function prevStep(current) {
    saveStep(current); // Optimistically save
    goToStep(current - 1);
}

function goToStep(step) {
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.step-indicator').forEach(i => i.classList.remove('active'));
    
    const targetStep = document.getElementById('step-' + step);
    const targetInd = document.getElementById('ind-' + step);
    
    if (targetStep) targetStep.classList.add('active');
    if (targetInd) targetInd.classList.add('active');
}

async function submitApplication() {
    const success = await saveStep(4);
    if (!success) return;

    showToast('Validating Affidavits & Preparing Review...');
    try {
        const res = await fetch(`/api/applications/${regId}/validate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.ok) {
            window.location.href = 'review.html';
        } else {
            if (data.details) {
                const msgs = data.details.map(d => d.message).join(', ');
                alert(`Final Validation Error:\n\n` + msgs);
            } else {
                alert(data.message || data.error || 'Submission failed');
            }
        }
    } catch (err) {
        showToast('Server error', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadDraft();

    document.getElementById('btn_back')?.addEventListener('click', () => window.location.href = 'dashboard.html');
    
    document.getElementById('btn-next-1')?.addEventListener('click', () => nextStep(1));
    document.getElementById('btn-prev-2')?.addEventListener('click', () => prevStep(2));
    document.getElementById('btn-next-2')?.addEventListener('click', () => nextStep(2));
    
    document.getElementById('btn-add-q9')?.addEventListener('click', () => addTableRow('table-q9'));
    document.getElementById('btn-prev-3')?.addEventListener('click', () => prevStep(3));
    document.getElementById('btn-next-3')?.addEventListener('click', () => nextStep(3));
    
    document.getElementById('btn-add-q15')?.addEventListener('click', () => addTableRow('table-q15'));
    document.getElementById('btn-add-q19')?.addEventListener('click', () => addTableRow('table-q19'));
    document.getElementById('btn-prev-4')?.addEventListener('click', () => prevStep(4));
    document.getElementById('btn-submit-app')?.addEventListener('click', submitApplication);

    // Event delegation for dynamic delete buttons
    document.addEventListener('click', (e) => {
        if(e.target && e.target.classList.contains('row-del-btn')) {
            e.target.parentElement.parentElement.remove();
        }
    });
});
