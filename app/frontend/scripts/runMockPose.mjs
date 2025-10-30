import postureModule from '../src/utils/postureAnalysis.js';
import { EXERCISES } from '../src/data/exercises.js';

const { analyzePosture } = postureModule;

const buildBaseLandmarks = () =>
  Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 1,
  }));

const makeBalancedPose = () => {
  const pose = buildBaseLandmarks();

  // Head / upper body
  pose[0] = { x: 0.5, y: 0.25, z: 0, visibility: 1 }; // Nose
  pose[11] = { x: 0.4, y: 0.4, z: 0, visibility: 1 }; // Left shoulder
  pose[12] = { x: 0.6, y: 0.4, z: 0, visibility: 1 }; // Right shoulder

  // Hips
  pose[23] = { x: 0.45, y: 0.6, z: 0, visibility: 1 }; // Left hip
  pose[24] = { x: 0.55, y: 0.6, z: 0, visibility: 1 }; // Right hip

  // Knees
  pose[25] = { x: 0.45, y: 0.74, z: 0, visibility: 1 }; // Left knee
  pose[26] = { x: 0.55, y: 0.74, z: 0, visibility: 1 }; // Right knee

  // Ankles
  pose[27] = { x: 0.45, y: 0.9, z: 0, visibility: 1 }; // Left ankle
  pose[28] = { x: 0.55, y: 0.9, z: 0, visibility: 1 }; // Right ankle

  // Arms in first-position arc
  pose[13] = { x: 0.38, y: 0.52, z: 0, visibility: 1 }; // Left elbow
  pose[14] = { x: 0.62, y: 0.52, z: 0, visibility: 1 }; // Right elbow
  pose[15] = { x: 0.37, y: 0.64, z: 0, visibility: 1 }; // Left wrist
  pose[16] = { x: 0.63, y: 0.64, z: 0, visibility: 1 }; // Right wrist

  return pose;
};

const makeSlouchedPose = () => {
  const pose = makeBalancedPose();

  // Drop one shoulder and tilt spine
  pose[11] = { x: 0.42, y: 0.46, z: 0, visibility: 1 };
  pose[0] = { x: 0.58, y: 0.3, z: 0, visibility: 1 };

  // Collapse right arm
  pose[14] = { x: 0.64, y: 0.6, z: 0, visibility: 1 };
  pose[16] = { x: 0.66, y: 0.76, z: 0, visibility: 1 };

  return pose;
};

const exercise = EXERCISES.find((ex) => ex.name === 'First Position');

const balancedResult = analyzePosture(makeBalancedPose(), exercise);
const slouchedResult = analyzePosture(makeSlouchedPose(), exercise);

console.log('=== First Position | Balanced Pose ===');
console.log(JSON.stringify(balancedResult, null, 2));

console.log('\n=== First Position | Slouched Pose ===');
console.log(JSON.stringify(slouchedResult, null, 2));
