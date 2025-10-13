import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft,
  Download,
  Play,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  BarChart3
} from 'lucide-react';
import { mockSessions } from '../mock';

const SessionReport = () => {
  const { id } = useParams();
  const session = mockSessions.find(s => s.id === id) || mockSessions[0];

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getProgressColor = (score) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
      {/* Header */}
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
              {session.date} at {session.time}
            </p>
          </div>
        </div>
        <Button className="bg-slate-800 hover:bg-slate-700 text-white">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Overview Stats */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Overall Score</p>
                    <p className="text-3xl font-bold text-indigo-700">{session.overallScore}/100</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Duration</p>
                    <p className="text-3xl font-bold text-emerald-700">{session.duration}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Positions</p>
                    <p className="text-3xl font-bold text-purple-700">{session.positions.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Play className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Best Position</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {Math.max(...session.positions.map(p => p.score))}/100
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Position Breakdown */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-slate-700" />
                Position Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {session.positions.map((position, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors duration-200">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-700">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-slate-800">{position.name}</h3>
                          <Badge className={`px-3 py-1 ${getScoreColor(position.score)}`}>
                            {position.score}/100
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <Progress 
                            value={position.score} 
                            className="flex-1 h-2 mr-3"
                          />
                          <span className="text-xs text-slate-500 w-16">
                            {position.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Improvements & Analysis */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-700">
                <AlertCircle className="w-5 h-5 mr-2" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {session.improvements.map((improvement, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-amber-50">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-amber-800">{improvement}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardHeader>
              <CardTitle className="flex items-center text-emerald-800">
                <CheckCircle className="w-5 h-5 mr-2" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-emerald-100/50">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                  <p className="text-sm text-emerald-800">Excellent core stability throughout session</p>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-emerald-100/50">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                  <p className="text-sm text-emerald-800">Consistent arm positioning and port de bras</p>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-emerald-100/50">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                  <p className="text-sm text-emerald-800">Good progress in balance and coordination</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-indigo-800">Next Session Focus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-indigo-700 font-medium">Recommended for your next practice:</p>
                <ul className="space-y-1 text-indigo-600 ml-2">
                  <li>• Work on hip alignment in arabesque</li>
                  <li>• Practice core engagement exercises</li>
                  <li>• Focus on shoulder blade stability</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SessionReport;