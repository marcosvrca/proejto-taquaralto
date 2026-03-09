import { Nutrition } from '../entities/Nutrition';

class NutritionController {
  static async createNutrition(req, res) {
    const { date, time, mealType, calories, consumedSoda, consumedAlcohol, consumedWater, consumedNaturalJuice, consumedIndustrialJuice, notes } = req.body;
    const userId = req.user.id;

    try {
      const nutritionRepository = req.app.locals.dataSource.getRepository(Nutrition);

      const nutrition = nutritionRepository.create({
        userId,
        date,
        time,
        mealType: mealType || 'cafe_manha',
        calories: parseInt(calories),
        consumedSoda: consumedSoda || false,
        consumedAlcohol: consumedAlcohol || false,
        consumedWater: consumedWater || false,
        consumedNaturalJuice: consumedNaturalJuice || false,
        consumedIndustrialJuice: consumedIndustrialJuice || false,
        notes,
      });

      await nutritionRepository.save(nutrition);

      res.status(201).json({ message: 'Nutrition recorded', nutrition });
    } catch (error) {
      console.error('Erro ao registrar alimentação:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getNutrition(req, res) {
    const { period } = req.query;
    const userId = req.user.id;

    try {
      const nutritionRepository = req.app.locals.dataSource.getRepository(Nutrition);

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
        // Padrão: semana passada
        startDate.setDate(now.getDate() - 7);
      }

      const nutrition = await nutritionRepository.find({
        where: {
          userId,
        },
        order: { date: 'DESC', time: 'DESC' },
      });

      // Filtrar por período no código
      const filteredNutrition = nutrition.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate;
      });

      res.json({ nutrition: filteredNutrition });
    } catch (error) {
      console.error('Erro ao buscar alimentação:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async updateNutrition(req, res) {
    const { id } = req.params;
    const { date, time, mealType, calories, consumedSoda, consumedAlcohol, consumedWater, consumedNaturalJuice, consumedIndustrialJuice, notes } = req.body;
    const userId = req.user.id;

    try {
      const nutritionRepository = req.app.locals.dataSource.getRepository(Nutrition);

      const nutrition = await nutritionRepository.findOne({
        where: { id: parseInt(id), userId },
      });

      if (!nutrition) {
        return res.status(404).json({ message: 'Nutrition record not found' });
      }

      nutrition.date = date;
      nutrition.time = time;
      nutrition.mealType = mealType;
      nutrition.calories = parseInt(calories);
      nutrition.consumedSoda = consumedSoda || false;
      nutrition.consumedAlcohol = consumedAlcohol || false;
      nutrition.consumedWater = consumedWater || false;
      nutrition.consumedNaturalJuice = consumedNaturalJuice || false;
      nutrition.consumedIndustrialJuice = consumedIndustrialJuice || false;
      nutrition.notes = notes;

      await nutritionRepository.save(nutrition);

      res.json({ message: 'Nutrition updated', nutrition });
    } catch (error) {
      console.error('Erro ao atualizar alimentação:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async deleteNutrition(req, res) {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const nutritionRepository = req.app.locals.dataSource.getRepository(Nutrition);

      const nutrition = await nutritionRepository.findOne({
        where: { id: parseInt(id), userId },
      });

      if (!nutrition) {
        return res.status(404).json({ message: 'Nutrition record not found' });
      }

      await nutritionRepository.remove(nutrition);

      res.json({ message: 'Nutrition deleted' });
    } catch (error) {
      console.error('Erro ao deletar alimentação:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getNutritionReports(req, res) {
    const { period } = req.query;
    const userId = req.user.id;

    try {
      const nutritionRepository = req.app.locals.dataSource.getRepository(Nutrition);

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
        // Padrão: semana passada
        startDate.setDate(now.getDate() - 7);
      }

      const nutrition = await nutritionRepository.find({
        where: {
          userId,
        },
        order: { date: 'DESC' },
      });

      // Filtrar por período no código
      const filteredNutrition = nutrition.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate;
      });

      // Calcular estatísticas
      const dayStats = {};
      let totalMeals = 0;
      let totalCalories = 0;
      const sodaDays = new Set();
      const alcoholDays = new Set();

      filteredNutrition.forEach(record => {
        const day = record.date;
        if (!dayStats[day]) {
          dayStats[day] = { meals: 0, calories: 0 };
        }
        dayStats[day].meals += 1;
        dayStats[day].calories += record.calories;
        totalMeals += 1;
        totalCalories += record.calories;

        if (record.consumedSoda) {
          sodaDays.add(day);
        }
        if (record.consumedAlcohol) {
          alcoholDays.add(day);
        }
      });

      // Encontrar dia com mais refeições
      let maxMealsDay = null;
      let maxMeals = 0;
      let minMealsDay = null;
      let minMeals = Infinity;
      let maxCaloriesDay = null;
      let maxCalories = 0;

      Object.entries(dayStats).forEach(([day, stats]: [string, any]) => {
        if (stats.meals > maxMeals) {
          maxMeals = stats.meals;
          maxMealsDay = day;
        }
        if (stats.meals < minMeals) {
          minMeals = stats.meals;
          minMealsDay = day;
        }
        if (stats.calories > maxCalories) {
          maxCalories = stats.calories;
          maxCaloriesDay = day;
        }
      });

      const reports = {
        totalMeals,
        totalCalories,
        dayWithMostMeals: maxMealsDay,
        dayWithLeastMeals: minMealsDay,
        dayWithMostCalories: maxCaloriesDay,
        maxCalories,
        sodaConsumptionDays: Array.from(sodaDays),
        alcoholConsumptionDays: Array.from(alcoholDays),
        dayStats
      };

      res.json(reports);
    } catch (error) {
      console.error('Erro ao gerar relatórios de alimentação:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = NutritionController;