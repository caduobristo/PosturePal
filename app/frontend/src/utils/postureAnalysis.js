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

// Calculate penalty based on distance relative to target range
// If distance is outside [minDist, maxDist], calculate penalty proportionally
export const calculateDistancePenalty = (distance, minDist, maxDist, maxPenalty) => {
  if (distance >= minDist && distance <= maxDist) {
    return 0;
  }

  let excess;
  if (distance < minDist) {
    excess = minDist - distance;
  } else {
    excess = distance - maxDist;
  }

  const range = maxDist - minDist;
  let penalty = Math.floor((excess / range) * maxPenalty);
  penalty = Math.min(penalty, maxPenalty);

  return penalty;
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

// Helper: consider a landmark visible when it exists and has a visibility
// score above the threshold. If visibility is not provided, treat it as
// visible to preserve backward compatibility with inputs that don't
// include a visibility property.
const isVisible = (lm, threshold = 0.5) => {
  if (!lm) return false;
  if (typeof lm.visibility === 'number') return lm.visibility > threshold;
  return true;
};

// Calculate visibility confidence factor based on critical landmarks
// Returns a value between 0.5 and 1.0 to reduce penalties during lateral camera views
// Critical landmarks: nose, shoulders (2), elbows (2), wrists (2), hips (2)
const getVisibilityConfidence = (landmarks) => {
  if (!landmarks || landmarks.length === 0) return 0.5;

  const criticalLandmarks = [
    LANDMARK_INDICES.NOSE,
    LANDMARK_INDICES.LEFT_SHOULDER,
    LANDMARK_INDICES.RIGHT_SHOULDER,
    LANDMARK_INDICES.LEFT_ELBOW,
    LANDMARK_INDICES.RIGHT_ELBOW,
    LANDMARK_INDICES.LEFT_WRIST,
    LANDMARK_INDICES.RIGHT_WRIST,
    LANDMARK_INDICES.LEFT_HIP,
    LANDMARK_INDICES.RIGHT_HIP,
  ];

  let visibleCount = 0;
  for (const idx of criticalLandmarks) {
    if (isVisible(landmarks[idx])) {
      visibleCount++;
    }
  }

  // Confidence formula: max(0.5, visibleCount / totalCritical)
  // Frontal (0°): 9/9 = 1.0 (full penalties)
  // Semi-lateral (45°): 7/9 = 0.78 (78% penalties)
  // Lateral (90°): 5/9 = 0.56 (56% penalties)
  // Rear (180°): 4/9 = 0.5 (minimum, 50% penalties)
  const confidence = Math.max(0.5, visibleCount / criticalLandmarks.length);
  return confidence;
};

// Apply visibility confidence factor to a penalty
// Reduces penalties when camera is at extreme angles (lateral views)
const applyConfidenceFactor = (penalty, confidenceFactor) => {
  if (penalty === 0) return 0;
  return Math.floor(penalty * confidenceFactor);
};

// Analyzes posture based on landmarks
export const analyzePosture = (landmarks, exercise) => {
  if (!landmarks || landmarks.length === 0 || !exercise) {
    return null;
  }

  // Calculate visibility confidence at the start
  const confidenceFactor = getVisibilityConfidence(landmarks);

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
    rightArmHeight: 0,
    handDistance: 0,
    footDistance: 0
  };

  // 1. Check shoulder alignment
  const leftShoulder = landmarks[LANDMARK_INDICES.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARK_INDICES.RIGHT_SHOULDER];

  if (isVisible(leftShoulder) && isVisible(rightShoulder)) {
    const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    penalty = calculatePenalty(shoulderDiff, 0.05, 0.2, SHOULDER_ALIGNMENT_MAX_PENALTY);
    penalty = applyConfidenceFactor(penalty, confidenceFactor);
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
      score: -SHOULDER_ALIGNMENT_MAX_PENALTY,
    });
    totalScore -= SHOULDER_ALIGNMENT_MAX_PENALTY;
  }

  // 2. Check hip alignment
  const leftHip = landmarks[LANDMARK_INDICES.LEFT_HIP];
  const rightHip = landmarks[LANDMARK_INDICES.RIGHT_HIP];

  if (isVisible(leftHip) && isVisible(rightHip)) {
    const hipDiff = Math.abs(leftHip.y - rightHip.y);
    penalty = calculatePenalty(hipDiff, 0.05, 0.2, 10);
    penalty = applyConfidenceFactor(penalty, confidenceFactor);
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
  let midHip = null;
  if (isVisible(leftHip) && isVisible(rightHip)) {
    midHip = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };
  }

  if (isVisible(nose) && midHip) {
    const spineAlignment = Math.abs(nose.x - midHip.x);
    penalty = calculatePenalty(spineAlignment, 0.1, 0.2, 15);
    penalty = applyConfidenceFactor(penalty, confidenceFactor);
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

  if (isVisible(leftHip) && isVisible(leftKnee) && isVisible(leftAnkle)) {
    const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);

    if (kneeAngle > 140 && kneeAngle < 160) {
      feedback.push({
        type: 'success',
        message: 'Great knee angle!',
      });
    } else if (kneeAngle < 140) {
      penalty = calculatePenalty(kneeAngle, 140, 80, 5);
      penalty = applyConfidenceFactor(penalty, confidenceFactor);
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

  // 6. Check arm height
  if (isVisible(rightShoulder) && isVisible(rightElbow) && isVisible(rightHip)) {
    const rightArmHeightAngle = calculateAngle(rightElbow, rightShoulder, rightHip);

    if (exercise.name != 'Fifth Position') {
      if (rightArmHeightAngle > 40 && rightArmHeightAngle < 80) {
        feedback.push({
          type: 'success',
          message: 'Right arm well extended!',
        });
      } else if (rightArmHeightAngle < 40) {
        penalty = calculatePenalty(rightArmHeightAngle, 40, 10, 60);
        penalty = applyConfidenceFactor(penalty, confidenceFactor);
        metrics.rightArmHeight = calculateSeverity(penalty, 60);
        feedback.push({
          type: 'error',
          message: 'Right hand should be in front of your navel!',
          score: -penalty,
        });
        totalScore -= penalty;
      } else {
        penalty = calculatePenalty(rightArmHeightAngle, 80, 150, 60);
        penalty = applyConfidenceFactor(penalty, confidenceFactor);
        metrics.rightArmHeight = calculateSeverity(penalty, 60);
        feedback.push({
          type: 'error',
          message: 'Right hand should be in front of your navel!',
          score: -penalty,
        });
        totalScore -= penalty;
      }
    } else {
      if (rightArmHeightAngle > 150) {
        feedback.push({
          type: 'success',
          message: 'Right arm in the correct position!',
        });
      } else {
        penalty = calculatePenalty(rightArmHeightAngle, 150, 90, 60);
        penalty = applyConfidenceFactor(penalty, confidenceFactor);
        metrics.rightArmHeight = calculateSeverity(penalty, 60);
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
      score: -60,
    });
    totalScore -= 60;
  }

  if (isVisible(leftShoulder) && isVisible(leftElbow) && isVisible(leftHip)) {
    const leftArmHeightAngle = calculateAngle(leftElbow, leftShoulder, leftHip);

    if (exercise.name != 'Fifth Position' || exercise.name != 'Fourth Position') {
      if (leftArmHeightAngle > 40 && leftArmHeightAngle < 80) {
        feedback.push({
          type: 'success',
          message: 'Left arm well extended!',
        });
      } else if (leftArmHeightAngle < 40) {
        penalty = calculatePenalty(leftArmHeightAngle, 40, 10, 60);
        penalty = applyConfidenceFactor(penalty, confidenceFactor);
        metrics.leftArmHeight = calculateSeverity(penalty, 60);
        feedback.push({
          type: 'error',
          message: 'Left hand should be in front of your navel!',
          score: -penalty,
        });
        totalScore -= penalty;
      } else {
        penalty = calculatePenalty(leftArmHeightAngle, 80, 150, 60);
        penalty = applyConfidenceFactor(penalty, confidenceFactor);
        metrics.leftArmHeight = calculateSeverity(penalty, 60);
        feedback.push({
          type: 'error',
          message: 'Left hand should be in front of your navel!',
          score: -penalty,
        });
        totalScore -= penalty;
      }
    } else {
      if (leftArmHeightAngle > 150) {
        feedback.push({
          type: 'success',
          message: 'Left arm in the correct position!',
        });
      } else {
        penalty = calculatePenalty(leftArmHeightAngle, 150, 90, 60);
        penalty = applyConfidenceFactor(penalty, confidenceFactor);
        metrics.leftArmHeight = calculateSeverity(penalty, 60);
        feedback.push({
          type: 'error',
          message: 'Left arm should be at shoulder height!',
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
      score: -60,
    });
    totalScore -= 60;
  }

  // 7. Check hand distance (distance between left and right wrists)
  if (isVisible(leftWrist) && isVisible(rightWrist)) {
    const handDistance = calculateDistance(leftWrist, rightWrist);

    // First and Fifth positions: hands should be close
    // Other positions: hands should be farther apart
    let minHandDist, maxHandDist;
    let expectedDistance;

    if (exercise.name === 'First Position' || exercise.name === 'Fifth Position') {
      minHandDist = 0.05;
      maxHandDist = 0.25;
      expectedDistance = 'close';
    } else {
      minHandDist = 0.2;
      maxHandDist = 0.6;
      expectedDistance = 'far apart';
    }

    penalty = calculateDistancePenalty(handDistance, minHandDist, maxHandDist, 25);
    penalty = applyConfidenceFactor(penalty, confidenceFactor);
    metrics.handDistance = calculateSeverity(penalty, 25);

    if (penalty > 0) {
      feedback.push({
        type: 'error',
        message: `Hands should be ${expectedDistance}. Adjust your arm position.`,
        score: -penalty,
      });
      totalScore -= penalty;
    } else {
      feedback.push({
        type: 'success',
        message: 'Hand distance is correct!',
      });
    }
  } else {
    metrics.handDistance = 1;
    feedback.push({
      type: 'error',
      message: 'Hands not visible in the camera.',
      score: -25,
    });
    totalScore -= 25;
  }

  // 8. Check foot distance (distance between left and right ankles)
  const leftFootIndex = landmarks[LANDMARK_INDICES.LEFT_FOOT_INDEX];
  const rightFootIndex = landmarks[LANDMARK_INDICES.RIGHT_FOOT_INDEX];

  if (isVisible(leftFootIndex) && isVisible(rightFootIndex)) {
    const footDistance = calculateDistance(leftFootIndex, rightFootIndex);

    // Second position: feet should be far apart
    // Other positions: feet should be close
    let minFootDist, maxFootDist;
    let expectedDistance;

    if (exercise.name === 'Second Position') {
      minFootDist = 0.25;
      maxFootDist = 0.40;
      expectedDistance = 'far apart';
    } else {
      minFootDist = 0.01;
      maxFootDist = 0.2;
      expectedDistance = 'close';
    }

    penalty = calculateDistancePenalty(footDistance, minFootDist, maxFootDist, 10);
    penalty = applyConfidenceFactor(penalty, confidenceFactor);
    metrics.footDistance = calculateSeverity(penalty, 10);

    if (penalty > 0) {
      feedback.push({
        type: 'error',
        message: `Feet should be ${expectedDistance}. Adjust your stance.`,
        score: -penalty,
      });
      totalScore -= penalty;
    } else {
      feedback.push({
        type: 'success',
        message: 'Foot distance is correct!',
      });
    }
  } else {
    metrics.footDistance = 1;
    feedback.push({
      type: 'error',
      message: 'Feet not visible in the camera.',
      score: -10,
    });
    totalScore -= 10;
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
