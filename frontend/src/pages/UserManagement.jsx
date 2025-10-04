import React from 'react'

export default function UserManagement() {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">
                <i className="fas fa-users-cog me-2"></i>
                User Management
              </h3>
            </div>
            <div className="card-body">
              <p className="lead">
                Manage system users
              </p>
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Administer user accounts and roles
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
