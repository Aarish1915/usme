# USAME Online Application Portal

This is the official Backend API and Frontend Portal for the Uttarakhand State Minority Education (USAME) Authority.

## Features
- **Secure Authentication:** JWT-based applicant and admin login, with Twilio SMS OTP verification for Registration, Login, and Password Recovery.
- **Dynamic Application Workflow:** A robust 4-step wizard for educational institutions to submit their minority recognition details, including dynamically generated tabular data.
- **Automated PDF Generation:** The system instantly generates legally compliant PDF dossiers using `pdfkit`, natively stamping applications upon submission.
- **Cloud Storage (S3 / Supabase):** Seamlessly uploads, retrieves, and presigns institutional affidavits and documents to an AWS S3-compatible bucket (`DOCM`).
- **Fully Responsive:** Beautifully designed glass-morphism interface that dynamically scales across Desktops, Tablets, and Mobile phones.

---

## 🚀 Deployment Guide (Render.com)

This application is perfectly pre-configured to be deployed on **Render**.

### 1. Connect Repository
1. Go to your Render Dashboard and create a **New Web Service**.
2. Connect your GitHub account and select the `Aarish1915/usme` repository.

### 2. Configure Service
Fill out the setup form with the following details:
- **Environment**: `Node`
- **Build Command**: `npm install && npx prisma generate` *(Critical: This builds the database client)*
- **Start Command**: `npm start`

### 3. Environment Variables
Add the following variables in the **Environment Variables** section on Render (copy the exact values from your local `.env` file):

```text
DATABASE_URL=your-supabase-connection-string
JWT_SECRET=your-secret
NODE_ENV=production
S3_ENDPOINT=https://<YOUR-ID>.supabase.co/storage/v1/s3
S3_REGION=us-east-1
S3_BUCKET=DOCM
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
```
*(Render will automatically assign a `PORT`, so you do not need to include it).*

### 4. Deploy!
Click **Create Web Service**. Render will automatically build the Prisma client and launch the application!

---

## Technical Stack
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (via Prisma ORM)
- **Frontend:** Vanilla JS, HTML, CSS (Glass-morphism design)
- **Integrations:** Twilio (SMS), AWS SDK v2 (S3 Storage)
