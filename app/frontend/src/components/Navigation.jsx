import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Camera, 
  User,
  BarChart3
} from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/exercises', icon: Camera, label: 'Practice' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-slate-200">
      <div className="max-w-md mx-auto px-6">
        <div className="flex items-center justify-around h-20">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link key={path} to={path} className="flex-1">
              <div className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive(path) 
                  ? 'bg-gradient-to-br from-rose-500 to-purple-600 text-white shadow-lg' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}>
                <Icon className={`w-5 h-5 mb-1 ${isActive(path) ? 'text-white' : 'text-slate-600'}`} />
                <span className={`text-xs font-medium ${isActive(path) ? 'text-white' : 'text-slate-600'}`}>
                  {label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;