'use client';

import React, { useState, useEffect } from 'react';
import { PromiseCalculator } from '@/components/otp/promise-calculator';
import { Scenarios } from '@/components/otp/scenarios';
import { AuditTrace } from '@/components/otp/audit-trace';
import { Settings } from '@/components/otp/settings';
import { Calculator, BarChart3, History, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { otpApiClient } from '@/lib/api/otp-client';

type Page = 'calculator' | 'scenarios' | 'audit' | 'settings';

const NAVIGATION = [
  { id: 'calculator' as Page, label: 'Promise Calculator', icon: Calculator },
  { id: 'scenarios' as Page, label: 'Scenarios (What-if)', icon: BarChart3 },
  { id: 'audit' as Page, label: 'Audit & Trace', icon: History },
  { id: 'settings' as Page, label: 'Settings', icon: SettingsIcon },
];

export function OTPDashboard() {
  const [currentPage, setCurrentPage] = useState<Page>('calculator');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(true);
  const [apiStatus, setApiStatus] = useState<'healthy' | 'offline' | 'checking'>('checking');
  const [lastSync, setLastSync] = useState<string>('—');

  useEffect(() => {
    const handleResize = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      setIsDesktop(isLargeScreen);
      if (!isLargeScreen) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await otpApiClient.checkHealth();
        setApiStatus('healthy');
        setLastSync(new Date().toLocaleTimeString());
      } catch {
        setApiStatus('offline');
        setLastSync(new Date().toLocaleTimeString());
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const getCurrentPageLabel = () => {
    const page = NAVIGATION.find((nav) => nav.id === currentPage);
    return page?.label || 'OTP Dashboard';
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Mobile Backdrop */}
            {!isDesktop && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              />
            )}

            {/* Sidebar */}
            <motion.div
              initial={!isDesktop ? { x: -256 } : undefined}
              animate={{ x: 0 }}
              exit={!isDesktop ? { x: -256 } : undefined}
              transition={{ type: 'spring', damping: 20 }}
              className="w-64 bg-white border-r border-slate-200 flex flex-col z-40 fixed lg:static h-screen"
            >
              {/* Logo/Header */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-lg font-bold text-slate-900">OTP</h1>
                </div>
                <p className="text-xs text-slate-500">Order Promise Engine</p>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {NAVIGATION.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentPage(item.id);
                        if (!isDesktop) setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-500 text-center">
                  v1.0 • Backend{' '}
                  <span className="text-green-600 font-medium">●</span>
                </p>
              </div>

              {/* Close Button (Mobile) */}
              {!isDesktop && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-slate-100 rounded-lg transition lg:hidden"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
            )}
            <h2 className="text-xl font-semibold text-slate-900">
              {getCurrentPageLabel()}
            </h2>
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${
              apiStatus === 'healthy'
                ? 'bg-green-50 border-green-200 text-green-700'
                : apiStatus === 'offline'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                apiStatus === 'healthy'
                  ? 'bg-green-600'
                  : apiStatus === 'offline'
                    ? 'bg-red-600'
                    : 'bg-slate-400'
              }`}
            />
            <span>
              {apiStatus === 'healthy'
                ? `API: ${otpApiClient.getBaseUrl().replace('http://', '')}`
                : apiStatus === 'offline'
                  ? 'Backend Offline'
                  : 'Checking...'}
            </span>
            <span className="text-[10px] opacity-70">Last sync: {lastSync}</span>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-6 max-w-7xl"
          >
            {currentPage === 'calculator' && <PromiseCalculator />}
            {currentPage === 'scenarios' && <Scenarios />}
            {currentPage === 'audit' && <AuditTrace />}
            {currentPage === 'settings' && <Settings />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
