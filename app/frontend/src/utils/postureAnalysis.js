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
export const analyzePosture = (landmarks, exercise) => {
  if (!landmarks || landmarks.length === 0 || !exercise) {
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
      });
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

  if (rightShoulder && rightElbow && rightWrist) {
      const rightArmAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);

      if (exercise.name == 'Second Position' || exercise.name == 'Fourth Position' || exercise.name == 'Fifth Position') {
          if (rightArmAngle > 160) {
              feedback.push({
                type: 'success',
                message: 'Braço direito bem estendido!',
              });
          } else {
              feedback.push({
                type: 'error',
                message: 'Braço direito deve estar estendido!',
                score: -15,
              });
              totalScore -= 15;
          }
      } else {
          if (rightArmAngle < 120) {
              feedback.push({
                type: 'success',
                message: 'Braço direito na posição correta!',
              });
         } else {
             feedback.push({
               type: 'error',
               message: 'Braço direito não deve estar estendido!',
               score: -15,
             });
             totalScore -= 15;
         }
    }
  }

  if (leftShoulder && leftElbow && leftWrist) {
    const leftArmAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);

    if (exercise.name == 'Second Position' || exercise.name == 'Fourth Position' || exercise.name == 'Fifth Position') {
        if (leftArmAngle > 160) {
            feedback.push({
              type: 'success',
              message: 'Braço esquerdo bem estendido!',
            });
        } else {
            feedback.push({
              type: 'error',
              message: 'Braço esquerdo deve estar estendido!',
              score: -15,
            });
            totalScore -= 15;
        }
    } else {
        if (leftArmAngle < 120) {
            feedback.push({
              type: 'success',
              message: 'Braço esquerdo na posição correta!',
            });
       } else {
           feedback.push({
             type: 'error',
             message: 'Braço esquerdo não deve estar estendido!',
             score: -15,
           });
           totalScore -= 15;
       }
    }
  }

 // 6. Verificar altura dos braços
 if (rightShoulder && rightElbow && rightHip) {
       const rightArmHeightAngle = calculateAngle(rightElbow, rightShoulder, rightHip);

       if (exercise.name == 'First Position' || exercise.name == 'Fourth Position') {
           if (rightArmHeightAngle > 30 && rightArmHeightAngle < 100) {
               feedback.push({
                 type: 'success',
                 message: 'Braço direito bem estendido!',
               });
           } else {
               feedback.push({
                 type: 'error',
                 message: 'Mão direita na frente do umbigo!',
                 score: -15,
               });
               totalScore -= 15;
           }
       } else if (exercise.name == 'Fifth Position') {
           if (rightArmHeightAngle > 150) {
               feedback.push({
                 type: 'success',
                 message: 'Braço direito na posição correta!',
               });
          } else {
              feedback.push({
                type: 'error',
                message: 'Braço direito mais para cima!',
                score: -15,
              });
              totalScore -= 15;
          }
      } else {
           if (rightArmHeightAngle > 70 && rightArmHeightAngle < 120) {
               feedback.push({
                 type: 'success',
                 message: 'Braço direito na posição correta!',
               });
          } else {
              feedback.push({
                type: 'error',
                message: 'Braço direito na altura do ombro!',
                score: -15,
              });
              totalScore -= 15;
          }
     }
   }

   if (leftShoulder && leftElbow && leftHip) {
     const leftArmHeightAngle = calculateAngle(leftElbow, leftShoulder, leftHip);

     if (exercise.name == 'First Position' || exercise.name == 'Third Position') {
        if (leftArmHeightAngle > 30 && leftArmHeightAngle < 100) {
            feedback.push({
              type: 'success',
              message: 'Braço esquerdo bem estendido!',
            });
        } else {
            feedback.push({
              type: 'error',
              message: 'Mão esquerdo na frente do umbigo!',
              score: -15,
            });
            totalScore -= 15;
        }
    } else if (exercise.name == 'Second Position') {
        if (leftArmHeightAngle > 70 && leftArmHeightAngle < 120) {
            feedback.push({
              type: 'success',
              message: 'Braço esquerdo na posição correta!',
            });
       } else {
           feedback.push({
             type: 'error',
             message: 'Braço esquerdo na altura do ombro!',
             score: -15,
           });
           totalScore -= 15;
       }
   } else {
        if (leftArmHeightAngle > 150) {
            feedback.push({
              type: 'success',
              message: 'Braço esquerdo na posição correta!',
            });
       } else {
           feedback.push({
             type: 'error',
             message: 'Braço esquerdo mais para cima!',
             score: -15,
           });
           totalScore -= 15;
       }
  }
}
  // Garantir que o score final esteja entre 0 e 100
  totalScore = Math.max(0, Math.min(100, totalScore));

  return {
    score: Math.round(totalScore),
    feedback
  };
};

// Gera feedback detalhado baseado no score
export const generateDetailedFeedback = (score) => {
  if (score >= 95) {
    return {
      title: 'Execução Impecável! 🏆',
      message: 'Postura perfeita! Você dominou este exercício.',
      color: 'bg-green-200',
    };
  } else if (score >= 85) {
    return {
      title: 'Execução Excelente! 🎉',
      message: 'Ajustes mínimos. Continue assim!',
      color: 'bg-lime-200',
    };
  } else if (score >= 75) {
    return {
      title: 'Ótimo Trabalho! 👏',
      message: 'Sua postura está boa. Pequenos ajustes ainda são possíveis.',
      color: 'bg-blue-200',
    };
  } else if (score >= 65) {
    return {
      title: 'Bom Esforço! 💪',
      message: 'Você está no caminho certo. Foque nos pontos de melhoria.',
      color: 'bg-yellow-200',
    };
  } else if (score >= 50) {
    return {
      title: 'Você Consegue Melhorar! 🧐',
      message: 'Revise os principais pontos da postura e tente novamente.',
      color: 'bg-orange-200',
    };
  } else {
    return {
      title: 'Continue Praticando! 🌟',
      message: 'Não desanime. Com dedicação, você chegará lá!',
      color: 'bg-rose-200',
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
