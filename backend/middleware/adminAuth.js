require('dotenv').config();

// Protects admin-only routes.
// Frontend must send header: 'x-admin-password': <the password entered at login>
const adminAuth = (req, res, next) => {
  const password = req.headers['x-admin-password'];

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Unauthorized: admin access only' });
  }

  next();
};

module.exports = adminAuth;
