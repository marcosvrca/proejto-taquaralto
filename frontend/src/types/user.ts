export interface User {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
  canAccessSleep?: boolean;
  canAccessWorkouts?: boolean;
  canAccessNutrition?: boolean;
  canAccessHealth?: boolean;
  canAccessGoals?: boolean;
}

export type ModulePermission = 'sleep' | 'workouts' | 'nutrition' | 'health' | 'goals';

export const PERMISSION_MAP: Record<ModulePermission, keyof User> = {
  sleep: 'canAccessSleep',
  workouts: 'canAccessWorkouts',
  nutrition: 'canAccessNutrition',
  health: 'canAccessHealth',
  goals: 'canAccessGoals',
};

export function hasModuleAccess(user: User | null | undefined, permission: ModulePermission): boolean {
  if (!user) return false;
  return user[PERMISSION_MAP[permission]] !== false;
}
