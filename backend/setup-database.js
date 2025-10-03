const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: "postgresql://luct_reports_user:VfNK4tNbsVQ58Bvh4glC1dVQ4cPDjbm5@dpg-d36jogadbo4c73dse7l0-a.virginia-postgres.render.com/luct_reports",
  ssl: { rejectUnauthorized: false },
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Setting up LUCT Reports Database...');

    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Create tables
    await client.query(`
      -- Roles table
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        role_id INTEGER REFERENCES roles(id),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Faculties table
      CREATE TABLE IF NOT EXISTS faculties (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Courses table
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        faculty_id INTEGER REFERENCES faculties(id),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        total_registered INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Classes table
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id),
        lecturer_id INTEGER REFERENCES users(id),
        class_name VARCHAR(255) NOT NULL,
        venue VARCHAR(100),
        scheduled_time VARCHAR(50),
        day_of_week VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Reports table (with feedback columns)
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        faculty_id INTEGER REFERENCES faculties(id),
        class_id INTEGER REFERENCES classes(id),
        course_id INTEGER REFERENCES courses(id),
        lecturer_id INTEGER REFERENCES users(id),
        week_of_reporting INTEGER NOT NULL CHECK (week_of_reporting BETWEEN 1 AND 52),
        lecture_date DATE NOT NULL,
        course_code VARCHAR(50) NOT NULL,
        actual_present INTEGER NOT NULL CHECK (actual_present >= 0),
        total_registered INTEGER NOT NULL CHECK (total_registered >= 0),
        venue VARCHAR(100),
        scheduled_time VARCHAR(50),
        topic TEXT NOT NULL,
        learning_outcomes TEXT NOT NULL,
        recommendations TEXT,
        
        -- Feedback columns
        feedback TEXT,
        feedback_by INTEGER REFERENCES users(id),
        feedback_at TIMESTAMP,
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CHECK (actual_present <= total_registered),
        CHECK (lecture_date <= CURRENT_DATE)
      );

      -- Ratings table
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        rated_item_id INTEGER NOT NULL,
        rated_item_type VARCHAR(50) NOT NULL CHECK (rated_item_type IN ('course', 'lecture', 'report', 'lecturer')),
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        rated_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Audit log table
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        table_name VARCHAR(100),
        record_id INTEGER,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Database tables created successfully!');

    // Insert initial data
    await client.query(`
      -- Insert roles
      INSERT INTO roles (name, description) VALUES 
        ('Student', 'Can view reports and ratings'),
        ('Lecturer', 'Can submit and view reports'),
        ('PRL', 'Principal Lecturer - Can manage courses and provide feedback'),
        ('PL', 'Program Leader - Can manage courses, users, and view all reports'),
        ('Admin', 'Full system administrator')
      ON CONFLICT (name) DO NOTHING;

      -- Insert sample faculties
      INSERT INTO faculties (name, code, description) VALUES 
        ('Faculty of Information Communication Technology', 'FICT', 'ICT and Computer Science programs'),
        ('Faculty of Business', 'FB', 'Business and Management programs'),
        ('Faculty of Design', 'FD', 'Creative Design and Media programs')
      ON CONFLICT (code) DO NOTHING;

      -- Insert sample courses
      INSERT INTO courses (faculty_id, code, name, description, total_registered) VALUES 
        (1, 'DIWA2110', 'Web Application Development', 'Diploma in Web Application Development', 45),
        (1, 'DIPR2110', 'Programming Fundamentals', 'Introduction to Programming', 50),
        (1, 'DIDB2110', 'Database Systems', 'Database Design and Management', 40),
        (2, 'BAMG3110', 'Business Management', 'Principles of Business Management', 35),
        (3, 'DIGD2110', 'Graphic Design', 'Fundamentals of Graphic Design', 30)
      ON CONFLICT (code) DO NOTHING;

      -- Insert sample users (password is 'password123' hashed)
      INSERT INTO users (role_id, first_name, last_name, email, password_hash) VALUES 
        -- Admin
        (5, 'System', 'Administrator', 'admin@luct.ac.ls', '$2b$12$LQv3c1yqBWVHxkd0L6k0uO9L4vRWrT7LcJmWkQZQY9QYbJkL8Z8Xa'),
        
        -- Lecturers
        (2, 'John', 'Borotho', 'borotho@luct.ac.ls', '$2b$12$LQv3c1yqBWVHxkd0L6k0uO9L4vRWrT7LcJmWkQZQY9QYbJkL8Z8Xa'),
        (2, 'Sarah', 'Mokoena', 'mokoena@luct.ac.ls', '$2b$12$LQv3c1yqBWVHxkd0L6k0uO9L4vRWrT7LcJmWkQZQY9QYbJkL8Z8Xa'),
        
        -- PRL
        (3, 'David', 'Moloi', 'moloi@luct.ac.ls', '$2b$12$LQv3c1yqBWVHxkd0L6k0uO9L4vRWrT7LcJmWkQZQY9QYbJkL8Z8Xa'),
        
        -- PL
        (4, 'Mary', 'Khumalo', 'khumalo@luct.ac.ls', '$2b$12$LQv3c1yqBWVHxkd0L6k0uO9L4vRWrT7LcJmWkQZQY9QYbJkL8Z8Xa'),
        
        -- Students
        (1, 'Liteboho', 'Molaoa', 'liteboho@student.luct.ac.ls', '$2b$12$LQv3c1yqBWVHxkd0L6k0uO9L4vRWrT7LcJmWkQZQY9QYbJkL8Z8Xa'),
        (1, 'Thabo', 'Mofokeng', 'thabo@student.luct.ac.ls', '$2b$12$LQv3c1yqBWVHxkd0L6k0uO9L4vRWrT7LcJmWkQZQY9QYbJkL8Z8Xa')
      ON CONFLICT (email) DO NOTHING;

      -- Insert sample classes
      INSERT INTO classes (course_id, lecturer_id, class_name, venue, scheduled_time, day_of_week) VALUES 
        (1, 2, 'DIWA2110 - Group A', 'Lab 101', '08:00-10:00', 'Monday'),
        (1, 2, 'DIWA2110 - Group B', 'Lab 102', '10:00-12:00', 'Monday'),
        (2, 3, 'DIPR2110 - Group A', 'Lab 201', '14:00-16:00', 'Tuesday'),
        (3, 3, 'DIDB2110 - Group A', 'Lab 202', '16:00-18:00', 'Wednesday')
      ON CONFLICT DO NOTHING;

      -- Insert sample reports
      INSERT INTO reports (
        faculty_id, class_id, course_id, lecturer_id, week_of_reporting, 
        lecture_date, course_code, actual_present, total_registered, 
        venue, scheduled_time, topic, learning_outcomes, recommendations
      ) VALUES 
        (1, 1, 1, 2, 6, '2024-02-05', 'DIWA2110', 38, 45, 'Lab 101', '08:00-10:00', 
         'React Components and Props', 
         'Students can create functional components, understand props, and build reusable UI elements',
         'More practical exercises needed for state management'),

        (1, 2, 1, 2, 6, '2024-02-05', 'DIWA2110', 42, 45, 'Lab 102', '10:00-12:00', 
         'React State and Hooks', 
         'Students understand useState hook and can manage component state',
         'Good participation, continue with more examples'),

        (1, 3, 2, 3, 6, '2024-02-06', 'DIPR2110', 45, 50, 'Lab 201', '14:00-16:00', 
         'Python Functions and Modules', 
         'Students can define functions, use parameters, and create modules',
         'Some students struggling with return values - review needed')
      ON CONFLICT DO NOTHING;

      -- Insert sample ratings
      INSERT INTO ratings (rated_item_id, rated_item_type, rating, comment, rated_by) VALUES 
        (1, 'course', 4, 'Excellent course content and structure', 6),
        (1, 'lecture', 5, 'Very engaging lecture with practical examples', 6),
        (2, 'lecturer', 4, 'Knowledgeable and helpful instructor', 7),
        (1, 'report', 3, 'Good report but could use more details', 4)
      ON CONFLICT DO NOTHING;

      -- Insert sample notifications
      INSERT INTO notifications (user_id, title, message, type) VALUES 
        (2, 'New Report Submitted', 'Your lecture report for DIWA2110 has been submitted successfully', 'success'),
        (4, 'Feedback Required', 'New reports are available for your review and feedback', 'info'),
        (6, 'Welcome to LUCT Reports', 'Your student account has been activated successfully', 'info')
      ON CONFLICT DO NOTHING;
    `);

    console.log('✅ Sample data inserted successfully!');

    // Create indexes for better performance
    await client.query(`
      -- Users indexes
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
      
      -- Reports indexes
      CREATE INDEX IF NOT EXISTS idx_reports_lecturer ON reports(lecturer_id);
      CREATE INDEX IF NOT EXISTS idx_reports_course ON reports(course_id);
      CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(lecture_date);
      CREATE INDEX IF NOT EXISTS idx_reports_faculty ON reports(faculty_id);
      
      -- Classes indexes
      CREATE INDEX IF NOT EXISTS idx_classes_course ON classes(course_id);
      CREATE INDEX IF NOT EXISTS idx_classes_lecturer ON classes(lecturer_id);
      
      -- Ratings indexes
      CREATE INDEX IF NOT EXISTS idx_ratings_item ON ratings(rated_item_id, rated_item_type);
      CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(rated_by);
      
      -- Courses indexes
      CREATE INDEX IF NOT EXISTS idx_courses_faculty ON courses(faculty_id);
      CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
      
      -- Notifications indexes
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
      
      -- Audit logs indexes
      CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
    `);

    console.log('✅ Database indexes created successfully!');

    // Reset sequences
    console.log('🔄 Resetting database sequences...');
    await client.query(`
      SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM users), false);
      SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM roles), false);
      SELECT setval('faculties_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM faculties), false);
      SELECT setval('courses_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM courses), false);
      SELECT setval('classes_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM classes), false);
      SELECT setval('reports_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM reports), false);
      SELECT setval('ratings_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM ratings), false);
      SELECT setval('notifications_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM notifications), false);
      SELECT setval('audit_logs_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM audit_logs), false);
    `);

    console.log('✅ Database sequences reset successfully!');

    // Show database summary
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM roles) as total_roles,
        (SELECT COUNT(*) FROM faculties) as total_faculties,
        (SELECT COUNT(*) FROM courses) as total_courses,
        (SELECT COUNT(*) FROM classes) as total_classes,
        (SELECT COUNT(*) FROM reports) as total_reports,
        (SELECT COUNT(*) FROM ratings) as total_ratings,
        (SELECT COUNT(*) FROM notifications) as total_notifications
    `);

    console.log('\n📊 Database Setup Complete!');
    console.log('==============================');
    console.log('Total Users:', summary.rows[0].total_users);
    console.log('Total Roles:', summary.rows[0].total_roles);
    console.log('Total Faculties:', summary.rows[0].total_faculties);
    console.log('Total Courses:', summary.rows[0].total_courses);
    console.log('Total Classes:', summary.rows[0].total_classes);
    console.log('Total Reports:', summary.rows[0].total_reports);
    console.log('Total Ratings:', summary.rows[0].total_ratings);
    console.log('Total Notifications:', summary.rows[0].total_notifications);
    console.log('\n🚀 LUCT Reports System is ready!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupDatabase().catch(console.error);