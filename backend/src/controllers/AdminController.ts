import { MoreThanOrEqual } from 'typeorm';
import { User } from '../entities/User';
import { SleepRecord } from '../entities/SleepRecord';
import { Workout } from '../entities/Workout';
import { Nutrition } from '../entities/Nutrition';

class AdminController {
  static async getAllUsersWithMetrics(req, res) {
    const period = req.query.period || 'week';

    try {
      const userRepository = req.app.locals.dataSource.getRepository(User);
      const sleepRepository = req.app.locals.dataSource.getRepository(SleepRecord);
      const workoutRepository = req.app.locals.dataSource.getRepository(Workout);
      const nutritionRepository = req.app.locals.dataSource.getRepository(Nutrition);

      // Buscar todos os usuários (exceto admins)
      const users = await userRepository.find({
        where: { isAdmin: false },
        order: { createdAt: 'DESC' },
      });

      // Calcular data de início baseado no período
      const now = new Date();
      let startDate = new Date(now);

      if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (period === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      } else {
        startDate.setDate(now.getDate() - 7);
      }

      const startDateStr = startDate.toISOString().split('T')[0];

      // Para cada usuário, buscar suas métricas
      const usersWithMetrics = await Promise.all(
        users.map(async (user) => {
          // Dados de sono
          const sleepRecords = await sleepRepository.find({
            where: {
              userId: user.id,
              date: MoreThanOrEqual(startDateStr),
            },
          });

          let averageSleepHours = 0;
          if (sleepRecords.length > 0) {
            const totalMinutes = sleepRecords.reduce((sum, record) => sum + (record.durationMinutes || 0), 0);
            averageSleepHours = Math.round((totalMinutes / sleepRecords.length / 60) * 10) / 10;
          }

          // Dados de treinos
          const workouts = await workoutRepository.find({
            where: {
              userId: user.id,
              date: MoreThanOrEqual(startDateStr),
            },
          });

          const totalWorkouts = workouts.length;
          const totalWorkoutMinutes = workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);

          // Dados de nutrição
          const nutrition = await nutritionRepository.find({
            where: {
              userId: user.id,
            },
          });

          const nutritionFiltered = nutrition.filter((n) => {
            const nDate = new Date(n.date);
            return nDate >= startDate;
          });

          const totalMeals = nutritionFiltered.length;
          const mealsWithGoodBeverages = nutritionFiltered.filter(
            (n) => (n.consumedWater || n.consumedNaturalJuice) && !n.consumedSoda && !n.consumedAlcohol && !n.consumedIndustrialJuice
          ).length;
          const cleanMealPercentage = totalMeals > 0 ? Math.round((mealsWithGoodBeverages / totalMeals) * 100) : 0;
          const totalCalories = nutritionFiltered.reduce((sum, n) => sum + n.calories, 0);

          // Calcular scores
          const sleepScore = calculateSleepScore(averageSleepHours, sleepRecords.length);
          const workoutScore = calculateWorkoutScore(totalWorkouts, totalWorkoutMinutes);
          const nutritionScore = calculateNutritionScore(nutritionFiltered);

          const overallScore = Math.round((sleepScore + workoutScore + nutritionScore) / 3);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            metrics: {
              sleep: {
                averageHours: averageSleepHours,
                totalNights: sleepRecords.length,
                score: sleepScore,
              },
              workouts: {
                total: totalWorkouts,
                totalMinutes: totalWorkoutMinutes,
                score: workoutScore,
              },
              nutrition: {
                totalMeals,
                cleanMealPercentage,
                totalCalories,
                score: nutritionScore,
              },
            },
            overallScore,
            rank: getRank(overallScore),
          };
        })
      );

      // Ordenar por score geral
      const rankedUsers = usersWithMetrics.sort((a, b) => b.overallScore - a.overallScore);

      res.json({
        users: rankedUsers,
        summary: {
          totalUsers: users.length,
          period,
        },
      });
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getUserDetailedMetrics(req, res) {
    const { userId } = req.params;
    const period = req.query.period || 'week';

    try {
      const userRepository = req.app.locals.dataSource.getRepository(User);
      const sleepRepository = req.app.locals.dataSource.getRepository(SleepRecord);
      const workoutRepository = req.app.locals.dataSource.getRepository(Workout);
      const nutritionRepository = req.app.locals.dataSource.getRepository(Nutrition);

      const user = await userRepository.findOne({ where: { id: parseInt(userId) } });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Calcular data de início
      const now = new Date();
      let startDate = new Date(now);

      if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (period === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      } else {
        startDate.setDate(now.getDate() - 7);
      }

      const startDateStr = startDate.toISOString().split('T')[0];

      // Buscar dados detalhados
      const sleepRecords = await sleepRepository.find({
        where: {
          userId: parseInt(userId),
          date: MoreThanOrEqual(startDateStr),
        },
        order: { date: 'DESC' },
      });

      const workouts = await workoutRepository.find({
        where: {
          userId: parseInt(userId),
          date: MoreThanOrEqual(startDateStr),
        },
        order: { date: 'DESC' },
      });

      const nutrition = await nutritionRepository.find({
        where: {
          userId: parseInt(userId),
        },
      });

      const nutritionFiltered = nutrition.filter((n) => {
        const nDate = new Date(n.date);
        return nDate >= startDate;
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        period,
        sleep: sleepRecords,
        workouts,
        nutrition: nutritionFiltered,
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes do usuário:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

// Funções auxiliares
function calculateSleepScore(averageHours: number, nights: number): number {
  if (nights === 0) return 0;

  let score = 0;

  // Qualidade do sono (7-9h é ideal)
  if (averageHours >= 7 && averageHours <= 9) {
    score += 60;
  } else if (averageHours >= 6 && averageHours < 7) {
    score += 40;
  } else if (averageHours >= 9 && averageHours <= 10) {
    score += 50;
  } else if (averageHours >= 5 && averageHours < 6) {
    score += 20;
  } else {
    score += 10;
  }

  // Consistência (quanto mais noites registradas, melhor)
  if (nights >= 7) {
    score += 40;
  } else if (nights >= 5) {
    score += 25;
  } else if (nights >= 3) {
    score += 10;
  }

  return Math.min(score, 100);
}

function calculateWorkoutScore(totalWorkouts: number, totalMinutes: number): number {
  let score = 0;

  // Frequência
  if (totalWorkouts >= 5) {
    score += 50;
  } else if (totalWorkouts >= 3) {
    score += 30;
  } else if (totalWorkouts >= 1) {
    score += 10;
  }

  // Duração
  if (totalMinutes >= 300) {
    score += 50;
  } else if (totalMinutes >= 150) {
    score += 30;
  } else if (totalMinutes >= 60) {
    score += 10;
  }

  return Math.min(score, 100);
}

function calculateNutritionScore(nutritionArray: any[]): number {
  if (nutritionArray.length === 0) return 0;

  let score = 0;
  const totalMeals = nutritionArray.length;

  // Calcular quantidade de refeições com bebidas boas (água ou suco natural)
  // E penalizar por bebidas ruins
  let foodQualityScore = 0;

  for (const meal of nutritionArray) {
    let mealScore = 10; // Base score para cada refeição

    // Penalidades (bebidas ruins)
    if (meal.consumedAlcohol) {
      mealScore -= 8; // Pior bebida
    } else if (meal.consumedSoda) {
      mealScore -= 5; // Segunda pior
    } else if (meal.consumedIndustrialJuice) {
      mealScore -= 2; // Terceira pior
    }

    // Bônus (bebidas boas)
    if (meal.consumedWater) {
      mealScore += 3; // Melhor bebida
    }
    if (meal.consumedNaturalJuice) {
      mealScore += 2; // Segunda melhor
    }

    // Evitar score negativo
    foodQualityScore += Math.max(0, mealScore);
  }

  // Normalizar o score de qualidade (máximo 60 pontos)
  const maxQualityScore = 13 * totalMeals; // 10 base + 3 bônus máximo
  const qualityPercentage = (foodQualityScore / maxQualityScore) * 100;

  if (qualityPercentage >= 80) {
    score += 60;
  } else if (qualityPercentage >= 60) {
    score += 40;
  } else if (qualityPercentage >= 40) {
    score += 20;
  } else {
    score += 5;
  }

  // Consistência (refeições registradas) - máximo 40 pontos
  if (totalMeals >= 21) {
    score += 40;
  } else if (totalMeals >= 14) {
    score += 25;
  } else if (totalMeals >= 7) {
    score += 10;
  }

  return Math.min(score, 100);
}

function getRank(score: number): string {
  if (score >= 90) return '🏆 Mestre';
  if (score >= 80) return '🥇 Especialista';
  if (score >= 70) return '🥈 Avançado';
  if (score >= 60) return '🥉 Intermediário';
  if (score >= 40) return '📈 Iniciante';
  return '🌱 Aprendiz';
}

// Métodos de gerenciamento de usuários
class UserManagementController {
  static async getAllUsers(req, res) {
    try {
      const userRepository = req.app.locals.dataSource.getRepository(User);
      const users = await userRepository.find({
        where: { isAdmin: false },
        select: { id: true, email: true, name: true, isAdmin: true, createdAt: true, canAccessSleep: true, canAccessWorkouts: true, canAccessNutrition: true, canAccessHealth: true, canAccessGoals: true },
        order: { createdAt: 'DESC' },
      });
      res.json(users);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async createUser(req, res) {
    const { email, password, name } = req.body;
    
    try {
      // @ts-ignore
      const bcrypt = require('bcryptjs');
      const userRepository = req.app.locals.dataSource.getRepository(User);

      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = userRepository.create({
        email,
        password: hashedPassword,
        name,
        isAdmin: false,
        canAccessSleep: true,
        canAccessWorkouts: true,
        canAccessNutrition: true,
        canAccessHealth: true,
        canAccessGoals: true,
      });

      await userRepository.save(user);
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ message: 'Usuário criado com sucesso', user: userWithoutPassword });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async updateUser(req, res) {
    const { id } = req.params;
    const { email, name } = req.body;

    try {
      const userRepository = req.app.locals.dataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: parseInt(id) } });

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      if (email && email !== user.email) {
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
          return res.status(400).json({ message: 'Email já cadastrado' });
        }
        user.email = email;
      }

      if (name) user.name = name;

      await userRepository.save(user);
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ message: 'Usuário atualizado com sucesso', user: userWithoutPassword });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async deleteUser(req, res) {
    const { id } = req.params;

    try {
      const userRepository = req.app.locals.dataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: parseInt(id) } });

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      await userRepository.remove(user);
      res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async updateUserPermissions(req, res) {
    const { id } = req.params;
    const { canAccessSleep, canAccessWorkouts, canAccessNutrition, canAccessHealth, canAccessGoals } = req.body;

    try {
      const userRepository = req.app.locals.dataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: parseInt(id) } });

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      if (canAccessSleep !== undefined) user.canAccessSleep = canAccessSleep;
      if (canAccessWorkouts !== undefined) user.canAccessWorkouts = canAccessWorkouts;
      if (canAccessNutrition !== undefined) user.canAccessNutrition = canAccessNutrition;
      if (canAccessHealth !== undefined) user.canAccessHealth = canAccessHealth;
      if (canAccessGoals !== undefined) user.canAccessGoals = canAccessGoals;

      await userRepository.save(user);
      
      res.json({ message: 'Permissões atualizadas com sucesso', user });
    } catch (error) {
      console.error('Erro ao atualizar permissões:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = { AdminController, UserManagementController };
