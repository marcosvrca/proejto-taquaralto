import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Tournament } from './Tournament';

export enum MatchCategory {
  TORNEIO = 'torneio',
  AMISTOSO = 'amistoso',
  AVULSO = 'avulso',
}

export enum MatchLocation {
  CASA = 'casa',
  FORA = 'fora',
  NEUTRO = 'neutro',
}

export enum MatchStatus {
  AGENDADO = 'agendado',
  EM_ANDAMENTO = 'em_andamento',
  FINALIZADO = 'finalizado',
  CANCELADO = 'cancelado',
}

@Entity('matches')
@Index('IDX_matches_date', ['date'])
@Index('IDX_matches_category', ['category'])
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: MatchCategory,
    default: MatchCategory.AVULSO,
  })
  category: MatchCategory;

  @ManyToOne(() => Tournament, (tournament) => tournament.matches, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'tournamentId' })
  tournament: Tournament;

  @Column({ nullable: true })
  tournamentId: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time', nullable: true })
  time: string;

  @Column({ type: 'varchar', length: 255 })
  opponent: string;

  @Column({
    type: 'enum',
    enum: MatchLocation,
    default: MatchLocation.CASA,
  })
  location: MatchLocation;

  @Column({ type: 'varchar', length: 255, nullable: true })
  venue: string;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.AGENDADO,
  })
  status: MatchStatus;

  @Column({ type: 'int', nullable: true })
  ourScore: number;

  @Column({ type: 'int', nullable: true })
  opponentScore: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
