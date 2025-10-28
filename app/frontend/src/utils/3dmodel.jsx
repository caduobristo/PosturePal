import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { POSE_CONNECTIONS } from '@mediapipe/pose';
import { LANDMARK_INDICES } from './postureAnalysis';

const normalizeLandmark = ({ x, y, z }) => {
  return [
    (x - 0.5) * 2, // center and scale X
    -(y - 0.5) * 2, // invert Y to match camera orientation
    (z ?? 0) * 0.6, // keep depth subtle so cloud stays compact
  ];
};

const NEUTRAL_COLOR = new THREE.Color('#d1d5db');
const GOOD_COLOR = new THREE.Color('#22c55e');
const BAD_COLOR = new THREE.Color('#ef4444');

const METRIC_SEGMENTS = {
  shoulderAlignment: [[LANDMARK_INDICES.LEFT_SHOULDER, LANDMARK_INDICES.RIGHT_SHOULDER]],
  hipAlignment: [[LANDMARK_INDICES.LEFT_HIP, LANDMARK_INDICES.RIGHT_HIP]],
  spineAlignment: [
    [LANDMARK_INDICES.LEFT_SHOULDER, LANDMARK_INDICES.LEFT_HIP],
    [LANDMARK_INDICES.RIGHT_SHOULDER, LANDMARK_INDICES.RIGHT_HIP],
  ],
  kneeAngle: [
    [LANDMARK_INDICES.LEFT_HIP, LANDMARK_INDICES.LEFT_KNEE],
    [LANDMARK_INDICES.LEFT_KNEE, LANDMARK_INDICES.LEFT_ANKLE],
    [LANDMARK_INDICES.RIGHT_HIP, LANDMARK_INDICES.RIGHT_KNEE],
    [LANDMARK_INDICES.RIGHT_KNEE, LANDMARK_INDICES.RIGHT_ANKLE],
  ],
  leftArmExtension: [
    [LANDMARK_INDICES.LEFT_SHOULDER, LANDMARK_INDICES.LEFT_ELBOW],
    [LANDMARK_INDICES.LEFT_ELBOW, LANDMARK_INDICES.LEFT_WRIST],
  ],
  rightArmExtension: [
    [LANDMARK_INDICES.RIGHT_SHOULDER, LANDMARK_INDICES.RIGHT_ELBOW],
    [LANDMARK_INDICES.RIGHT_ELBOW, LANDMARK_INDICES.RIGHT_WRIST],
  ],
  leftArmHeight: [
    [LANDMARK_INDICES.LEFT_SHOULDER, LANDMARK_INDICES.LEFT_ELBOW],
    [LANDMARK_INDICES.LEFT_SHOULDER, LANDMARK_INDICES.LEFT_HIP],
  ],
  rightArmHeight: [
    [LANDMARK_INDICES.RIGHT_SHOULDER, LANDMARK_INDICES.RIGHT_ELBOW],
    [LANDMARK_INDICES.RIGHT_SHOULDER, LANDMARK_INDICES.RIGHT_HIP],
  ],
};

const lerpColor = (startColor, endColor, t) =>
  startColor.clone().lerp(endColor, THREE.MathUtils.clamp(t, 0, 1));

const fillColorAttribute = (attribute, color) => {
  for (let i = 0; i < attribute.count; i += 1) {
    attribute.setXYZ(i, color.r, color.g, color.b);
  }
  attribute.needsUpdate = true;
};

const setConnectionColor = (attribute, connectionIndex, color) => {
  const firstVertex = connectionIndex * 2;
  attribute.setXYZ(firstVertex, color.r, color.g, color.b);
  attribute.setXYZ(firstVertex + 1, color.r, color.g, color.b);
  attribute.needsUpdate = true;
};

const clampSeverity = (value) =>
  THREE.MathUtils.clamp(typeof value === 'number' ? value : 0, 0, 1);

const Landmark3DViewer = ({ landmarks, metrics = {} }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const pointsRef = useRef(null);
  const lineSegmentsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const connectionLookupRef = useRef(new Map());

  useEffect(() => {
    if (!containerRef.current) return;

    const { clientWidth } = containerRef.current;
    const height = 360;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f3f4f6');

    const camera = new THREE.PerspectiveCamera(45, clientWidth / height, 0.1, 10);
    camera.position.set(0, 0, 2.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(clientWidth, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(0, 1, 1);
    scene.add(ambientLight, directionalLight);

    const geometry = new THREE.BufferGeometry();
    const initialCount = landmarks?.length ?? 0;
    const positions = new Float32Array(Math.max(initialCount, 1) * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xff4fa1,
      size: 0.035,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    pointsRef.current = points;

    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(POSE_CONNECTIONS.length * 2 * 3);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineColors = new Float32Array(POSE_CONNECTIONS.length * 2 * 3);
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    fillColorAttribute(lineGeometry.getAttribute('color'), NEUTRAL_COLOR);
    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      linewidth: 2.5,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);
    lineSegmentsRef.current = lines;

    const lookup = new Map();
    POSE_CONNECTIONS.forEach(([start, end], connectionIndex) => {
      lookup.set(`${start}-${end}`, connectionIndex);
      lookup.set(`${end}-${start}`, connectionIndex);
    });
    connectionLookupRef.current = lookup;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    const onResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const newHeight = height;
      camera.aspect = width / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, newHeight);
    };

    const renderScene = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(renderScene);
    };

    renderScene();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const hasLandmarks = Array.isArray(landmarks) && landmarks.length > 0;
    if (lineSegmentsRef.current) {
      lineSegmentsRef.current.visible = hasLandmarks;
    }
    if (!pointsRef.current || !hasLandmarks) return;

    const positions = pointsRef.current.geometry.getAttribute('position');
    if (!positions || positions.count !== landmarks.length) {
      const newPositions = new Float32Array(landmarks.length * 3);
      pointsRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    }

    const attribute = pointsRef.current.geometry.getAttribute('position');
    landmarks.forEach((landmark, index) => {
      const [nx, ny, nz] = normalizeLandmark(landmark);
      attribute.setXYZ(index, nx, ny, nz);
    });
    attribute.needsUpdate = true;

    if (lineSegmentsRef.current) {
      const lineAttribute = lineSegmentsRef.current.geometry.getAttribute('position');
      POSE_CONNECTIONS.forEach(([startIdx, endIdx], connectionIndex) => {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];
        const firstIndex = connectionIndex * 2;
        if (start && end) {
          const [sx, sy, sz] = normalizeLandmark(start);
          const [ex, ey, ez] = normalizeLandmark(end);
          lineAttribute.setXYZ(firstIndex, sx, sy, sz);
          lineAttribute.setXYZ(firstIndex + 1, ex, ey, ez);
        } else {
          lineAttribute.setXYZ(firstIndex, 0, 0, 0);
          lineAttribute.setXYZ(firstIndex + 1, 0, 0, 0);
        }
      });
      lineAttribute.needsUpdate = true;
    }
  }, [landmarks]);

  useEffect(() => {
    if (!lineSegmentsRef.current) return;

    const lineAttribute = lineSegmentsRef.current.geometry.getAttribute('color');
    if (!lineAttribute) return;

    fillColorAttribute(lineAttribute, NEUTRAL_COLOR);

    const segmentSeverity = new Map();
    Object.entries(METRIC_SEGMENTS).forEach(([metricKey, segments]) => {
      if (typeof metrics[metricKey] !== 'number') return;
      const severity = clampSeverity(metrics[metricKey]);

      segments.forEach(([start, end]) => {
        const key = `${start}-${end}`;
        const current = segmentSeverity.get(key) ?? 0;
        segmentSeverity.set(key, Math.max(current, severity));
      });
    });

    segmentSeverity.forEach((severity, key) => {
      const connectionIndex = connectionLookupRef.current.get(key);
      if (connectionIndex === undefined) return;
      const color = lerpColor(GOOD_COLOR, BAD_COLOR, severity);
      setConnectionColor(lineAttribute, connectionIndex, color);
    });

    lineAttribute.needsUpdate = true;
  }, [metrics]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        style={{ width: '100%', height: '360px', borderRadius: '12px', overflow: 'hidden' }}
      />
      {(!landmarks || landmarks.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-slate-500">
          Landmark data unavailable for preview.
        </div>
      )}
    </div>
  );
};

export default Landmark3DViewer;
