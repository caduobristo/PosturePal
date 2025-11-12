import { useEffect, useRef, useState, useCallback } from 'react';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const CAMERA_TIMEOUT_MS = 10000;

export const useMediaPipePose = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [pose, setPose] = useState(null);
  const [camera, setCamera] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [landmarks, setLandmarks] = useState(null);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const poseDetectorRef = useRef(null);
  const cameraRef = useRef(null);
  const retryCountRef = useRef(0);
  const cleanupTimeoutRef = useRef(null);
  const initTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // Limpar todos os timers
  const clearAllTimers = useCallback(() => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
  }, []);

  // Parar a câmera de forma segura
  const stopCameraSafely = useCallback(() => {
    try {
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      
      // Parar o stream do vídeo
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    } catch (err) {
      console.warn('Erro ao parar câmera:', err);
    }
  }, []);

  // Fechar o pose detector de forma segura
  const closePoseSafely = useCallback(() => {
    try {
      if (poseDetectorRef.current) {
        poseDetectorRef.current.close();
        poseDetectorRef.current = null;
      }
    } catch (err) {
      console.warn('Erro ao fechar pose detector:', err);
    }
  }, []);

  // Verificar permissões da câmera
  const checkCameraPermissions = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' });
      return result.state === 'granted' || result.state === 'prompt';
    } catch (err) {
      // Se a API não estiver disponível, assumir que tem permissão
      return true;
    }
  }, []);

  // Inicializar câmera com retry e timeout
  const initializeCamera = useCallback(async (poseDetector, facingMode = 'user') => {
    if (!isMountedRef.current || !videoRef.current) {
      return null;
    }

    return new Promise((resolve, reject) => {
      // Timeout para evitar travamento
      initTimeoutRef.current = setTimeout(() => {
        reject(new Error('Camera initialization timeout'));
      }, CAMERA_TIMEOUT_MS);

      try {
        const cam = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && isMountedRef.current) {
              try {
                await poseDetector.send({ image: videoRef.current });
              } catch (err) {
                console.warn('Erro ao processar frame:', err);
              }
            }
          },
          width: 640,
          height: 480,
          facingMode,
        });

        cam.start()
          .then(() => {
            clearTimeout(initTimeoutRef.current);
            if (isMountedRef.current) {
              cameraRef.current = cam;
              setCamera(cam);
              setIsReady(true);
              setError(null);
              retryCountRef.current = 0;
              resolve(cam);
            } else {
              cam.stop();
              reject(new Error('Component unmounted'));
            }
          })
          .catch((err) => {
            clearTimeout(initTimeoutRef.current);
            reject(err);
          });
      } catch (err) {
        clearTimeout(initTimeoutRef.current);
        reject(err);
      }
    });
  }, []);

  // Tentar inicializar com retry
  const tryInitializeWithRetry = useCallback(async (poseDetector) => {
    if (!isMountedRef.current) return;

    // Verificar permissões primeiro
    const hasPermission = await checkCameraPermissions();
    if (!hasPermission) {
      setError('Permissão de câmera negada');
      setIsInitializing(false);
      return;
    }

    try {
      // Tentar câmera frontal primeiro
      await initializeCamera(poseDetector, 'user');
    } catch (frontError) {
      console.warn('Erro com câmera frontal:', frontError);

      // Se falhar e ainda tiver retries, tentar novamente
      if (retryCountRef.current < MAX_RETRIES && isMountedRef.current) {
        retryCountRef.current++;
        console.log(`Tentando novamente... (${retryCountRef.current}/${MAX_RETRIES})`);
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * retryCountRef.current));
        
        if (isMountedRef.current) {
          try {
            // Tentar câmera traseira como fallback
            await initializeCamera(poseDetector, 'environment');
          } catch (backError) {
            console.warn('Erro com câmera traseira:', backError);
            
            // Última tentativa com qualquer câmera disponível
            if (retryCountRef.current < MAX_RETRIES && isMountedRef.current) {
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
              try {
                await initializeCamera(poseDetector, undefined);
              } catch (finalError) {
                if (isMountedRef.current) {
                  setError('Não foi possível iniciar a câmera. Verifique as permissões.');
                  setIsInitializing(false);
                }
              }
            }
          }
        }
      } else if (isMountedRef.current) {
        setError('Não foi possível iniciar a câmera após várias tentativas.');
        setIsInitializing(false);
      }
    }
  }, [initializeCamera, checkCameraPermissions]);
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    isMountedRef.current = true;
    setIsInitializing(true);
    setError(null);

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
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    poseDetector.onResults((results) => {
      if (!canvasRef.current || !isMountedRef.current) return;

      try {
        const canvasCtx = canvasRef.current.getContext('2d');

        // Limpar canvas
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Desenhar vídeo
        if (results.image) {
          canvasCtx.drawImage(
            results.image,
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        }

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
      } catch (err) {
        console.warn('Erro ao desenhar no canvas:', err);
      }
    });

    poseDetectorRef.current = poseDetector;
    setPose(poseDetector);

    // Inicializar câmera com retry
    tryInitializeWithRetry(poseDetector).finally(() => {
      if (isMountedRef.current) {
        setIsInitializing(false);
      }
    });

    // Cleanup
    return () => {
      isMountedRef.current = false;
      clearAllTimers();
      
      // Aguardar um pouco antes de limpar para evitar race conditions
      cleanupTimeoutRef.current = setTimeout(() => {
        stopCameraSafely();
        closePoseSafely();
        setCamera(null);
        setPose(null);
        setIsReady(false);
        setLandmarks(null);
      }, 100);
    };
  }, [tryInitializeWithRetry, clearAllTimers, stopCameraSafely, closePoseSafely]);

  const stopCamera = useCallback(() => {
    stopCameraSafely();
    setIsReady(false);
  }, [stopCameraSafely]);

  const restartCamera = useCallback(async () => {
    if (!isMountedRef.current || !poseDetectorRef.current) return;
    
    stopCameraSafely();
    setIsReady(false);
    setError(null);
    retryCountRef.current = 0;
    
    await tryInitializeWithRetry(poseDetectorRef.current);
  }, [stopCameraSafely, tryInitializeWithRetry]);

  return {
    videoRef,
    canvasRef,
    isReady,
    landmarks,
    error,
    isInitializing,
    stopCamera,
    restartCamera,
  };
};
