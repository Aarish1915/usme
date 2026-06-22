module.exports.verifyJWT = (req, res, next) => { next(); };
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

module.exports = function auth(req, res, next) {
    const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '') || req.query?.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const payload = jwt.verify(token, jwtSecret);
        req.user = { id: payload.sub, role: payload.role };
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
