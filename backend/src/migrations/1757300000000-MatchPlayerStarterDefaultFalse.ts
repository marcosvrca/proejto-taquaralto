/**
 * Migration: relacionados não iniciam como titular por padrão
 */
module.exports = class MatchPlayerStarterDefaultFalse1757300000000 {
  name = 'MatchPlayerStarterDefaultFalse1757300000000';

  async up(queryRunner) {
    await queryRunner.query(`
      ALTER TABLE match_players
      ALTER COLUMN "isStarter" SET DEFAULT false
    `);
    // Corrige relacionados já cadastrados com titular automático
    await queryRunner.query(`
      UPDATE match_players SET "isStarter" = false
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`
      ALTER TABLE match_players
      ALTER COLUMN "isStarter" SET DEFAULT true
    `);
  }
};
