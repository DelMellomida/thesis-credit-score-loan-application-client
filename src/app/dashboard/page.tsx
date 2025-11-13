"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { useRouter } from 'next/navigation';

const Dashboard = dynamic(() => import('@/components/dashboard/Dashboard'), { ssr: false });

export default function DashboardPage() {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-500">{String(error)}</div>;
  if (!user) return <LoginForm />;

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <Header
        currentView={'applicants-list'}
        onToggleView={() => {
          // Navigate to the main app and request the loan-process view
          router.push('/?view=loan-process');
        }}
      />

      <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-80px)] overflow-auto">
        <Dashboard />
      </div>
    </div>
  );
}
