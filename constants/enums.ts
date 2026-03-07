export enum TrainingLevel {
  NOOB = 'noob',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum PersonaTag {
  MUSCLE_DADDY = 'muscle_daddy',
  MUSCLE_MOMMY = 'muscle_mommy',
  GYMBRO = 'gymbro',
  GYM_DUDETTE = 'gym_dudette',
  LONE_WOLF = 'lone_wolf',
  GYM_RAT = 'gym_rat',
}

export enum WorkoutFocus {
  BICEPS = 'biceps',
  TRICEPS = 'triceps',
  QUADS = 'quads',
  HAMMIES = 'hammies',
  BACK = 'back',
  SHOULDERS = 'shoulders',
  ABS = 'abs',
}

export const TRAINING_LEVEL_LABELS = {
  [TrainingLevel.NOOB]: 'Beginner',
  [TrainingLevel.INTERMEDIATE]: 'Intermediate',
  [TrainingLevel.ADVANCED]: 'Advanced',
};

export const PERSONA_TAG_LABELS = {
  [PersonaTag.MUSCLE_DADDY]: '💪 Muscle Daddy',
  [PersonaTag.MUSCLE_MOMMY]: '💪 Muscle Mommy',
  [PersonaTag.GYMBRO]: '🤙 Gym Bro',
  [PersonaTag.GYM_DUDETTE]: '🤙 Gym Dudette',
  [PersonaTag.LONE_WOLF]: '🐺 Lone Wolf',
  [PersonaTag.GYM_RAT]: '🐀 Gym Rat',
};

export const WORKOUT_FOCUS_LABELS = {
  [WorkoutFocus.BICEPS]: '💪 Biceps',
  [WorkoutFocus.TRICEPS]: '💪 Triceps',
  [WorkoutFocus.QUADS]: '🦵 Quads',
  [WorkoutFocus.HAMMIES]: '🦵 Hamstrings',
  [WorkoutFocus.BACK]: '🏋️ Back',
  [WorkoutFocus.SHOULDERS]: '🤸 Shoulders',
  [WorkoutFocus.ABS]: '⚡ Abs',
};