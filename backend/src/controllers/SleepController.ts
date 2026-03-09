import { MoreThanOrEqual } from 'typeorm';
import { SleepRecord } from '../entities/SleepRecord';

class SleepController {
  static async recordBedTime(req, res) {
    const { date, bedTime, wakeTime } = req.body;
    const userId = req.user.id;

    try {
      const sleepRepository = req.app.locals.dataSource.getRepository(SleepRecord);

      // Criar novo registro completo
      const record = sleepRepository.create({
        userId,
        date,
        bedTime,
        wakeTime,
      });

      // Calcular duração
      const bed = new Date(`${date}T${bedTime}`);
      const wake = new Date(`${date}T${wakeTime}`);
      if (wake < bed) wake.setDate(wake.getDate() + 1); // Se acordar no dia seguinte
      record.durationMinutes = Math.round((wake.getTime() - bed.getTime()) / (1000 * 60));

      await sleepRepository.save(record);

      res.json({ message: 'Sleep cycle recorded', record });
    } catch (error) {
      console.error('Erro ao registrar ciclo de sono:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // Método antigo mantido para compatibilidade, mas não será usado
  static async recordWakeTime(req, res) {
    res.status(400).json({ message: 'Use recordBedTime with both bedTime and wakeTime' });
  }

  static async getReports(req, res) {
    const { period } = req.query;
    const userId = req.user.id;

    try {
      const sleepRepository = req.app.locals.dataSource.getRepository(SleepRecord);

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

      // Buscar registros com período
      const records = await sleepRepository.find({
        where: {
          userId,
          date: MoreThanOrEqual(startDateStr),
        },
        order: { date: 'DESC' },
      });

      // Calcular melhor dia
      let bestDay = null;
      if (records.length > 0) {
        bestDay = records.reduce((best, record) => {
          if (record.durationMinutes && (!best || !best.durationMinutes || record.durationMinutes > best.durationMinutes)) {
            return record;
          }
          return best;
        });
      }

      // Calcular pior dia
      let worstDay = null;
      if (records.length > 0) {
        worstDay = records.reduce((worst, record) => {
          if (record.durationMinutes && (!worst || !worst.durationMinutes || record.durationMinutes < worst.durationMinutes)) {
            return record;
          }
          return worst;
        });
      }

      // Calcular média semanal
      let weeklyAverage = 0;
      if (records.length > 0) {
        const totalMinutes = records.reduce((sum, record) => sum + (record.durationMinutes || 0), 0);
        const daysInPeriod = period === 'week' ? 7 : period === 'month' ? 30 : 365;
        weeklyAverage = (totalMinutes / daysInPeriod) * 7; // Média semanal em minutos
      }

      // Calcular média diária (baseada nos dias com registros)
      let dailyAverage = 0;
      if (records.length > 0) {
        const totalMinutes = records.reduce((sum, record) => sum + (record.durationMinutes || 0), 0);
        dailyAverage = totalMinutes / records.length; // Média diária baseada nos dias registrados
      }

      res.json({ records, bestDay, worstDay, weeklyAverage, dailyAverage });
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async updateSleepRecord(req, res) {
    const { id } = req.params;
    const { date, bedTime, wakeTime } = req.body;
    const userId = req.user.id;

    try {
      const sleepRepository = req.app.locals.dataSource.getRepository(SleepRecord);

      const record = await sleepRepository.findOne({
        where: { id: parseInt(id), userId }
      });

      if (!record) {
        return res.status(404).json({ message: 'Sleep record not found' });
      }

      // Atualizar campos
      if (date) record.date = date;
      if (bedTime) record.bedTime = bedTime;
      if (wakeTime) record.wakeTime = wakeTime;

      // Recalcular duração se bedTime ou wakeTime foram alterados
      if (record.bedTime && record.wakeTime) {
        const bed = new Date(`${record.date}T${record.bedTime}`);
        const wake = new Date(`${record.date}T${record.wakeTime}`);
        if (wake < bed) wake.setDate(wake.getDate() + 1);
        record.durationMinutes = Math.round((wake.getTime() - bed.getTime()) / (1000 * 60));
      }

      await sleepRepository.save(record);

      res.json({ message: 'Sleep record updated', record });
    } catch (error) {
      console.error('Erro ao atualizar registro de sono:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async deleteSleepRecord(req, res) {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const sleepRepository = req.app.locals.dataSource.getRepository(SleepRecord);

      const record = await sleepRepository.findOne({
        where: { id: parseInt(id), userId }
      });

      if (!record) {
        return res.status(404).json({ message: 'Sleep record not found' });
      }

      await sleepRepository.remove(record);

      res.json({ message: 'Sleep record deleted' });
    } catch (error) {
      console.error('Erro ao deletar registro de sono:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = SleepController;