import { Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { User } from '../entities/User';
import { Workout } from '../entities/Workout';
import { AthleteNote, AthleteNoteType } from '../entities/AthleteNote';
import { Match } from '../entities/Match';
import { MatchPlayer } from '../entities/MatchPlayer';
import { MatchGoal } from '../entities/MatchGoal';

function periodStart(period: string): string | null {
  if (!period || period === 'all') return null;
  const now = new Date();
  const start = new Date(now);
  if (period === 'week') start.setDate(now.getDate() - 7);
  else if (period === 'month') start.setMonth(now.getMonth() - 1);
  else if (period === 'year') start.setFullYear(now.getFullYear() - 1);
  else start.setDate(now.getDate() - 7);
  return start.toISOString().split('T')[0];
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;
}

function dateFilter(start: string | null, from?: string, to?: string) {
  if (from && to) return Between(from, to);
  if (from) return MoreThanOrEqual(from);
  if (to) return LessThanOrEqual(to);
  if (start) return MoreThanOrEqual(start);
  return undefined;
}

class AthletePerformanceController {
  /** Lista todos os atletas com métricas de jogos e treinos */
  static async getOverview(req, res) {
    try {
      const period = (req.query.period as string) || 'month';
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const start = periodStart(period);
      const dateWhere = dateFilter(start, from, to);

      const dataSource = req.app.locals.dataSource;
      const userRepo = dataSource.getRepository(User);
      const playerRepo = dataSource.getRepository(MatchPlayer);
      const goalRepo = dataSource.getRepository(MatchGoal);
      const noteRepo = dataSource.getRepository(AthleteNote);
      const workoutRepo = dataSource.getRepository(Workout);
      const matchRepo = dataSource.getRepository(Match);

      const athletes = await userRepo.find({
        where: { isAdmin: false },
        select: { id: true, name: true, email: true },
        order: { name: 'ASC' },
      });

      if (!athletes.length) {
        return res.json({ period, athletes: [], summary: { totalAthletes: 0 } });
      }

      const athleteIds = athletes.map((a) => a.id);

      let matchIdsInPeriod: number[] | null = null;
      if (dateWhere) {
        const matchesInPeriod = await matchRepo.find({
          where: { date: dateWhere },
          select: { id: true },
        });
        matchIdsInPeriod = matchesInPeriod.map((m) => m.id);
      }

      const [allPlayers, allGoals, allNotes, allWorkouts] = await Promise.all([
        matchIdsInPeriod && matchIdsInPeriod.length === 0
          ? Promise.resolve([])
          : playerRepo.find({
              where:
                matchIdsInPeriod != null
                  ? { athleteId: In(athleteIds), matchId: In(matchIdsInPeriod) }
                  : { athleteId: In(athleteIds) },
              relations: ['match'],
            }),
        matchIdsInPeriod && matchIdsInPeriod.length === 0
          ? Promise.resolve([])
          : goalRepo.find({
              where:
                matchIdsInPeriod != null
                  ? { athleteId: In(athleteIds), matchId: In(matchIdsInPeriod) }
                  : { athleteId: In(athleteIds) },
            }),
        noteRepo.find({
          where: dateWhere
            ? { athleteId: In(athleteIds), date: dateWhere }
            : { athleteId: In(athleteIds) },
        }),
        workoutRepo.find({
          where: dateWhere
            ? { userId: In(athleteIds), date: dateWhere }
            : { userId: In(athleteIds) },
        }),
      ]);

      const byAthlete = athletes.map((athlete) => {
        const players = allPlayers.filter((p) => p.athleteId === athlete.id);
        const ratings = players
          .filter((p) => p.rating != null)
          .map((p) => Number(p.rating));
        const goals = allGoals.filter(
          (g) => g.athleteId === athlete.id && !g.isOpponentGoal && !g.isOwnGoal
        );
        const ownGoals = allGoals.filter((g) => g.athleteId === athlete.id && g.isOwnGoal);
        const notes = allNotes.filter((n) => n.athleteId === athlete.id);
        const treinoNotes = notes.filter(
          (n) => n.type === AthleteNoteType.TREINO || n.type === 'treino'
        );
        const jogoNotes = notes.filter(
          (n) => n.type === AthleteNoteType.JOGO || n.type === 'jogo'
        );
        const workouts = allWorkouts.filter((w) => w.userId === athlete.id);
        const treinoRatings = treinoNotes
          .filter((n) => n.rating != null)
          .map((n) => Number(n.rating));
        const jogoNoteRatings = jogoNotes
          .filter((n) => n.rating != null)
          .map((n) => Number(n.rating));
        const avgMatch = avg(ratings);
        const avgTreino = avg(treinoRatings);
        const avgJogoNote = avg(jogoNoteRatings);

        let delta: number | null = null;
        if (avgMatch != null && avgTreino != null) {
          delta = Math.round((avgMatch - avgTreino) * 10) / 10;
        }

        return {
          id: athlete.id,
          name: athlete.name,
          email: athlete.email,
          games: {
            matchesPlayed: players.length,
            starters: players.filter((p) => p.isStarter).length,
            avgRating: avgMatch,
            goals: goals.length,
            ownGoals: ownGoals.length,
            ratedMatches: ratings.length,
          },
          trainings: {
            sessions: workouts.length,
            totalMinutes: workouts.reduce((s, w) => s + (w.durationMinutes || 0), 0),
            notesCount: treinoNotes.length,
            avgNoteRating: avgTreino,
          },
          gameNotes: {
            count: jogoNotes.length,
            avgRating: avgJogoNote,
          },
          compare: {
            avgMatchRating: avgMatch,
            avgTrainingRating: avgTreino,
            delta,
            label:
              delta == null
                ? 'sem_dados'
                : delta > 0.5
                  ? 'jogo_acima'
                  : delta < -0.5
                    ? 'treino_acima'
                    : 'equilibrado',
          },
        };
      });

      const withGames = byAthlete.filter((a) => a.games.matchesPlayed > 0);
      const withBoth = byAthlete.filter(
        (a) => a.compare.avgMatchRating != null && a.compare.avgTrainingRating != null
      );

      res.json({
        period,
        from: from || start,
        to: to || null,
        athletes: byAthlete,
        summary: {
          totalAthletes: athletes.length,
          athletesWithMatches: withGames.length,
          athletesComparable: withBoth.length,
          avgMatchRating: avg(
            withGames
              .map((a) => a.games.avgRating)
              .filter((v): v is number => v != null)
          ),
          avgTrainingRating: avg(
            byAthlete
              .map((a) => a.trainings.avgNoteRating)
              .filter((v): v is number => v != null)
          ),
        },
      });
    } catch (error) {
      console.error('Erro ao carregar métricas de performance:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  /** Detalhe de um atleta: partidas, gols, notas e treinos (editável no front) */
  static async getAthleteDetail(req, res) {
    const { userId } = req.params;
    try {
      const period = (req.query.period as string) || 'month';
      const start = periodStart(period);
      const dateWhere = dateFilter(start);

      const dataSource = req.app.locals.dataSource;
      const userRepo = dataSource.getRepository(User);
      const playerRepo = dataSource.getRepository(MatchPlayer);
      const goalRepo = dataSource.getRepository(MatchGoal);
      const noteRepo = dataSource.getRepository(AthleteNote);
      const workoutRepo = dataSource.getRepository(Workout);
      const matchRepo = dataSource.getRepository(Match);

      const athlete = await userRepo.findOne({
        where: { id: parseInt(userId), isAdmin: false },
        select: { id: true, name: true, email: true },
      });
      if (!athlete) return res.status(404).json({ message: 'Atleta não encontrado' });

      let matchIdsInPeriod: number[] | null = null;
      if (dateWhere) {
        const matchesInPeriod = await matchRepo.find({
          where: { date: dateWhere },
          select: { id: true },
        });
        matchIdsInPeriod = matchesInPeriod.map((m) => m.id);
      }

      const [players, goals, notes, workouts] = await Promise.all([
        matchIdsInPeriod && matchIdsInPeriod.length === 0
          ? Promise.resolve([])
          : playerRepo.find({
              where:
                matchIdsInPeriod != null
                  ? { athleteId: athlete.id, matchId: In(matchIdsInPeriod) }
                  : { athleteId: athlete.id },
              relations: ['match', 'match.tournament'],
              order: { createdAt: 'DESC' },
            }),
        matchIdsInPeriod && matchIdsInPeriod.length === 0
          ? Promise.resolve([])
          : goalRepo.find({
              where:
                matchIdsInPeriod != null
                  ? { athleteId: athlete.id, matchId: In(matchIdsInPeriod) }
                  : { athleteId: athlete.id },
              relations: ['match'],
              order: { createdAt: 'DESC' },
            }),
        noteRepo.find({
          where: dateWhere
            ? { athleteId: athlete.id, date: dateWhere }
            : { athleteId: athlete.id },
          order: { date: 'DESC', createdAt: 'DESC' },
        }),
        workoutRepo.find({
          where: dateWhere
            ? { userId: athlete.id, date: dateWhere }
            : { userId: athlete.id },
          order: { date: 'DESC' },
        }),
      ]);

      const matchRatings = players
        .filter((p) => p.rating != null)
        .map((p) => Number(p.rating));
      const treinoNotes = notes.filter(
        (n) => n.type === AthleteNoteType.TREINO || n.type === 'treino'
      );
      const jogoNotes = notes.filter(
        (n) => n.type === AthleteNoteType.JOGO || n.type === 'jogo'
      );

      res.json({
        period,
        athlete,
        matches: players.map((p) => ({
          playerId: p.id,
          matchId: p.matchId,
          date: p.match?.date,
          opponent: p.match?.opponent,
          category: p.match?.category,
          status: p.match?.status,
          ourScore: p.match?.ourScore,
          opponentScore: p.match?.opponentScore,
          tournament: p.match?.tournament?.name || null,
          rating: p.rating != null ? Number(p.rating) : null,
          isStarter: p.isStarter,
          notes: p.notes,
        })),
        goals: goals.map((g) => ({
          id: g.id,
          matchId: g.matchId,
          date: g.match?.date,
          opponent: g.match?.opponent,
          minute: g.minute,
          isOwnGoal: g.isOwnGoal,
          description: g.description,
        })),
        notes: {
          treino: treinoNotes,
          jogo: jogoNotes,
        },
        workouts: workouts.map((w) => ({
          id: w.id,
          date: w.date,
          type: w.type,
          intensity: w.intensity,
          durationMinutes: w.durationMinutes,
          notes: w.notes,
        })),
        summary: {
          matchesPlayed: players.length,
          avgMatchRating: avg(matchRatings),
          goals: goals.filter((g) => !g.isOwnGoal).length,
          ownGoals: goals.filter((g) => g.isOwnGoal).length,
          trainingSessions: workouts.length,
          avgTrainingNote: avg(
            treinoNotes.filter((n) => n.rating != null).map((n) => Number(n.rating))
          ),
          avgGameNote: avg(
            jogoNotes.filter((n) => n.rating != null).map((n) => Number(n.rating))
          ),
        },
      });
    } catch (error) {
      console.error('Erro ao carregar detalhe de performance:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = AthletePerformanceController;
export {};
