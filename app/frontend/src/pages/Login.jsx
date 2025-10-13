import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  Sparkles
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const result = await login(email, password);
    
    if (!result.success) {
      toast({
        title: "Login Failed",
        description: result.error || "Invalid credentials",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "Successfully logged in",
      });
    }
  };

  const handleDemoLogin = () => {
    setEmail('admin@ballet.com');
    setPassword('admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-rose-100 via-purple-50 to-indigo-100">
      {/* Ballet-themed background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-rose-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-20 w-60 h-60 bg-gradient-to-br from-purple-200/30 to-indigo-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 left-1/3 w-50 h-50 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-purple-600 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent mb-2">
            PosturePal
          </h1>
          <p className="text-slate-600 text-sm">
            Perfect your technique 
          </p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl text-slate-800">Welcome Back</CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Sign in to continue your ballet journey
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-slate-200 focus:border-purple-300 focus:ring-purple-200"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-slate-200 focus:border-purple-300 focus:ring-purple-200"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-gradient-to-r from-rose-50 to-purple-50 rounded-lg border border-purple-100">
              <p className="text-xs text-slate-600 mb-3 text-center">Demo Credentials:</p>
              <div className="text-xs text-slate-700 space-y-1 mb-3">
                <p><strong>Email:</strong> admin@ballet.com</p>
                <p><strong>Password:</strong> admin</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDemoLogin}
                className="w-full text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                Use Demo Credentials
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                Don't have an account?{' '}
                <button className="text-purple-600 hover:text-purple-700 font-medium">
                  Sign up
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ballet-themed footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-500">
            🩰 Elevate your ballet technique with precision
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;