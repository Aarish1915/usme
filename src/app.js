const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./common/middlewares/errorHandler');
const authRouter = require('./modules/auth/auth.routes');
const applicationRouter = require('./modules/applications/applications.routes');
const documentRouter = require('./modules/documents/documents.routes');
const reviewRouter = require('./modules/review/review.routes');

const app = express();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Required for existing UI styles
            imgSrc: ["'self'", "data:", "blob:"],
            fontSrc: ["'self'"],
            connectSrc: ["'self'"]
        }
    }
}));

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        // Allow localhost and any render.com subdomains
        if (!origin || allowedOrigins.includes(origin) || origin.includes('onrender.com')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../Public')));

app.use('/api/auth', authRouter);
app.use('/api/applications', applicationRouter);
app.use('/api/documents', documentRouter);
app.use('/api/review', reviewRouter);

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'USAME Express API is running' });
});

app.use(errorHandler);

module.exports = app;
