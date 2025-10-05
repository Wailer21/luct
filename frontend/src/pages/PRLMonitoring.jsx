// PRLMonitoring.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';

export default function PRLMonitoring() {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year'
  const [activeChart, setActiveChart] = useState('enrollment');

  const { user } = useAuth();

  useEffect(() => {
    fetchMonitoringData();
  }, [timeRange]);

  const fetchMonitoringData = async () => {
    try {
      const response = await apiMethods.getProgramMetrics(user.programId, timeRange);
      if (response.success) {
        setMetrics(response.data);
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const ChartCard = ({ title, value, change, icon, color }) => (
    <div className="col-md-3 mb-4">
      <div className={`card bg-${color} text-white`}>
        <div className="card-body">
          <div className="d-flex justify-content-between">
            <div>
              <h4 className="mb-0">{value}</h4>
              <p className="mb-0">{title}</p>
            </div>
            <i className={`fas ${icon} fa-2x opacity-50`}></i>
          </div>
          {change && (
            <small className="opacity-75">
              {change > 0 ? '+' : ''}{change}% from last period
            </small>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-primary mb-0">
              <i className="fas fa-chart-bar me-2"></i>
              Program Monitoring Dashboard
            </h2>
            <select 
              className="form-select w-auto"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          {/* Key Metrics */}
          <div className="row">
            <ChartCard 
              title="Total Students" 
              value={metrics.total_students || 0} 
              change={metrics.student_growth || 0}
              icon="fa-users"
              color="primary"
            />
            <ChartCard 
              title="Active Courses" 
              value={metrics.active_courses || 0} 
              change={metrics.course_growth || 0}
              icon="fa-book"
              color="success"
            />
            <ChartCard 
              title="Completion Rate" 
              value={`${metrics.completion_rate || 0}%`} 
              change={metrics.completion_change || 0}
              icon="fa-check-circle"
              color="info"
            />
            <ChartCard 
              title="Avg. Performance" 
              value={`${metrics.avg_performance || 0}%`} 
              change={metrics.performance_change || 0}
              icon="fa-chart-line"
              color="warning"
            />
          </div>

          {/* Charts and Visualizations */}
          <div className="row mt-4">
            <div className="col-md-8">
              <div className="card shadow">
                <div className="card-header bg-light">
                  <ul className="nav nav-tabs card-header-tabs">
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeChart === 'enrollment' ? 'active' : ''}`}
                        onClick={() => setActiveChart('enrollment')}
                      >
                        Enrollment Trends
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeChart === 'performance' ? 'active' : ''}`}
                        onClick={() => setActiveChart('performance')}
                      >
                        Performance Metrics
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeChart === 'attendance' ? 'active' : ''}`}
                        onClick={() => setActiveChart('attendance')}
                      >
                        Attendance
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="card-body">
                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary"></div>
                      <p className="mt-2">Loading chart data...</p>
                    </div>
                  ) : (
                    <div className="chart-placeholder" style={{height: '300px'}}>
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="text-center text-muted">
                          <i className="fas fa-chart-bar fa-3x mb-3"></i>
                          <h5>Chart Visualization</h5>
                          <p>
                            {activeChart === 'enrollment' && 'Enrollment trends over time'}
                            {activeChart === 'performance' && 'Student performance metrics'}
                            {activeChart === 'attendance' && 'Class attendance rates'}
                          </p>
                          <small>Chart integration with libraries like Chart.js or D3.js</small>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-4">
              {/* Recent Alerts */}
              <div className="card shadow mb-4">
                <div className="card-header bg-warning text-dark">
                  <h6 className="mb-0">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Recent Alerts
                  </h6>
                </div>
                <div className="card-body">
                  {metrics.alerts?.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {metrics.alerts.slice(0, 5).map((alert, index) => (
                        <div key={index} className="list-group-item px-0">
                          <div className="d-flex w-100 justify-content-between">
                            <h6 className="mb-1">{alert.title}</h6>
                            <small className="text-muted">{alert.time}</small>
                          </div>
                          <p className="mb-1 small">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-3">
                      <i className="fas fa-check-circle fa-2x mb-2"></i>
                      <p>No recent alerts</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h6 className="mb-0">
                    <i className="fas fa-bolt me-2"></i>
                    Quick Actions
                  </h6>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-2">
                    <button className="btn btn-outline-primary btn-sm">
                      <i className="fas fa-download me-2"></i>
                      Export Report
                    </button>
                    <button className="btn btn-outline-success btn-sm">
                      <i className="fas fa-sync me-2"></i>
                      Refresh Data
                    </button>
                    <button className="btn btn-outline-info btn-sm">
                      <i className="fas fa-cog me-2"></i>
                      Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Metrics Table */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header bg-light">
                  <h5 className="mb-0">
                    <i className="fas fa-table me-2"></i>
                    Detailed Program Metrics
                  </h5>
                </div>
                <div className="card-body">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary"></div>
                      <p className="mt-2">Loading detailed metrics...</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Metric</th>
                            <th>Current</th>
                            <th>Previous</th>
                            <th>Change</th>
                            <th>Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Student Enrollment</td>
                            <td>{metrics.total_students || 0}</td>
                            <td>{(metrics.total_students || 0) - (metrics.student_growth || 0)}</td>
                            <td>
                              <span className={`badge ${(metrics.student_growth || 0) >= 0 ? 'bg-success' : 'bg-danger'}`}>
                                {(metrics.student_growth || 0) >= 0 ? '+' : ''}{metrics.student_growth || 0}%
                              </span>
                            </td>
                            <td>
                              <i className={`fas fa-arrow-${(metrics.student_growth || 0) >= 0 ? 'up text-success' : 'down text-danger'}`}></i>
                            </td>
                          </tr>
                          <tr>
                            <td>Course Completion</td>
                            <td>{metrics.completion_rate || 0}%</td>
                            <td>{(metrics.completion_rate || 0) - (metrics.completion_change || 0)}%</td>
                            <td>
                              <span className={`badge ${(metrics.completion_change || 0) >= 0 ? 'bg-success' : 'bg-danger'}`}>
                                {(metrics.completion_change || 0) >= 0 ? '+' : ''}{metrics.completion_change || 0}%
                              </span>
                            </td>
                            <td>
                              <i className={`fas fa-arrow-${(metrics.completion_change || 0) >= 0 ? 'up text-success' : 'down text-danger'}`}></i>
                            </td>
                          </tr>
                          <tr>
                            <td>Average Grade</td>
                            <td>{metrics.avg_performance || 0}%</td>
                            <td>{(metrics.avg_performance || 0) - (metrics.performance_change || 0)}%</td>
                            <td>
                              <span className={`badge ${(metrics.performance_change || 0) >= 0 ? 'bg-success' : 'bg-danger'}`}>
                                {(metrics.performance_change || 0) >= 0 ? '+' : ''}{metrics.performance_change || 0}%
                              </span>
                            </td>
                            <td>
                              <i className={`fas fa-arrow-${(metrics.performance_change || 0) >= 0 ? 'up text-success' : 'down text-danger'}`}></i>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}