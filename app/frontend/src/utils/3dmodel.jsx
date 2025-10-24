import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const LandmarkPoints = ({ landmarks }) => {
  const positions = useMemo(() => {
    return new Float32Array(
      landmarks.flatMap(({ x, y, z }) => [
        (x - 0.5) * 2,      // X normalizado para [-1, 1]
        -(y - 0.5) * 2,     // Y invertido para o sistema do Three.js
        z * 2               // Z pode ser amplificado ou invertido se necessário
      ])
    );
  }, [landmarks]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={landmarks.length}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="hotpink" size={0.05} sizeAttenuation />
    </points>
  );
};

const Landmark3DViewer = ({ landmarks }) => {
  if (!landmarks || landmarks.length === 0) return null;

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Canvas camera={{ position: [0, 0, 2] }}>
        <ambientLight intensity={0.5} />
        <OrbitControls />
        <LandmarkPoints landmarks={landmarks} />
      </Canvas>
    </div>
  );
};

export default Landmark3DViewer;
