import { Workout } from '../entities/Workout';

class WorkoutController {
  static async createWorkout(req, res) {
    const { date, time, type, intensity, notes, durationMinutes } = req.body;
    const userId = req.user.id;

    try {
      const workoutRepository = req.app.locals.dataSource.getRepository(Workout);

      // Mapear tipos de treino do frontend para os valores do enum
      const typeMapping = {
        'Musculação': 'musculacao',
        'Futsal': 'futsal',
        'Corrida': 'corrida',
        'Caminhada': 'mobilidade',
        'Natação': 'natacao',
        'Ciclismo': 'mobilidade',
        'Crossfit': 'treino_forca',
        'Outro': 'musculacao'
      };

      // Mapear intensidades do frontend para os valores do enum
      const intensityMapping = {
        'Baixa': 'leve',
        'Média': 'moderado',
        'Alta': 'intenso'
      };

      const workout = workoutRepository.create({
        userId,
        date,
        time,
        type: typeMapping[type] || 'musculacao',
        intensity: intensityMapping[intensity] || 'moderado',
        notes,
        durationMinutes: durationMinutes || null,
      });

      await workoutRepository.save(workout);

      res.status(201).json({ message: 'Workout recorded', workout });
    } catch (error) {
      console.error('Erro ao registrar treino:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getWorkouts(req, res) {
    const { period } = req.query;
    const userId = req.user.id;

    try {
      const workoutRepository = req.app.locals.dataSource.getRepository(Workout);

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

      const startDateStr = startDate.toISOString().split('T')[0];

      // Buscar treinos
      const workouts = await workoutRepository.find({
        where: {
          userId,
          date: require('typeorm').MoreThanOrEqual(startDateStr),
        },
        order: { date: 'DESC', time: 'DESC' },
      });

      res.json({ workouts });
    } catch (error) {
      console.error('Erro ao buscar treinos:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async updateWorkout(req, res) {
    const { id } = req.params;
    const { date, time, type, intensity, notes, durationMinutes } = req.body;
    const userId = req.user.id;

    try {
      const workoutRepository = req.app.locals.dataSource.getRepository(Workout);

      // Mapear tipos de treino do frontend para os valores do enum
      const typeMapping = {
        'Musculação': 'musculacao',
        'Futsal': 'futsal',
        'Corrida': 'corrida',
        'Caminhada': 'mobilidade',
        'Natação': 'natacao',
        'Ciclismo': 'mobilidade',
        'Crossfit': 'treino_forca',
        'Outro': 'musculacao'
      };

      // Mapear intensidades do frontend para os valores do enum
      const intensityMapping = {
        'Baixa': 'leve',
        'Média': 'moderado',
        'Alta': 'intenso'
      };

      const workout = await workoutRepository.findOne({
        where: { id: parseInt(id), userId }
      });

      if (!workout) {
        return res.status(404).json({ message: 'Workout not found' });
      }

      // Atualizar campos
      if (date) workout.date = date;
      if (time) workout.time = time;
      if (type) workout.type = typeMapping[type] || type;
      if (intensity) workout.intensity = intensityMapping[intensity] || intensity;
      if (notes !== undefined) workout.notes = notes;
      if (durationMinutes !== undefined) workout.durationMinutes = durationMinutes;

      await workoutRepository.save(workout);

      res.json({ message: 'Workout updated', workout });
    } catch (error) {
      console.error('Erro ao atualizar treino:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async deleteWorkout(req, res) {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const workoutRepository = req.app.locals.dataSource.getRepository(Workout);

      const workout = await workoutRepository.findOne({
        where: { id: parseInt(id), userId }
      });

      if (!workout) {
        return res.status(404).json({ message: 'Workout not found' });
      }

      await workoutRepository.remove(workout);

      res.json({ message: 'Workout deleted' });
    } catch (error) {
      console.error('Erro ao deletar treino:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getWorkoutReports(req, res) {
    const { period } = req.query;
    const userId = req.user.id;

    try {
      const workoutRepository = req.app.locals.dataSource.getRepository(Workout);

      // Calcular data limite baseada no período
      const now = new Date();
      let startDate;
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 dias por padrão
      }

      const workouts = await workoutRepository.find({
        where: {
          userId,
          date: require('typeorm').MoreThanOrEqual(startDate.toISOString().split('T')[0])
        }
      });

      // 1. Tipo de treino mais praticado
      const typeCount = {};
      workouts.forEach(workout => {
        typeCount[workout.type] = (typeCount[workout.type] || 0) + 1;
      });
      const mostPracticedType = Object.keys(typeCount).reduce((a, b) =>
        typeCount[a] > typeCount[b] ? a : b, '');

      // 2. Período com mais treinos (manhã, tarde, noite)
      const periodCount = { manha: 0, tarde: 0, noite: 0 };
      workouts.forEach(workout => {
        const hour = parseInt(workout.time.split(':')[0]);
        if (hour >= 6 && hour < 12) periodCount.manha++;
        else if (hour >= 12 && hour < 18) periodCount.tarde++;
        else periodCount.noite++;
      });
      const mostActivePeriod = Object.keys(periodCount).reduce((a, b) =>
        periodCount[a] > periodCount[b] ? a : b, '');

      // 3. Total de minutos treinando
      const totalMinutes = workouts.reduce((sum, workout) =>
        sum + (workout.durationMinutes || 0), 0);

      // 4. Distribuição por intensidade
      const intensityCount = {};
      workouts.forEach(workout => {
        intensityCount[workout.intensity] = (intensityCount[workout.intensity] || 0) + 1;
      });

      res.json({
        period,
        totalWorkouts: workouts.length,
        mostPracticedType,
        mostActivePeriod,
        totalMinutes,
        intensityDistribution: intensityCount,
        typeDistribution: typeCount
      });
    } catch (error) {
      console.error('Erro ao gerar relatórios de treino:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = WorkoutController;