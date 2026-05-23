// ──────────────────────────────────────────────
//  Role Middleware — PBAC Role Verification
// ──────────────────────────────────────────────

/**
 * Protects routes by verifying the user role against an array of allowed roles.
 * Must be used AFTER authMiddleware.
 * 
 * @param {string[]} allowedRoles - Array of roles permitted to access the route (e.g., ['teacher', 'admin'])
 */
module.exports = (allowedRoles) => {
    return (req, res, next) => {
        // req.user is populated by authMiddleware
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `Access denied. Requires one of these roles: ${allowedRoles.join(', ')}.`,
            });
        }
        next();
    };
};
