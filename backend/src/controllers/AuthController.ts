// @ts-ignore
const bcrypt = require('bcryptjs');
// @ts-ignore
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    canAccessSleep: user.canAccessSleep,
    canAccessWorkouts: user.canAccessWorkouts,
    canAccessNutrition: user.canAccessNutrition,
    canAccessHealth: user.canAccessHealth,
    canAccessGoals: user.canAccessGoals,
  };
}

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, isAdmin: user.isAdmin, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES }
  );
}

class AuthController {
  static async register(req, res) {
    const { email, password, name } = req.body;

    try {
      const { User } = require('../entities/User');
      const userRepository = req.app.locals.dataSource.getRepository(User);
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = userRepository.create({
        email,
        password: hashedPassword,
        name,
        isAdmin: false,
      });
      await userRepository.save(user);

      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async me(req, res) {
    try {
      const { User } = require('../entities/User');
      const userRepository = req.app.locals.dataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: req.user.id } });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      res.json(toPublicUser(user));
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async login(req, res) {
    const { email, password } = req.body;

    try {
      const { User } = require('../entities/User');
      const userRepository = req.app.locals.dataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { email } });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      res.json({
        token: signAccessToken(user),
        refreshToken: signRefreshToken(user),
        user: toPublicUser(user),
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async refresh(req, res) {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      if (decoded.type !== 'refresh') {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      const { User } = require('../entities/User');
      const userRepository = req.app.locals.dataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: decoded.id } });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      res.json({
        token: signAccessToken(user),
        refreshToken: signRefreshToken(user),
        user: toPublicUser(user),
      });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
  }
}

module.exports = AuthController;

export {};
