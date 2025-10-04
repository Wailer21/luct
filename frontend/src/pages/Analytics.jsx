import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';
import { exportAnalyticsToExcel, exportReportsToExcel } from '../utils/excelExport';

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const { user } = useAuth();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const [overviewRes, trendsRes, reportsRes] = await Promise.all([
        apiMethods.getAnalyticsOverview(),
        apiMethods.getAnalyticsTrends(),
        apiMethods.getReports()
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (trendsRes.success) setTrends(trendsRes.data);
      if (reportsRes.success) setReports(reportsRes.data.reports || reportsRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAnalytics = () => {
    if (overview) {
      exportAnalyticsToExcel(overview);
    }
  };

  const handleExportAllReports = () => {
    exportReportsToExcel(reports);
  };

  if (!['PRL', 'Admin'].includes(user?.role)) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Access denied. Analytics requires PRL or Admin role.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="text-primary mb-1">
                <i className="fas fa-chart-bar me-2"></i>
                System Analytics
              </h2>
              <p className="text-muted mb-0">Comprehensive system insights and reports</p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-success"
                onClick={handleExportAnalytics}
                disabled={!overview}
              >
                <i className="fas fa-file-excel me-2"></i>
                Export Analytics
              </button>
              <button
                className="btn btn-info"
                onClick={handleExportAllReports}
                disabled={reports.length === 0}
              >
                <i className="fas fa-file-excel me-2"></i>
                Export All Reports
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="card shadow mb-4">
            <div className="card-header bg-white">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <i className="fas fa-chart-pie me-2"></i>
                    Overview
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'trends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trends')}
                  >
                    <i className="fas fa-chart-line me-2"></i>
                    Trends
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reports')}
                  >
                    <i className="fas fa-clipboard-list me-2"></i>
                    All Reports
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                  <p className="mt-2">Loading analytics...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'overview' && overview && (
                    <div className="row">
                      <div className="col-md-3 mb-3">
                        <div className="card border-left-primary shadow h-100">
                          <div className="card-body">
                            <div className="d-flex justify-content-between">
                              <div>
                                <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                  Total Users
                                </div>
                                <div className="h5 mb-0 font-weight-bold text-gray-800">
                                  {overview.total_users}
                                </div>
                              </div>
                              <i className="fas fa-users fa-2x text-gray-300"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Add more overview cards similar to above */}
                    </div>
                  )}

                  {activeTab === 'trends' && (
                    <div>
                      <h5>Weekly Trends</h5>
                      {/* Add trends chart/table here */}
                    </div>
                  )}

                  {activeTab === 'reports' && (
                    <div>
                      <h5>All System Reports ({reports.length})</h5>
                      {/* Add reports table here */}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}