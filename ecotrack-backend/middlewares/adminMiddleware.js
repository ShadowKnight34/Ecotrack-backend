// ──────────────────────────────────────────────
//  Admin Middleware — Role Verification
// ──────────────────────────────────────────────

/**
 * Protects admin routes by verifying the user role is 'admin'.
 * Must be used AFTER authMiddleware.
 */
module.exports = (req, res, next) => {
    // req.user is populated by authMiddleware
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied. Admins only.',
        });
    }
    next();
};
