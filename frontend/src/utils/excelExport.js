import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const exportToExcel = (data, filename = 'export', sheetName = 'Data') => {
  try {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate Excel file and save
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    saveAs(dataBlob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Excel export error:', error);
    return false;
  }
};

// Specific export functions for different data types
export const exportReportsToExcel = (reports) => {
  const exportData = reports.map(report => ({
    'Report ID': report.id,
    'Course Code': report.course_code,
    'Course Name': report.course_name,
    'Lecturer': report.lecturer_name,
    'Week': report.week_of_reporting,
    'Lecture Date': new Date(report.lecture_date).toLocaleDateString(),
    'Students Present': report.actual_present,
    'Total Registered': report.total_registered,
    'Attendance Rate': `${Math.round((report.actual_present / report.total_registered) * 100)}%`,
    'Venue': report.venue || 'N/A',
    'Topic': report.topic || 'N/A',
    'Learning Outcomes': report.learning_outcomes || 'N/A',
    'Recommendations': report.recommendations || 'N/A',
    'Feedback': report.feedback || 'N/A',
    'Created At': new Date(report.created_at).toLocaleString()
  }));

  return exportToExcel(exportData, 'lecture_reports', 'Reports');
};

export const exportCoursesToExcel = (courses) => {
  const exportData = courses.map(course => ({
    'Course Code': course.code,
    'Course Name': course.course_name,
    'Faculty': course.faculty_name,
    'Total Registered': course.total_registered,
    'Total Reports': course.report_count || 0,
    'Average Attendance': course.avg_attendance ? `${Math.round(course.avg_attendance)}%` : 'N/A'
  }));

  return exportToExcel(exportData, 'courses', 'Courses');
};

export const exportStudentAttendanceToExcel = (attendance, studentName = '') => {
  const exportData = attendance.map(record => ({
    'Date': new Date(record.lecture_date).toLocaleDateString(),
    'Course Code': record.course_code,
    'Course Name': record.course_name,
    'Lecturer': record.lecturer_name,
    'Class': record.class_name,
    'Week': record.week_of_reporting,
    'Topic': record.topic || 'N/A',
    'Status': record.actual_present > 0 ? 'Present' : 'Absent',
    'Students Present': record.actual_present,
    'Total Registered': record.total_registered,
    'Attendance Rate': `${Math.round((record.actual_present / record.total_registered) * 100)}%`
  }));

  const filename = studentName ? `attendance_${studentName}` : 'attendance';
  return exportToExcel(exportData, filename, 'Attendance');
};

export const exportAnalyticsToExcel = (analyticsData) => {
  const exportData = [
    {
      'Metric': 'Total Users',
      'Value': analyticsData.total_users || 0
    },
    {
      'Metric': 'Total Students',
      'Value': analyticsData.total_students || 0
    },
    {
      'Metric': 'Total Lecturers',
      'Value': analyticsData.total_lecturers || 0
    },
    {
      'Metric': 'Total Courses',
      'Value': analyticsData.total_courses || 0
    },
    {
      'Metric': 'Total Reports',
      'Value': analyticsData.total_reports || 0
    },
    {
      'Metric': 'Average Attendance Rate',
      'Value': analyticsData.avg_attendance_rate ? `${analyticsData.avg_attendance_rate}%` : '0%'
    },
    {
      'Metric': 'Average Rating',
      'Value': analyticsData.avg_rating || 0
    }
  ];

  return exportToExcel(exportData, 'analytics_report', 'Analytics');
};

export const exportRatingsToExcel = (ratings, type = 'ratings') => {
  const exportData = ratings.map(rating => ({
    'Rated Item': rating.lecturer_name || rating.course_name,
    'Type': rating.rating_type,
    'Rating': rating.rating,
    'Comment': rating.comment || 'N/A',
    'Rated By': rating.student_name || 'N/A',
    'Date': new Date(rating.created_at).toLocaleDateString()
  }));

  return exportToExcel(exportData, `${type}_ratings`, 'Ratings');
};