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
import * as Tabs from '@radix-ui/react-tabs';

const Login = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, loading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || (activeTab === 'register' && !fullName)) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (activeTab === 'register') {
      if (password !== confirmPassword) {
        toast({
          title: 'Passwords do not match',
          description: 'Please make sure your passwords match',
          variant: 'destructive',
        });
        return;
      }

      const result = await register({ name: fullName, email, password });
      if (!result.success) {
        toast({
          title: 'Sign Up Failed',
          description: result.error || 'Unable to create account',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Account created!',
          description: 'You are now logged in',
        });
      }
      return;
    }

    const result = await login(email, password);

    if (!result.success) {
      toast({
        title: 'Login Failed',
        description: result.error || 'Invalid credentials',
        variant: 'destructive',
      });
    } else {
      toast({
        title: result.demo ? 'Demo Mode' : 'Welcome back!',
        description: result.demo
          ? 'You are logged in with demo credentials'
          : 'Successfully logged in',
      });
    }
  };

  const handleDemoLogin = () => {
    setActiveTab('login');
    setEmail('admin@ballet.com');
    setPassword('admin');
    setConfirmPassword('admin');
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
            <CardTitle className="text-xl text-slate-800">
              {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              {activeTab === 'login'
                ? 'Sign in to continue your ballet journey'
                : 'Join PosturePal to track your progress'}
            </p>
          </CardHeader>
          <CardContent>
            <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <Tabs.List className="grid grid-cols-2 gap-2 bg-slate-100 rounded-lg p-1">
                <Tabs.Trigger
                  value="login"
                  className={`py-2 text-sm font-medium rounded-md transition ${
                    activeTab === 'login'
                      ? 'bg-white shadow text-purple-600'
                      : 'text-slate-500 hover:text-slate-600'
                  }`}
                >
                  Sign In
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="register"
                  className={`py-2 text-sm font-medium rounded-md transition ${
                    activeTab === 'register'
                      ? 'bg-white shadow text-purple-600'
                      : 'text-slate-500 hover:text-slate-600'
                  }`}
                >
                  Sign Up
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="login">
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
              </Tabs.Content>

              <Tabs.Content value="register">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-12 border-slate-200 focus:border-purple-300 focus:ring-purple-200"
                      placeholder="Enter your full name"
                    />
                  </div>

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
                        placeholder="Create a password"
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

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-slate-700 font-medium">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 border-slate-200 focus:border-purple-300 focus:ring-purple-200"
                      placeholder="Confirm your password"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating account...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </Tabs.Content>
            </Tabs.Root>

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
                {activeTab === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Sign in
                    </button>
                  </>
                )}
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
