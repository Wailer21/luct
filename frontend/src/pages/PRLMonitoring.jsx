import React from 'react'

export default function PRLMonitoring() {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">
                <i className="fas fa-chart-bar me-2"></i>
                PRL Monitoring
              </h3>
            </div>
            <div className="card-body">
              <p className="lead">
                Program Monitoring Dashboard
              </p>
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Monitor program performance and metrics
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
