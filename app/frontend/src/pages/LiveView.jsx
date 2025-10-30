import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { 
  Play,
  Pause, 
  Square,
  RotateCcw,
  Camera,
  Timer,
  Target,
  Zap,
  Settings,
  AlertCircle
} from 'lucide-react';
const INITIAL_SESSION_STATE = {
  isActive: false,
  isRecording: false,
  currentPosition: 'Standby',
};

const LiveView = () => {
  const [session, setSession] = useState(INITIAL_SESSION_STATE);
  const [sessionTimer, setSessionTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (session.isActive) {
      interval = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session.isActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSession = () => {
    setSession(prev => ({
      ...prev,
      isActive: !prev.isActive,
      isRecording: !prev.isActive ? true : prev.isRecording
    }));
  };

  const stopSession = () => {
    setSession(prev => ({
      ...prev,
      isActive: false,
      isRecording: false
    }));
    setSessionTimer(0);
  };

  const mockCameraAngle = Math.floor((sessionTimer * 2) % 180);
  const mockCurrentScore = session.isActive ? Math.floor(Math.random() * 20) + 75 : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Live Practice Session</h1>
        <p className="text-slate-600">
          Real-time posture analysis and feedback for your ballet practice
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main View */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Camera className="w-5 h-5 mr-2 text-slate-700" />
                  Camera View
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {session.isRecording && (
                    <Badge className="bg-red-100 text-red-700 animate-pulse">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                      Recording
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-slate-600">
                    {mockCameraAngle}° angle
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                  {session.isActive ? (
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                        <Camera className="w-10 h-10 text-white" />
                      </div>
                      <p className="text-slate-600 font-medium">
                        Analyzing posture: {session.currentPosition}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Camera moving to angle {mockCameraAngle}°
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-20 h-20 bg-slate-300 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Camera className="w-10 h-10 text-slate-500" />
                      </div>
                      <p className="text-slate-500 font-medium">Camera ready</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Start session to begin analysis
                      </p>
                    </div>
                  )}
                </div>

                {/* Overlay Controls */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                    <Button
                      onClick={toggleSession}
                      size="sm"
                      className={`${
                        session.isActive 
                          ? 'bg-amber-500 hover:bg-amber-600' 
                          : 'bg-emerald-500 hover:bg-emerald-600'
                      } text-white`}
                    >
                      {session.isActive ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      onClick={stopSession}
                      size="sm"
                      variant="destructive"
                      disabled={!session.isActive && sessionTimer === 0}
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <div className="space-y-6">
          {/* Session Info */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Timer className="w-5 h-5 mr-2 text-slate-700" />
                Session Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-800 mb-1">
                  {formatTime(sessionTimer)}
                </div>
                <p className="text-sm text-slate-500">Session Duration</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Current Position</span>
                  <Badge variant="outline" className="text-slate-700">
                    {session.currentPosition}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Camera Angle</span>
                  <span className="text-sm font-medium text-slate-800">
                    {mockCameraAngle}°
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Status</span>
                  <Badge 
                    className={`${
                      session.isActive 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {session.isActive ? 'Active' : 'Stopped'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Score */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-slate-700" />
                Current Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-slate-800 mb-2">
                  {session.isActive ? mockCurrentScore : '--'}/100
                </div>
                <Progress 
                  value={session.isActive ? mockCurrentScore : 0} 
                  className="h-3 mb-3"
                />
                <p className="text-sm text-slate-500">
                  {session.isActive ? 'Live posture analysis' : 'Start session for scoring'}
                </p>
              </div>

              {session.isActive && (
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Zap className="w-4 h-4 mr-2 text-emerald-500" />
                    <span className="text-slate-600">Good alignment detected</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                    <span className="text-slate-600">Minor hip adjustment needed</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-indigo-800">Live Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-indigo-700">Keep your shoulders aligned over your hips</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-indigo-700">Engage your core for better stability</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-indigo-700">Focus on lengthening through the crown of your head</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveView;
