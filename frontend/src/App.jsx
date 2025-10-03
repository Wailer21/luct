import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './src/components/Navigation';

// Student Pages
import StudentHome from './pages/student/Home';
import StudentCourses from './pages/student/Courses';
import StudentAttendance from './pages/student/Attendance';
import StudentMonitoring from './pages/student/Monitoring';
import StudentRating from './pages/student/Rating';
import StudentFeedback from './pages/student/Feedback';

// Lecturer Pages
import LecturerClasses from './pages/lecturer/Classes';
import LecturerMonitoring from './pages/lecturer/Monitoring';
import LecturerRating from './pages/lecturer/Rating';

// PL Pages
import PLCourses from './pages/pl/Courses';
import PLLecturerAssigned from './pages/pl/LecturerAssigned';

// PRL Pages
import PRLClasses from './pages/prl/Classes';
import PRLCourses from './pages/prl/Courses';
import PRLMonitoring from './pages/prl/Monitoring';
import PRLReports from './pages/prl/Reports';

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        {/* Student Routes */}
        <Route path="/" element={<StudentHome />} />
        <Route path="/student/courses" element={<StudentCourses />} />
        <Route path="/student/attendance" element={<StudentAttendance />} />
        <Route path="/student/monitoring" element={<StudentMonitoring />} />
        <Route path="/student/rating" element={<StudentRating />} />
        <Route path="/student/feedback" element={<StudentFeedback />} />

        {/* Lecturer Routes */}
        <Route path="/lecturer/classes" element={<LecturerClasses />} />
        <Route path="/lecturer/monitoring" element={<LecturerMonitoring />} />
        <Route path="/lecturer/rating" element={<LecturerRating />} />

        {/* PL Routes */}
        <Route path="/pl/courses" element={<PLCourses />} />
        <Route path="/pl/lecturer-assigned" element={<PLLecturerAssigned />} />

        {/* PRL Routes */}
        <Route path="/prl/classes" element={<PRLClasses />} />
        <Route path="/prl/courses" element={<PRLCourses />} />
        <Route path="/prl/monitoring" element={<PRLMonitoring />} />
        <Route path="/prl/reports" element={<PRLReports />} />
      </Routes>
    </Router>
  );
}

export default App;