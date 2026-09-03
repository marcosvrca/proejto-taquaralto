/**
 * Migration: tabela de notas do admin sobre atletas (treino / jogo)
 */
module.exports = class AthleteNotes1757000000000 {
  name = 'AthleteNotes1757000000000';

  async up(queryRunner) {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE athlete_notes_type_enum AS ENUM ('treino', 'jogo');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS athlete_notes (
        id SERIAL PRIMARY KEY,
        "athleteId" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "adminId" integer NULL REFERENCES users(id) ON DELETE SET NULL,
        type athlete_notes_type_enum NOT NULL,
        date date NOT NULL,
        opponent varchar(255) NULL,
        observation text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_athlete_notes_athlete_date"
      ON athlete_notes ("athleteId", date)
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_athlete_notes_athlete_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS athlete_notes`);
    await queryRunner.query(`DROP TYPE IF EXISTS athlete_notes_type_enum`);
  }
};
