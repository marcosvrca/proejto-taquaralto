import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Match } from './Match';
import { User } from './User';

@Entity('match_goals')
@Index('IDX_match_goals_match', ['matchId'])
export class MatchGoal {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match: Match;

  @Column()
  matchId: number;

  /** Atleta que fez o gol (do nosso time). Null se for gol do adversário. */
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'athleteId' })
  athlete: User;

  @Column({ nullable: true })
  athleteId: number;

  @Column({ type: 'int', nullable: true })
  minute: number;

  /** true = gol contra do nosso atleta */
  @Column({ type: 'boolean', default: false })
  isOwnGoal: boolean;

  /** true = gol marcado pelo adversário */
  @Column({ type: 'boolean', default: false })
  isOpponentGoal: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
