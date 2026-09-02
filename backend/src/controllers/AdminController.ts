import { MoreThanOrEqual } from 'typeorm';
import { User } from '../entities/User';
import { SleepRecord } from '../entities/SleepRecord';
import { Workout } from '../entities/Workout';
import { Nutrition } from '../entities/Nutrition';
import { Pain } from '../entities/Pain';
import { Goal } from '../entities/Goal';

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
      const dataSource = req.app.locals.dataSource;
      const userRepository = dataSource.getRepository(User);
      const sleepRepository = dataSource.getRepository(SleepRecord);
      const workoutRepository = dataSource.getRepository(Workout);
      const nutritionRepository = dataSource.getRepository(Nutrition);
      const painRepository = dataSource.getRepository(Pain);
      const goalRepository = dataSource.getRepository(Goal);

      const user = await userRepository.findOne({ where: { id: parseInt(userId) } });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

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
      const uid = parseInt(userId);

      const [sleepRecords, workouts, nutritionAll, pains, goals] = await Promise.all([
        sleepRepository.find({
          where: { userId: uid, date: MoreThanOrEqual(startDateStr) },
          order: { date: 'ASC' },
        }),
        workoutRepository.find({
          where: { userId: uid, date: MoreThanOrEqual(startDateStr) },
          order: { date: 'ASC' },
        }),
        nutritionRepository.find({
          where: { userId: uid, date: MoreThanOrEqual(startDateStr) },
          order: { date: 'ASC' },
        }),
        painRepository.find({
          where: { userId: uid, date: MoreThanOrEqual(startDateStr) },
          order: { date: 'ASC' },
        }),
        goalRepository.find({
          where: { userId: uid },
          order: { targetDate: 'ASC' },
        }),
      ]);

      const nutrition = nutritionAll;

      // ---- Sleep analytics ----
      const sleepMinutes = sleepRecords.map((r) => r.durationMinutes || 0);
      const avgSleepMinutes = sleepMinutes.length
        ? sleepMinutes.reduce((a, b) => a + b, 0) / sleepMinutes.length
        : 0;
      const averageSleepHours = Math.round((avgSleepMinutes / 60) * 10) / 10;
      const bestSleep = sleepRecords.reduce(
        (best, r) => (!best || (r.durationMinutes || 0) > (best.durationMinutes || 0) ? r : best),
        null
      );
      const worstSleep = sleepRecords.reduce(
        (worst, r) => (!worst || (r.durationMinutes || 0) < (worst.durationMinutes || 0) ? r : worst),
        null
      );
      const idealNights = sleepRecords.filter((r) => {
        const h = (r.durationMinutes || 0) / 60;
        return h >= 7 && h <= 9;
      }).length;
      const expectedDays = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const sleepConsistency = Math.round((sleepRecords.length / expectedDays) * 100);
      const sleepScore = calculateSleepScore(averageSleepHours, sleepRecords.length);

      // ---- Workout analytics ----
      const totalWorkoutMinutes = workouts.reduce((s, w) => s + (w.durationMinutes || 0), 0);
      const workoutScore = calculateWorkoutScore(workouts.length, totalWorkoutMinutes);
      const byTypeMap = {};
      const byIntensityMap = {};
      workouts.forEach((w) => {
        const type = w.type || 'outros';
        const intensity = w.intensity || 'outros';
        if (!byTypeMap[type]) byTypeMap[type] = { type, count: 0, minutes: 0 };
        byTypeMap[type].count += 1;
        byTypeMap[type].minutes += w.durationMinutes || 0;
        byIntensityMap[intensity] = (byIntensityMap[intensity] || 0) + 1;
      });
      const weeksInPeriod = Math.max(1, expectedDays / 7);
      const sessionsPerWeek = Math.round((workouts.length / weeksInPeriod) * 10) / 10;

      // ---- Nutrition analytics ----
      const nutritionScore = calculateNutritionScore(nutrition);
      const totalMeals = nutrition.length;
      const cleanMeals = nutrition.filter(
        (n) =>
          (n.consumedWater || n.consumedNaturalJuice) &&
          !n.consumedSoda &&
          !n.consumedAlcohol &&
          !n.consumedIndustrialJuice
      ).length;
      const cleanMealPercentage = totalMeals ? Math.round((cleanMeals / totalMeals) * 100) : 0;
      const totalCalories = nutrition.reduce((s, n) => s + (n.calories || 0), 0);
      const habits = {
        water: nutrition.filter((n) => n.consumedWater).length,
        naturalJuice: nutrition.filter((n) => n.consumedNaturalJuice).length,
        soda: nutrition.filter((n) => n.consumedSoda).length,
        alcohol: nutrition.filter((n) => n.consumedAlcohol).length,
        industrialJuice: nutrition.filter((n) => n.consumedIndustrialJuice).length,
      };
      const byMealTypeMap = {};
      nutrition.forEach((n) => {
        const t = n.mealType || 'outro';
        if (!byMealTypeMap[t]) byMealTypeMap[t] = { mealType: t, count: 0, calories: 0 };
        byMealTypeMap[t].count += 1;
        byMealTypeMap[t].calories += n.calories || 0;
      });

      // ---- Health / pains ----
      const avgPainIntensity = pains.length
        ? Math.round((pains.reduce((s, p) => s + (p.intensity || 0), 0) / pains.length) * 10) / 10
        : 0;
      const byLocationMap = {};
      pains.forEach((p) => {
        const loc = p.location || 'Outro';
        if (!byLocationMap[loc]) byLocationMap[loc] = { location: loc, count: 0, totalIntensity: 0 };
        byLocationMap[loc].count += 1;
        byLocationMap[loc].totalIntensity += p.intensity || 0;
      });
      const byLocation = Object.values(byLocationMap)
        .map((l: any) => ({
          location: l.location,
          count: l.count,
          avgIntensity: Math.round((l.totalIntensity / l.count) * 10) / 10,
        }))
        .sort((a, b) => b.count - a.count);
      const healthScore =
        pains.length === 0
          ? 100
          : Math.max(0, Math.min(100, Math.round(100 - avgPainIntensity * 10 - Math.min(pains.length, 10) * 2)));

      // ---- Goals ----
      const completedGoals = goals.filter((g) => g.isCompleted).length;
      const completionRate = goals.length ? Math.round((completedGoals / goals.length) * 100) : 0;

      const overallScore = Math.round((sleepScore + workoutScore + nutritionScore + healthScore) / 4);

      // ---- Daily timelines for charts ----
      const sleepTimeline = sleepRecords.map((r) => ({
        date: r.date,
        label: formatShortDate(r.date),
        hours: Math.round(((r.durationMinutes || 0) / 60) * 10) / 10,
        bedTime: r.bedTime,
        wakeTime: r.wakeTime,
        durationMinutes: r.durationMinutes || 0,
      }));

      const workoutTimeline = workouts.map((w) => ({
        date: w.date,
        label: formatShortDate(w.date),
        minutes: w.durationMinutes || 0,
        type: w.type,
        intensity: w.intensity,
        notes: w.notes,
      }));

      const nutritionByDay = {};
      nutrition.forEach((n) => {
        if (!nutritionByDay[n.date]) nutritionByDay[n.date] = { date: n.date, calories: 0, meals: 0 };
        nutritionByDay[n.date].calories += n.calories || 0;
        nutritionByDay[n.date].meals += 1;
      });
      const nutritionTimeline = Object.values(nutritionByDay)
        .sort((a: any, b: any) => (a.date < b.date ? -1 : 1))
        .map((d: any) => ({ ...d, label: formatShortDate(d.date) }));

      const painTimeline = pains.map((p) => ({
        date: p.date,
        label: formatShortDate(p.date),
        intensity: p.intensity,
        location: p.location,
        description: p.description,
      }));

      // Weekly evolution buckets
      const evolution = buildWeeklyEvolution(sleepRecords, workouts, nutrition, pains);

      // Coach insights
      const insights = buildAthleteInsights({
        averageSleepHours,
        sleepConsistency,
        idealNights,
        totalNights: sleepRecords.length,
        workoutsCount: workouts.length,
        sessionsPerWeek,
        cleanMealPercentage,
        habits,
        avgPainIntensity,
        painsCount: pains.length,
        mostAffectedArea: byLocation[0]?.location,
        completionRate,
        goalsCount: goals.length,
        overallScore,
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          permissions: {
            canAccessSleep: user.canAccessSleep,
            canAccessWorkouts: user.canAccessWorkouts,
            canAccessNutrition: user.canAccessNutrition,
            canAccessHealth: user.canAccessHealth,
            canAccessGoals: user.canAccessGoals,
          },
        },
        period,
        expectedDays,
        scores: {
          sleep: sleepScore,
          workouts: workoutScore,
          nutrition: nutritionScore,
          health: healthScore,
          overall: overallScore,
          rank: getRank(overallScore),
        },
        sleep: {
          summary: {
            averageHours: averageSleepHours,
            totalNights: sleepRecords.length,
            bestNight: bestSleep
              ? {
                  date: bestSleep.date,
                  hours: Math.round(((bestSleep.durationMinutes || 0) / 60) * 10) / 10,
                }
              : null,
            worstNight: worstSleep
              ? {
                  date: worstSleep.date,
                  hours: Math.round(((worstSleep.durationMinutes || 0) / 60) * 10) / 10,
                }
              : null,
            idealRangePct: sleepRecords.length ? Math.round((idealNights / sleepRecords.length) * 100) : 0,
            consistencyPct: Math.min(sleepConsistency, 100),
          },
          timeline: sleepTimeline,
          records: [...sleepRecords].reverse(),
        },
        workouts: {
          summary: {
            total: workouts.length,
            totalMinutes: totalWorkoutMinutes,
            avgDuration: workouts.length ? Math.round(totalWorkoutMinutes / workouts.length) : 0,
            sessionsPerWeek,
          },
          byType: Object.values(byTypeMap).sort((a: any, b: any) => b.minutes - a.minutes),
          byIntensity: Object.entries(byIntensityMap).map(([intensity, count]) => ({ intensity, count })),
          timeline: workoutTimeline,
          records: [...workouts].reverse(),
        },
        nutrition: {
          summary: {
            totalMeals,
            cleanMealPercentage,
            totalCalories,
            avgCaloriesPerDay: nutritionTimeline.length
              ? Math.round(totalCalories / nutritionTimeline.length)
              : 0,
            avgMealsPerDay: nutritionTimeline.length
              ? Math.round((totalMeals / nutritionTimeline.length) * 10) / 10
              : 0,
          },
          habits,
          byMealType: Object.values(byMealTypeMap),
          timeline: nutritionTimeline,
          records: [...nutrition].reverse(),
        },
        health: {
          summary: {
            totalRecords: pains.length,
            avgIntensity: avgPainIntensity,
            mostAffectedArea: byLocation[0]?.location || null,
          },
          byLocation,
          timeline: painTimeline,
          records: [...pains].reverse(),
        },
        goals: {
          summary: {
            total: goals.length,
            completed: completedGoals,
            pending: goals.length - completedGoals,
            completionRate,
          },
          items: goals,
        },
        evolution,
        insights,
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

function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getWeekKey(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

function buildWeeklyEvolution(sleepRecords, workouts, nutrition, pains) {
  const buckets = {};

  const ensure = (dateStr) => {
    const key = getWeekKey(dateStr);
    if (!buckets[key]) {
      buckets[key] = {
        week: key,
        label: formatShortDate(dateStr),
        sleepMinutes: 0,
        sleepNights: 0,
        workoutMinutes: 0,
        workouts: 0,
        calories: 0,
        meals: 0,
        painSum: 0,
        painCount: 0,
      };
    }
    return buckets[key];
  };

  sleepRecords.forEach((r) => {
    const b = ensure(r.date);
    b.sleepMinutes += r.durationMinutes || 0;
    b.sleepNights += 1;
  });
  workouts.forEach((w) => {
    const b = ensure(w.date);
    b.workoutMinutes += w.durationMinutes || 0;
    b.workouts += 1;
  });
  nutrition.forEach((n) => {
    const b = ensure(n.date);
    b.calories += n.calories || 0;
    b.meals += 1;
  });
  pains.forEach((p) => {
    const b = ensure(p.date);
    b.painSum += p.intensity || 0;
    b.painCount += 1;
  });

  return Object.values(buckets)
    .sort((a: any, b: any) => (a.week < b.week ? -1 : 1))
    .map((b: any) => {
      const sleepHours = b.sleepNights ? Math.round((b.sleepMinutes / b.sleepNights / 60) * 10) / 10 : 0;
      const sleepScore = calculateSleepScore(sleepHours, b.sleepNights);
      const workoutScore = calculateWorkoutScore(b.workouts, b.workoutMinutes);
      const approxNutrition = Math.min(100, b.meals * 5);
      const avgPain = b.painCount ? b.painSum / b.painCount : 0;
      const healthScore = b.painCount === 0 ? 100 : Math.max(0, Math.round(100 - avgPain * 10));
      const overall = Math.round((sleepScore + workoutScore + approxNutrition + healthScore) / 4);

      return {
        week: b.week,
        label: b.label,
        sleepHours,
        workoutMinutes: b.workoutMinutes,
        calories: b.calories,
        meals: b.meals,
        avgPainIntensity: Math.round(avgPain * 10) / 10,
        overallScore: overall,
      };
    });
}

function buildAthleteInsights(data) {
  const insights = [];

  if (data.totalNights === 0) {
    insights.push('Sem registros de sono no período — incentive o preenchimento diário.');
  } else if (data.averageSleepHours < 7) {
    insights.push(`Sono abaixo do ideal (${data.averageSleepHours}h). Meta sugerida: 7–9h.`);
  } else if (data.averageSleepHours > 9) {
    insights.push(`Sono elevado (${data.averageSleepHours}h). Avaliar qualidade e recuperação.`);
  } else {
    insights.push(`Sono dentro da faixa ideal (${data.averageSleepHours}h).`);
  }

  if (data.sleepConsistency < 50) {
    insights.push(`Baixa consistência de registros de sono (${data.sleepConsistency}%).`);
  }

  if (data.workoutsCount === 0) {
    insights.push('Nenhum treino registrado no período.');
  } else if (data.sessionsPerWeek < 2) {
    insights.push(`Frequência de treino baixa (${data.sessionsPerWeek}/semana).`);
  } else if (data.sessionsPerWeek >= 4) {
    insights.push(`Boa frequência de treinos (${data.sessionsPerWeek}/semana).`);
  }

  if (data.cleanMealPercentage < 50 && data.habits) {
    insights.push(`Qualidade alimentar em atenção: apenas ${data.cleanMealPercentage}% refeições limpas.`);
  } else if (data.cleanMealPercentage >= 70) {
    insights.push(`Boa qualidade nutricional (${data.cleanMealPercentage}% refeições limpas).`);
  }

  if (data.habits?.soda > 0 || data.habits?.alcohol > 0) {
    insights.push(
      `Hábitos a monitorar: refrigerante (${data.habits.soda}) e álcool (${data.habits.alcohol}) no período.`
    );
  }

  if (data.painsCount > 0) {
    insights.push(
      `Relatos de dor: ${data.painsCount} (intensidade média ${data.avgPainIntensity}/10)${
        data.mostAffectedArea ? ` — região mais afetada: ${data.mostAffectedArea}` : ''
      }.`
    );
  } else {
    insights.push('Sem relatos de dor no período.');
  }

  if (data.goalsCount > 0) {
    insights.push(`Metas: ${data.completionRate}% concluídas.`);
  }

  if (data.overallScore >= 80) {
    insights.push('Desenvolvimento geral excelente neste período.');
  } else if (data.overallScore < 40) {
    insights.push('Desenvolvimento geral baixo — priorizar acompanhamento próximo.');
  }

  return insights;
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
    const {
      email,
      password,
      name,
      canAccessSleep,
      canAccessWorkouts,
      canAccessNutrition,
      canAccessHealth,
      canAccessGoals,
    } = req.body;
    
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
        canAccessSleep: canAccessSleep !== undefined ? canAccessSleep : true,
        canAccessWorkouts: canAccessWorkouts !== undefined ? canAccessWorkouts : true,
        canAccessNutrition: canAccessNutrition !== undefined ? canAccessNutrition : true,
        canAccessHealth: canAccessHealth !== undefined ? canAccessHealth : true,
        canAccessGoals: canAccessGoals !== undefined ? canAccessGoals : true,
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
    const userId = parseInt(id);

    try {
      const dataSource = req.app.locals.dataSource;
      const userRepository = dataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      await dataSource.transaction(async (manager) => {
        await manager.getRepository(SleepRecord).delete({ userId });
        await manager.getRepository(Workout).delete({ userId });
        await manager.getRepository(Nutrition).delete({ userId });
        await manager.getRepository(Pain).delete({ userId });
        await manager.getRepository(Goal).delete({ userId });
        await manager.getRepository(User).remove(user);
      });

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
