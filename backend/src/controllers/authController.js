import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as userRepository from '../repositories/userRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'edunotify_enterprise_security_jwt_secret_token_123456';

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const user = await userRepository.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'User account is inactive. Please contact school administration.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Sign JWT
    const token = jwt.sign(
      {
        id: user.id,
        school_id: user.school_id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        school_name: user.school_name,
        school_code: user.school_code
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        school_id: user.school_id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        school_name: user.school_name,
        school_code: user.school_code
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'An internal server error occurred during login.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await userRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User session not found.' });
    }
    return res.json({ user });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};
