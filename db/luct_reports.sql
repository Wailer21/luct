-- =========================
-- 1. Roles
-- =========================
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (id, name) VALUES
(1, 'Student'),
(2, 'Lecturer'),
(3, 'PRL'),
(4, 'PL'),
(5, 'Admin')
ON CONFLICT (id) DO NOTHING;

-- =========================
-- 2. Users
-- =========================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  role_id INT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, phone) VALUES
(1, 2, 'Borotho', 'Lecturer', 'borotho@luct.ac.ls', 'hashed_pw', '123456789'),
(2, 2, 'Ntho', 'Lecturer', 'ntho@luct.ac.ls', 'hashed_pw', '123456789'),
(3, 2, 'Sechaba', 'Lecturer', 'sechaba@luct.ac.ls', 'hashed_pw', '123456789'),
(4, 2, 'Mofolo', 'Lecturer', 'mofolo@luct.ac.ls', 'hashed_pw', '123456789'),
(5, 2, 'Molaoa', 'Lecturer', 'molaoa@luct.ac.ls', 'hashed_pw', '123456789'),
(6, 2, 'Tlali', 'Lecturer', 'tlali@luct.ac.ls', 'hashed_pw', '123456789'),
(7, 2, 'Bhila', 'Lecturer', 'bhila@luct.ac.ls', 'hashed_pw', '123456789'),
(8, 2, 'Thokoana', 'Lecturer', 'thokoana@luct.ac.ls', 'hashed_pw', '123456789')
ON CONFLICT (id) DO NOTHING;

-- =========================
-- 3. Faculties
-- =========================
CREATE TABLE faculties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL
);

INSERT INTO faculties (id, name) VALUES 
(1, 'Faculty of Information Communication Technology')
ON CONFLICT (id) DO NOTHING;

-- =========================
-- 4. Courses
-- =========================
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  faculty_id INT NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  total_registered INT DEFAULT 0,
  FOREIGN KEY (faculty_id) REFERENCES faculties(id)
);

INSERT INTO courses (id, faculty_id, code, name, total_registered) VALUES
(1, 1, 'BIDC2110', 'Data Communication & Networking', 60),
(2, 1, 'BIIC2110', 'Introduction to Computer Architecture', 55),
(3, 1, 'BIMT2108', 'Multimedia Technology', 45),
(4, 1, 'BIOP2110', 'Object Oriented Programming I', 70),
(5, 1, 'BIWA2110', 'Web Application Development', 50),
(6, 1, 'BBBM1108', 'Introduction to Business Management', 80)
ON CONFLICT (id) DO NOTHING;

-- =========================
-- 5. Classes (Timetable)
-- =========================
CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL,
  class_name VARCHAR(150),
  venue VARCHAR(150),
  scheduled_time VARCHAR(50),
  lecturer_id INT,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (lecturer_id) REFERENCES users(id)
);

INSERT INTO classes (id, course_id, class_name, venue, scheduled_time, lecturer_id) VALUES
(1, 2, 'Introduction to Computer Architecture', 'Workshop Borotho', '08:30 - 10:30', 1),
(2, 1, 'Data Communication & Networking', 'Hall 6', '14:30 - 16:30', 2),
(3, 6, 'Concept of Organization', 'Hall 7', '08:30 - 10:30', 3),
(4, 4, 'Object Oriented Programming (TUT)', 'MM2', '10:30 - 12:30', 4),
(5, 5, 'Web Application Development', 'MM2', '12:30 - 14:30', 5),
(6, 1, 'Data Communication & Networking (LAB)', 'Net Lab', '08:30 - 10:30', 6),
(7, 4, 'Object Oriented Programming (Java 1)', 'MM6', '08:30 - 10:30', 7),
(8, 3, 'Multimedia Technology', 'MM3', '10:30 - 12:30', 8)
ON CONFLICT (id) DO NOTHING;

-- =========================
-- 6. Reports
-- =========================
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  faculty_id INT NOT NULL,
  class_id INT NOT NULL,
  week_of_reporting VARCHAR(50) NOT NULL,
  lecture_date DATE NOT NULL,
  course_id INT NOT NULL,
  course_code VARCHAR(50),
  lecturer_id INT NOT NULL,
  actual_present INT NOT NULL,
  total_registered INT NOT NULL,
  venue VARCHAR(150),
  scheduled_time VARCHAR(50),
  topic TEXT,
  learning_outcomes TEXT,
  recommendations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id) REFERENCES faculties(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (lecturer_id) REFERENCES users(id)
);

-- =========================
-- 7. Report Feedback
-- =========================
CREATE TABLE report_feedback (
  id SERIAL PRIMARY KEY,
  report_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

-- =========================
-- 8. Ratings
-- =========================
CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT,
  lecturer_id INT,
  rating SMALLINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (lecturer_id) REFERENCES users(id)
);
