// Utilitários para análise de postura baseado em landmarks do MediaPipe

// Calcula o ângulo entre três pontos
export const calculateAngle = (a, b, c) => {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360 - angle;
  }

  return angle;
};

// Calcula a distância entre dois pontos
export const calculateDistance = (a, b) => {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
};

// Índices dos landmarks do MediaPipe Pose
export const LANDMARK_INDICES = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

// Analisa a postura com base nos landmarks
export const analyzePosture = (landmarks) => {
  if (!landmarks || landmarks.length === 0) {
    return null;
  }

  const feedback = [];
  let totalScore = 100;

  // 1. Verificar alinhamento dos ombros
  const leftShoulder = landmarks[LANDMARK_INDICES.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARK_INDICES.RIGHT_SHOULDER];

  if (leftShoulder && rightShoulder) {
    const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    
    if (shoulderDiff > 0.05) {
      feedback.push({
        type: 'warning',
        message: 'Ombros desalinhados. Mantenha-os no mesmo nível.',
        score: -10,
      });
      totalScore -= 10;
    }
  }

  // 2. Verificar alinhamento dos quadris
  const leftHip = landmarks[LANDMARK_INDICES.LEFT_HIP];
  const rightHip = landmarks[LANDMARK_INDICES.RIGHT_HIP];

  if (leftHip && rightHip) {
    const hipDiff = Math.abs(leftHip.y - rightHip.y);
    
    if (hipDiff > 0.05) {
      feedback.push({
        type: 'warning',
        message: 'Quadris desalinhados. Mantenha o equilíbrio.',
        score: -10,
      });
      totalScore -= 10;
    }
  }

  // 3. Verificar postura da coluna (alinhamento vertical)
  const nose = landmarks[LANDMARK_INDICES.NOSE];
  const midHip = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  if (nose && midHip) {
    const spineAlignment = Math.abs(nose.x - midHip.x);
    
    if (spineAlignment > 0.1) {
      feedback.push({
        type: 'error',
        message: 'Postura curvada. Mantenha a coluna ereta.',
        score: -15,
      });
      totalScore -= 15;
    }
  }

  // 4. Verificar ângulo dos joelhos (para exercícios de pliê, por exemplo)
  const leftKnee = landmarks[LANDMARK_INDICES.LEFT_KNEE];
  const leftAnkle = landmarks[LANDMARK_INDICES.LEFT_ANKLE];

  if (leftHip && leftKnee && leftAnkle) {
    const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    
    if (kneeAngle < 160 && kneeAngle > 140) {
      feedback.push({
        type: 'success',
        message: 'Ótimo ângulo do joelho!',
        score: 5,
      });
      totalScore += 5;
    } else if (kneeAngle < 140) {
      feedback.push({
        type: 'info',
        message: 'Joelhos muito flexionados. Estenda ligeiramente.',
        score: -5,
      });
      totalScore -= 5;
    }
  }

  // 5. Verificar extensão dos braços
  const leftElbow = landmarks[LANDMARK_INDICES.LEFT_ELBOW];
  const leftWrist = landmarks[LANDMARK_INDICES.LEFT_WRIST];
  const rightElbow = landmarks[LANDMARK_INDICES.RIGHT_ELBOW];
  const rightWrist = landmarks[LANDMARK_INDICES.RIGHT_WRIST];

  if (leftShoulder && leftElbow && leftWrist) {
    const leftArmAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    
    if (leftArmAngle > 160) {
      feedback.push({
        type: 'success',
        message: 'Braços bem estendidos!',
        score: 5,
      });
      totalScore += 5;
    }
  }
  // 6. Verificar equilíbrio (distância dos pés)
  const rightAnkle = landmarks[LANDMARK_INDICES.RIGHT_ANKLE];

  if (leftAnkle && rightAnkle) {
    const feetDistance = calculateDistance(leftAnkle, rightAnkle);
    const shoulderWidth = calculateDistance(leftShoulder, rightShoulder);
    
    // Pés devem estar aproximadamente na largura dos ombros
    if (Math.abs(feetDistance - shoulderWidth) < 0.1) {
      feedback.push({
        type: 'success',
        message: 'Excelente base de apoio!',
        score: 5,
      });
      totalScore += 5;
    } else if (feetDistance > shoulderWidth * 1.5) {
      feedback.push({
        type: 'warning',
        message: 'Pés muito afastados. Aproxime-os.',
        score: -5,
      });
      totalScore -= 5;
    } else if (feetDistance < shoulderWidth * 0.5) {
      feedback.push({
        type: 'warning',
        message: 'Pés muito juntos. Afaste-os um pouco.',
        score: -5,
      });
      totalScore -= 5;
    }
  }

  // Garantir que o score final esteja entre 0 e 100
  totalScore = Math.max(0, Math.min(100, totalScore));

  return {
    score: Math.round(totalScore),
    feedback,
    landmarks,
  };
};

// Gera feedback detalhado baseado no score
export const generateDetailedFeedback = (score) => {
  if (score >= 90) {
    return {
      title: 'Execução Excelente! 🎉',
      message: 'Sua forma e alinhamento estão perfeitos. Continue assim!',
      color: 'from-green-500 to-emerald-600',
    };
  } else if (score >= 80) {
    return {
      title: 'Ótimo Trabalho! 👏',
      message: 'Sua postura está muito boa. Pequenos ajustes levarão à perfeição.',
      color: 'from-blue-500 to-cyan-600',
    };
  } else if (score >= 70) {
    return {
      title: 'Bom Esforço! 💪',
      message: 'Continue praticando. Foque nos pontos de melhoria.',
      color: 'from-yellow-500 to-orange-600',
    };
  } else {
    return {
      title: 'Continue Praticando! 🌟',
      message: 'Revise os pontos-chave e tente novamente.',
      color: 'from-rose-500 to-pink-600',
    };
  }
};

export default {
  calculateAngle,
  calculateDistance,
  analyzePosture,
  generateDetailedFeedback,
  LANDMARK_INDICES,
};
