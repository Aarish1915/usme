const PDFDocument = require('pdfkit');

function generateApplicationPDF(data, res) {
    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('USAME Application Form', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Minority Educational Institution Recognition', { align: 'center' });
    doc.moveDown(2);

    const drawField = (labelEn, labelHi, value) => {
        doc.font('Helvetica-Bold').fontSize(11).text(labelEn);
        // Fallback for Hindi (PDFKit default font doesn't support Devangari out of the box so we'll just write the English label to avoid ??? characters)
        // Note: To support actual Hindi text in PDFKit, a unicode font like NotoSansDevanagari must be embedded.
        // For now, we will just use the English text.
        doc.font('Helvetica').fontSize(11).text(`${value || 'Not provided'}`);
        doc.moveDown(0.5);
    };

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#10b981').text('1. Basic Institution Details');
    doc.fillColor('black').moveDown(0.5);
    drawField('1. Institution Name:', '', data.q1_name);
    drawField('2. Address:', '', data.q2_address);
    drawField('3. Year of Establishment:', '', data.q3_year);
    drawField('4. Recognition Details:', '', data.q4_rec_details);
    drawField('5. Recognition No & Date:', '', data.q5_rec_no_date);
    drawField('6. Renewal Details:', '', data.q6_renewal);

    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#10b981').text('2. Society & Land Details');
    doc.fillColor('black').moveDown(0.5);
    drawField('7. Society Registration Details:', '', data.q7_society);
    drawField('8. GST Registration Number:', '', data.q8_gst);
    drawField('10. Land Ownership/Lease Details:', '', data.q10_land);

    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#10b981').text('3. Management & Banking');
    doc.fillColor('black').moveDown(0.5);
    drawField('11. Bank Account Details:', '', data.q11_bank);
    drawField('12. Currently Managed By:', '', data.q12_manager);
    drawField('13. Status of Management:', '', data.q13_status);

    doc.moveDown();
    doc.font('Helvetica-Bold').text('9. Management Committee Members:');
    doc.font('Helvetica').moveDown(0.5);
    if (data.q9_members && data.q9_members.length > 0) {
        data.q9_members.forEach((m, i) => {
            doc.text(`${i + 1}. ${m.name} (${m.designation}) - Phone: ${m.phone} | Exp: ${m.experience || 'N/A'}`);
        });
    } else {
        doc.text('No members added.');
    }

    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#10b981').text('4. Staff, Students & Other Details');
    doc.fillColor('black').moveDown(0.5);
    drawField('18. Fee Details:', '', data.q18_fee);
    drawField('20. Other Details:', '', data.q20_other);

    doc.moveDown();
    doc.font('Helvetica-Bold').text('15. Staff List:');
    doc.font('Helvetica').moveDown(0.5);
    if (data.q15_staff && data.q15_staff.length > 0) {
        data.q15_staff.forEach((m, i) => {
            doc.text(`${i + 1}. ${m.name} (${m.designation}) - Profession: ${m.profession}`);
        });
    } else {
        doc.text('No staff added.');
    }

    doc.moveDown();
    doc.font('Helvetica-Bold').text('19. Classes & Students:');
    doc.font('Helvetica').moveDown(0.5);
    if (data.q19_classes && data.q19_classes.length > 0) {
        data.q19_classes.forEach((m, i) => {
            doc.text(`${i + 1}. Class ${m.className} | Minority Total: ${m.minority_total || 0} | Others Total: ${m.others_total || 0} | Grand Total: ${m.grand_total || 0}`);
        });
    } else {
        doc.text('No classes added.');
    }

    doc.end();
}

module.exports = { generateApplicationPDF };
