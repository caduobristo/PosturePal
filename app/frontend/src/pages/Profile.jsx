import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { 
  User,
  Trophy,
  Calendar,
  TrendingUp,
  Clock,
  Target,
  Award,
  Settings,
  LogOut,
  Download,
  Star,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockSessionHistory, mockProgressData } from '../mock';

const Profile = () => {
  const { user, logout } = useAuth();
  const recentScores = mockProgressData.slice(-7);
  const averageScore = Math.round(recentScores.reduce((acc, day) => acc + day.score, 0) / recentScores.length);
  const totalSessions = mockSessionHistory.length;

  const achievements = [
    { name: 'First Steps', description: 'Complete your first session', earned: true, icon: '🩰' },
    { name: 'Consistency', description: '7-day practice streak', earned: true, icon: '🔥' },
    { name: 'Excellence', description: 'Score 90+ in any exercise', earned: true, icon: '⭐' },
    { name: 'Dedication', description: 'Complete 50 sessions', earned: false, icon: '🏆' },
    { name: 'Perfectionist', description: 'Score 95+ three times', earned: false, icon: '💎' },
    { name: 'Master', description: 'Complete all exercises', earned: false, icon: '👑' }
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Profile</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-600 hover:text-slate-800 p-2"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* User Info */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="w-16 h-16 ring-2 ring-purple-200">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-rose-100 to-purple-100 text-purple-700 text-lg font-bold">
                  {user?.name?.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
                <p className="text-slate-600 text-sm">{user?.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className="bg-gradient-to-r from-rose-100 to-purple-100 text-purple-700 text-xs">
                    {user?.level}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-slate-200 text-slate-600">
                    {user?.experience}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg">
                <div className="text-lg font-bold text-slate-800">{totalSessions}</div>
                <div className="text-xs text-slate-600">Sessions</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
                <div className="text-lg font-bold text-slate-800">{user?.bestScore}</div>
                <div className="text-xs text-slate-600">Best Score</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg">
                <div className="text-lg font-bold text-slate-800">{user?.streakDays}</div>
                <div className="text-xs text-slate-600">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="px-6 mb-6">
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-slate-800">
              <BarChart3 className="w-5 h-5 mr-2" />
              Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Weekly Average</span>
                <span className="text-sm font-semibold text-slate-800">{averageScore}/100</span>
              </div>
              <Progress value={averageScore} className="h-3" />
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Target className="w-4 h-4 text-blue-600 mr-1" />
                  </div>
                  <div className="text-sm font-bold text-slate-800">{user?.averageScore}/100</div>
                  <div className="text-xs text-slate-600">All-time Avg</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Trophy className="w-4 h-4 text-amber-600 mr-1" />
                  </div>
                  <div className="text-sm font-bold text-slate-800">#{Math.floor(Math.random() * 10) + 1}</div>
                  <div className="text-xs text-slate-600">Leaderboard</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <div className="px-6 mb-6">
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-slate-800">
              <Award className="w-5 h-5 mr-2" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {achievements.slice(0, 4).map((achievement, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    achievement.earned 
                      ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50' 
                      : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-2xl mb-2 ${achievement.earned ? '' : 'grayscale'}`}>
                      {achievement.icon}
                    </div>
                    <h3 className={`font-semibold text-xs mb-1 ${
                      achievement.earned ? 'text-emerald-800' : 'text-slate-600'
                    }`}>
                      {achievement.name}
                    </h3>
                    {achievement.earned && (
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                        Earned
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-3 text-slate-600 hover:text-slate-800">
              View All Achievements <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="px-6 mb-6">
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-slate-800">
              <Clock className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockSessionHistory.slice(0, 3).map((session, index) => (
                <div key={session.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-rose-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{session.exercise}</div>
                      <div className="text-xs text-slate-500">{session.date}</div>
                    </div>
                  </div>
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings & Actions */}
      <div className="px-6 pb-24 space-y-3">
        <Button 
          variant="outline" 
          className="w-full h-12 border-purple-200 text-purple-700 hover:bg-purple-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Progress Report
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full h-12 border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <Settings className="w-4 h-4 mr-2" />
          Account Settings
        </Button>

        <Button 
          onClick={handleLogout}
          variant="outline" 
          className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Profile;