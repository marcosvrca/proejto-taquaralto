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
import { User } from './User';

export enum AthleteNoteType {
  TREINO = 'treino',
  JOGO = 'jogo',
}

@Entity('athlete_notes')
@Index('IDX_athlete_notes_athlete_date', ['athleteId', 'date'])
export class AthleteNote {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'athleteId' })
  athlete: User;

  @Column()
  athleteId: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'adminId' })
  admin: User;

  @Column({ nullable: true })
  adminId: number;

  @Column({
    type: 'enum',
    enum: AthleteNoteType,
  })
  type: AthleteNoteType;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  opponent: string;

  @Column({ type: 'decimal', precision: 4, scale: 1 })
  rating: number;

  @Column({ type: 'text' })
  observation: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
