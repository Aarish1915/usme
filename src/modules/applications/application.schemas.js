const { z } = require('zod');

// Helper regexes
const phoneRegex = /^\d{10}$/;
const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
const numberRegex = /^\d+$/;
const currentYear = new Date().getFullYear();

// Step 1: Basic Details
const step1Schema = z.object({
    q1_name: z.string().optional(),
    q2_address: z.string().optional(),
    q3_year: z.string().optional(),
    q4_rec_details: z.string().optional(),
    q5_rec_no_date: z.string().optional(),
    q5_upload: z.string().optional(),
    q6_renewal: z.string().optional()
});

// Step 2: Society & Land Details
const step2Schema = z.object({
    q7_society: z.string().optional(),
    q7_upload: z.string().optional(),
    q8_gst: z.string().optional(),
    q8_upload: z.string().optional(),
    q10_land: z.string().optional(),
    q10_upload: z.string().optional()
});

// Step 3: Management & Banking
const memberSchema = z.object({
    name: z.string().optional(),
    fname: z.string().optional(),
    dob: z.string().optional(),
    designation: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    qualification: z.string().optional(),
    experience: z.string().optional()
});

const step3Schema = z.object({
    q9_members: z.array(memberSchema).optional(),
    q11_bank: z.string().optional(),
    q11_upload: z.string().optional(),
    q12_manager: z.string().optional(),
    q13_status: z.string().optional()
});

// Step 4: Staff, Students & Affidavits
const staffSchema = z.object({
    name: z.string().optional(),
    designation: z.string().optional(),
    address: z.string().optional(),
    profession: z.string().optional()
});

const classSchema = z.object({
    className: z.string().optional(),
    minority_boys: z.string().optional(),
    minority_girls: z.string().optional(),
    minority_total: z.string().optional(),
    others_boys: z.string().optional(),
    others_girls: z.string().optional(),
    others_total: z.string().optional(),
    grand_total: z.string().optional()
});

const step4Schema = z.object({
    q14_upload: z.string().optional(),
    q16_upload: z.string().optional(),
    q17_upload: z.string().optional(),
    q15_staff: z.array(staffSchema).optional(),
    q18_fee: z.string().optional(),
    q19_classes: z.array(classSchema).optional(),
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
