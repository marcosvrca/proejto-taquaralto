import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './User';

export enum WorkoutIntensity {
  LEVE = 'leve',
  MODERADO = 'moderado',
  INTENSO = 'intenso',
  PESADO = 'pesado',
  EXAUSTIVO = 'exaustivo',
  OUTROS = 'outros'
}

export enum WorkoutType {
  FUTSAL = 'futsal',
  FUTEBOL = 'futebol',
  TERRAO = 'terrao',
  SOCIETY = 'society',
  VOLEI = 'volei',
  FUTEVOLEI = 'futevolei',
  BASQUETE = 'basquete',
  NATACAO = 'natacao',
  LUTAS = 'lutas',
  MUSCULACAO = 'musculacao',
  CORRIDA = 'corrida',
  MOBILIDADE = 'mobilidade',
  TREINO_FORCA = 'treino_forca',
  TREINO_AGILIDADE = 'treino_agilidade'
}

@Entity('workouts')
@Index('IDX_workouts_user_date', ['userId', 'date'])
export class Workout {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  time: string;

  @Column({
    type: 'enum',
    enum: WorkoutType,
    default: WorkoutType.MUSCULACAO
  })
  type: WorkoutType;

  @Column({
    type: 'enum',
    enum: WorkoutIntensity,
    default: WorkoutIntensity.MODERADO
  })
  intensity: WorkoutIntensity;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'int', nullable: true })
  durationMinutes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
