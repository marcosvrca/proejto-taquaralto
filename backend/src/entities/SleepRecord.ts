import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique, Index } from 'typeorm';
import { User } from './User';

@Entity('sleep_records')
@Unique('UQ_sleep_user_date', ['userId', 'date'])
@Index('IDX_sleep_user_date', ['userId', 'date'])
export class SleepRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time', nullable: true })
  bedTime: string;

  @Column({ type: 'time', nullable: true })
  wakeTime: string;

  @Column({ type: 'int', nullable: true })
  durationMinutes: number;

  @CreateDateColumn()
  createdAt: Date;
}
