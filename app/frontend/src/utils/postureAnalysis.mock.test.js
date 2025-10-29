import { analyzePosture } from './postureAnalysis';
import { mockBalletExercises } from '../mock';

const buildBaseLandmarks = () =>
  Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 1,
  }));

const makeBalancedPose = () => {
  const pose = buildBaseLandmarks();

  pose[0] = { x: 0.5, y: 0.25, z: 0, visibility: 1 };
  pose[11] = { x: 0.4, y: 0.4, z: 0, visibility: 1 };
  pose[12] = { x: 0.6, y: 0.4, z: 0, visibility: 1 };
  pose[23] = { x: 0.45, y: 0.6, z: 0, visibility: 1 };
  pose[24] = { x: 0.55, y: 0.6, z: 0, visibility: 1 };
  pose[25] = { x: 0.45, y: 0.74, z: 0, visibility: 1 };
  pose[26] = { x: 0.55, y: 0.74, z: 0, visibility: 1 };
  pose[27] = { x: 0.45, y: 0.9, z: 0, visibility: 1 };
  pose[28] = { x: 0.55, y: 0.9, z: 0, visibility: 1 };
  pose[13] = { x: 0.32, y: 0.42, z: 0, visibility: 1 };
  pose[14] = { x: 0.68, y: 0.42, z: 0, visibility: 1 };
  pose[15] = { x: 0.18, y: 0.44, z: 0, visibility: 1 };
  pose[16] = { x: 0.82, y: 0.44, z: 0, visibility: 1 };

  return pose;
};

const makeSlouchedPose = () => {
  const pose = makeBalancedPose();

  pose[11] = { x: 0.43, y: 0.52, z: 0, visibility: 1 };
  pose[12] = { x: 0.62, y: 0.38, z: 0, visibility: 1 };
  pose[0] = { x: 0.65, y: 0.35, z: 0, visibility: 1 };
  pose[13] = { x: 0.38, y: 0.58, z: 0, visibility: 1 };
  pose[14] = { x: 0.7, y: 0.65, z: 0, visibility: 1 };
  pose[15] = { x: 0.34, y: 0.72, z: 0, visibility: 1 };
  pose[16] = { x: 0.78, y: 0.85, z: 0, visibility: 1 };

  return pose;
};

describe('postureAnalysis mock poses', () => {
  const exercise = mockBalletExercises.find((ex) => ex.name === 'Second Position');

  it('scores a balanced pose with high score', () => {
    const result = analyzePosture(makeBalancedPose(), exercise);

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(
      result.feedback.filter((item) => item.type === 'error'),
    ).toHaveLength(0);
  });

  it('penalises a slouched pose', () => {
    const result = analyzePosture(makeSlouchedPose(), exercise);

    const errors = result.feedback.filter((item) => item.type === 'error');

    expect(result.score).toBeLessThan(85);
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });
});
