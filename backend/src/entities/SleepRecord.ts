import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './User';

@Entity('sleep_records')
export class SleepRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'date' })
  date: string; // Data do registro

  @Column({ type: 'time', nullable: true })
  bedTime: string; // Hora de dormir

  @Column({ type: 'time', nullable: true })
  wakeTime: string; // Hora de acordar

  @Column({ type: 'int', nullable: true })
  durationMinutes: number; // Duração calculada

  @CreateDateColumn()
  createdAt: Date;
}