import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './User';

export enum MealType {
  CAFE_MANHA = 'cafe_manha',
  ALMOCO = 'almoco',
  LANCHE_TARDE = 'lanche_tarde',
  JANTAR = 'jantar',
  OUTRO_HORARIO = 'outro_horario'
}

@Entity('nutrition')
@Index('IDX_nutrition_user_date', ['userId', 'date'])
export class Nutrition {
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
    enum: MealType,
    default: MealType.CAFE_MANHA
  })
  mealType: MealType;

  @Column({ type: 'int' })
  calories: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false })
  consumedSoda: boolean;

  @Column({ type: 'boolean', default: false })
  consumedAlcohol: boolean;

  @Column({ type: 'boolean', default: false })
  consumedWater: boolean;

  @Column({ type: 'boolean', default: false })
  consumedNaturalJuice: boolean;

  @Column({ type: 'boolean', default: false })
  consumedIndustrialJuice: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
