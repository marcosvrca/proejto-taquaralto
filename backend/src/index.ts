require('reflect-metadata');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { AppDataSource } = require('./data-source');
const { User } = require('./entities/User');
const AuthController = require('./controllers/AuthController');
const { auth, adminAuth, requirePermission } = require('./middlewares/auth');
const SleepController = require('./controllers/SleepController');
const WorkoutController = require('./controllers/WorkoutController');
const NutritionController = require('./controllers/NutritionController');
const PainController = require('./controllers/PainController');
const GoalController = require('./controllers/GoalController');
const { AdminController, UserManagementController } = require('./controllers/AdminController');
const GamesController = require('./controllers/GamesController');
const AthletePerformanceController = require('./controllers/AthletePerformanceController');
const bcrypt = require('bcryptjs');

function createApp() {
  const app = express();

  if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
  }

  const corsOrigin = process.env.CORS_ORIGIN;
  app.use(
    cors(
      corsOrigin
        ? { origin: corsOrigin.split(',').map((o) => o.trim()), credentials: true }
        : undefined
    )
  );
  app.use(express.json());

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Muitas tentativas. Tente novamente em alguns minutos.' },
  });

  app.post('/api/auth/login', authLimiter, AuthController.login);
  app.post('/api/auth/register', authLimiter, AuthController.register);
  app.post('/api/auth/refresh', authLimiter, AuthController.refresh);
  app.get('/api/auth/me', auth, AuthController.me);

  app.post('/api/sleep/bed', auth, requirePermission('sleep'), SleepController.recordBedTime);
  app.post('/api/sleep/wake', auth, requirePermission('sleep'), SleepController.recordWakeTime);
  app.get('/api/sleep/reports', auth, requirePermission('sleep'), SleepController.getReports);
  app.put('/api/sleep/:id', auth, requirePermission('sleep'), SleepController.updateSleepRecord);
  app.delete('/api/sleep/:id', auth, requirePermission('sleep'), SleepController.deleteSleepRecord);

  app.post('/api/workouts', auth, requirePermission('workouts'), WorkoutController.createWorkout);
  app.get('/api/workouts', auth, requirePermission('workouts'), WorkoutController.getWorkouts);
  app.get('/api/workouts/reports', auth, requirePermission('workouts'), WorkoutController.getWorkoutReports);
  app.put('/api/workouts/:id', auth, requirePermission('workouts'), WorkoutController.updateWorkout);
  app.delete('/api/workouts/:id', auth, requirePermission('workouts'), WorkoutController.deleteWorkout);

  app.post('/api/nutrition', auth, requirePermission('nutrition'), NutritionController.createNutrition);
  app.get('/api/nutrition', auth, requirePermission('nutrition'), NutritionController.getNutrition);
  app.get('/api/nutrition/reports', auth, requirePermission('nutrition'), NutritionController.getNutritionReports);
  app.put('/api/nutrition/:id', auth, requirePermission('nutrition'), NutritionController.updateNutrition);
  app.delete('/api/nutrition/:id', auth, requirePermission('nutrition'), NutritionController.deleteNutrition);

  app.post('/api/pains', auth, requirePermission('health'), PainController.createPain);
  app.get('/api/pains', auth, requirePermission('health'), PainController.getPains);
  app.put('/api/pains/:id', auth, requirePermission('health'), PainController.updatePain);
  app.delete('/api/pains/:id', auth, requirePermission('health'), PainController.deletePain);

  app.post('/api/goals', auth, requirePermission('goals'), GoalController.createGoal);
  app.get('/api/goals', auth, requirePermission('goals'), GoalController.getGoals);
  app.put('/api/goals/:id', auth, requirePermission('goals'), GoalController.updateGoal);
  app.delete('/api/goals/:id', auth, requirePermission('goals'), GoalController.deleteGoal);

  app.get('/api/protected', auth, (req, res) => {
    res.json({ message: 'Protected route', user: req.user });
  });

  app.get('/api/admin', auth, adminAuth, (req, res) => {
    res.json({ message: 'Admin route' });
  });

  app.get('/api/admin/users/list/all', auth, adminAuth, UserManagementController.getAllUsers);
  app.get('/api/admin/users', auth, adminAuth, AdminController.getAllUsersWithMetrics);
  app.get('/api/admin/users/:userId', auth, adminAuth, AdminController.getUserDetailedMetrics);
  app.post('/api/admin/users/:userId/notes', auth, adminAuth, AdminController.createAthleteNote);
  app.put('/api/admin/users/:userId/notes/:noteId', auth, adminAuth, AdminController.updateAthleteNote);
  app.delete('/api/admin/users/:userId/notes/:noteId', auth, adminAuth, AdminController.deleteAthleteNote);
  app.post('/api/admin/users', auth, adminAuth, UserManagementController.createUser);
  app.put('/api/admin/users/:id/permissions', auth, adminAuth, UserManagementController.updateUserPermissions);
  app.put('/api/admin/users/:id', auth, adminAuth, UserManagementController.updateUser);
  app.delete('/api/admin/users/:id', auth, adminAuth, UserManagementController.deleteUser);

  // Calendário (atletas — somente leitura)
  app.get('/api/calendar/matches', auth, GamesController.listPublicCalendar);

  // Admin games / calendar
  app.get('/api/admin/tournaments', auth, adminAuth, GamesController.listTournaments);
  app.post('/api/admin/tournaments', auth, adminAuth, GamesController.createTournament);
  app.put('/api/admin/tournaments/:id', auth, adminAuth, GamesController.updateTournament);
  app.delete('/api/admin/tournaments/:id', auth, adminAuth, GamesController.deleteTournament);
  app.get('/api/admin/matches', auth, adminAuth, GamesController.listMatches);
  app.post('/api/admin/matches', auth, adminAuth, GamesController.createMatch);
  app.get('/api/admin/matches/metrics', auth, adminAuth, GamesController.getMetrics);
  app.get('/api/admin/athlete-performance', auth, adminAuth, AthletePerformanceController.getOverview);
  app.get('/api/admin/athlete-performance/:userId', auth, adminAuth, AthletePerformanceController.getAthleteDetail);
  app.get('/api/admin/matches/:id', auth, adminAuth, GamesController.getMatchDetails);
  app.put('/api/admin/matches/:id', auth, adminAuth, GamesController.updateMatch);
  app.delete('/api/admin/matches/:id', auth, adminAuth, GamesController.deleteMatch);
  app.post('/api/admin/matches/:id/players', auth, adminAuth, GamesController.addMatchPlayers);
  app.put('/api/admin/matches/:id/players/:playerId', auth, adminAuth, GamesController.updateMatchPlayer);
  app.delete('/api/admin/matches/:id/players/:playerId', auth, adminAuth, GamesController.removeMatchPlayer);
  app.post('/api/admin/matches/:id/goals', auth, adminAuth, GamesController.addMatchGoal);
  app.delete('/api/admin/matches/:id/goals/:goalId', auth, adminAuth, GamesController.removeMatchGoal);

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  return app;
}

async function seedAdmin(dataSource) {
  try {
    const userRepository = dataSource.getRepository(User);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@taquaralto.com';
    const adminExists = await userRepository.findOne({ where: { email: adminEmail } });

    if (!adminExists) {
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        if (process.env.NODE_ENV === 'production') {
          console.error('ADMIN_PASSWORD is required to seed admin in production');
          return;
        }
        console.warn('ADMIN_PASSWORD not set; skipping admin seed');
        return;
      }
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        isAdmin: true,
      });
      await userRepository.save(admin);
      console.log(`Admin user created: ${adminEmail}`);
    }
  } catch (seedError) {
    console.error('Error seeding admin user:', seedError.message);
  }
}

async function startServer() {
  const app = createApp();

  await AppDataSource.initialize();
  console.log('Database connected');

  if (process.env.DB_SYNCHRONIZE === 'true') {
    console.log('Synchronizing database schema...');
    await AppDataSource.synchronize();
    console.log('Database schema synchronized');
  }

  app.locals.dataSource = AppDataSource;
  await seedAdmin(AppDataSource);

  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  return app;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = { createApp, startServer, AppDataSource };
export {};
