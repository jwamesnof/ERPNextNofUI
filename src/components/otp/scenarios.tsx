'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, BarChart2, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScenarioRun {
  id: string;
  name: string;
  timestamp: string;
  customer: string;
  items: string;
  warehouse: string;
  desiredDate?: string;
  deliveryMode: string;
  promiseDate: string;
  confidence: string;
  onTime?: boolean;
}

export function Scenarios() {
  const [scenarios, setScenarios] = useState<ScenarioRun[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [showNewScenarioDialog, setShowNewScenarioDialog] = useState(false);

  // Load scenarios from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('otp_scenarios');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ScenarioRun[];
        setScenarios(parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } catch (e) {
        console.error('Failed to parse scenarios:', e);
      }
    }
  }, []);

  const handleDeleteScenario = (id: string) => {
    const updated = scenarios.filter((s) => s.id !== id);
    setScenarios(updated);
    localStorage.setItem('otp_scenarios', JSON.stringify(updated));
    setSelectedScenarios(selectedScenarios.filter((sid) => sid !== id));
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all scenarios?')) {
      setScenarios([]);
      setSelectedScenarios([]);
      localStorage.removeItem('otp_scenarios');
    }
  };

  const handleSelectScenario = (id: string) => {
    if (selectedScenarios.includes(id)) {
      setSelectedScenarios(selectedScenarios.filter((sid) => sid !== id));
    } else {
      if (selectedScenarios.length < 4) {
        setSelectedScenarios([...selectedScenarios, id]);
      }
    }
  };

  const handleSaveCurrentScenario = () => {
    if (!newScenarioName.trim()) return;

    const auditHistory = localStorage.getItem('otp_audit_history');
    if (!auditHistory) {
      alert('No evaluation history found. Run a promise evaluation first.');
      return;
    }

    try {
      const history = JSON.parse(auditHistory);
      if (history.length === 0) {
        alert('No evaluation history found. Run a promise evaluation first.');
        return;
      }

      const latestRun = history[history.length - 1];
      const newScenario: ScenarioRun = {
        id: `scenario_${Date.now()}`,
        name: newScenarioName,
        timestamp: new Date().toISOString(),
        customer: latestRun.customer,
        items: `${latestRun.itemCount} items`,
        warehouse: latestRun.request.items?.[0]?.warehouse || 'Stores - SD',
        desiredDate: latestRun.request.desired_delivery_date,
        deliveryMode: latestRun.request.delivery_mode || 'LATEST_ACCEPTABLE',
        promiseDate: latestRun.promiseDate,
        confidence: latestRun.confidence,
        onTime: latestRun.onTime,
      };

      const updated = [newScenario, ...scenarios];
      setScenarios(updated);
      localStorage.setItem('otp_scenarios', JSON.stringify(updated));
      setNewScenarioName('');
      setShowNewScenarioDialog(false);
    } catch (e) {
      alert('Error saving scenario');
      console.error(e);
    }
  };

  const comparedScenarios = scenarios.filter((s) => selectedScenarios.includes(s.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Scenarios (What-if)</h1>
          <p className="text-sm text-slate-600 mt-1">Save and compare different order scenarios</p>
        </div>
        <div className="flex gap-2">
          {scenarios.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
          <button
            onClick={() => setShowNewScenarioDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Save Current
          </button>
        </div>
      </div>

      {/* Save Scenario Dialog */}
      {showNewScenarioDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Save Current Scenario</h2>
              <button
                onClick={() => setShowNewScenarioDialog(false)}
                className="p-1 hover:bg-slate-100 rounded transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <input
              type="text"
              placeholder="e.g., Large Order, SD Warehouse"
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowNewScenarioDialog(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCurrentScenario}
                disabled={!newScenarioName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenarios List */}
      {scenarios.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="text-slate-400 mb-4">
            <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          </div>
          <p className="text-slate-600 font-medium">No scenarios saved yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Run a promise evaluation and click "Save Current" to create a scenario for comparison
          </p>
        </div>
      ) : (
        <>
          {/* Selection Info */}
          {selectedScenarios.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between"
            >
              <p className="text-sm font-medium text-blue-800">
                {selectedScenarios.length} scenario{selectedScenarios.length !== 1 ? 's' : ''} selected (max 4)
              </p>
              <button
                onClick={() => setShowComparison(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm"
              >
                Compare
              </button>
            </motion.div>
          )}

          {/* Scenarios Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((scenario) => (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`border-2 rounded-lg p-5 cursor-pointer transition ${
                  selectedScenarios.includes(scenario.id)
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                onClick={() => handleSelectScenario(scenario.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{scenario.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {format(new Date(scenario.timestamp), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteScenario(scenario.id);
                    }}
                    className="p-1.5 hover:bg-red-100 rounded transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div>
                    <p className="text-xs text-slate-500">Customer</p>
                    <p className="font-medium text-slate-900">{scenario.customer}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-slate-500">Items</p>
                      <p className="font-medium text-slate-900">{scenario.items}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Warehouse</p>
                      <p className="font-medium text-slate-900 truncate">{scenario.warehouse}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Promise Date</p>
                    <p className="font-bold text-lg text-blue-600">
                      {format(new Date(scenario.promiseDate), 'MMM dd')}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Confidence</p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        scenario.confidence === 'HIGH'
                          ? 'bg-green-100 text-green-800'
                          : scenario.confidence === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {scenario.confidence}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Comparison View */}
      {showComparison && comparedScenarios.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-auto shadow-2xl"
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Scenario Comparison</h2>
              <button
                onClick={() => setShowComparison(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 sticky left-0 bg-slate-50">
                      Attribute
                    </th>
                    {comparedScenarios.map((s) => (
                      <th key={s.id} className="px-4 py-3 text-left font-semibold text-slate-900">
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white">
                      Timestamp
                    </td>
                    {comparedScenarios.map((s) => (
                      <td key={s.id} className="px-4 py-3 text-slate-600">
                        {format(new Date(s.timestamp), 'MMM dd, yyyy')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white">
                      Customer
                    </td>
                    {comparedScenarios.map((s) => (
                      <td key={s.id} className="px-4 py-3 text-slate-600">
                        {s.customer}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white">
                      Items
                    </td>
                    {comparedScenarios.map((s) => (
                      <td key={s.id} className="px-4 py-3 text-slate-600">
                        {s.items}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white">
                      Warehouse
                    </td>
                    {comparedScenarios.map((s) => (
                      <td key={s.id} className="px-4 py-3 text-slate-600">
                        {s.warehouse}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white">
                      Delivery Mode
                    </td>
                    {comparedScenarios.map((s) => (
                      <td key={s.id} className="px-4 py-3 text-slate-600">
                        {s.deliveryMode}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-blue-50">
                      Promise Date
                    </td>
                    {comparedScenarios.map((s) => (
                      <td key={s.id} className="px-4 py-3 font-bold text-blue-600">
                        {format(new Date(s.promiseDate), 'MMM dd')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white">
                      Confidence
                    </td>
                    {comparedScenarios.map((s) => (
                      <td key={s.id} className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            s.confidence === 'HIGH'
                              ? 'bg-green-100 text-green-800'
                              : s.confidence === 'MEDIUM'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {s.confidence}
                        </span>
                      </td>
                    ))}
                  </tr>
                  {comparedScenarios[0].onTime !== undefined && (
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white">
                        Status
                      </td>
                      {comparedScenarios.map((s) => (
                        <td key={s.id} className="px-4 py-3">
                          {s.onTime === null ? (
                            <span className="text-slate-600">N/A</span>
                          ) : (
                            <span
                              className={`font-semibold ${s.onTime ? 'text-green-700' : 'text-red-700'}`}
                            >
                              {s.onTime ? '✓ On Time' : '⚠ Late'}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
