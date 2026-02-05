'use client';

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { WEEKEND_DAYS, getWeekendLabel, getWorkweekLabel } from '@/lib/weekend';

interface SettingsState {
  apiBaseUrl: string;
  mockMode: boolean;
  weekStart: number; // 0 = Sunday
  weekEnd: number; // 4 = Thursday (Israel workweek ends on Thursday)
  cutoffTime: string; // "14:00"
  cutoffTimezone: string; // "UTC"
  defaultWarehouse: string;
  bufferDays: number;
}

export function Settings() {
  const [settings, setSettings] = useState<SettingsState>({
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8001',
    mockMode: process.env.NEXT_PUBLIC_MOCK_MODE === 'true',
    weekStart: 0, // Sunday
    weekEnd: 4,   // Thursday (Israel workweek)
    cutoffTime: '14:00',
    cutoffTimezone: 'UTC',
    defaultWarehouse: 'Stores - SD',
    bufferDays: 1,
  });

  const [isMockModeEnabled, setIsMockModeEnabled] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('otp_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<SettingsState>;
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }

    // Check if mock mode env var exists
    setIsMockModeEnabled(typeof process.env.NEXT_PUBLIC_MOCK_MODE !== 'undefined');
  }, []);

  const handleSave = () => {
    localStorage.setItem('otp_settings', JSON.stringify(settings));
    setSavedMessage('Settings saved successfully!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getWorkdayLabel = () => {
    return getWorkweekLabel();
  };

  const getWeekendLabelDisplay = () => {
    return getWeekendLabel();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-600 mt-1">Configure API, week schedule, and system defaults</p>
        </div>
      </div>

      {/* Saved Message */}
      {savedMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">{savedMessage}</p>
        </motion.div>
      )}

      {/* API Configuration Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <SettingsIcon className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">API Configuration</h2>
        </div>

        <div className="space-y-4">
          {/* API Base URL (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">API Base URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings.apiBaseUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-600 text-sm"
              />
              <button
                onClick={() => handleCopy(settings.apiBaseUrl, 'apiUrl')}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <Copy className={`w-4 h-4 transition ${copiedField === 'apiUrl' ? 'text-green-600' : 'text-slate-400'}`} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Backend is running at this URL. Change via environment variables.</p>
          </div>

          {/* Mock Mode Toggle */}
          {isMockModeEnabled && (
            <div className="pt-4 border-t border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.mockMode}
                    onChange={(e) => setSettings((prev) => ({ ...prev, mockMode: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Enable Mock Mode</p>
                  <p className="text-xs text-slate-500">Use simulated data instead of backend API</p>
                </div>
              </label>
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Mock mode is only available in development. When enabled, the app will use simulated data instead of real backend responses.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Week Configuration Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Week Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Working Days */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Working Days</label>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-900">{getWorkdayLabel()}</p>
              <p className="text-xs text-slate-500 mt-2">Days included in promise date calculations</p>
            </div>

            <div className="mt-4 space-y-2">
              <div>
                <label className="text-xs font-medium text-slate-700">Week Start</label>
                <select
                  value={settings.weekStart}
                  onChange={(e) => setSettings((prev) => ({ ...prev, weekStart: parseInt(e.target.value) }))}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Week End</label>
                <select
                  value={settings.weekEnd}
                  onChange={(e) => setSettings((prev) => ({ ...prev, weekEnd: parseInt(e.target.value) }))}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                </select>
              </div>
            </div>
          </div>

          {/* Weekend Days */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Weekend Days</label>
            <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-900">{getWeekendLabelDisplay()}</p>
              <p className="text-xs text-slate-500 mt-2">Excluded from promise date calculations</p>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 font-medium">Default for most operations: Sunday–Thursday</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cutoff & Timezone Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Cutoff & Timezone</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cutoff Time */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Order Cutoff Time</label>
            <input
              type="time"
              value={settings.cutoffTime}
              onChange={(e) => setSettings((prev) => ({ ...prev, cutoffTime: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">Orders placed after this time are processed next day</p>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
            <select
              value={settings.cutoffTimezone}
              onChange={(e) => setSettings((prev) => ({ ...prev, cutoffTimezone: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Standard Time</option>
              <option value="CST">Central Standard Time</option>
              <option value="MST">Mountain Standard Time</option>
              <option value="PST">Pacific Standard Time</option>
              <option value="GMT">GMT</option>
              <option value="CET">Central European Time</option>
              <option value="IST">Indian Standard Time</option>
              <option value="SGT">Singapore Time</option>
              <option value="AEST">Australian Eastern Standard Time</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">Used for cutoff time interpretation</p>
          </div>
        </div>
      </div>

      {/* Default Values Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Defaults</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Default Warehouse */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Default Warehouse</label>
            <input
              type="text"
              value={settings.defaultWarehouse}
              onChange={(e) => setSettings((prev) => ({ ...prev, defaultWarehouse: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">Pre-filled warehouse for new items</p>
          </div>

          {/* Buffer Days */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Buffer Days</label>
            <input
              type="number"
              value={settings.bufferDays}
              onChange={(e) => setSettings((prev) => ({ ...prev, bufferDays: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={0}
              max={30}
            />
            <p className="text-xs text-slate-500 mt-1">Safety buffer added to promise calculations</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
