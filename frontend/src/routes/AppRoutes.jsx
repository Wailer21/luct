import React from 'react'
import { Routes, Route } from 'react-router-dom'

// Public Components
import Home from '../pages/Home'
import Login from '../pages/Login'
import Register from '../pages/Register'

// Protected Components
import ReportForm from '../pages/ReportForm'
import Reports from '../pages/Reports'
import Courses from '../pages/Courses'
import Feedback from '../pages/Feedback'
import Rating from '../pages/Rating'
import Search from '../pages/Search'
import StudentMonitoring from '../pages/StudentMonitoring'
import StudentAttendance from '../pages/StudentAttendance'

// Management Components
import ClassManagement from '../pages/ClassManagement'
import Analytics from '../pages/Analytics'
import UserManagement from '../pages/UserManagement'
import LecturerAssignment from '../pages/LecturerAssignment'
import PRLCourses from '../pages/PRLCourses'
import PRLClasses from '../pages/PRLClasses'
import PRLMonitoring from '../pages/PRLMonitoring'
import PRLReports from '../pages/PRLReports'
import PLCourses from '../pages/PLCourses'

// Feedback Components
import LecturerFeedback from '../pages/LecturerFeedback'

import PublicRoute from './PublicRoute'
import PrivateRoute from './PrivateRoute'
import NotFound from '../pages/NotFound'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />

      {/* Common Protected Routes */}
      <Route
        path="/reports"
        element={
          <PrivateRoute roles={['Student', 'Lecturer', 'PRL', 'PL', 'Admin']}>
            <Reports />
          </PrivateRoute>
        }
      />

      <Route
        path="/search"
        element={
          <PrivateRoute roles={['Student', 'Lecturer', 'PRL', 'PL', 'Admin']}>
            <Search />
          </PrivateRoute>
        }
      />

      <Route
        path="/rating"
        element={
          <PrivateRoute roles={['Student', 'Lecturer', 'PRL', 'PL', 'Admin']}>
            <Rating />
          </PrivateRoute>
        }
      />

      {/* Lecturer Specific Routes */}
      <Route
        path="/report"
        element={
          <PrivateRoute roles={['Lecturer']}>
            <ReportForm />
          </PrivateRoute>
        }
      />

      <Route
        path="/my-classes"
        element={
          <PrivateRoute roles={['Lecturer']}>
            <Reports view="my-classes" />
          </PrivateRoute>
        }
      />

      {/* Lecturer Feedback Route */}
      <Route
        path="/my-feedback"
        element={
          <PrivateRoute roles={['Lecturer']}>
            <LecturerFeedback />
          </PrivateRoute>
        }
      />

      {/* Student Specific Routes */}
      <Route
        path="/monitoring"
        element={
          <PrivateRoute roles={['Student']}>
            <StudentMonitoring />
          </PrivateRoute>
        }
      />

      <Route
        path="/attendance"
        element={
          <PrivateRoute roles={['Student']}>
            <StudentAttendance />
          </PrivateRoute>
        }
      />

      {/* PRL Feedback Routes */}
      <Route
        path="/prl-reports"
        element={
          <PrivateRoute roles={['PRL', 'PL', 'Admin']}>
            <PRLReports />
          </PrivateRoute>
        }
      />

      <Route
        path="/feedback"
        element={
          <PrivateRoute roles={['PRL', 'PL', 'Admin']}>
            <Feedback />
          </PrivateRoute>
        }
      />

      {/* Management Routes */}
      <Route
        path="/courses"
        element={
          <PrivateRoute roles={['PL', 'PRL', 'Admin']}>
            <Courses />
          </PrivateRoute>
        }
      />

      <Route
        path="/classes"
        element={
          <PrivateRoute roles={['PL']}>
            <ClassManagement />
          </PrivateRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <PrivateRoute roles={['PRL', 'Admin']}>
            <Analytics />
          </PrivateRoute>
        }
      />

      <Route
        path="/users"
        element={
          <PrivateRoute roles={['Admin']}>
            <UserManagement />
          </PrivateRoute>
        }
      />

      {/* PRL Management Routes */}
      <Route
        path="/prl-courses"
        element={
          <PrivateRoute roles={['PRL']}>
            <PRLCourses />
          </PrivateRoute>
        }
      />

      <Route
        path="/prl-classes"
        element={
          <PrivateRoute roles={['PRL']}>
            <PRLClasses />
          </PrivateRoute>
        }
      />

      <Route
        path="/prl-monitoring"
        element={
          <PrivateRoute roles={['PRL']}>
            <PRLMonitoring />
          </PrivateRoute>
        }
      />

      {/* PL Management Routes */}
      <Route
        path="/pl-courses"
        element={
          <PrivateRoute roles={['PL']}>
            <PLCourses />
          </PrivateRoute>
        }
      />

      <Route
        path="/lecturer-assignment"
        element={
          <PrivateRoute roles={['PL']}>
            <LecturerAssignment />
          </PrivateRoute>
        }
      />

      {/* Catch all route - 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}