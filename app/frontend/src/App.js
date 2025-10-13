import React, { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider, { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ExerciseSelection from "./pages/ExerciseSelection";
import CameraEvaluation from "./pages/CameraEvaluation";
import SessionResult from "./pages/SessionResult";
import Profile from "./pages/Profile";
import Navigation from "./components/Navigation";
import { Toaster } from "./components/ui/toaster";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Main App Routes
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} 
        />
        <Route path="/" element={
          <ProtectedRoute>
            <div className="pb-20">
              <Dashboard />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/exercises" element={
          <ProtectedRoute>
            <div className="pb-20">
              <ExerciseSelection />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/camera/:exerciseId" element={
          <ProtectedRoute>
            <CameraEvaluation />
          </ProtectedRoute>
        } />
        <Route path="/result/:sessionId" element={
          <ProtectedRoute>
            <div className="pb-20">
              <SessionResult />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <div className="pb-20">
              <Profile />
            </div>
          </ProtectedRoute>
        } />
      </Routes>
      
      {isAuthenticated && <Navigation />}
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;