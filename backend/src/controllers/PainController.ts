import { Pain } from '../entities/Pain';

class PainController {
  static async createPain(req, res) {
    const { date, location, intensity, description } = req.body;
    const userId = req.user.id;

    try {
      const painRepository = req.app.locals.dataSource.getRepository(Pain);

      const pain = painRepository.create({
        userId,
        date,
        location,
        intensity: parseInt(intensity),
        description,
      });

      await painRepository.save(pain);

      res.status(201).json({ message: 'Pain record registered', pain });
    } catch (error) {
      console.error('Erro ao registrar dor:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getPains(req, res) {
    const userId = req.user.id;

    try {
      const painRepository = req.app.locals.dataSource.getRepository(Pain);

      const pains = await painRepository.find({
        where: {
          userId,
        },
        order: { date: 'DESC' },
      });

      res.json(pains);
    } catch (error) {
      console.error('Erro ao buscar registros de dor:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async updatePain(req, res) {
    const { id } = req.params;
    const { date, location, intensity, description } = req.body;
    const userId = req.user.id;

    try {
      const painRepository = req.app.locals.dataSource.getRepository(Pain);

      const pain = await painRepository.findOne({
        where: { id: parseInt(id), userId },
      });

      if (!pain) {
        return res.status(404).json({ message: 'Pain record not found' });
      }

      pain.date = date;
      pain.location = location;
      pain.intensity = parseInt(intensity);
      pain.description = description;

      await painRepository.save(pain);

      res.json({ message: 'Pain record updated', pain });
    } catch (error) {
      console.error('Erro ao atualizar dor:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async deletePain(req, res) {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const painRepository = req.app.locals.dataSource.getRepository(Pain);

      const pain = await painRepository.findOne({
        where: { id: parseInt(id), userId },
      });

      if (!pain) {
        return res.status(404).json({ message: 'Pain record not found' });
      }

      await painRepository.remove(pain);

      res.json({ message: 'Pain record deleted' });
    } catch (error) {
      console.error('Erro ao deletar dor:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = PainController;
