import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
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
  Trophy
} from 'lucide-react';
import { mockSessionHistory } from '../mock';

const SessionResult = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get session data from navigation state or mock data
  const sessionFromState = location.state;
  const sessionFromMock = mockSessionHistory.find(s => s.id === sessionId);
  
  const session = sessionFromState || sessionFromMock || {
    exercise: 'Unknown Exercise',
    score: 0,
    feedback: 'No feedback available',
    keyMetrics: { alignment: 0, balance: 0, form: 0 }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'from-emerald-400 to-emerald-600';
    if (score >= 80) return 'from-blue-400 to-blue-600';
    if (score >= 70) return 'from-amber-400 to-amber-600';
    return 'from-red-400 to-red-600';
  };

  const getScoreBadge = (score) => {
    if (score >= 90) return { text: 'Excellent', class: 'bg-emerald-100 text-emerald-700' };
    if (score >= 80) return { text: 'Good', class: 'bg-blue-100 text-blue-700' };
    if (score >= 70) return { text: 'Fair', class: 'bg-amber-100 text-amber-700' };
    return { text: 'Needs Work', class: 'bg-red-100 text-red-700' };
  };

  const badge = getScoreBadge(session.score);

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
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-600">
              <Share className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-600">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Session Complete!</h1>
          <p className="text-slate-600 text-sm">{session.exercise} Analysis</p>
        </div>
      </div>

      {/* Score Display */}
      <div className="px-6 mb-6">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="relative mb-6">
              <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${getScoreColor(session.score)} flex items-center justify-center shadow-lg`}>
                <div className="text-white">
                  <div className="text-3xl font-bold mb-1">{session.score}</div>
                  <div className="text-sm opacity-90">/ 100</div>
                </div>
              </div>
              {session.score >= 90 && (
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
            
            <p className="text-slate-700 text-sm leading-relaxed">
              {session.feedback}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="px-6 mb-6">
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-slate-800">
              <Target className="w-5 h-5 mr-2" />
              Detailed Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.keyMetrics && Object.entries(session.keyMetrics).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 capitalize">{key}</span>
                  <span className="text-sm font-bold text-slate-800">{value}/100</span>
                </div>
                <Progress value={value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

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
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <Star className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-emerald-700">Maintained excellent core stability</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Star className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-emerald-700">Good alignment through spine</p>
                </div>
              </div>
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
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <TrendingUp className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-amber-700">Work on hip alignment for better balance</p>
                </div>
                <div className="flex items-start space-x-2">
                  <TrendingUp className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-amber-700">Focus on extended leg positioning</p>
                </div>
              </div>
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
        </Button>

        <Button 
          variant="outline" 
          className="w-full h-12 border-purple-200 text-purple-700 hover:bg-purple-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Detailed Report
        </Button>
      </div>
    </div>
  );
};

export default SessionResult;