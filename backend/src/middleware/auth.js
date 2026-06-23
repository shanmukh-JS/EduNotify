import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'edunotify_enterprise_security_jwt_secret_token_123456';

/**
 * Authentication check middleware.
 * Verifies JWT token and attaches user information to the request context.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info: { id, school_id, username, role, full_name }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * Role authorization guard.
 * Blocks access if user role is not listed in allowedRoles.
 */
export const requireRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. User context missing.' });
    }

    const { role } = req.user;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ 
        error: `Access forbidden. Required roles: [${allowedRoles.join(', ')}]. Current role: ${role}` 
      });
    }

    next();
  };
};
