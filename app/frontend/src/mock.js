// Mock data for Ballet Posture Monitor Mobile App

export const mockUser = {
  id: '1',
  name: 'Usuario',
  email: 'admin@ballet.com',
  level: 'Intermediate',
  experience: '3 years',
  avatar: 'https://images.unsplash.com/photo-1675806528444-75a88ed9c014?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  totalSessions: 89,
  averageScore: 82,
  bestScore: 94,
  streakDays: 8,
  joinDate: '2023-03-15',
  isAuthenticated: false
};

export const mockBalletExercises = [
  {
    id: '1',
    name: 'First Position',
    difficulty: 'Beginner',
    description: 'Basic foot position with heels together, toes turned out',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=200&fit=crop',
    keyPoints: ['Heels together', 'Toes turned out', 'Straight posture', 'Engaged core'],
    averageScore: 88,
    completedTimes: 15
  },
  {
    id: '2',
    name: 'Second Position',
    difficulty: 'Beginner',
    description: 'One leg extended behind, body in line',
    image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=300&h=200&fit=crop',
    keyPoints: ['Extended leg alignment', 'Hip square', 'Long spine', 'Arm positioning'],
    averageScore: 75,
    completedTimes: 8
  },
  {
    id: '3',
    name: 'Third Position',
    difficulty: 'Beginner',
    description: 'Deep knee bend maintaining turnout',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
    keyPoints: ['Knee alignment', 'Straight back', 'Controlled movement', 'Proper turnout'],
    averageScore: 85,
    completedTimes: 12
  },
  {
    id: '4',
    name: 'Fourth Position',
    difficulty: 'Beginner',
    description: 'Graceful arm movements and carriage',
    image: 'https://images.unsplash.com/photo-1594736797933-d0401ba00de2?w=300&h=200&fit=crop',
    keyPoints: ['Flowing movement', 'Shoulder stability', 'Curved arms', 'Coordinated breathing'],
    averageScore: 91,
    completedTimes: 20
  },
  {
    id: '5',
    name: 'Fifth Position',
    difficulty: 'Beginner',
    description: 'Sliding foot along floor maintaining contact',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=200&fit=crop',
    keyPoints: ['Foot articulation', 'Leg alignment', 'Hip stability', 'Core engagement'],
    averageScore: 86,
    completedTimes: 18
  },
  {
    id: '6',
    name: 'Relevé',
    difficulty: 'Intermediate',
    description: 'Rising onto balls of feet with control',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=200&fit=crop',
    keyPoints: ['Balanced rise', 'Ankle strength', 'Core stability', 'Proper alignment'],
    averageScore: 79,
    completedTimes: 10
  }
];

export const mockSessionHistory = [
  {
    id: '1',
    date: '2025-11-15',
    time: '14:30',
    exercise: 'First Position',
    score: 87,
    duration: '00:45',
    feedback: 'Great improvement in hip alignment! Work on extending the lifted leg more.',
    keyMetrics: {
      alignment: 89,
      balance: 85,
      form: 87
    }
  },
  {
    id: '2',
    date: '2025-11-14',
    time: '16:20',
    exercise: 'Second Position',
    score: 91,
    duration: '00:32',
    feedback: 'Excellent control and turnout. Keep working on the depth of the plié.',
    keyMetrics: {
      alignment: 93,
      balance: 90,
      form: 90
    }
  },
  {
    id: '3',
    date: '2025-11-14',
    time: '16:00',
    exercise: 'Third Position',
    score: 94,
    duration: '00:25',
    feedback: 'Perfect execution! Your posture and turnout are excellent.',
    keyMetrics: {
      alignment: 95,
      balance: 94,
      form: 93
    }
  },
  {
    id: '4',
    date: '2025-11-13',
    time: '18:45',
    exercise: 'Fourth Position',
    score: 83,
    duration: '01:12',
    feedback: 'Beautiful arm flow. Focus on keeping shoulders relaxed.',
    keyMetrics: {
      alignment: 85,
      balance: 82,
      form: 82
    }
  },
  {
    id: '5',
    date: '2025-11-12',
    time: '15:30',
    exercise: 'Fifth Position',
    score: 88,
    duration: '00:38',
    feedback: 'Good foot articulation. Work on maintaining hip stability.',
    keyMetrics: {
      alignment: 89,
      balance: 87,
      form: 88
    }
  }
];

export const mockProgressData = [
  { date: '2025-11-08', score: 78, exercise: 'Fourth Position' },
  { date: '2025-11-09', score: 85, exercise: 'First Position' },
  { date: '2025-11-10', score: 82, exercise: 'Third Position' },
  { date: '2025-11-11', score: 89, exercise: 'Second Position' },
  { date: '2025-11-12', score: 88, exercise: 'Fifth Position' },
  { date: '2025-11-13', score: 83, exercise: 'Second Position' },
  { date: '2025-11-14', score: 91, exercise: 'Third Position' },
  { date: '2025-11-15', score: 87, exercise: 'Fourth Position' }
];

export const mockCameraSession = {
  isActive: false,
  selectedExercise: null,
  currentScore: 0,
  analyzing: false,
  countdown: 0,
  capturedImage: null,
  feedback: null
};