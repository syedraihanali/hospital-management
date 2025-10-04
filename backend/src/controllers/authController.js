const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const { findUserByEmail } = require('../services/userService');

const SUPPORTED_ROLES = new Set(['admin', 'doctor', 'patient']);

// Authenticates a user by role and issues a signed JWT.
async function signIn(req, res) {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Please provide email, password, and role.' });
  }

  const normalizedRole = role.toLowerCase();
  if (!SUPPORTED_ROLES.has(normalizedRole)) {
    return res.status(400).json({ message: 'Unsupported role supplied.' });
  }

  const user = await findUserByEmail(email);
  if (!user || user.role !== normalizedRole) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Incorrect password.' });
  }

  const subjectId =
    user.role === 'admin' ? user.adminId : user.role === 'doctor' ? user.doctorId : user.patientId;

  if (!subjectId) {
    return res.status(500).json({ message: 'User record is missing role association.' });
  }

  const fullName =
    user.role === 'admin' ? user.adminName : user.role === 'doctor' ? user.doctorName : user.patientName;

  const tokenPayload = {
    userId: user.userId,
    id: subjectId,
    role: user.role,
    email: user.email,
    ...(fullName ? { fullName } : {}),
  };

  const token = jwt.sign(tokenPayload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  return res.json({
    message: 'Sign-in successful',
    token,
    user: {
      id: subjectId,
      fullName,
      email: user.email,
      role: user.role,
    },
  });
}

// Stateless logout endpoint retained for API symmetry.
function logout(_req, res) {
  return res.json({ message: 'Logout successful' });
}

module.exports = {
  signIn,
  logout,
};
