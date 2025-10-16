import React, { useState, useEffect, useRef } from 'react';
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
  Target,
  Zap,
  Info,
  AlertCircle
} from 'lucide-react';
import { mockBalletExercises, mockCameraSession } from '../mock';
import { useMediaPipePose } from '../hooks/useMediaPipePose';
import { analyzePosture, generateDetailedFeedback } from '../utils/postureAnalysis';

const CameraEvaluation = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(mockCameraSession);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [score, setScore] = useState(0);
  const [feedbacks, setFeedbacks] = useState([]);
  const [scoreFeedback, setScoreFeedback] = useState(null);
  
  const exercise = mockBalletExercises.find(ex => ex.id === exerciseId);
  
  // Hook do MediaPipe
  const { videoRef, canvasRef, isReady, landmarks, error, stopCamera } = useMediaPipePose();

  const startEvaluation = () => {
    if (!isReady) {
      alert('Câmera ainda não está pronta. Aguarde um momento.');
      return;
    }
    setSession(prev => ({ ...prev, isActive: true }));
    setIsAnalyzing(true); // Ativar câmera imediatamente
  };

  const stopEvaluation = () => {
    setSession(mockCameraSession);
    setIsAnalyzing(false);
    stopCamera();
  };

  useEffect(() => {
      if (!isAnalyzing || !landmarks || landmarks.length === 0 || !exercise) return;

      const { score, feedback } = analyzePosture(landmarks, exercise);
      const feedbackSummary = generateDetailedFeedback(score);

      console.log('landmarks:', landmarks);
      console.log('score:', score);
      console.log('feedbacks:', feedback);
      console.log('feedback summary:', feedbackSummary);

      setScore(score);
      setFeedbacks(feedback);
      setScoreFeedback(feedbackSummary);
    }, [landmarks, isAnalyzing, exercise]);

  if (!exercise) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Exercise not found</h2>
          <Button onClick={() => navigate('/exercises')} className="bg-gradient-to-r from-rose-500 to-purple-600">
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

      {/* Camera View with MediaPipe */}
      <div className="px-6 mb-6">
        <Card className="border-0 shadow-2xl bg-black/5 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-800 to-slate-900">
              
              {/* Vídeo oculto (usado pelo MediaPipe) */}
              <video
                ref={videoRef}
                style={{ display: 'none' }}
                playsInline
              />
              
              {/* Canvas com detecção de pose */}
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Erro de câmera */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="text-center text-white p-6">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                    <p className="text-sm mb-2">Erro ao acessar câmera</p>
                    <p className="text-xs text-white/70">{error}</p>
                  </div>
                </div>
              )}

              {/* Camera overlay */}
              <div className="absolute inset-4 border-2 border-white/30 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-white/50"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-white/50"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-white/50"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-white/50"></div>
              </div>

              {/*              Status overlay */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                {!isReady && !error && (
                  <Badge className="bg-yellow-500/90 text-white">
                    Iniciando câmera...
                  </Badge>
                )}
                {isAnalyzing && (
                  <Badge className="bg-green-500/90 text-white">
                    ● AO VIVO
                  </Badge>
                )}
              </div>

              {/* Countdown /              Status overlay center */}
              {!session.isActive && isReady && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-white/80">Posicione-se no quadro</p>
                  </div>
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
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-800">
                  {landmarks.length} pontos detectados
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Info */}
      {isAnalyzing && landmarks && (
          <div className="px-6 mb-6">
              {/*
                  1. Verificamos se 'feedbacks' é um array e se tem elementos.
                  2. Usamos o método 'map' para iterar sobre cada item do array 'feedbacks'.
              */}
              {feedbacks && Array.isArray(feedbacks) && feedbacks.map((feedbackItem, index) => (
                  // A 'key' é essencial no React para ajudar na performance e rastreamento.
                  // Usamos o índice (index) como key, mas um ID único seria melhor se estivesse disponível.
                  <Card
                      key={index}
                      className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 mb-3" // Adicionado mb-3 para espaçamento
                  >
                      <CardContent className="p-4">
                          <div className="flex items-center justify-center space-x-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <p className="text-sm font-medium text-green-800">
                                  {/* Você pode exibir o score se for o mesmo para todos, ou removê-lo. */}
                                  {/* Se o score for por feedback, use feedbackItem.score */}
                                  {/* Exibindo a mensagem do feedback atual: */}
                                  **Feedback {index + 1}:** {feedbackItem.message}
                              </p>
                          </div>
                      </CardContent>
                  </Card>
              ))}

              {/* Se você ainda quiser exibir o score uma única vez (se ele não for por feedback) */}
              {scoreFeedback && (
                  <div className="text-center mt-4">
                       <p className="text-lg font-bold text-gray-700">Score Final: {score} -> {scoreFeedback.title}</p>
                  </div>
              )}
          </div>
      )}

      {/* Controls */}
      <div className="px-6 mb-6">
        {!session.isActive ? (
          <Button
            onClick={startEvaluation}
            disabled={!isReady}
            className="w-full h-14 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-medium shadow-lg disabled:opacity-50"
          >
            {!isReady ? (
              <>
                <Camera className="w-5 h-5 mr-2" />
                Preparando Câmera...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Iniciar Câmera
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={stopEvaluation}
            className="w-full h-14 bg-red-500 hover:bg-red-600 text-white font-medium shadow-lg"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Parar Câmera
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