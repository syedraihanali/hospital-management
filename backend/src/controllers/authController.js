const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const { findUserByEmail } = require('../services/userService');

// Authenticates a user and issues a signed JWT using the stored role metadata.
async function signIn(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password.' });
  }

  const user = await findUserByEmail(email);
  if (!user) {
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
