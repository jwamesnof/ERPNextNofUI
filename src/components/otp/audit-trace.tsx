'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ChevronRight, Calendar, Filter, Download, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditRecord {
  id: string;
  timestamp: string;
  customer: string;
  itemCount: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  promiseDate: string;
  onTime: boolean | null;
  request: Record<string, any>;
  response: Record<string, any>;
}

export function AuditTrace() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AuditRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  // Filters
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(''); // 'on-time', 'late', 'all'

  // Load audit records from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('otp_audit_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuditRecord[];
        setRecords(parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } catch (e) {
        console.error('Failed to parse audit history:', e);
      }
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...records];

    // Date range filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.timestamp);
        if (dateFrom && dateTo) {
          const from = startOfDay(new Date(dateFrom));
          const to = endOfDay(new Date(dateTo));
          return isWithinInterval(recordDate, { start: from, end: to });
        }
        if (dateFrom) {
          return recordDate >= new Date(dateFrom);
        }
        if (dateTo) {
          return recordDate <= endOfDay(new Date(dateTo));
        }
        return true;
      });
    }

    // Confidence filter
    if (confidenceFilter) {
      filtered = filtered.filter((record) => record.confidence === confidenceFilter);
    }

    // Status filter (on-time vs late)
    if (statusFilter === 'on-time') {
      filtered = filtered.filter((record) => record.onTime === true);
    } else if (statusFilter === 'late') {
      filtered = filtered.filter((record) => record.onTime === false);
    }

    setFilteredRecords(filtered);
  }, [records, dateFrom, dateTo, confidenceFilter, statusFilter]);

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setConfidenceFilter('');
    setStatusFilter('');
  };

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    localStorage.setItem('otp_audit_history', JSON.stringify(updated));
    if (selectedRecord?.id === id) {
      setShowDrawer(false);
      setSelectedRecord(null);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all audit records?')) {
      setRecords([]);
      setFilteredRecords([]);
      localStorage.removeItem('otp_audit_history');
      setShowDrawer(false);
      setSelectedRecord(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('No records to export');
      return;
    }

    const headers = ['Timestamp', 'Customer', 'Items', 'Confidence', 'Promise Date', 'Status'];
    const rows = filteredRecords.map((r) => [
      format(parseISO(r.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      r.customer,
      r.itemCount,
      r.confidence,
      r.promiseDate,
      r.onTime === null ? 'N/A' : r.onTime ? 'On Time' : 'Late',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `otp_audit_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`);
    link.click();
  };

  const getConfidenceBadgeColor = (confidence: string) => {
    switch (confidence) {
      case 'HIGH':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (onTime: boolean | null) => {
    if (onTime === null) return 'bg-gray-100 text-gray-800';
    return onTime ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Audit & Trace</h1>
          <p className="text-sm text-slate-600 mt-1">View evaluation history and request/response details</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          {records.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h2 className="font-semibold text-slate-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Confidence Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Confidence</label>
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="on-time">On Time</option>
              <option value="late">Late</option>
            </select>
          </div>
        </div>

        {(dateFrom || dateTo || confidenceFilter || statusFilter) && (
          <button
            onClick={handleClearFilters}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Records List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-slate-400 mb-2">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            </div>
            <p className="text-slate-600 font-medium">No evaluation records found</p>
            <p className="text-slate-500 text-sm mt-1">
              {records.length === 0
                ? 'Run promise evaluations to see them appear here'
                : 'No records match your current filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Promise Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.map((record) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50 transition"
                  >
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {format(parseISO(record.timestamp), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{record.customer}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{record.itemCount}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceBadgeColor(record.confidence)}`}>
                        {record.confidence}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {format(parseISO(record.promiseDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(record.onTime)}`}>
                        {record.onTime === null ? 'N/A' : record.onTime ? 'On Time' : 'Late'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setShowDrawer(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition"
                        >
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination info */}
        {filteredRecords.length > 0 && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
            Showing {filteredRecords.length} of {records.length} records
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {showDrawer && selectedRecord && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white z-50 shadow-2xl overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Evaluation Details</h2>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase font-semibold text-slate-500 mb-1">Timestamp</p>
                    <p className="text-sm font-medium text-slate-900">
                      {format(parseISO(selectedRecord.timestamp), 'PPP p')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-semibold text-slate-500 mb-1">Customer</p>
                    <p className="text-sm font-medium text-slate-900">{selectedRecord.customer}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-semibold text-slate-500 mb-1">Items</p>
                    <p className="text-sm font-medium text-slate-900">{selectedRecord.itemCount}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-semibold text-slate-500 mb-1">Confidence</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceBadgeColor(selectedRecord.confidence)}`}>
                      {selectedRecord.confidence}
                    </span>
                  </div>
                </div>

                {/* Request & Response Tabs */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Request Payload</h3>
                  <pre className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs overflow-x-auto text-slate-600">
                    {JSON.stringify(selectedRecord.request, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Response Payload</h3>
                  <pre className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs overflow-x-auto text-slate-600">
                    {JSON.stringify(selectedRecord.response, null, 2)}
                  </pre>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedRecord.request, null, 2));
                      alert('Request copied to clipboard');
                    }}
                    className="flex-1 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition font-medium text-sm"
                  >
                    Copy Request
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedRecord.response, null, 2));
                      alert('Response copied to clipboard');
                    }}
                    className="flex-1 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition font-medium text-sm"
                  >
                    Copy Response
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteRecord(selectedRecord.id);
                    }}
                    className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition font-medium text-sm"
                  >
                    Delete Record
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
