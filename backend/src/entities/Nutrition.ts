import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

export enum MealType {
  CAFE_MANHA = 'cafe_manha',
  ALMOCO = 'almoco',
  LANCHE_TARDE = 'lanche_tarde',
  JANTAR = 'jantar',
  OUTRO_HORARIO = 'outro_horario'
}

@Entity('nutrition')
export class Nutrition {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'date' })
  date: string; // Data da refeição

  @Column({ type: 'time' })
  time: string; // Hora da refeição

  @Column({
    type: 'enum',
    enum: MealType,
    default: MealType.CAFE_MANHA
  })
  mealType: MealType; // Tipo de refeição

  @Column({ type: 'int' })
  calories: number; // Calorias da refeição

  @Column({ type: 'text', nullable: true })
  notes: string; // O que foi consumido

  @Column({ type: 'boolean', default: false })
  consumedSoda: boolean; // Consumiu refrigerante?

  @Column({ type: 'boolean', default: false })
  consumedAlcohol: boolean; // Consumiu bebida alcoólica?

  @Column({ type: 'boolean', default: false })
  consumedWater: boolean; // Consumiu água?

  @Column({ type: 'boolean', default: false })
  consumedNaturalJuice: boolean; // Consumiu suco natural?

  @Column({ type: 'boolean', default: false })
  consumedIndustrialJuice: boolean; // Consumiu suco industrial?

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}