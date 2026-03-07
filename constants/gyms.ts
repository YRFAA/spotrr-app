export const PRELOADED_GYMS = [
  { gym_id: 'gym-1', name: 'Virgin Active', is_custom: false },
  { gym_id: 'gym-2', name: 'Zone Fitness', is_custom: false },
  { gym_id: 'gym-3', name: 'Planet Fitness', is_custom: false },
  { gym_id: 'gym-4', name: 'Moove Motion Fitness', is_custom: false },
  { gym_id: 'gym-5', name: 'Edge Fitness', is_custom: false },
];

export interface Gym {
  gym_id: string;
  name: string;
  is_custom: boolean;
}