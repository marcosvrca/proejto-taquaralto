/**
 * Migration: cascade FKs, indexes e unique sleep (userId, date)
 * Aplicada via npm run migration:run ou DB_MIGRATIONS_RUN=true
 */
module.exports = class IntegrityCascadeAndUnique1756800000000 {
  name = 'IntegrityCascadeAndUnique1756800000000';

  async up(queryRunner) {
    // Remover duplicatas de sleep mantendo o registro mais recente
    await queryRunner.query(`
      DELETE FROM sleep_records a
      USING sleep_records b
      WHERE a."userId" = b."userId"
        AND a.date = b.date
        AND a.id < b.id
    `);

    // Recriar FKs com ON DELETE CASCADE
    const tables = [
      { table: 'sleep_records', fk: 'FK_sleep_records_user' },
      { table: 'workouts', fk: 'FK_workouts_user' },
      { table: 'nutrition', fk: 'FK_nutrition_user' },
      { table: 'pains', fk: 'FK_pains_user' },
      { table: 'goals', fk: 'FK_goals_user' },
    ];

    for (const { table } of tables) {
      const fks = await queryRunner.query(`
        SELECT conname FROM pg_constraint
        WHERE conrelid = '${table}'::regclass AND contype = 'f'
      `);
      for (const row of fks) {
        await queryRunner.query(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${row.conname}"`);
      }
      await queryRunner.query(`
        ALTER TABLE "${table}"
        ADD CONSTRAINT "FK_${table}_user"
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      `);
    }

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_sleep_user_date"
      ON sleep_records ("userId", date)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_workouts_user_date"
      ON workouts ("userId", date)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_nutrition_user_date"
      ON nutrition ("userId", date)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pains_user_date"
      ON pains ("userId", date)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_goals_user"
      ON goals ("userId")
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_sleep_user_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workouts_user_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_nutrition_user_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pains_user_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_goals_user"`);
  }
};
