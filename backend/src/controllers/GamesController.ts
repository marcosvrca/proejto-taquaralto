import { Between, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { Tournament, TournamentKind } from '../entities/Tournament';
import { Match, MatchCategory, MatchLocation, MatchStatus } from '../entities/Match';
import { MatchPlayer } from '../entities/MatchPlayer';
import { MatchGoal } from '../entities/MatchGoal';
import { User } from '../entities/User';

function parseOptionalInt(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

function resultOf(match) {
  if (match.status !== MatchStatus.FINALIZADO && match.status !== 'finalizado') return null;
  if (match.ourScore == null || match.opponentScore == null) return null;
  if (match.ourScore > match.opponentScore) return 'V';
  if (match.ourScore < match.opponentScore) return 'D';
  return 'E';
}

class GamesController {
  // ---- Tournaments ----
  static async listTournaments(req, res) {
    try {
      const repo = req.app.locals.dataSource.getRepository(Tournament);
      const tournaments = await repo.find({ order: { startDate: 'DESC', createdAt: 'DESC' } });
      res.json(tournaments);
    } catch (error) {
      console.error('Erro ao listar torneios:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async createTournament(req, res) {
    const { name, kind, season, startDate, endDate, notes } = req.body;
    try {
      if (!name?.trim()) {
        return res.status(400).json({ message: 'Nome do torneio é obrigatório' });
      }
      const repo = req.app.locals.dataSource.getRepository(Tournament);
      const tournament = repo.create({
        name: name.trim(),
        kind: kind || TournamentKind.CAMPEONATO,
        season: season || null,
        startDate: startDate || null,
        endDate: endDate || null,
        notes: notes || null,
      });
      await repo.save(tournament);
      res.status(201).json({ message: 'Torneio criado', tournament });
    } catch (error) {
      console.error('Erro ao criar torneio:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async updateTournament(req, res) {
    const { id } = req.params;
    const { name, kind, season, startDate, endDate, notes } = req.body;
    try {
      const repo = req.app.locals.dataSource.getRepository(Tournament);
      const tournament = await repo.findOne({ where: { id: parseInt(id) } });
      if (!tournament) return res.status(404).json({ message: 'Torneio não encontrado' });

      if (name !== undefined) tournament.name = name.trim();
      if (kind !== undefined) tournament.kind = kind;
      if (season !== undefined) tournament.season = season || null;
      if (startDate !== undefined) tournament.startDate = startDate || null;
      if (endDate !== undefined) tournament.endDate = endDate || null;
      if (notes !== undefined) tournament.notes = notes || null;

      await repo.save(tournament);
      res.json({ message: 'Torneio atualizado', tournament });
    } catch (error) {
      console.error('Erro ao atualizar torneio:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async deleteTournament(req, res) {
    const { id } = req.params;
    try {
      const dataSource = req.app.locals.dataSource;
      const tournamentRepo = dataSource.getRepository(Tournament);
      const matchRepo = dataSource.getRepository(Match);
      const tournament = await tournamentRepo.findOne({ where: { id: parseInt(id) } });
      if (!tournament) return res.status(404).json({ message: 'Torneio não encontrado' });

      await matchRepo.update({ tournamentId: tournament.id }, { tournamentId: null });
      await tournamentRepo.remove(tournament);
      res.json({ message: 'Torneio removido' });
    } catch (error) {
      console.error('Erro ao deletar torneio:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // ---- Matches ----
  static async listMatches(req, res) {
    try {
      const { from, to, category, status, tournamentId } = req.query;
      const repo = req.app.locals.dataSource.getRepository(Match);
      const where: any = {};

      if (from && to) where.date = Between(from, to);
      else if (from) where.date = MoreThanOrEqual(from);
      else if (to) where.date = LessThanOrEqual(to);
      if (category) where.category = category;
      if (status) where.status = status;
      if (tournamentId) where.tournamentId = parseInt(tournamentId as string);

      const matches = await repo.find({
        where,
        relations: ['tournament'],
        order: { date: 'ASC', time: 'ASC' },
      });
      res.json(matches);
    } catch (error) {
      console.error('Erro ao listar jogos:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  /** Calendário somente leitura para atletas autenticados */
  static async listPublicCalendar(req, res) {
    try {
      const { from, to, category } = req.query;
      const repo = req.app.locals.dataSource.getRepository(Match);
      const where: any = {};

      if (from && to) where.date = Between(from, to);
      else if (from) where.date = MoreThanOrEqual(from);
      else if (to) where.date = LessThanOrEqual(to);
      if (category) where.category = category;

      const matches = await repo.find({
        where,
        relations: ['tournament'],
        order: { date: 'ASC', time: 'ASC' },
      });

      res.json(
        matches.map((m) => ({
          id: m.id,
          category: m.category,
          date: m.date,
          time: m.time,
          opponent: m.opponent,
          location: m.location,
          venue: m.venue,
          status: m.status,
          ourScore: m.ourScore,
          opponentScore: m.opponentScore,
          tournament: m.tournament
            ? { id: m.tournament.id, name: m.tournament.name, kind: m.tournament.kind }
            : null,
        }))
      );
    } catch (error) {
      console.error('Erro ao listar calendário público:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async createMatch(req, res) {
    const {
      category,
      tournamentId,
      date,
      time,
      opponent,
      location,
      venue,
      status,
      ourScore,
      opponentScore,
      notes,
    } = req.body;

    try {
      if (!date || !opponent?.trim()) {
        return res.status(400).json({ message: 'Data e adversário são obrigatórios' });
      }

      const finalCategory = category || MatchCategory.AVULSO;
      if (finalCategory === MatchCategory.TORNEIO && !tournamentId) {
        return res.status(400).json({ message: 'Selecione o torneio para jogos de torneio' });
      }

      const repo = req.app.locals.dataSource.getRepository(Match);
      const match = repo.create({
        category: finalCategory,
        tournamentId: tournamentId ? parseInt(tournamentId) : null,
        date,
        time: time || null,
        opponent: opponent.trim(),
        location: location || MatchLocation.CASA,
        venue: venue || null,
        status: status || MatchStatus.AGENDADO,
        ourScore: parseOptionalInt(ourScore),
        opponentScore: parseOptionalInt(opponentScore),
        notes: notes || null,
      });

      await repo.save(match);
      const saved = await repo.findOne({ where: { id: match.id }, relations: ['tournament'] });
      res.status(201).json({ message: 'Jogo cadastrado', match: saved });
    } catch (error) {
      console.error('Erro ao criar jogo:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async updateMatch(req, res) {
    const { id } = req.params;
    const body = req.body;

    try {
      const repo = req.app.locals.dataSource.getRepository(Match);
      const match = await repo.findOne({ where: { id: parseInt(id) } });
      if (!match) return res.status(404).json({ message: 'Jogo não encontrado' });

      if (body.category !== undefined) match.category = body.category;
      if (body.tournamentId !== undefined) {
        match.tournamentId = body.tournamentId ? parseInt(body.tournamentId) : null;
      }
      if (body.date !== undefined) match.date = body.date;
      if (body.time !== undefined) match.time = body.time || null;
      if (body.opponent !== undefined) match.opponent = body.opponent.trim();
      if (body.location !== undefined) match.location = body.location;
      if (body.venue !== undefined) match.venue = body.venue || null;
      if (body.status !== undefined) match.status = body.status;
      if (body.ourScore !== undefined) match.ourScore = parseOptionalInt(body.ourScore);
      if (body.opponentScore !== undefined) match.opponentScore = parseOptionalInt(body.opponentScore);
      if (body.notes !== undefined) match.notes = body.notes || null;

      if (match.category === MatchCategory.TORNEIO && !match.tournamentId) {
        return res.status(400).json({ message: 'Selecione o torneio para jogos de torneio' });
      }

      await repo.save(match);
      const saved = await repo.findOne({ where: { id: match.id }, relations: ['tournament'] });
      res.json({ message: 'Jogo atualizado', match: saved });
    } catch (error) {
      console.error('Erro ao atualizar jogo:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async deleteMatch(req, res) {
    const { id } = req.params;
    try {
      const repo = req.app.locals.dataSource.getRepository(Match);
      const match = await repo.findOne({ where: { id: parseInt(id) } });
      if (!match) return res.status(404).json({ message: 'Jogo não encontrado' });
      await repo.remove(match);
      res.json({ message: 'Jogo removido' });
    } catch (error) {
      console.error('Erro ao deletar jogo:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getMatchDetails(req, res) {
    const { id } = req.params;
    try {
      const dataSource = req.app.locals.dataSource;
      const matchRepo = dataSource.getRepository(Match);
      const playerRepo = dataSource.getRepository(MatchPlayer);
      const goalRepo = dataSource.getRepository(MatchGoal);
      const userRepo = dataSource.getRepository(User);

      const match = await matchRepo.findOne({
        where: { id: parseInt(id) },
        relations: ['tournament'],
      });
      if (!match) return res.status(404).json({ message: 'Jogo não encontrado' });

      const [players, goals, athletes] = await Promise.all([
        playerRepo.find({
          where: { matchId: match.id },
          relations: ['athlete'],
          order: { isStarter: 'DESC', createdAt: 'ASC' },
        }),
        goalRepo.find({
          where: { matchId: match.id },
          relations: ['athlete'],
          order: { minute: 'ASC', createdAt: 'ASC' },
        }),
        userRepo.find({
          where: { isAdmin: false },
          select: { id: true, name: true, email: true },
          order: { name: 'ASC' },
        }),
      ]);

      const ourGoals = goals.filter((g) => !g.isOpponentGoal && !g.isOwnGoal).length;
      const ownGoals = goals.filter((g) => g.isOwnGoal).length;
      const opponentGoals = goals.filter((g) => g.isOpponentGoal).length;
      const rated = players.filter((p) => p.rating != null);
      const avgRating = rated.length
        ? Math.round(
            (rated.reduce((s, p) => s + Number(p.rating), 0) / rated.length) * 10
          ) / 10
        : null;

      res.json({
        match,
        players: players.map((p) => ({
          id: p.id,
          athleteId: p.athleteId,
          name: p.athlete?.name || p.athlete?.email,
          email: p.athlete?.email,
          rating: p.rating != null ? Number(p.rating) : null,
          isStarter: p.isStarter,
          notes: p.notes,
        })),
        goals: goals.map((g) => ({
          id: g.id,
          athleteId: g.athleteId,
          athleteName: g.athlete?.name || g.athlete?.email || null,
          minute: g.minute,
          isOwnGoal: g.isOwnGoal,
          isOpponentGoal: g.isOpponentGoal,
          description: g.description,
        })),
        availableAthletes: athletes,
        summary: {
          ourGoalsLogged: ourGoals,
          ownGoalsLogged: ownGoals,
          opponentGoalsLogged: opponentGoals,
          playersCount: players.length,
          avgRating,
        },
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes do jogo:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async addMatchPlayers(req, res) {
    const { id } = req.params;
    const { athleteIds, isStarter } = req.body;

    try {
      const ids = Array.isArray(athleteIds) ? athleteIds.map((x) => parseInt(x)) : [];
      if (!ids.length) {
        return res.status(400).json({ message: 'Selecione ao menos um atleta' });
      }

      const dataSource = req.app.locals.dataSource;
      const matchRepo = dataSource.getRepository(Match);
      const playerRepo = dataSource.getRepository(MatchPlayer);
      const userRepo = dataSource.getRepository(User);

      const match = await matchRepo.findOne({ where: { id: parseInt(id) } });
      if (!match) return res.status(404).json({ message: 'Jogo não encontrado' });

      const athletes = await userRepo.find({
        where: { id: In(ids), isAdmin: false },
      });
      if (!athletes.length) {
        return res.status(400).json({ message: 'Nenhum atleta válido encontrado' });
      }

      const existing = await playerRepo.find({ where: { matchId: match.id } });
      const existingIds = new Set(existing.map((p) => p.athleteId));
      const toCreate = athletes.filter((a) => !existingIds.has(a.id));

      const created = toCreate.map((a) =>
        playerRepo.create({
          matchId: match.id,
          athleteId: a.id,
          isStarter: !!isStarter,
          rating: null,
          notes: null,
        })
      );

      if (created.length) await playerRepo.save(created);

      res.status(201).json({
        message: `${created.length} atleta(s) adicionados`,
        added: created.length,
        skipped: athletes.length - created.length,
      });
    } catch (error) {
      console.error('Erro ao adicionar atletas à partida:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async updateMatchPlayer(req, res) {
    const { id, playerId } = req.params;
    const { rating, isStarter, notes } = req.body;

    try {
      const playerRepo = req.app.locals.dataSource.getRepository(MatchPlayer);
      const player = await playerRepo.findOne({
        where: { id: parseInt(playerId), matchId: parseInt(id) },
        relations: ['athlete'],
      });
      if (!player) return res.status(404).json({ message: 'Atleta não está nesta partida' });

      if (rating !== undefined && rating !== null && rating !== '') {
        const ratingValue = Number(rating);
        if (Number.isNaN(ratingValue) || ratingValue < 0 || ratingValue > 10) {
          return res.status(400).json({ message: 'Nota deve ser entre 0 e 10' });
        }
        player.rating = ratingValue;
      } else if (rating === null || rating === '') {
        player.rating = null;
      }

      if (isStarter !== undefined) player.isStarter = !!isStarter;
      if (notes !== undefined) player.notes = notes || null;

      await playerRepo.save(player);
      res.json({
        message: 'Atleta atualizado',
        player: {
          id: player.id,
          athleteId: player.athleteId,
          name: player.athlete?.name || player.athlete?.email,
          rating: player.rating != null ? Number(player.rating) : null,
          isStarter: player.isStarter,
          notes: player.notes,
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar atleta da partida:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async removeMatchPlayer(req, res) {
    const { id, playerId } = req.params;
    try {
      const dataSource = req.app.locals.dataSource;
      const playerRepo = dataSource.getRepository(MatchPlayer);
      const goalRepo = dataSource.getRepository(MatchGoal);

      const player = await playerRepo.findOne({
        where: { id: parseInt(playerId), matchId: parseInt(id) },
      });
      if (!player) return res.status(404).json({ message: 'Atleta não está nesta partida' });

      await goalRepo.delete({ matchId: parseInt(id), athleteId: player.athleteId });
      await playerRepo.remove(player);
      res.json({ message: 'Atleta removido da partida' });
    } catch (error) {
      console.error('Erro ao remover atleta da partida:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async addMatchGoal(req, res) {
    const { id } = req.params;
    const { athleteId, minute, isOwnGoal, isOpponentGoal, description } = req.body;

    try {
      const dataSource = req.app.locals.dataSource;
      const matchRepo = dataSource.getRepository(Match);
      const playerRepo = dataSource.getRepository(MatchPlayer);
      const goalRepo = dataSource.getRepository(MatchGoal);

      const match = await matchRepo.findOne({ where: { id: parseInt(id) } });
      if (!match) return res.status(404).json({ message: 'Jogo não encontrado' });

      const opponentGoal = !!isOpponentGoal;
      const ownGoal = !!isOwnGoal;

      if (!opponentGoal && !athleteId) {
        return res.status(400).json({ message: 'Selecione o atleta que fez o gol' });
      }

      if (athleteId && !opponentGoal) {
        const inMatch = await playerRepo.findOne({
          where: { matchId: match.id, athleteId: parseInt(athleteId) },
        });
        if (!inMatch) {
          return res.status(400).json({ message: 'Atleta precisa estar na escalação da partida' });
        }
      }

      const goal = goalRepo.create({
        matchId: match.id,
        athleteId: opponentGoal ? null : athleteId ? parseInt(athleteId) : null,
        minute: minute === '' || minute == null ? null : parseInt(minute),
        isOwnGoal: opponentGoal ? false : ownGoal,
        isOpponentGoal: opponentGoal,
        description: description || null,
      });

      await goalRepo.save(goal);
      const saved = await goalRepo.findOne({ where: { id: goal.id }, relations: ['athlete'] });

      res.status(201).json({
        message: 'Gol registrado',
        goal: {
          id: saved.id,
          athleteId: saved.athleteId,
          athleteName: saved.athlete?.name || saved.athlete?.email || null,
          minute: saved.minute,
          isOwnGoal: saved.isOwnGoal,
          isOpponentGoal: saved.isOpponentGoal,
          description: saved.description,
        },
      });
    } catch (error) {
      console.error('Erro ao registrar gol:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async removeMatchGoal(req, res) {
    const { id, goalId } = req.params;
    try {
      const goalRepo = req.app.locals.dataSource.getRepository(MatchGoal);
      const goal = await goalRepo.findOne({
        where: { id: parseInt(goalId), matchId: parseInt(id) },
      });
      if (!goal) return res.status(404).json({ message: 'Gol não encontrado' });
      await goalRepo.remove(goal);
      res.json({ message: 'Gol removido' });
    } catch (error) {
      console.error('Erro ao remover gol:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getMetrics(req, res) {
    try {
      const { from, to } = req.query;
      const repo = req.app.locals.dataSource.getRepository(Match);
      const where: any = {};
      if (from && to) where.date = Between(from, to);
      else if (from) where.date = MoreThanOrEqual(from);
      else if (to) where.date = LessThanOrEqual(to);

      const matches = await repo.find({
        where,
        relations: ['tournament'],
        order: { date: 'ASC' },
      });

      const finished = matches.filter(
        (m) => (m.status === MatchStatus.FINALIZADO || m.status === 'finalizado') &&
          m.ourScore != null &&
          m.opponentScore != null
      );

      let wins = 0;
      let draws = 0;
      let losses = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;
      const byCategory = { torneio: 0, amistoso: 0, avulso: 0 };
      const byLocation = { casa: { j: 0, v: 0, e: 0, d: 0 }, fora: { j: 0, v: 0, e: 0, d: 0 }, neutro: { j: 0, v: 0, e: 0, d: 0 } };
      const monthlyMap = {};
      const form = [];

      finished.forEach((m) => {
        const r = resultOf(m);
        goalsFor += m.ourScore;
        goalsAgainst += m.opponentScore;
        if (r === 'V') wins += 1;
        else if (r === 'E') draws += 1;
        else if (r === 'D') losses += 1;

        if (byCategory[m.category] !== undefined) byCategory[m.category] += 1;

        const loc = byLocation[m.location] || byLocation.neutro;
        loc.j += 1;
        if (r === 'V') loc.v += 1;
        if (r === 'E') loc.e += 1;
        if (r === 'D') loc.d += 1;

        const monthKey = String(m.date).slice(0, 7);
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { month: monthKey, jogos: 0, vitorias: 0, empates: 0, derrotas: 0, golsPro: 0, golsContra: 0 };
        }
        monthlyMap[monthKey].jogos += 1;
        monthlyMap[monthKey].golsPro += m.ourScore;
        monthlyMap[monthKey].golsContra += m.opponentScore;
        if (r === 'V') monthlyMap[monthKey].vitorias += 1;
        if (r === 'E') monthlyMap[monthKey].empates += 1;
        if (r === 'D') monthlyMap[monthKey].derrotas += 1;

        form.push({
          date: m.date,
          opponent: m.opponent,
          score: `${m.ourScore}x${m.opponentScore}`,
          result: r,
          category: m.category,
        });
      });

      const played = finished.length;
      const points = wins * 3 + draws;
      const winRate = played ? Math.round((wins / played) * 100) : 0;

      const upcoming = matches
        .filter((m) => m.status === MatchStatus.AGENDADO || m.status === 'agendado')
        .slice(0, 8);

      const recent = [...finished].reverse().slice(0, 8);

      res.json({
        summary: {
          total: matches.length,
          played,
          scheduled: matches.filter((m) => m.status === 'agendado' || m.status === MatchStatus.AGENDADO).length,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          goalDiff: goalsFor - goalsAgainst,
          points,
          winRate,
        },
        byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
        byLocation: Object.entries(byLocation).map(([name, stats]) => ({ name, ...stats })),
        resultsPie: [
          { name: 'Vitórias', value: wins },
          { name: 'Empates', value: draws },
          { name: 'Derrotas', value: losses },
        ],
        monthly: Object.values(monthlyMap).sort((a: any, b: any) => (a.month < b.month ? -1 : 1)),
        form: form.slice(-10),
        upcoming,
        recent,
      });
    } catch (error) {
      console.error('Erro ao calcular métricas de jogos:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = GamesController;
export {};
