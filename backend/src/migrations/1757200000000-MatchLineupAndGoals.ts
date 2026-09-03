/**
 * Migration: escalação e gols por partida
 */
module.exports = class MatchLineupAndGoals1757200000000 {
  name = 'MatchLineupAndGoals1757200000000';

  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS match_players (
        id SERIAL PRIMARY KEY,
        "matchId" integer NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        "athleteId" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating numeric(4,1) NULL,
        "isStarter" boolean NOT NULL DEFAULT true,
        notes text NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_match_player" UNIQUE ("matchId", "athleteId")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_match_players_match"
      ON match_players ("matchId")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS match_goals (
        id SERIAL PRIMARY KEY,
        "matchId" integer NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        "athleteId" integer NULL REFERENCES users(id) ON DELETE SET NULL,
        minute integer NULL,
        "isOwnGoal" boolean NOT NULL DEFAULT false,
        "isOpponentGoal" boolean NOT NULL DEFAULT false,
        description varchar(255) NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_match_goals_match"
      ON match_goals ("matchId")
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_match_goals_match"`);
    await queryRunner.query(`DROP TABLE IF EXISTS match_goals`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_match_players_match"`);
    await queryRunner.query(`DROP TABLE IF EXISTS match_players`);
  }
};
