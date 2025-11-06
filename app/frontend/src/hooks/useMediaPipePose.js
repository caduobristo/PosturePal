import { useEffect, useRef, useState } from 'react';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

export const useMediaPipePose = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [pose, setPose] = useState(null);
  const [camera, setCamera] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [landmarks, setLandmarks] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    // Inicializar MediaPipe Pose
    const poseDetector = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    poseDetector.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    poseDetector.onResults((results) => {
      if (!canvasRef.current) return;

      const canvasCtx = canvasRef.current.getContext('2d');
      const videoElement = videoRef.current;

      // Limpar canvas
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Desenhar vídeo
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      // Desenhar landmarks se detectados
      if (results.poseLandmarks) {
        setLandmarks(results.poseLandmarks);
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 4,
        });
        drawLandmarks(canvasCtx, results.poseLandmarks, {
          color: '#FF0000',
          fillColor: '#FFFFFF',
          lineWidth: 2,
          radius: 6,
        });
      }

      canvasCtx.restore();
    });

    setPose(poseDetector);

    // Inicializar câmera
    if (videoRef.current) {
      const cam = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await poseDetector.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
        facingMode: 'user', // Câmera frontal
      });

      cam.start()
        .then(() => {
          setIsReady(true);
          setCamera(cam);
        })
        .catch((err) => {
          console.error('Erro ao iniciar câmera:', err);
          setError(err.message);
        });
    }

    return () => {
      if (camera) {
        camera.stop();
      }
      if (poseDetector) {
        poseDetector.close();
      }
    };
  }, []);

  const stopCamera = () => {
    if (camera) {
      camera.stop();
    }
  };

  const restartCamera = () => {
    if (camera) {
      camera.start();
    }
  };
  return {
    videoRef,
    canvasRef,
    isReady,
    landmarks,
    error,
    stopCamera,
    restartCamera,
  };
};
