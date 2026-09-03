/**
 * Migration: campo rating (nota numérica) em athlete_notes
 */
module.exports = class AthleteNoteRating1757001000000 {
  name = 'AthleteNoteRating1757001000000';

  async up(queryRunner) {
    await queryRunner.query(`
      ALTER TABLE athlete_notes
      ADD COLUMN IF NOT EXISTS rating numeric(4,1) NOT NULL DEFAULT 0
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`
      ALTER TABLE athlete_notes
      DROP COLUMN IF EXISTS rating
    `);
  }
};
