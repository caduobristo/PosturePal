import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Camera,
  ArrowLeft,
  Play,
  RotateCcw,
  CheckCircle,
  Info,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import { useMediaPipePose } from '../hooks/useMediaPipePose';
import { analyzePosture, generateDetailedFeedback } from '../utils/postureAnalysis';
import {
  EXERCISES,
  DEFAULT_CAMERA_SESSION_STATE,
  getExerciseById,
} from '../data/exercises';
import { createSession } from '../lib/api';

const CameraEvaluation = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState(() => ({
    ...DEFAULT_CAMERA_SESSION_STATE,
  }));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [savingSession, setSavingSession] = useState(false);
  const [score, setScore] = useState(0);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [landmarksHistory, setLandmarksHistory] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [scoreFeedback, setScoreFeedback] = useState(null);
  const [feedbacksHistory, setFeedbacksHistory] = useState([]);
  const [connected, setConnected] = useState(false);
  const [bluetoothError, setBluetoothError] = useState(null);
  const scoreHistoryRef = useRef([]);
  const landmarksHistoryRef = useRef([]);
  const feedbacksHistoryRef = useRef([]);
  const videoFramesRef = useRef([]);
  const metricsRef = useRef(null);
  const connectSubscriptionRef = useRef(null);
  const dataSubscriptionRef = useRef(null);
  const connectedRef = useRef(false);
  const stopEvaluationRef = useRef(() => {});
  const frameIntervalRef = useRef(null);

  const exercise = useMemo(() => getExerciseById(exerciseId), [exerciseId]);
  const isNativePlatform = useMemo(() => {
    const platform = Capacitor.getPlatform();
    return platform === 'ios' || platform === 'android';
  }, []);
  const isBluetoothAvailable = isNativePlatform;
  const { videoRef, canvasRef, isReady, landmarks, error, stopCamera, restartCamera, isInitializing } =
    useMediaPipePose();
  const countdownIntervalRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const requestBluetoothPermissions = useCallback(async () => {
    if (!isNativePlatform || Capacitor.getPlatform() !== 'android') {
      return true;
    }

    if (
      typeof AndroidPermissions?.checkPermission !== 'function' ||
      typeof AndroidPermissions?.requestPermission !== 'function'
    ) {
      return true;
    }

    const requiredPermissions = [
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.ACCESS_FINE_LOCATION',
    ];

    try {
      for (const permission of requiredPermissions) {
        const check = await AndroidPermissions.checkPermission(permission);
        if (!check?.hasPermission) {
          const result = await AndroidPermissions.requestPermission(permission);
          if (!result?.hasPermission) {
            return false;
          }
        }
      }
      return true;
    } catch (err) {
      console.error('Erro ao solicitar permissões Bluetooth:', err);
      setBluetoothError('Permissões de Bluetooth foram negadas.');
      return false;
    }
  }, [isNativePlatform]);

  const sendBluetoothCommand = useCallback(
    async (command) => {
      if (!isBluetoothAvailable) {
        return;
      }
      if (!connectedRef.current) {
        console.warn('Bluetooth dispositivo não conectado; comando ignorado:', command);
        return;
      }
      if (typeof BluetoothSerial?.write !== 'function') {
        console.warn('BluetoothSerial.write não disponível');
        return;
      }

      try {
        await BluetoothSerial.write(command);
      } catch (err) {
        console.error(`Erro ao enviar comando Bluetooth (${command})`, err);
        setBluetoothError(err?.message || 'Falha ao enviar comando Bluetooth');
      }
    },
    [isBluetoothAvailable],
  );

  useEffect(() => {
    if (!isBluetoothAvailable) {
      setConnected(false);
      setBluetoothError(null);
      return;
    }

    let cancelled = false;

    const connectToESP32 = async () => {
      try {
        const hasPermissions = await requestBluetoothPermissions();
        if (!hasPermissions) {
          setBluetoothError('Permissões de Bluetooth são necessárias para conectar ao ESP32.');
          setConnected(false);
          return;
        }

        if (typeof BluetoothSerial?.enable === 'function') {
          await BluetoothSerial.enable();
        }

        const devices = await BluetoothSerial.list();
        const deviceList = Array.isArray(devices)
          ? devices
          : Array.isArray(devices?.devices)
            ? devices.devices
            : [];

        const esp =
          deviceList.find((device) => device?.name === 'PosturePal') ||
          deviceList.find((device) => device?.name?.includes?.('Carrinho'));

        if (!esp) {
          console.warn('ESP32 não encontrado');
          if (!cancelled) {
            setBluetoothError('ESP32 não encontrado');
            setConnected(false);
          }
          return;
        }

        const address =
          esp.address ??
          esp.id ??
          esp.uuid ??
          esp.macAddress ??
          esp.deviceAddress;

        if (!address) {
          throw new Error('Endereço Bluetooth do ESP32 não encontrado');
        }

        connectSubscriptionRef.current = BluetoothSerial.connect(address).subscribe({
          next: () => {
            if (cancelled) {
              return;
            }
            connectedRef.current = true;
            setConnected(true);
            setBluetoothError(null);

            dataSubscriptionRef.current = BluetoothSerial.subscribe('\n').subscribe({
              next: (rawValue) => {
                const normalized = String(rawValue ?? '')
                  .trim()
                  .toLowerCase();
                if (normalized.startsWith('parou')) {
                  console.log('📩 Carrinho enviou PAROU');
                  stopEvaluationRef.current();
                }
              },
              error: (err) => {
                console.error('Erro ao receber dados do ESP32:', err);
              },
            });
          },
          error: (err) => {
            console.error('Erro ao conectar ao ESP32:', err);
            if (!cancelled) {
              setBluetoothError(err?.message || 'Erro ao conectar ao ESP32');
              setConnected(false);
              connectedRef.current = false;
            }
          },
        });
      } catch (err) {
        console.error('Erro ao conectar ao ESP32:', err);
        if (!cancelled) {
          setBluetoothError(err?.message || 'Erro ao conectar ao ESP32');
          setConnected(false);
          connectedRef.current = false;
        }
      }
    };

    connectToESP32();

    return () => {
      cancelled = true;

      dataSubscriptionRef.current?.unsubscribe?.();
      dataSubscriptionRef.current = null;

      connectSubscriptionRef.current?.unsubscribe?.();
      connectSubscriptionRef.current = null;

      if (connectedRef.current && typeof BluetoothSerial?.disconnect === 'function') {
        BluetoothSerial.disconnect().catch(() => null);
      }

      connectedRef.current = false;
    };
  }, [isBluetoothAvailable, requestBluetoothPermissions]);
  const captureVideoFrame = useCallback(() => {
    if (!videoRef.current) return null;
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  }, []);

  const startEvaluation = async () => {
    if (savingSession) return;
    if (!isReady) {
      alert('Camera is not ready. Wait a minute.');
      return;
    }

    clearTimers();
    scoreHistoryRef.current = [];
    landmarksHistoryRef.current = [];
    feedbacksHistoryRef.current = [];
    videoFramesRef.current = [];
    metricsRef.current = null;
    setScoreHistory([]);
    setLandmarksHistory([]);
    setFeedbacksHistory([]);
    setCountdown(3);
    setSession(prev => ({ ...prev, isActive: true }));
    setIsAnalyzing(false);

    let timeLeft = 3;
    countdownIntervalRef.current = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft > 0) {
        setCountdown(timeLeft);
        return;
      }

      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
      setCountdown(null);

      if (isBluetoothAvailable && connectedRef.current) {
        sendBluetoothCommand('d\n');
        console.log('➡️ Comando D (Frente) enviado ao carrinho');
      } else if (isBluetoothAvailable && !connectedRef.current) {
        setBluetoothError('Carrinho não conectado via Bluetooth.');
      }

      setIsAnalyzing(true);
      
      // Capture video frames every 200ms (5 frames per second)
      frameIntervalRef.current = setInterval(() => {
        const frame = captureVideoFrame();
        if (frame && videoFramesRef.current.length < 100) { // Limit to 100 frames (~20 seconds)
          videoFramesRef.current.push(frame);
        }
      }, 200);
    }, 1000);
  };

  const buildLandmarkPayload = useCallback(
    (frames) =>
      frames.map((frame) =>
        frame.map((point) => ({
          x: point.x ?? 0,
          y: point.y ?? 0,
          z: point.z ?? 0,
          visibility:
            typeof point.visibility === 'number' ? point.visibility : 1,
        })),
      ),
    [],
  );

  const transformMetrics = useCallback(
    (metrics) => ({
      shoulder_alignment:
        metrics?.shoulder_alignment ?? metrics?.shoulderAlignment ?? 0,
      hip_alignment: metrics?.hip_alignment ?? metrics?.hipAlignment ?? 0,
      spine_alignment: metrics?.spine_alignment ?? metrics?.spineAlignment ?? 0,
      knee_angle: metrics?.knee_angle ?? metrics?.kneeAngle ?? 0,
      left_arm_extension:
        metrics?.left_arm_extension ?? metrics?.leftArmExtension ?? 0,
      right_arm_extension:
        metrics?.right_arm_extension ?? metrics?.rightArmExtension ?? 0,
      left_arm_height:
        metrics?.left_arm_height ?? metrics?.leftArmHeight ?? 0,
      right_arm_height:
        metrics?.right_arm_height ?? metrics?.rightArmHeight ?? 0,
    }),
    [],
  );

  const stopEvaluation = useCallback(async () => {
    if (savingSession) return;
    clearTimers();
    setCountdown(null);

    // Stop capturing frames
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (isBluetoothAvailable && connectedRef.current) {
      await sendBluetoothCommand('off\n');
      console.log('⛔ Comando OFF enviado ao carrinho');
    }

    const finalScoreHistory = scoreHistoryRef.current;
    const finalLandmarksHistory = landmarksHistoryRef.current;
    const finalFeedbacksHistory = feedbacksHistoryRef.current;
    const finalVideoFrames = videoFramesRef.current;

    setSession({ ...DEFAULT_CAMERA_SESSION_STATE });
    setIsAnalyzing(false);
    stopCamera();

    if (!exercise) {
      toast({
        title: 'Exercise unavailable',
        description: 'Unable to identify the selected exercise.',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: 'User not authenticated',
        description: 'Please log in again before saving the session.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    const averageScore =
      finalScoreHistory.length > 0
        ? Math.round(
            finalScoreHistory.reduce((acc, value) => acc + value, 0) /
              finalScoreHistory.length,
          )
        : Math.round(score || 0);

    const payload = {
      user_id: user.id,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      score: averageScore,
      feedback: finalFeedbacksHistory,
      metrics: transformMetrics(metricsRef.current),
      landmark_frames: buildLandmarkPayload(finalLandmarksHistory),
      video_frames: finalVideoFrames,
    };

    try {
      setSavingSession(true);
      const savedSession = await createSession(payload);
      toast({
        title: 'Session saved',
        description: 'Your posture session was stored successfully.',
      });
      navigate(`/result/${savedSession.id}`, {
        state: {
          exercise,
          scoreHistory: finalScoreHistory,
          landmarksHistory: finalLandmarksHistory,
          feedbacksHistory: finalFeedbacksHistory,
          videoFrames: finalVideoFrames,
          session: savedSession,
        },
      });
    } catch (err) {
      let message =
        err?.data?.detail ||
        err?.message ||
        'Unable to save the session. Please try again.';
      if (Array.isArray(message)) {
        message = message
          .map((item) => item?.msg || item?.message || JSON.stringify(item))
          .join(', ');
      }
      toast({
        title: 'Failed to save session',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSavingSession(false);
    }
  }, [
    savingSession,
    clearTimers,
    sendBluetoothCommand,
    setCountdown,
    exercise,
    toast,
    navigate,
    user,
    score,
    buildLandmarkPayload,
    transformMetrics,
    stopCamera,
  ]);

  useEffect(() => {
    stopEvaluationRef.current = stopEvaluation;
  }, [stopEvaluation]);
  useEffect(() => {
    if (!isAnalyzing || !landmarks?.length || !exercise) return;

    const analysis = analyzePosture(landmarks, exercise);
    if (!analysis) return;

    const { score: computedScore, feedback, metrics } = analysis;
    const feedbackSummary = generateDetailedFeedback(computedScore);

    setScore(computedScore);
    setFeedbacks(feedback);
    setScoreFeedback(feedbackSummary);
    metricsRef.current = metrics;

    setScoreHistory((prevHistory) => {
      const updated = [...prevHistory, computedScore];
      scoreHistoryRef.current = updated;
      return updated;
    });
    setLandmarksHistory((prevHistory) => {
      const updated = [...prevHistory, landmarks];
      landmarksHistoryRef.current = updated;
      return updated;
    });
    setFeedbacksHistory((prevHistory) => {
      const updated = [...prevHistory, ...feedback];
      feedbacksHistoryRef.current = updated;
      return updated;
    });
  }, [landmarks, isAnalyzing, exercise]);

  if (!exercise) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Exercise not found</h2>
          <Button
            onClick={() => navigate('/exercises')}
            className="bg-gradient-to-r from-rose-500 to-purple-600"
          >
            Back to Exercises
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/exercises')}
            className="text-slate-600 hover:text-slate-800 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Badge className="bg-gradient-to-r from-rose-100 to-purple-100 text-purple-700">
            {exercise.difficulty}
          </Badge>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{exercise.name}</h1>
          <p className="text-slate-600 text-sm mb-4">{exercise.description}</p>
      </div>
    </div>

      {isBluetoothAvailable && (
        <div className="px-6 mb-4">
          <div className="rounded-lg border border-purple-100 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
            <p className="text-sm font-medium text-slate-700">
              Bluetooth:&nbsp;
              {connected ? (
                <span className="text-emerald-600">conectado ao PosturePal…</span>
              ) : (
                <span className="text-amber-600">conectando ao PosturePal…</span>
              )}
            </p>
            {bluetoothError && (
              <p className="mt-2 text-xs text-red-600">{bluetoothError}</p>
            )}
          </div>
        </div>
      )}

      {/* Camera View with MediaPipe */}
      <div className="px-6 mb-6">
        <Card className="border-0 shadow-2xl bg-black/5 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-800 to-slate-900">
              {/* Video element for MediaPipe */}
              <video ref={videoRef} style={{ display: 'none' }} playsInline />

              {/* Canvas with pose detection */}
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full object-cover"
              />              {/* Camera error */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="text-center text-white p-6">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                    <p className="text-sm mb-2 font-semibold">Erro ao acessar a câmera</p>
                    <p className="text-xs text-white/70 mb-4">{error}</p>
                    <Button
                      onClick={restartCamera}
                      disabled={isInitializing}
                      className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      {isInitializing ? 'Tentando...' : 'Tentar Novamente'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Camera overlay */}
              <div className="absolute inset-4 border-2 border-white/30 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-white/50"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-white/50"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-white/50"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-white/50"></div>
              </div>              {/*              Status overlay */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                {!isReady && !error && (
                  <Badge className="bg-yellow-500/90 text-white">
                    {isInitializing ? 'Iniciando câmera...' : 'Carregando...'}
                  </Badge>
                )}
                {isAnalyzing && (
                  <Badge className="bg-green-500/90 text-white">
                    ● LIVE
                  </Badge>
                )}
              </div>              {/* Countdown /              Status overlay center */}
              {!session.isActive && isReady && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-white/80">Posicione-se dentro do quadro</p>
                  </div>
                </div>
              )}

              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="text-5xl font-bold text-white">{countdown}</span>
                </div>
              )}

              {/* Recording indicator */}
              {session.isActive && isAnalyzing && (
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-medium">REC</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Info */}
      {isAnalyzing && landmarks && (
          <div className="px-6 mb-6">
              {/*
                  1. Verificamos se 'feedbacks' é um array e se tem elementos.
                  2. Usamos o método 'map' para iterar sobre cada item do array 'feedbacks'.
              */}
              {/* Se você ainda quiser exibir o score uma única vez (se ele não for por feedback) */}
              {scoreFeedback && (
                     <div className={`text-center mt-4 p-4 rounded border border-black ${scoreFeedback.color}`}>
                         <p className="text-lg font-bold text-gray-700">Score: {score} </p>
                         <p className="text-lg font-bold text-gray-700">{scoreFeedback.title}</p>
                         <p className="text-sm text-gray-700">{scoreFeedback.message}</p>
                    </div>
              )}

              {feedbacks && Array.isArray(feedbacks) && feedbacks.map((feedbackItem, index) => {
                  if (feedbackItem.type === 'success') {
                      return (
                          <Card
                              key={index}
                              className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 mb-3"
                          >
                              <CardContent className="p-4">
                                  <div className="flex items-center justify-center space-x-2">
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                      <p className="text-sm font-medium text-green-800">
                                          <strong>Feedback {index + 1}:</strong> {feedbackItem.message}
                                      </p>
                                  </div>
                              </CardContent>
                          </Card>
                      );
                  } else {
                      return (
                          <Card
                              key={index}
                              className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-rose-50 mb-3"
                          >
                              <CardContent className="p-4">
                                  <div className="flex items-center justify-center space-x-2">
                                      <CheckCircle className="w-5 h-5 text-red-600" />
                                      <p className="text-sm font-medium text-red-800">
                                          <strong>Feedback {index + 1}:</strong> {feedbackItem.message}
                                      </p>
                                  </div>
                              </CardContent>
                          </Card>
                      );
                  }
              })}


          </div>
      )}

      {/* Controls */}
      <div className="px-6 mb-6">
        {!session.isActive ? (
          <Button
            onClick={startEvaluation}
            disabled={!isReady || savingSession}
            className="w-full h-14 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-medium shadow-lg disabled:opacity-50"
          >
            {!isReady ? (
              <>
                <Camera className="w-5 h-5 mr-2" />
                Preparing the camera...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Init camera
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={stopEvaluation}
            disabled={savingSession}
            className="w-full h-14 bg-red-500 hover:bg-red-600 text-white font-medium shadow-lg disabled:opacity-50"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Stop camera
          </Button>
        )}
      </div>

      {/* Exercise Tips */}
      <div className="px-6 pb-24">
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-slate-800">
              <Info className="w-5 h-5 mr-2" />
              Key Points to Focus On
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exercise.keyPoints.map((point, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-rose-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3 h-3 text-purple-600" />
                  </div>
                  <p className="text-sm text-slate-700">{point}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CameraEvaluation;
