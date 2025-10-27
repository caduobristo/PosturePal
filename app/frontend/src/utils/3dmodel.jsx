import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { POSE_CONNECTIONS } from '@mediapipe/pose';

const normalizeLandmark = ({ x, y, z }) => {
  return [
    (x - 0.5) * 2, // center and scale X
    -(y - 0.5) * 2, // invert Y to match camera orientation
    (z ?? 0) * 0.6, // keep depth subtle so cloud stays compact
  ];
};

const Landmark3DViewer = ({ landmarks }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const pointsRef = useRef(null);
  const lineSegmentsRef = useRef(null);
  const animationFrameRef = useRef(null);

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
      size: 0.05,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    pointsRef.current = points;

    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(POSE_CONNECTIONS.length * 2 * 3);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xf5a2d0,
      transparent: true,
      opacity: 0.6,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);
    lineSegmentsRef.current = lines;

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
    // We intentionally exclude landmarks here; updates handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
