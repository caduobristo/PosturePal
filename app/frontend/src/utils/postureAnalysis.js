// Utilities for posture analysis based on MediaPipe landmarks

// Calculates the angle between three points
export const calculateAngle = (a, b, c) => {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360 - angle;
  }

  return angle;
};

// Calculates the distance between two points
export const calculateDistance = (a, b) => {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
};

export const calculatePenalty = (angle, minAngle, maxAngle, maxPenalty) => {
  let inverted = false;
  if (minAngle > maxAngle) {
    inverted = true;
  }

  if ((angle <= minAngle && !inverted) || (angle >= minAngle && inverted)) {
    return 0;
  }

  let excess;
  if (!inverted) {
    excess = angle - minAngle;
  } else {
    excess = angle - maxAngle;
  }

  const range = Math.abs(maxAngle - minAngle);

  let penalty = Math.floor((excess / range) * maxPenalty);
  penalty = Math.min(penalty, maxPenalty);

  return penalty;
};

export const calculateSeverity = (penalty, maxPenalty) => {
  if (!maxPenalty) {
    return 0;
  }
  const normalized = penalty / maxPenalty;
  if (!Number.isFinite(normalized)) {
    return 0;
  }
  return Math.max(0, Math.min(1, normalized));
};

// MediaPipe Pose landmark indices
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

const SHOULDER_ALIGNMENT_MAX_PENALTY = 10;

// Analyzes posture based on landmarks
export const analyzePosture = (landmarks, exercise) => {
  if (!landmarks || landmarks.length === 0 || !exercise) {
    return null;
  }

  const feedback = [];
  let totalScore = 100;
  let penalty = 0;
  const metrics = {
    shoulderAlignment: 0,
    hipAlignment: 0,
    spineAlignment: 0,
    kneeAngle: 0,
    leftArmExtension: 0,
    rightArmExtension: 0,
    leftArmHeight: 0,
    rightArmHeight: 0
  };

  // 1. Check shoulder alignment
  const leftShoulder = landmarks[LANDMARK_INDICES.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARK_INDICES.RIGHT_SHOULDER];

  if (leftShoulder && rightShoulder) {
    const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    penalty = calculatePenalty(shoulderDiff, 0.05, 0.4, SHOULDER_ALIGNMENT_MAX_PENALTY);
    metrics.shoulderAlignment = calculateSeverity(
      penalty,
      SHOULDER_ALIGNMENT_MAX_PENALTY
    );
    if (penalty > 0) {
      feedback.push({
        type: 'error',
        message: 'Shoulders misaligned. Keep them at the same level.',
        score: -penalty,
      });
      totalScore -= penalty;
    } else {
      feedback.push({
        type: 'success',
        message: 'Shoulders aligned. Keep it up.',
      });
    }
  } else {
    metrics.shoulderAlignment = 1;
    feedback.push({
      type: 'error',
      message: 'Shoulders not detected. Adjust the camera.',
      score: -10,
    });
    totalScore -= 10;
  }

  // 2. Check hip alignment
  const leftHip = landmarks[LANDMARK_INDICES.LEFT_HIP];
  const rightHip = landmarks[LANDMARK_INDICES.RIGHT_HIP];

  if (leftHip && rightHip) {
    const hipDiff = Math.abs(leftHip.y - rightHip.y);
    penalty = calculatePenalty(hipDiff, 0.05, 0.4, 10);
    metrics.hipAlignment = calculateSeverity(penalty, 10);

    if (penalty > 0) {
      feedback.push({
        type: 'error',
        message: 'Hips misaligned. Maintain balance.',
        score: -penalty,
      });
      totalScore -= penalty;
    } else {
      feedback.push({
        type: 'success',
        message: 'Hips aligned. Great job.',
      });
    }
  } else {
    metrics.hipAlignment = 1;
    feedback.push({
      type: 'error',
      message: 'Hips not detected. Adjust the camera.',
      score: -10,
    });
    totalScore -= 10;
  }

  // 3. Check spine alignment (vertical posture)
  const nose = landmarks[LANDMARK_INDICES.NOSE];
  const midHip = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  if (nose && midHip) {
    const spineAlignment = Math.abs(nose.x - midHip.x);
    penalty = calculatePenalty(spineAlignment, 0.1, 0.4, 15);
    metrics.spineAlignment = calculateSeverity(penalty, 15);

    if (penalty > 0) {
      feedback.push({
        type: 'error',
        message: 'Slouched posture. Keep your spine straight.',
        score: -penalty,
      });
      totalScore -= penalty;
    } else {
      feedback.push({
        type: 'success',
        message: 'Straight posture. Keep it up.',
      });
    }
  } else {
    metrics.spineAlignment = 1;
    feedback.push({
      type: 'error',
      message: 'Posture not detected. Adjust the camera.',
      score: -15,
    });
    totalScore -= 15;
  }

  // 4. Check knee angle (e.g., for plié exercises)
  const leftKnee = landmarks[LANDMARK_INDICES.LEFT_KNEE];
  const leftAnkle = landmarks[LANDMARK_INDICES.LEFT_ANKLE];

  if (leftHip && leftKnee && leftAnkle) {
    const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);

    if (kneeAngle > 140 && kneeAngle < 160) {
      feedback.push({
        type: 'success',
        message: 'Great knee angle!',
      });
    } else if (kneeAngle < 140) {
      penalty = calculatePenalty(kneeAngle, 140, 80, 5);
      metrics.kneeAngle = calculateSeverity(penalty, 5);
      feedback.push({
        type: 'error',
        message: 'Knees too bent. Straighten slightly.',
        score: -penalty,
      });
      totalScore -= penalty;
    }
  } else {
    metrics.kneeAngle = 1;
    feedback.push({
      type: 'error',
      message: 'Knees not visible in the camera.',
      score: -5,
    });
    totalScore -= 5;
  }

  // 5. Check arm extension
  const leftElbow = landmarks[LANDMARK_INDICES.LEFT_ELBOW];
  const leftWrist = landmarks[LANDMARK_INDICES.LEFT_WRIST];
  const rightElbow = landmarks[LANDMARK_INDICES.RIGHT_ELBOW];
  const rightWrist = landmarks[LANDMARK_INDICES.RIGHT_WRIST];

  if (rightShoulder && rightElbow && rightWrist) {
    const rightArmAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);

    if (
      exercise.name == 'Second Position' ||
      exercise.name == 'Fourth Position' ||
      exercise.name == 'Fifth Position'
    ) {
      if (rightArmAngle > 160) {
        feedback.push({
          type: 'success',
          message: 'Right arm well extended!',
        });
      } else {
        penalty = calculatePenalty(rightArmAngle, 160, 100, 15);
        metrics.rightArmExtension = calculateSeverity(penalty, 15);
        feedback.push({
          type: 'error',
          message: 'Right arm should be extended!',
          score: -penalty,
        });
        totalScore -= penalty;
      }
    } else {
      if (rightArmAngle < 120) {
        feedback.push({
          type: 'success',
          message: 'Right arm in the correct position!',
        });
      } else {
        penalty = calculatePenalty(rightArmAngle, 120, 160, 15);
        metrics.rightArmExtension = calculateSeverity(penalty, 15);
        feedback.push({
          type: 'error',
          message: 'Right arm should not be extended!',
          score: -penalty,
        });
        totalScore -= penalty;
      }
    }
  } else {
    metrics.rightArmExtension = 1;
    feedback.push({
      type: 'error',
      message: 'Right arm not visible in the camera.',
      score: -15,
    });
    totalScore -= 15;
  }

  if (leftShoulder && leftElbow && leftWrist) {
    const leftArmAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);

    if (
      exercise.name == 'Second Position' ||
      exercise.name == 'Fourth Position' ||
      exercise.name == 'Fifth Position'
    ) {
      if (leftArmAngle > 160) {
        feedback.push({
          type: 'success',
          message: 'Left arm well extended!',
        });
      } else {
        penalty = calculatePenalty(leftArmAngle, 160, 100, 15);
        metrics.leftArmExtension = calculateSeverity(penalty, 15);
        feedback.push({
          type: 'error',
          message: 'Left arm should be extended!',
          score: -penalty,
        });
        totalScore -= penalty;
      }
    } else {
      if (leftArmAngle < 120) {
        feedback.push({
          type: 'success',
          message: 'Left arm in the correct position!',
        });
      } else {
        penalty = calculatePenalty(leftArmAngle, 120, 160, 15);
        metrics.leftArmExtension = calculateSeverity(penalty, 15);
        feedback.push({
          type: 'error',
          message: 'Left arm should not be extended!',
          score: -penalty,
        });
        totalScore -= penalty;
      }
    }
  } else {
    metrics.leftArmExtension = 1;
    feedback.push({
      type: 'error',
      message: 'Left arm not visible in the camera.',
      score: -15,
    });
    totalScore -= 15;
  }

  // 6. Check arm height
  if (rightShoulder && rightElbow && rightHip) {
    const rightArmHeightAngle = calculateAngle(rightElbow, rightShoulder, rightHip);

    if (exercise.name == 'First Position' || exercise.name == 'Fourth Position') {
      if (rightArmHeightAngle > 30 && rightArmHeightAngle < 100) {
        feedback.push({
          type: 'success',
          message: 'Right arm well extended!',
        });
      } else if (rightArmHeightAngle < 30) {
        penalty = calculatePenalty(rightArmHeightAngle, 30, 10, 15);
        metrics.rightArmHeight = calculateSeverity(penalty, 15);
        feedback.push({
          type: 'error',
          message: 'Right hand should be in front of your navel!',
          score: -penalty,
        });
        totalScore -= penalty;
      } else {
        penalty = calculatePenalty(rightArmHeightAngle, 100, 120, 15);
        metrics.rightArmHeight = calculateSeverity(penalty, 15);
        feedback.push({
          type: 'error',
          message: 'Right hand should be in front of your navel!',
          score: -penalty,
        });
        totalScore -= penalty;
      }
    } else if (exercise.name == 'Fifth Position') {
      if (rightArmHeightAngle > 130) {
        feedback.push({
          type: 'success',
          message: 'Right arm in the correct position!',
        });
      } else {
        penalty = calculatePenalty(rightArmHeightAngle, 130, 90, 15);
        metrics.rightArmHeight = calculateSeverity(penalty, 15);
        feedback.push({
          type: 'error',
          message: 'Right arm higher up!',
          score: -penalty,
        });
        totalScore -= penalty;
      }
    } else {
      if (rightArmHeightAngle > 70 && rightArmHeightAngle < 120) {
        feedback.push({
          type: 'success',
          message: 'Right arm in the correct position!',
        });
      } else if (rightArmHeightAngle < 70) {
        penalty = calculatePenalty(rightArmHeightAngle, 70, 40, 15);
        metrics.rightArmHeight = calculateSeverity(penalty, 15);
        feedback.push({
          type: 'error',
          message: 'Right arm should be at shoulder height!',
          score: -penalty,
        });
        totalScore -= penalty;
      } else {
        penalty = calculatePenalty(rightArmHeightAngle, 120, 160, 15);
        metrics.rightArmHeight = calculateSeverity(penalty, 15);
        feedback.push({
          type: 'error',
          message: 'Right arm higher up!',
          score: -penalty,
        });
        totalScore -= penalty;
      }
    }
  } else {
    metrics.rightArmHeight = 1;
    feedback.push({
      type: 'error',
      message: 'Right side of the body not visible in the camera.',
      score: -15,
    });
    totalScore -= 15;
  }

  if (leftShoulder && leftElbow && leftHip) {
    const leftArmHeightAngle = calculateAngle(leftElbow, leftShoulder, leftHip);

    if (exercise.name == 'First Position' || exercise.name == 'Third Position') {
      if (leftArmHeightAngle > 30 && leftArmHeightAngle < 100) {
        feedback.push({
          type: 'success',
          message: 'Left arm well extended!',
        });
      } else if (leftArmHeightAngle < 30) {
        penalty = calculatePenalty(leftArmHeightAngle, 30, 0, 15);
        metrics.leftArmHeight = calculateSeverity(penalty, 15);
        feedback.push({
          type: 'error',
          message: 'Left hand should be in front of your navel!',
          score: -penalty,
        });
        totalScore -= penalty;
      } else {
        penalty = calculatePenalty(leftArmHeightAngle, 100, 140, 15);
        metrics.leftArmHeight = calculateSeverity(penalty, 15);
        feedback.push({
          type: 'error',
          message: 'Left hand should be in front of your navel!',
          score: -penalty,
        });
        totalScore -= penalty;
      }
    } else if (exercise.name == 'Second Position') {
      if (leftArmHeightAngle > 70 && leftArmHeightAngle < 120) {
        feedback.push({
          type: 'success',
          message: 'Left arm in the correct position!',
        });
      } else if (leftArmHeightAngle < 70) {
        penalty = calculatePenalty(leftArmHeightAngle, 70, 40, 15);
        metrics.leftArmHeight = calculateSeverity(penalty, 15);
        feedback.push({
          type: 'error',
          message: 'Left arm should be at shoulder height!',
          score: -penalty,
        });
        totalScore -= penalty;
      } else {
        penalty = calculatePenalty(leftArmHeightAngle, 120, 160, 15);
        metrics.leftArmHeight = calculateSeverity(penalty, 15);
        feedback.push({
          type: 'error',
          message: 'Left arm should be at shoulder height!',
          score: -penalty,
        });
        totalScore -= penalty;
      }
    } else {
      if (leftArmHeightAngle > 130) {
        feedback.push({
          type: 'success',
          message: 'Left arm in the correct position!',
        });
      } else {
        penalty = calculatePenalty(leftArmHeightAngle, 130, 90, 15);
        metrics.leftArmHeight = calculateSeverity(penalty, 15);
        feedback.push({
          type: 'error',
          message: 'Left arm higher up!',
          score: -penalty,
        });
        totalScore -= penalty;
      }
    }
  } else {
    metrics.leftArmHeight = 1;
    feedback.push({
      type: 'error',
      message: 'Left side of the body not visible in the camera.',
      score: -15,
    });
    totalScore -= 15;
  }

  // Ensure final score stays between 0 and 100
  totalScore = Math.max(0, Math.min(100, totalScore));

  return {
    score: Math.round(totalScore),
    feedback,
    metrics,
  };
};

// Generates detailed feedback based on score
export const generateDetailedFeedback = (score) => {
  if (score >= 95) {
    return {
      title: 'Flawless Execution! 🏆',
      message: 'Perfect posture! You mastered this exercise.',
      color: 'bg-green-200',
    };
  } else if (score >= 85) {
    return {
      title: 'Excellent Execution! 🎉',
      message: 'Only minor adjustments needed. Keep it up!',
      color: 'bg-lime-200',
    };
  } else if (score >= 75) {
    return {
      title: 'Great Work! 👏',
      message: 'Your posture looks good. Small tweaks are still possible.',
      color: 'bg-blue-200',
    };
  } else if (score >= 65) {
    return {
      title: 'Good Effort! 💪',
      message: 'You’re on the right track. Focus on areas for improvement.',
      color: 'bg-yellow-200',
    };
  } else if (score >= 50) {
    return {
      title: 'You Can Improve! 🧐',
      message: 'Review key posture points and try again.',
      color: 'bg-orange-200',
    };
  } else {
    return {
      title: 'Keep Practicing! 🌟',
      message: 'Don’t give up. With dedication, you’ll get there!',
      color: 'bg-rose-200',
    };
  }
};

export default {
  calculateAngle,
  calculateDistance,
  calculateSeverity,
  analyzePosture,
  generateDetailedFeedback,
  LANDMARK_INDICES,
};
