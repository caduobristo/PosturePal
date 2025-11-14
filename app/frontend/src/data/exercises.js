import position1 from './position1.png';
import position2 from './position2.png';
import position3 from './position3.png';
import position4 from './position4.png';
import position5 from './position5.png';
import releve from './releve.png';

export const EXERCISES = [
  {
    id: '1',
    name: 'Bras Bas',
    difficulty: 'Beginner',
    description: 'Basic foot position with heels together, toes turned out.',
    image: position1,
    keyPoints: [
      'Heels together',
      'Toes turned out',
      'Straight posture',
      'Engaged core',
    ],
    averageScore: 88,
    completedTimes: 15,
  },
  {
    id: '2',
    name: 'À la seconde',
    difficulty: 'Beginner',
    description: 'One leg extended behind, body in line.',
    image: position2,
    keyPoints: [
      'Extended leg alignment',
      'Hip square',
      'Long spine',
      'Arm positioning',
    ],
    averageScore: 75,
    completedTimes: 8,
  },
  {
    id: '3',
    name: 'Troisième Position',
    difficulty: 'Beginner',
    description: 'Deep knee bend maintaining turnout.',
    image: position3,
    keyPoints: [
      'Knee alignment',
      'Straight back',
      'Controlled movement',
      'Proper turnout',
    ],
    averageScore: 85,
    completedTimes: 12,
  },
  {
    id: '4',
    name: 'Quatrième Position',
    difficulty: 'Beginner',
    description: 'Graceful arm movements and carriage.',
    image: position4,
    keyPoints: [
      'Flowing movement',
      'Shoulder stability',
      'Curved arms',
      'Coordinated breathing',
    ],
    averageScore: 91,
    completedTimes: 20,
  },
  {
    id: '5',
    name: 'Cinquième en Haut',
    difficulty: 'Beginner',
    description: 'Sliding foot along floor maintaining contact.',
    image: position5,
    keyPoints: [
      'Foot articulation',
      'Leg alignment',
      'Hip stability',
      'Core engagement',
    ],
    averageScore: 86,
    completedTimes: 18,
  },  {
    id: '6',
    name: 'Relevé',
    difficulty: 'Intermediate',
    description: 'Rising onto balls of feet with control.',
    image: releve,
    keyPoints: [
      'Balanced rise',
      'Ankle strength',
      'Core stability',
      'Proper alignment',
    ],
    averageScore: 79,
    completedTimes: 10,
  },
];

export const getExerciseById = (id) =>
  EXERCISES.find((exercise) => exercise.id === id);

export const DEFAULT_CAMERA_SESSION_STATE = Object.freeze({
  isActive: false,
  selectedExercise: null,
  currentScore: 0,
  analyzing: false,
  countdown: 0,
  capturedImage: null,
  feedback: null,
});
