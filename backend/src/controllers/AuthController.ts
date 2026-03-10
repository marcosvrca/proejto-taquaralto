// @ts-ignore
const bcrypt = require('bcryptjs');
// @ts-ignore
const jwt = require('jsonwebtoken');

class AuthController {
  static async register(req, res) {
    const { email, password, name, isAdmin } = req.body;

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
        isAdmin: isAdmin || false,
      });
      await userRepository.save(user);

      res.status(201).json({ message: 'User registered successfully' });
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

      const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          isAdmin: user.isAdmin,
          canAccessSleep: user.canAccessSleep,
          canAccessWorkouts: user.canAccessWorkouts,
          canAccessNutrition: user.canAccessNutrition,
          canAccessHealth: user.canAccessHealth,
          canAccessGoals: user.canAccessGoals
        } 
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = AuthController;