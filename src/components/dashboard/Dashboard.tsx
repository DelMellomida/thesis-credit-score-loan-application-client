"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getApplicantReport, exportApplicantReport } from '@/lib/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '../ui/card';

const STATUS_COLORS: Record<string, string> = {
  approved: '#22c55e',
  denied: '#ef4444',
  pending: '#f59e0b',
  cancelled: '#6b7280',
};

export default function Dashboard() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [groupBy, setGroupBy] = useState<'day'|'month'|'year'>('day');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const token = user?.token;

  useEffect(() => { fetchReport(); }, []);

  // Auto-refresh when filters or auth token change
  useEffect(() => {
    // Only fetch when token is present
    if (!token) return;
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, groupBy, token]);

  async function fetchReport() {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        setReport(null);
        setLoading(false);
        setError('Not authenticated — please log in');
        return;
      }
      const params = { start_date: startDate, end_date: endDate, group_by: groupBy };
      const data = await getApplicantReport(params as any, token);
      setReport(data);
    } catch (err: any) {
      console.error('Failed to fetch report', err);
      setReport(null);
      setError(err?.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  }

  async function onExportCsv() {
    try {
      if (!token) {
        alert('Please log in to export reports');
        return;
      }
      const params = { start_date: startDate, end_date: endDate, group_by: groupBy };
      const blob = await exportApplicantReport(params as any, token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applicants-${startDate}_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
      alert('Export failed');
    }
  }

  function onPrint() {
    if (!report) {
      alert('No data to print');
      return;
    }
    // Build a nicer print view similar to ResultPreview
    const html: string[] = [];
    html.push('<!doctype html><html><head><meta charset="utf-8"/><title>Applicants Report</title>');
    html.push('<meta name="viewport" content="width=device-width,initial-scale=1"/>');
    html.push('<style>body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#111} .header{display:flex;align-items:center;gap:16px;margin-bottom:16px} .logo{height:48px} h1{margin:0;font-size:20px} .muted{color:#6b7280} .totals{display:flex;gap:12px;margin:12px 0} .card{padding:12px;border-radius:6px;background:#f8fafc;border:1px solid #e6eef6} table{border-collapse:collapse;width:100%;margin-top:12px} th,td{border:1px solid #ddd;padding:8px;text-align:left} .by-status{margin-top:8px} .small{font-size:12px;color:#555} @media print{body{padding:8mm} .no-print{display:none}}</style>');
    html.push('</head><body>');
    html.push('<div class="header">');
    html.push('<div style="display:flex;align-items:center;justify-content:space-between;width:100%">');
    html.push('<div><h1>Applicants Report</h1><div class="muted small">Period: ' + startDate + ' — ' + endDate + ' (grouped by ' + groupBy + ')</div></div>');
    html.push('<div class="small" style="text-align:right">Best Loan Company</div>');
    html.push('</div></div>');

    html.push('<div class="totals">');
    html.push('<div class="card"><div class="small">Total</div><div style="font-size:20px;font-weight:600">' + (report.totals?.total ?? 0) + '</div></div>');
    html.push('<div class="card"><div class="small">Approved</div><div style="font-size:20px;color:#16a34a;font-weight:600">' + (report.totals?.by_status?.approved ?? 0) + '</div></div>');
    html.push('<div class="card"><div class="small">Denied</div><div style="font-size:20px;color:#ef4444;font-weight:600">' + (report.totals?.by_status?.denied ?? 0) + '</div></div>');
    html.push('<div class="card"><div class="small">Pending</div><div style="font-size:20px;color:#f59e0b;font-weight:600">' + (report.totals?.by_status?.pending ?? 0) + '</div></div>');
    html.push('</div>');

    html.push('<div class="by-status"><h3 style="margin:12px 0 6px 0">Time series</h3>');
    html.push('<table><thead><tr><th>Group</th><th>Count</th></tr></thead><tbody>');
    (report.raw || []).forEach((r: any) => {
      html.push('<tr><td>' + (r.group ?? '') + '</td><td>' + (r.count ?? 0) + '</td></tr>');
    });
    html.push('</tbody></table>');
    html.push('</div>');

    html.push('<div style="margin-top:18px;font-size:12px;color:#666">Generated on: ' + new Date().toLocaleString() + '</div>');
    html.push('</body></html>');

    // Use a blob URL to avoid about:blank and noopener restrictions
    try {
      const blob = new Blob([html.join('')], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const w = window.open(url, '_blank');
      if (!w) {
        window.URL.revokeObjectURL(url);
        alert('Unable to open print window — please allow popups.');
        return;
      }
      // Give the window a moment to load the blob then trigger print
      const handle = setTimeout(() => {
        try {
          w.focus();
          w.print();
        } catch (e) {
          console.error('Print failed', e);
          alert('Print failed — please try saving or allowing popups.');
        } finally {
          try { window.URL.revokeObjectURL(url); } catch (e) {}
        }
      }, 600);
      // As a safety, clear the timeout when the window is closed
      const interval = setInterval(() => {
        if (w.closed) {
          clearInterval(interval);
          clearTimeout(handle);
          try { window.URL.revokeObjectURL(url); } catch (e) {}
        }
      }, 500);
    } catch (err) {
      console.error('Failed to open print window via blob', err);
      alert('Unable to open print window — please allow popups.');
    }
  }

  const timeseries = useMemo(() => {
    if (!report?.labels || !report?.series) return [];
    return report.labels.map((label: string, idx: number) => ({
      name: label,
      count: report.series[idx] ?? 0,
    }));
  }, [report]);

  const statusData = useMemo(() => {
    const by = report?.totals?.by_status || {};
    return Object.keys(by).map(k => ({ name: k, value: by[k] }));
  }, [report]);

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-b from-gray-50 to-white">
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Applicants Dashboard</h1>
          <p className="text-gray-500">Track and analyze loan applications in real-time</p>
        </div>

        {/* KPI cards - Enhanced styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Total Applicants</p>
              <p className="text-4xl font-bold text-blue-900">{report?.totals?.total ?? 0}</p>
              <p className="text-xs text-blue-600 mt-3">All time submissions</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider mb-2">Pending</p>
              <p className="text-4xl font-bold text-yellow-900">{report?.totals?.by_status?.pending ?? 0}</p>
              <p className="text-xs text-yellow-600 mt-3">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Approved</p>
              <p className="text-4xl font-bold text-green-900">{report?.totals?.by_status?.approved ?? 0}</p>
              <p className="text-xs text-green-600 mt-3">Successfully approved</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Denied</p>
              <p className="text-4xl font-bold text-red-900">{report?.totals?.by_status?.denied ?? 0}</p>
              <p className="text-xs text-red-600 mt-3">Not approved</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Cancelled</p>
              <p className="text-4xl font-bold text-gray-900">{report?.totals?.by_status?.cancelled ?? 0}</p>
              <p className="text-xs text-gray-600 mt-3">Withdrawn/Cancelled</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Report Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input 
                className="px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition" 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input 
                className="px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition" 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Group By</label>
              <select 
                className="px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition" 
                value={groupBy} 
                onChange={e => setGroupBy(e.target.value as any)}
              >
                <option value="day">Daily</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchReport} 
                  disabled={loading}
                  className="flex-1 hover:bg-gray-50"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExportCsv}
              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
            >
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onPrint}
              className="hover:bg-green-50 hover:text-green-600 hover:border-green-300"
            >
              Print Report
            </Button>
          </div>
        </div>

        {/* Content State Handling */}
        {loading && (
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center">
              <div className="flex justify-center items-center gap-3">
                <div className="h-8 w-8 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
                <span className="text-gray-600 font-medium">Loading dashboard data...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-900 mb-1">Error Loading Report</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && report && (
          <div className="space-y-6">
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Time Series Chart */}
              <div className="lg:col-span-2">
                <Card className="border-gray-200 h-full">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Applications Over Time</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Track submission trends</p>
                  </CardHeader>
                  <CardContent>
                    <div style={{ width: '100%', height: 320 }}>
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={timeseries} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#ffffff', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.5rem'
                            }} 
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#dc2626" 
                            strokeWidth={3} 
                            dot={{ r: 5, fill: '#dc2626' }}
                            activeDot={{ r: 7 }}
                            name="Applications"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Pie Chart */}
              <Card className="border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Status Distribution</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Current breakdown</p>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie 
                          data={statusData} 
                          dataKey="value" 
                          nameKey="name" 
                          cx="50%" 
                          cy="50%" 
                          outerRadius={80}
                          innerRadius={40}
                        >
                          {statusData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] ?? '#d1d5db'} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#ffffff', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Summary Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Total Applications</span>
                      <span className="text-2xl font-bold text-gray-900">{report.totals?.total ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500"></span>
                        Approved
                      </span>
                      <span className="text-xl font-bold text-green-600">{report.totals?.by_status?.approved ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500"></span>
                        Denied
                      </span>
                      <span className="text-xl font-bold text-red-600">{report.totals?.by_status?.denied ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                        Pending
                      </span>
                      <span className="text-xl font-bold text-yellow-600">{report.totals?.by_status?.pending ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                        Cancelled
                      </span>
                      <span className="text-xl font-bold text-gray-600">{report.totals?.by_status?.cancelled ?? 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Approval Metrics */}
              <Card className="border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Approval Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {(() => {
                      const total = report.totals?.total ?? 0;
                      const approved = report.totals?.by_status?.approved ?? 0;
                      const denied = report.totals?.by_status?.denied ?? 0;
                      const pending = report.totals?.by_status?.pending ?? 0;
                      const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : 0;
                      const denialRate = total > 0 ? ((denied / total) * 100).toFixed(1) : 0;
                      const pendingRate = total > 0 ? ((pending / total) * 100).toFixed(1) : 0;

                      return (
                        <>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Approval Rate</span>
                              <span className="text-sm font-bold text-green-600">{approvalRate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${approvalRate}%` }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Denial Rate</span>
                              <span className="text-sm font-bold text-red-600">{denialRate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-red-500 h-2 rounded-full" 
                                style={{ width: `${denialRate}%` }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Pending Review</span>
                              <span className="text-sm font-bold text-yellow-600">{pendingRate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full" 
                                style={{ width: `${pendingRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!loading && !report && !error && (
          <Card className="border-gray-200 bg-blue-50">
            <CardContent className="p-12 text-center">
              <svg className="h-12 w-12 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">No Data Available</h3>
              <p className="text-blue-700 text-sm">No applications found for the selected date range. Try adjusting your filters.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
