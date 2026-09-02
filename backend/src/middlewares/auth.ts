// @ts-ignore
const jwt = require('jsonwebtoken');

const PERMISSION_MAP = {
  sleep: 'canAccessSleep',
  workouts: 'canAccessWorkouts',
  nutrition: 'canAccessNutrition',
  health: 'canAccessHealth',
  goals: 'canAccessGoals',
};

const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Refresh tokens não podem acessar rotas protegidas
    if (decoded.type === 'refresh') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (!req.app.locals.dataSource) {
      return res.status(503).json({ message: 'Database not ready' });
    }

    const { User } = require('../entities/User');
    const userRepository = req.app.locals.dataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user.id,
      isAdmin: user.isAdmin,
      canAccessSleep: user.canAccessSleep,
      canAccessWorkouts: user.canAccessWorkouts,
      canAccessNutrition: user.canAccessNutrition,
      canAccessHealth: user.canAccessHealth,
      canAccessGoals: user.canAccessGoals,
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminAuth = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const requirePermission = (module) => (req, res, next) => {
  const permissionKey = PERMISSION_MAP[module];
  if (!permissionKey || !req.user?.[permissionKey]) {
    return res.status(403).json({ message: 'Access denied to this module' });
  }
  next();
};

module.exports = { auth, adminAuth, requirePermission };

export {};
