/**
 * Migration: torneios e jogos do calendário do time
 */
module.exports = class GamesModule1757100000000 {
  name = 'GamesModule1757100000000';

  async up(queryRunner) {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE tournaments_kind_enum AS ENUM ('campeonato', 'copa', 'liga', 'outro');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE matches_category_enum AS ENUM ('torneio', 'amistoso', 'avulso');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE matches_location_enum AS ENUM ('casa', 'fora', 'neutro');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE matches_status_enum AS ENUM ('agendado', 'em_andamento', 'finalizado', 'cancelado');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id SERIAL PRIMARY KEY,
        name varchar(255) NOT NULL,
        kind tournaments_kind_enum NOT NULL DEFAULT 'campeonato',
        season varchar(100) NULL,
        "startDate" date NULL,
        "endDate" date NULL,
        notes text NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        category matches_category_enum NOT NULL DEFAULT 'avulso',
        "tournamentId" integer NULL REFERENCES tournaments(id) ON DELETE SET NULL,
        date date NOT NULL,
        time time NULL,
        opponent varchar(255) NOT NULL,
        location matches_location_enum NOT NULL DEFAULT 'casa',
        venue varchar(255) NULL,
        status matches_status_enum NOT NULL DEFAULT 'agendado',
        "ourScore" integer NULL,
        "opponentScore" integer NULL,
        notes text NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_matches_date" ON matches (date)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_matches_category" ON matches (category)`);
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_matches_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_matches_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS matches`);
    await queryRunner.query(`DROP TABLE IF EXISTS tournaments`);
    await queryRunner.query(`DROP TYPE IF EXISTS matches_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS matches_location_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS matches_category_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS tournaments_kind_enum`);
  }
};
