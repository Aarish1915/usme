function requireRole(roles) {
    return (req, res, next) => {
        // req.user is set by auth.middleware.js
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
}

module.exports = { requireRole };
