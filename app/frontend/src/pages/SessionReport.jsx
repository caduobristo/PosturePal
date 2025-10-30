import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import {
  ArrowLeft,
  Download,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { fetchSession } from '../lib/api';
import { getExerciseById } from '../data/exercises';
import { getTopFeedbacks } from '../utils/getTopFeedbacks';
import { generatePDFReport } from '../utils/pdfGenerator';

const metricLabels = {
  shoulder_alignment: 'Shoulder alignment',
  hip_alignment: 'Hip alignment',
  spine_alignment: 'Spine alignment',
  knee_angle: 'Knee angle',
  left_arm_extension: 'Left arm extension',
  right_arm_extension: 'Right arm extension',
  left_arm_height: 'Left arm height',
  right_arm_height: 'Right arm height',
};

const SessionReport = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchSession(id)
      .then((data) => setSession(data))
      .catch((error) => {
        const message =
          error?.data?.detail || error?.message || 'Unable to load session data.';
        toast({
          title: 'Failed to load session',
          description: message,
          variant: 'destructive',
        });
      })
      .finally(() => setLoading(false));
  }, [id, toast]);

  const exercise = useMemo(() => {
    if (!session) return null;
    return (
      getExerciseById(session.exercise_id) || {
        id: session.exercise_id,
        name: session.exercise_name,
        difficulty: 'Custom',
        keyPoints: [],
      }
    );
  }, [session]);

  const topFeedbacks = useMemo(
    () => getTopFeedbacks(session?.feedback || []),
    [session],
  );

  const handleExportPdf = async () => {
    if (!session) return;
    try {
      await generatePDFReport({
        exercise,
        scoreHistory: session.score_history || [session.score],
        average: session.score,
        topFeedbacks,
        date: session.created_at,
      });
      toast({
        title: 'Report generated',
        description: 'The PDF report was generated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Failed to generate PDF',
        description: error?.message || 'Try again in a moment.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-purple-50">
        <p className="text-slate-600">Loading session details…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-purple-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Session not found</h2>
          <Link to="/">
            <Button className="bg-gradient-to-r from-rose-500 to-purple-600">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const createdAt = new Date(session.created_at);
  const metrics = session.metrics || {};

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Session Report</h1>
            <p className="text-slate-600 flex items-center mt-1">
              <Calendar className="w-4 h-4 mr-2" />
              {createdAt.toLocaleString()}
            </p>
          </div>
        </div>
        <Button
          className="bg-slate-800 hover:bg-slate-700 text-white"
          onClick={handleExportPdf}
        >
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center text-indigo-700">
              <Target className="w-5 h-5 mr-2" />
              {exercise?.name || 'Exercise'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Overall Score</p>
              <p className="text-4xl font-bold text-indigo-700">{Math.round(session.score)}/100</p>
            </div>
            {exercise?.keyPoints?.length > 0 && (
              <div>
                <p className="text-sm text-slate-600 mb-2">Key points to focus on</p>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  {exercise.keyPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-700">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-700">Frames analyzed:</span>{' '}
              {session.landmark_frames?.length || 0}
            </p>
            <p>
              <span className="font-medium text-slate-700">Feedback entries:</span>{' '}
              {Array.isArray(session.feedback) ? session.feedback.length : 0}
            </p>
            <p>
              <span className="font-medium text-slate-700">Recorded at:</span>{' '}
              {createdAt.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-700">
              <CheckCircle className="w-5 h-5 mr-2" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topFeedbacks.success.length > 0 ? (
              topFeedbacks.success.map((item, index) => (
                <div
                  key={`strength-${index}`}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-emerald-50"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-1" />
                  <p className="text-sm text-emerald-800">{item.message}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No success feedback recorded.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              Areas for improvement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topFeedbacks.error.length > 0 ? (
              topFeedbacks.error.map((item, index) => (
                <div
                  key={`issue-${index}`}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-amber-50"
                >
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-1" />
                  <p className="text-sm text-amber-800">{item.message}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No improvement feedback recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="text-slate-700">Posture Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(metricLabels).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">{label}</span>
                <span className="text-sm font-medium text-slate-800">
                  {Math.round((metrics[key] ?? 0) * 100)}%
                </span>
              </div>
              <Progress value={(metrics[key] ?? 0) * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionReport;
