import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ nullable: true })
  name: string;

  @Column({ default: true })
  canAccessSleep: boolean;

  @Column({ default: true })
  canAccessWorkouts: boolean;

  @Column({ default: true })
  canAccessNutrition: boolean;

  @Column({ default: true })
  canAccessHealth: boolean;

  @Column({ default: true })
  canAccessGoals: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}