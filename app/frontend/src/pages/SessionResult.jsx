import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft,
  Download,
  Share,
  RotateCcw,
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Star,
  Trophy,
  Trash2
} from 'lucide-react';
import { getTopFeedbacks } from '../utils/getTopFeedbacks';
import Landmark3DViewer from '../utils/3dmodel';
import { analyzePosture } from '../utils/postureAnalysis';
import { generatePDFReport } from '../utils/pdfGenerator';
import { useToast } from '../hooks/use-toast';
import { fetchSession, deleteSession } from '../lib/api';

const SessionResult = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const navigationState = location.state || {};
  const {
    exercise: navExercise,
    scoreHistory: navScoreHistory,
    landmarksHistory: navLandmarksHistory,
    feedbacksHistory: navFeedbacksHistory,
  } = navigationState;

  const [sessionRecord, setSessionRecord] = useState(navigationState.session || null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if ((navExercise && navScoreHistory) || !sessionId) {
      return;
    }

    setLoadingSession(true);
    setLoadError(null);
    fetchSession(sessionId)
      .then((response) => setSessionRecord(response))
      .catch((err) => {
        console.error('Failed to load session', err);
        setLoadError(err);
      })
      .finally(() => setLoadingSession(false));
  }, [navExercise, navScoreHistory, sessionId]);

  const resolvedExercise =
    navExercise ||
    (sessionRecord
      ? {
          id: sessionRecord.exercise_id,
          name: sessionRecord.exercise_name || 'Recorded Exercise',
          difficulty: sessionRecord.exercise_difficulty || 'Custom',
          description: sessionRecord.exercise_description || '',
          keyPoints: sessionRecord.key_points || [],
        }
      : null);

  const resolvedScoreHistory =
    navScoreHistory ||
    (sessionRecord && typeof sessionRecord.score === 'number'
      ? [sessionRecord.score]
      : []);

  const resolvedLandmarksHistory =
    navLandmarksHistory ||
    (Array.isArray(sessionRecord?.landmark_frames)
      ? sessionRecord.landmark_frames
      : []);

  const resolvedFeedbacksHistory =
    navFeedbacksHistory ||
    (Array.isArray(sessionRecord?.feedback) ? sessionRecord.feedback : []);

  const latestLandmarks =
    Array.isArray(resolvedLandmarksHistory) && resolvedLandmarksHistory.length > 0
      ? resolvedLandmarksHistory[resolvedLandmarksHistory.length - 1]
      : null;

  const latestAnalysis = useMemo(() => {
    if (
      !latestLandmarks ||
      !resolvedExercise ||
      !Array.isArray(latestLandmarks) ||
      latestLandmarks.length < 33
    ) {
      return null;
    }
    return analyzePosture(latestLandmarks, resolvedExercise);
  }, [latestLandmarks, resolvedExercise]);

  const feedbackArray = Array.isArray(resolvedFeedbacksHistory)
    ? resolvedFeedbacksHistory
    : [];

  const topFeedbacks = useMemo(
    () => getTopFeedbacks(feedbackArray),
    [feedbackArray],
  );

  const scoreHistoryValues = Array.isArray(resolvedScoreHistory)
    ? resolvedScoreHistory
    : [];

  const averageValue =
    scoreHistoryValues.length > 0
      ? scoreHistoryValues.reduce((acc, s) => acc + s, 0) / scoreHistoryValues.length
      : typeof sessionRecord?.score === 'number'
      ? sessionRecord.score
      : 0;
  const average = averageValue.toFixed(1);

  const sessionScore = Number(
    typeof sessionRecord?.score === 'number'
      ? sessionRecord.score
      : scoreHistoryValues[scoreHistoryValues.length - 1] || 0,
  );

  if (loadingSession && !navScoreHistory) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-600">Loading session details…</p>
      </div>
    );
  }

  if (!resolvedExercise) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">
          {loadError ? 'Unable to load session data.' : 'Session data not available.'}
        </p>
        <Button onClick={() => navigate('/exercises')} className="mt-4">
          Come back to exercises
        </Button>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 95) return 'bg-green-400';
    if (score >= 85) return 'bg-lime-400';
    if (score >= 75) return 'bg-blue-400';
    if (score >= 65) return 'bg-yellow-400';
    if (score >= 50) return 'bg-orange-400';
    return 'bg-rose-400';
  };

  const getScoreBadge = (score) => {
    if (score >= 95) return { text: 'Flawless Execution! 🏆', class: 'bg-emerald-100 text-emerald-700' };
    if (score >= 85) return { text: 'Excellent Execution! 🎉', class: 'bg-lime-100 text-lime-700' };
    if (score >= 75) return { text: 'Great Work! 👏', class: 'bg-blue-100 text-blue-700' };
    if (score >= 65) return { text: 'Good Effort! 💪', class: 'bg-yellow-100 text-yellow-700' };
    if (score >= 50) return { text: 'You Can Improve! 🧐', class: 'bg-orange-100 text-orange-700' };
    return { text: 'Keep Practicing! 🌟', class: 'bg-rose-100 text-rose-700' };
  };
  const badge = getScoreBadge(Number(average));

  const handleDownloadPDF = async () => {
    if (!resolvedExercise) return;

    try {
      await generatePDFReport({
        exercise: resolvedExercise,
        scoreHistory:
          scoreHistoryValues.length > 0 ? scoreHistoryValues : [sessionScore],
        average: averageValue,
        topFeedbacks,
        date: sessionRecord?.created_at || new Date().toISOString(),
      });
      toast({
        title: 'PDF generated',
        description: 'Your session report has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Failed to generate PDF',
        description: error?.message || 'Try again in a moment.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionId) return;
    
    if (!window.confirm('Tem certeza que deseja deletar esta sessão?')) {
      return;
    }

    try {
      await deleteSession(sessionId);
      toast({
        title: 'Sessão deletada',
        description: 'A sessão foi removida com sucesso.',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Erro ao deletar',
        description: error?.message || 'Não foi possível deletar a sessão.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="text-slate-600 hover:text-slate-800 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-600">
              <Share className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-slate-200 text-slate-600"
              onClick={handleDownloadPDF}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Session Complete!</h1>
          <p className="text-slate-600 text-sm">{resolvedExercise.name} Analysis</p>
        </div>
      </div>

      {/* Score Display */}
      <div className="px-6 mb-6">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="relative mb-6">
              <div className={`w-32 h-32 mx-auto rounded-full ${getScoreColor(average)} flex items-center justify-center shadow-lg`}>
                <div className="text-white">
                  <div className="text-3xl font-bold mb-1">{average}</div>
                  <div className="text-sm opacity-90">/ 100</div>
                </div>
              </div>
              {sessionScore >= 90 && (
                <div className="absolute -top-2 -right-2">
                  <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </div>
            
            <Badge className={`${badge.class} px-4 py-2 text-sm font-medium mb-4`}>
              {badge.text}
            </Badge>

          </CardContent>
        </Card>
      </div>

      {latestLandmarks && (
        <div className="px-6 mb-6">
          <Card className="border-0 shadow-2xl bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-slate-800">
                3D Landmark Preview
              </CardTitle>
            </CardHeader>
              <CardContent>
              <Landmark3DViewer
                landmarks={latestLandmarks}
                metrics={latestAnalysis?.metrics}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Achievements & Tips */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-1 gap-4">
            {/* Strengths */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center text-emerald-800">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  What You Did Well
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topFeedbacks.success.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {topFeedbacks.success.map((item, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Star className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <p className="text-emerald-700">
                          {item.message} <span className="text-xs text-emerald-500"></span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-emerald-700 text-sm">No success feedback recorded.</p>
                )}
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center text-amber-800">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Areas to Focus On
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topFeedbacks.error.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {topFeedbacks.error.map((item, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <TrendingUp className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-amber-700">
                          {item.message} <span className="text-xs text-amber-500"></span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-amber-700 text-sm">No error feedback recorded.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      {/* Action Buttons */}
      <div className="px-6 pb-24 space-y-3">
        <Button 
          onClick={() => navigate('/exercises')}
          className="w-full h-12 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Practice Again
        </Button>
        
        <Button 
          onClick={() => navigate('/')}
          variant="outline" 
          className="w-full h-12 border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          Back to Dashboard
        </Button>        <Button 
          variant="outline" 
          className="w-full h-12 border-purple-200 text-purple-700 hover:bg-purple-50"
          onClick={handleDownloadPDF}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Detailed Report
        </Button>
        
        {sessionId && (
          <Button 
            variant="outline" 
            className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleDeleteSession}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Session
          </Button>
        )}
      </div>
    </div>
  );
};

export default SessionResult;
