import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { 
  Camera, 
  TrendingUp, 
  Award, 
  Clock,
  Target,
  Sparkles,
  ChevronRight,
  BarChart3,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockSessionHistory, mockProgressData } from '../mock';

const Dashboard = () => {
  const { user } = useAuth();
  const recentSessions = mockSessionHistory.slice(0, 3);
  const weeklyAverage = Math.round(mockProgressData.slice(-7).reduce((acc, day) => acc + day.score, 0) / 7);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12 ring-2 ring-purple-200">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-gradient-to-br from-rose-100 to-purple-100 text-purple-700 font-semibold">
                {user?.name?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-bold text-slate-800">
                Hello, {user?.name?.split(' ')[0]}! 🩰
              </h1>
              <p className="text-sm text-slate-600">Ready to practice?</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-50 to-pink-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-rose-600" />
                <Badge className="bg-rose-100 text-rose-700 text-xs">Best</Badge>
              </div>
              <div className="text-2xl font-bold text-slate-800 mb-1">{user?.bestScore}</div>
              <div className="text-xs text-slate-600">Personal Best</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <Badge className="bg-purple-100 text-purple-700 text-xs">Avg</Badge>
              </div>
              <div className="text-2xl font-bold text-slate-800 mb-1">{weeklyAverage}</div>
              <div className="text-xs text-slate-600">This Week</div>
            </CardContent>
          </Card>
        </div>

        {/* Practice Button */}
        <Link to="/exercises">
          <Button className="w-full h-14 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl">
            <Camera className="w-5 h-5 mr-2" />
            Start Practice Session
          </Button>
        </Link>
      </div>

      {/* Recent Sessions */}
      <div className="px-6 pb-6">
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center text-slate-800">
                <BarChart3 className="w-5 h-5 mr-2" />
                Recent Sessions
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800 p-1">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSessions.map((session) => (
              <Link key={session.id} to={`/result/${session.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{session.exercise}</div>
                      <div className="text-xs text-slate-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {session.date} • {session.duration}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      className={`text-xs ${
                        session.score >= 90 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : session.score >= 80 
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {session.score}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="px-6 pb-24">
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center text-slate-800">
              <Award className="w-5 h-5 mr-2" />
              Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Weekly Progress</span>
                <span className="text-sm font-semibold text-slate-800">{weeklyAverage}/100</span>
              </div>
              <Progress value={weeklyAverage} className="h-3" />
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg">
                  <div className="text-lg font-bold text-slate-800">{user?.totalSessions}</div>
                  <div className="text-xs text-slate-600">Total Sessions</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
                  <div className="text-lg font-bold text-slate-800">{user?.streakDays}</div>
                  <div className="text-xs text-slate-600">Day Streak</div>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4 border-purple-200 text-purple-700 hover:bg-purple-50">
                <Download className="w-4 h-4 mr-2" />
                Export Progress Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;