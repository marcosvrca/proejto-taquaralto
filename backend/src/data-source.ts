require('reflect-metadata');
require('dotenv').config();

const { DataSource } = require('typeorm');
const { User } = require('./entities/User');
const { SleepRecord } = require('./entities/SleepRecord');
const { Workout } = require('./entities/Workout');
const { Nutrition } = require('./entities/Nutrition');
const { Pain } = require('./entities/Pain');
const { Goal } = require('./entities/Goal');
const { AthleteNote } = require('./entities/AthleteNote');
const { Tournament } = require('./entities/Tournament');
const { Match } = require('./entities/Match');
const { MatchPlayer } = require('./entities/MatchPlayer');
const { MatchGoal } = require('./entities/MatchGoal');

const isDev = process.env.NODE_ENV === 'development';
const forceSync = process.env.DB_SYNCHRONIZE === 'true';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, SleepRecord, Workout, Nutrition, Pain, Goal, AthleteNote, Tournament, Match, MatchPlayer, MatchGoal],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: forceSync,
  migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
  logging: isDev ? ['error', 'warn'] : ['error'],
});

module.exports = { AppDataSource };
export {};
