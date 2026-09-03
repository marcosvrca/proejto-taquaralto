import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { Match } from './Match';
import { User } from './User';

@Entity('match_players')
@Unique('UQ_match_player', ['matchId', 'athleteId'])
@Index('IDX_match_players_match', ['matchId'])
export class MatchPlayer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match: Match;

  @Column()
  matchId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'athleteId' })
  athlete: User;

  @Column()
  athleteId: number;

  /** Nota individual do atleta na partida (0-10) */
  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  rating: number;

  @Column({ type: 'boolean', default: false })
  isStarter: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
