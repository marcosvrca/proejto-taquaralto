import { describe, it, expect } from 'vitest';
import { hasModuleAccess, type User } from '../types/user';

const baseUser: User = {
  id: 1,
  email: 'a@test.com',
  name: 'A',
  isAdmin: false,
  canAccessSleep: true,
  canAccessWorkouts: false,
  canAccessNutrition: true,
  canAccessHealth: true,
  canAccessGoals: true,
};

describe('hasModuleAccess', () => {
  it('retorna false sem usuário', () => {
    expect(hasModuleAccess(null, 'sleep')).toBe(false);
  });

  it('permite quando flag é true', () => {
    expect(hasModuleAccess(baseUser, 'sleep')).toBe(true);
  });

  it('bloqueia quando flag é false', () => {
    expect(hasModuleAccess(baseUser, 'workouts')).toBe(false);
  });

  it('permite quando flag é undefined (default liberado)', () => {
    const user = { ...baseUser };
    delete user.canAccessNutrition;
    expect(hasModuleAccess(user, 'nutrition')).toBe(true);
  });
});
