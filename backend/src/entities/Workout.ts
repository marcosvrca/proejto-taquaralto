import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
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
export class Workout {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'date' })
  date: string; // Data do treino

  @Column({ type: 'time' })
  time: string; // Hora do treino

  @Column({
    type: 'enum',
    enum: WorkoutType,
    default: WorkoutType.MUSCULACAO
  })
  type: WorkoutType; // Tipo de treino

  @Column({
    type: 'enum',
    enum: WorkoutIntensity,
    default: WorkoutIntensity.MODERADO
  })
  intensity: WorkoutIntensity; // Intensidade do treino

  @Column({ type: 'text', nullable: true })
  notes: string; // Observações do treino

  @Column({ type: 'int', nullable: true })
  durationMinutes: number; // Duração em minutos

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}