import { Goal } from '../entities/Goal';

class GoalController {
  static async createGoal(req, res) {
    const { title, description, targetDate } = req.body;
    const userId = req.user.id;

    try {
      const goalRepository = req.app.locals.dataSource.getRepository(Goal);

      const goal = goalRepository.create({
        userId,
        title,
        description,
        targetDate,
      });

      await goalRepository.save(goal);

      res.status(201).json({ message: 'Goal created', goal });
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getGoals(req, res) {
    const userId = req.user.id;

    try {
      const goalRepository = req.app.locals.dataSource.getRepository(Goal);

      const goals = await goalRepository.find({
        where: {
          userId,
        },
        order: { createdAt: 'DESC' },
      });

      res.json(goals);
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async updateGoal(req, res) {
    const { id } = req.params;
    const { title, description, targetDate, isCompleted } = req.body;
    const userId = req.user.id;

    try {
      const goalRepository = req.app.locals.dataSource.getRepository(Goal);

      const goal = await goalRepository.findOne({
        where: { id: parseInt(id), userId },
      });

      if (!goal) {
        return res.status(404).json({ message: 'Goal not found' });
      }

      goal.title = title;
      goal.description = description;
      goal.targetDate = targetDate;
      if (isCompleted !== undefined) {
        goal.isCompleted = isCompleted;
      }

      await goalRepository.save(goal);

      res.json({ message: 'Goal updated', goal });
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async deleteGoal(req, res) {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const goalRepository = req.app.locals.dataSource.getRepository(Goal);

      const goal = await goalRepository.findOne({
        where: { id: parseInt(id), userId },
      });

      if (!goal) {
        return res.status(404).json({ message: 'Goal not found' });
      }

      await goalRepository.remove(goal);

      res.json({ message: 'Goal deleted' });
    } catch (error) {
      console.error('Erro ao deletar meta:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = GoalController;
