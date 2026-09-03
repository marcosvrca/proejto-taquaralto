import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum TournamentKind {
  CAMPEONATO = 'campeonato',
  COPA = 'copa',
  LIGA = 'liga',
  OUTRO = 'outro',
}

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: TournamentKind,
    default: TournamentKind.CAMPEONATO,
  })
  kind: TournamentKind;

  @Column({ type: 'varchar', length: 100, nullable: true })
  season: string;

  @Column({ type: 'date', nullable: true })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany('Match', 'tournament')
  matches: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
