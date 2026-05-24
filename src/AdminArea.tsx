import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/useAuth';
import { LoginPage } from './LoginPage';
import { AdminDashboard } from './AdminDashboard';

// Admin Area Component - handles admin routing
export const AdminArea: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-600/30 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => window.location.reload()} />;
  }

  // Show admin dashboard if authenticated
  if (isAuthenticated && user) {
    return <AdminDashboard userName={user.full_name} onLogout={() => window.location.reload()} />;
  }

  return null;
};
