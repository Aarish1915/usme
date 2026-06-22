const { z } = require('zod');

// Helper regexes
const phoneRegex = /^\d{10}$/;
const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
const numberRegex = /^\d+$/;
const currentYear = new Date().getFullYear();

// Step 1: Basic Details
const step1Schema = z.object({
    q1_name: z.string().min(2, 'Institution name is required (2-150 chars)').max(150),
    q2_address: z.string().min(5, 'Address is required'),
    q3_year: z.string().regex(/^\d{4}$/, 'Year must be exactly 4 digits').refine((val) => {
        const y = parseInt(val);
        return y >= 1900 && y <= currentYear;
    }, `Year must be between 1900 and ${currentYear}`),
    q4_rec_details: z.string().min(3, 'Recognition details must be at least 3 characters'),
    q5_rec_no_date: z.string().min(3, 'Recognition no/date must be at least 3 characters'),
    q5_upload: z.string().optional(),
    q6_renewal: z.string().min(3, 'Renewal details must be at least 3 characters')
});

// Step 2: Society & Land Details
const step2Schema = z.object({
    q7_society: z.string().min(5, 'Society details must be at least 5 characters'),
    q7_upload: z.string().optional(),
    q8_gst: z.string().regex(gstRegex, 'Must be a valid 15-character Indian GST Number').or(z.literal('').optional()),
    q8_upload: z.string().optional(),
    q10_land: z.string().min(5, 'Land ownership details must be at least 5 characters'),
    q10_upload: z.string().optional()
});

// Step 3: Management & Banking
const memberSchema = z.object({
    name: z.string().min(2, 'Name required'),
    fname: z.string().min(2, 'Father name required'),
    dob: z.string().min(4, 'DOB required'),
    designation: z.string().min(2, 'Designation required'),
    address: z.string().min(5, 'Full address required'),
    phone: z.string().regex(phoneRegex, 'Phone number must be exactly 10 digits'),
    qualification: z.string().min(2, 'Qualification required'),
    experience: z.string().min(1, 'Experience required')
});

const step3Schema = z.object({
    q9_members: z.array(memberSchema).min(1, 'At least one management member required'),
    q11_bank: z.string().min(5, 'Bank details must be at least 5 characters'),
    q11_upload: z.string().optional(),
    q12_manager: z.string().min(3, 'Manager details required'),
    q13_status: z.string().min(3, 'Status required')
});

// Step 4: Staff, Students & Affidavits
const staffSchema = z.object({
    name: z.string().min(2, 'Name required'),
    designation: z.string().min(2, 'Designation required'),
    address: z.string().min(5, 'Address & Phone required'),
    profession: z.string().min(2, 'Profession required')
});

const classSchema = z.object({
    className: z.string().min(1, 'Class name required'),
    minority_boys: z.string().regex(numberRegex, 'Must be a number'),
    minority_girls: z.string().regex(numberRegex, 'Must be a number'),
    minority_total: z.string().regex(numberRegex, 'Must be a number'),
    others_boys: z.string().regex(numberRegex, 'Must be a number'),
    others_girls: z.string().regex(numberRegex, 'Must be a number'),
    others_total: z.string().regex(numberRegex, 'Must be a number'),
    grand_total: z.string().regex(numberRegex, 'Must be a number')
}).refine((data) => {
    // Cross-field validation for Form III row totals
    const m_t = parseInt(data.minority_boys) + parseInt(data.minority_girls);
    const o_t = parseInt(data.others_boys) + parseInt(data.others_girls);
    if (parseInt(data.minority_total) !== m_t) return false;
    if (parseInt(data.others_total) !== o_t) return false;
    if (parseInt(data.grand_total) !== m_t + o_t) return false;
    return true;
}, { message: "Class row totals do not add up mathematically. Please verify your student counts." });

const step4Schema = z.object({
    q14_upload: z.string().optional(),
    q16_upload: z.string().optional(),
    q17_upload: z.string().optional(),
    q15_staff: z.array(staffSchema).min(1, 'At least one staff member required'),
    q18_fee: z.string().min(3, 'Fee details required'),
    q19_classes: z.array(classSchema).min(1, 'At least one class required'),
    q20_other: z.string().optional(),
    justification_upload: z.string().optional()
});

// Full Schema for Final Submit
const fullSchema = z.object({
    ...step1Schema.shape,
    ...step2Schema.shape,
    ...step3Schema.shape,
    ...step4Schema.shape
});

const schemas = {
    1: step1Schema,
    2: step2Schema,
    3: step3Schema,
    4: step4Schema
};

module.exports = { schemas, fullSchema };
