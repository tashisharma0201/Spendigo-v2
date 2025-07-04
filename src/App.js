import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import AddExpense from './pages/AddExpense';
import Dashboard from './pages/Dashboard';
import Authentication from './pages/Authentication';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navigation />
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/auth" element={<Authentication />} />
                
                {/* Protected Routes */}
                <Route path="/add-expense" element={
                  <ProtectedRoute>
                    <AddExpense />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                {/* Default redirect - authenticated users go to add-expense */}
                <Route path="/" element={<Navigate to="/add-expense" replace />} />
                
                {/* 404 route - redirect to auth for unauthenticated, add-expense for authenticated */}
                <Route path="*" element={<Navigate to="/auth" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
