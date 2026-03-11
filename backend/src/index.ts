require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { DataSource } = require('typeorm');
const { User } = require('./entities/User');
const { SleepRecord } = require('./entities/SleepRecord');
const { Workout } = require('./entities/Workout');
const { Nutrition } = require('./entities/Nutrition');
const { Pain } = require('./entities/Pain');
const { Goal } = require('./entities/Goal');
const AuthController = require('./controllers/AuthController');
const { auth, adminAuth } = require('./middlewares/auth');
const SleepController = require('./controllers/SleepController');
const WorkoutController = require('./controllers/WorkoutController');
const NutritionController = require('./controllers/NutritionController');
const PainController = require('./controllers/PainController');
const GoalController = require('./controllers/GoalController');
const { AdminController, UserManagementController } = require('./controllers/AdminController');
const bcrypt = require('bcryptjs');

const app = express();

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, SleepRecord, Workout, Nutrition, Pain, Goal],
  synchronize: process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV === 'development', 
});

AppDataSource.initialize()
  .then(async () => {
    console.log('Database connected');
    
    // Forçar sincronização se solicitado via variável de ambiente
    if (process.env.DB_SYNCHRONIZE === 'true') {
      console.log('Synchronizing database schema...');
      await AppDataSource.synchronize();
      console.log('Database schema synchronized');
    }

    app.locals.dataSource = AppDataSource;

    // Seed admin user
    try {
      const userRepository = AppDataSource.getRepository(User);
      const adminEmail = 'admin@taquaralto.com';
      const adminExists = await userRepository.findOne({ where: { email: adminEmail } });
      
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('@2026taquaraltofutsal', 10);
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
      // Não trava o servidor se o seed falhar (ex: tabela ainda não pronta)
    }
  })
  .catch((error) => console.log(error));
app.post('/api/auth/login', AuthController.login);
app.post('/api/auth/register', AuthController.register);

// Sleep routes
app.post('/api/sleep/bed', auth, SleepController.recordBedTime);
app.post('/api/sleep/wake', auth, SleepController.recordWakeTime);
app.get('/api/sleep/reports', auth, SleepController.getReports);
app.put('/api/sleep/:id', auth, SleepController.updateSleepRecord);
app.delete('/api/sleep/:id', auth, SleepController.deleteSleepRecord);

// Workout routes
app.post('/api/workouts', auth, WorkoutController.createWorkout);
app.get('/api/workouts', auth, WorkoutController.getWorkouts);
app.get('/api/workouts/reports', auth, WorkoutController.getWorkoutReports);
app.put('/api/workouts/:id', auth, WorkoutController.updateWorkout);
app.delete('/api/workouts/:id', auth, WorkoutController.deleteWorkout);

// Nutrition routes
app.post('/api/nutrition', auth, NutritionController.createNutrition);
app.get('/api/nutrition', auth, NutritionController.getNutrition);
app.get('/api/nutrition/reports', auth, NutritionController.getNutritionReports);
app.put('/api/nutrition/:id', auth, NutritionController.updateNutrition);
app.delete('/api/nutrition/:id', auth, NutritionController.deleteNutrition);

// Pain routes
app.post('/api/pains', auth, PainController.createPain);
app.get('/api/pains', auth, PainController.getPains);
app.put('/api/pains/:id', auth, PainController.updatePain);
app.delete('/api/pains/:id', auth, PainController.deletePain);

// Goal routes
app.post('/api/goals', auth, GoalController.createGoal);
app.get('/api/goals', auth, GoalController.getGoals);
app.put('/api/goals/:id', auth, GoalController.updateGoal);
app.delete('/api/goals/:id', auth, GoalController.deleteGoal);

// Exemplo de rota protegida
app.get('/api/protected', auth, (req, res) => {
  res.json({ message: 'Protected route', user: req.user });
});

// Rota admin
app.get('/api/admin', auth, adminAuth, (req, res) => {
  res.json({ message: 'Admin route' });
});

// Admin routes
app.get('/api/admin/users/list/all', auth, adminAuth, UserManagementController.getAllUsers);
app.get('/api/admin/users', auth, adminAuth, AdminController.getAllUsersWithMetrics);
app.get('/api/admin/users/:userId', auth, adminAuth, AdminController.getUserDetailedMetrics);
app.post('/api/admin/users', auth, adminAuth, UserManagementController.createUser);
app.put('/api/admin/users/:id/permissions', auth, adminAuth, UserManagementController.updateUserPermissions);
app.put('/api/admin/users/:id', auth, adminAuth, UserManagementController.updateUser);
app.delete('/api/admin/users/:id', auth, adminAuth, UserManagementController.deleteUser);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export {};