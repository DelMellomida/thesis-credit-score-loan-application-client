"use client";
import React, { useState } from 'react';
import { User, LogOut, ClipboardList, FileText, BarChart } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  currentView: 'loan-process' | 'applicants-list' | 'applicant-overview';
  onToggleView: () => void;
}

export function Header({ currentView, onToggleView }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isOnDashboard = pathname?.startsWith('/dashboard');
  
  // Show current time in Philippine Time (PHT) / Asia/Manila
  const [currentDateTime, setCurrentDateTime] = useState(() => {
    return new Date().toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  });

  // Update the displayed time every 30 seconds to keep it current
  React.useEffect(() => {
    const t = setInterval(() => {
      setCurrentDateTime(new Date().toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }));
    }, 30_000);

    return () => clearInterval(t);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const handleToggleView = () => {
    onToggleView();
    setIsOpen(false);
  };

  const isOnLoanProcess = currentView === 'loan-process';
  const buttonText = isOnLoanProcess ? 'Applicants List' : 'Loan Process';
  const ButtonIcon = isOnLoanProcess ? ClipboardList : FileText;

  return (
    <header className="bg-red-600 text-white px-6 py-4 shadow-lg">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center">
          <h1 className="text-xl font-medium">Best Loan</h1>
        </div>
        
        <div className="flex items-center">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-red-700 p-2 cursor-pointer"
              >
                <User className="h-6 w-6" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 mr-6" align="end">
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Current Time</p>
                  <p>{currentDateTime}</p>
                </div>
                <hr />
                <Button
                  onClick={handleToggleView}
                  variant="outline"
                  className="w-full flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50 cursor-pointer"
                >
                  <ButtonIcon className="h-4 w-4" />
                  {currentView === 'loan-process' ? 'View Applicants List' : 'New Application'}
                </Button>
                {!isOnDashboard ? (
                  <Button
                    onClick={() => { router.push('/dashboard'); setIsOpen(false); }}
                    variant="outline"
                    className="w-full flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50 cursor-pointer"
                  >
                    <BarChart className="h-4 w-4" />
                    Dashboard
                  </Button>
                ) : (
                  <Button
                    onClick={() => { router.push('/'); setIsOpen(false); }}
                    variant="outline"
                    className="w-full flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50 cursor-pointer"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Applicants List
                  </Button>
                )}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}