const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const rateLimit = require("express-rate-limit");

dotenv.config();
const app = express();
// ✅ Allowed origins
const allowedOrigins = [
  "http://localhost:3000",                         // local dev
  "https://frontend-8tlqmgw6n-thomonyaneneo-gmailcoms-projects.vercel.app" // Vercel
];
// PostgreSQL connection configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL || "postgresql://luct_reports_user:VfNK4tNbsVQ58Bvh4glC1dVQ4cPDjbm5@dpg-d36jogadbo4c73dse7l0-a.virginia-postgres.render.com/luct_reports",
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 8000,
};

const pool = new Pool(dbConfig);

// Enhanced connection handling
let isDatabaseConnected = false;

pool.on('connect', (client) => {
  console.log('✅ New PostgreSQL client connected');
  isDatabaseConnected = true;
});

pool.on('error', (err, client) => {
  console.error('❌ Database connection error:', err.message);
  isDatabaseConnected = false;
});

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully');
    client.release();
    isDatabaseConnected = true;
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    isDatabaseConnected = false;
    return false;
  }
}

testDatabaseConnection().then(success => {
  if (success) {
    console.log('🎉 Database ready for requests');
  } else {
    console.log('⚠️ Database connection issues - some features may not work');
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// ---------- Helpers ----------
function sendResponse(res, data = null, message = "Success", statusCode = 200) {
  res.status(statusCode).json({
    success: statusCode < 400,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

function sendError(res, error = "Internal server error", statusCode = 500) {
  console.error(`❌ Error ${statusCode}:`, error);
  sendResponse(res, null, typeof error === "string" ? error : "Internal server error", statusCode);
}

function sendSuccess(res, data = null, message = "Success") {
  sendResponse(res, data, message, 200);
}

function sendCreated(res, data = null, message = "Resource created successfully") {
  sendResponse(res, data, message, 201);
}

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Database query wrapper with error handling
async function executeQuery(query, params = []) {
  const client = await pool.connect();
  try {
    console.log('📊 Executing query:', query.substring(0, 100), '...');
    const result = await client.query(query, params);
    return result;
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  } finally {
    client.release();
  }
}

// ---------- Auth middleware ----------
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];
  
  if (!token) {
    return sendError(res, "Authentication token required", 401);
  }

  jwt.verify(token, process.env.JWT_SECRET || "luct_reports_secret_2024", (err, payload) => {
    if (err) {
      console.error('❌ JWT verification failed:', err.message);
      return sendError(res, "Invalid or expired token", 403);
    }
    req.user = payload;
    console.log('✅ Authenticated user:', req.user.email, 'Role:', req.user.role);
    next();
  });
}

// ---------- Validation middlewares ----------
function validateRegister(req, res, next) {
  const { email, password, role } = req.body;
  if (!email || !password || !role) return sendError(res, "Email, password, and role are required", 400);
  if (!validateEmail(email)) return sendError(res, "Invalid email format", 400);
  if (password.length < 6) return sendError(res, "Password must be at least 6 characters long", 400);
  const validRoles = ["Student", "Lecturer", "PRL", "PL", "Admin"];
  if (!validRoles.includes(role)) return sendError(res, "Invalid role specified", 400);
  next();
}

function validateReport(req, res, next) {
  const { class_id, week_of_reporting, lecture_date, course_id, actual_present } = req.body;
  
  if (!class_id || !week_of_reporting || !lecture_date || !course_id || actual_present === undefined) {
    return sendError(res, "All required fields must be filled", 400);
  }
  
  // Fix week validation - extract number from "week X" format
  let weekNumber = week_of_reporting;
  if (typeof week_of_reporting === 'string' && week_of_reporting.toLowerCase().includes('week')) {
    const weekMatch = week_of_reporting.match(/\d+/);
    weekNumber = weekMatch ? parseInt(weekMatch[0]) : week_of_reporting;
  }
  
  if (isNaN(weekNumber) || Number(weekNumber) < 1 || Number(weekNumber) > 52) {
    return sendError(res, "Week must be a number between 1 and 52", 400);
  }
  
  if (Number(actual_present) < 0) return sendError(res, "Actual present cannot be negative", 400);
  
  if (new Date(lecture_date) > new Date()) {
    return sendError(res, "Lecture date cannot be in the future", 400);
  }
  
  // Store cleaned week number for later use
  req.body.week_of_reporting = Number(weekNumber);
  next();
}

// -----------------
// TEST ENDPOINT
// -----------------
app.get("/api/test", async (req, res) => {
  try {
    const result = await executeQuery('SELECT NOW() as current_time');
    res.json({
      success: true,
      message: "Backend is working",
      database: "Connected",
      currentTime: result.rows[0].current_time,
      databaseStatus: isDatabaseConnected ? "Connected" : "Disconnected"
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Backend error",
      error: error.message,
      databaseStatus: "Error"
    });
  }
});

// -----------------
// AUTH ROUTES
// -----------------
app.post("/api/auth/register", validateRegister, async (req, res) => {
  if (!isDatabaseConnected) {
    return sendError(res, "Database temporarily unavailable. Please try again later.", 503);
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { first_name, last_name, email, password, role } = req.body;
    console.log('📝 Registration attempt:', { email, role });
    
    // Check if user exists
    const exists = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (exists.rows.length) {
      await client.query('ROLLBACK');
      return sendError(res, "Email already registered", 400);
    }

    // Get role_id
    const roleRes = await client.query("SELECT id FROM roles WHERE name = $1", [role]);
    if (!roleRes.rows.length) {
      await client.query('ROLLBACK');
      return sendError(res, "Invalid role specified", 400);
    }
    const role_id = roleRes.rows[0].id;

    // Hash password and create user
    const hash = await bcrypt.hash(password, 12);
    
    const insertRes = await client.query(
      `INSERT INTO users (role_id, first_name, last_name, email, password_hash) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, first_name, last_name, email, role_id`,
      [role_id, first_name || "", last_name || "", email, hash]
    );
    
    const user = insertRes.rows[0];

    // Get role name for token
    const roleNameRes = await client.query("SELECT name FROM roles WHERE id = $1", [role_id]);
    const roleName = roleNameRes.rows[0].name;

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: roleName,
        first_name: user.first_name,
        last_name: user.last_name
      }, 
      process.env.JWT_SECRET || "luct_reports_secret_2024", 
      { expiresIn: "24h" }
    );

    await client.query('COMMIT');
    
    console.log('✅ User registered successfully:', user.email);
    sendCreated(res, { 
      token, 
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: roleName
      }
    }, "Registration successful");

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Registration error:", error.message);
    sendError(res, "Registration failed: " + error.message);
  } finally {
    client.release();
  }
});

app.post("/api/auth/login", async (req, res) => {
  if (!isDatabaseConnected) {
    return sendError(res, "Database temporarily unavailable. Please try again later.", 503);
  }

  try {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, "Email and password are required", 400);

    console.log('🔐 Login attempt for:', email);

    // REMOVED is_active check
    const users = await executeQuery(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.password_hash, r.name AS role
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = $1`,
      [email]
    );
    
    if (!users.rows.length) {
      console.log('❌ Login failed: User not found');
      return sendError(res, "Invalid credentials", 400);
    }

    const user = users.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      console.log('❌ Login failed: Invalid password');
      return sendError(res, "Invalid credentials", 400);
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      }, 
      process.env.JWT_SECRET || "luct_reports_secret_2024", 
      { expiresIn: "24h" }
    );

    console.log('✅ User logged in successfully:', user.email);
    sendSuccess(res, { 
      token, 
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      }
    }, "Login successful");

  } catch (error) {
    console.error("❌ Login error:", error.message);
    sendError(res, "Login failed: " + error.message);
  }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    // REMOVED is_active check
    const users = await executeQuery(
      `SELECT u.id, u.email, u.first_name, u.last_name, r.name AS role
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1`,
      [req.user.id]
    );
    
    if (!users.rows.length) return sendError(res, "User not found", 404);
    
    sendSuccess(res, { user: users.rows[0] }, "User profile fetched successfully");
  } catch (error) {
    console.error("❌ Get user error:", error);
    sendError(res, "Failed to fetch user profile: " + error.message);
  }
});

// -----------------
// DATA ROUTES
// -----------------
app.get("/api/faculties", authenticateToken, async (req, res) => {
  try {
    const rows = await executeQuery("SELECT id, name FROM faculties ORDER BY name");
    sendSuccess(res, rows.rows, "Faculties fetched successfully");
  } catch (error) {
    console.error("❌ Faculties error:", error);
    sendError(res, "Failed to fetch faculties: " + error.message);
  }
});

app.get("/api/courses", authenticateToken, async (req, res) => {
  try {
    const rows = await executeQuery(
      `SELECT c.id, c.code, c.name as course_name, c.total_registered, f.name as faculty_name
       FROM courses c 
       JOIN faculties f ON c.faculty_id = f.id 
       ORDER BY c.name`
    );
    sendSuccess(res, rows.rows, "Courses fetched successfully");
  } catch (error) {
    console.error("❌ Courses error:", error);
    sendError(res, "Failed to fetch courses: " + error.message);
  }
});

app.get("/api/classes", authenticateToken, async (req, res) => {
  try {
    const rows = await executeQuery(
      `SELECT cl.id, cl.class_name, cl.venue, cl.scheduled_time,
              c.code as course_code, c.name as course_name, f.name as faculty_name,
              CONCAT(u.first_name, ' ', u.last_name) as lecturer_name
       FROM classes cl
       JOIN courses c ON cl.course_id = c.id
       JOIN faculties f ON c.faculty_id = f.id
       LEFT JOIN users u ON cl.lecturer_id = u.id
       ORDER BY cl.class_name`
    );
    sendSuccess(res, rows.rows, "Classes fetched successfully");
  } catch (error) {
    console.error("❌ Classes error:", error);
    sendError(res, "Failed to fetch classes: " + error.message);
  }
});

app.get("/api/my-classes", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Lecturer') {
      return sendError(res, "Access denied. Lecturers only.", 403);
    }

    const rows = await executeQuery(
      `SELECT cl.id, cl.class_name, cl.venue, cl.scheduled_time,
              c.code as course_code, c.name as course_name, f.name as faculty_name
       FROM classes cl
       JOIN courses c ON cl.course_id = c.id
       JOIN faculties f ON c.faculty_id = f.id
       WHERE cl.lecturer_id = $1
       ORDER BY cl.class_name`,
      [req.user.id]
    );

    sendSuccess(res, rows.rows, "My classes fetched successfully");

  } catch (error) {
    console.error("❌ My classes error:", error);
    sendError(res, "Failed to fetch your classes: " + error.message);
  }
});
// ========================
// COURSE MANAGEMENT ROUTES
// ========================
app.post("/api/courses", authenticateToken, async (req, res) => {
  try {
    const { name, code, faculty_id, total_registered } = req.body;

    if (!name || !code || !faculty_id || total_registered === undefined) {
      return sendError(res, "All fields are required", 400);
    }

    // Check if course code already exists
    const existingCourse = await executeQuery(
      "SELECT id FROM courses WHERE code = $1",
      [code]
    );

    if (existingCourse.rows.length > 0) {
      return sendError(res, "Course code already exists", 400);
    }

    const result = await executeQuery(
      "INSERT INTO courses (name, code, faculty_id, total_registered) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, code, faculty_id, total_registered]
    );

    sendCreated(res, result.rows[0], "Course created successfully");
  } catch (error) {
    console.error("❌ Create course error:", error);
    sendError(res, "Failed to create course: " + error.message);
  }
});

app.put("/api/courses/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, faculty_id, total_registered } = req.body;

    if (!name || !code || !faculty_id || total_registered === undefined) {
      return sendError(res, "All fields are required", 400);
    }

    // Check if course code already exists (excluding current course)
    const existingCourse = await executeQuery(
      "SELECT id FROM courses WHERE code = $1 AND id != $2",
      [code, id]
    );

    if (existingCourse.rows.length > 0) {
      return sendError(res, "Course code already exists", 400);
    }

    const result = await executeQuery(
      "UPDATE courses SET name = $1, code = $2, faculty_id = $3, total_registered = $4 WHERE id = $5 RETURNING *",
      [name, code, faculty_id, total_registered, id]
    );

    if (!result.rows.length) {
      return sendError(res, "Course not found", 404);
    }

    sendSuccess(res, result.rows[0], "Course updated successfully");
  } catch (error) {
    console.error("❌ Update course error:", error);
    sendError(res, "Failed to update course: " + error.message);
  }
});

app.delete("/api/courses/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if course has any reports
    const reportsCheck = await executeQuery(
      "SELECT id FROM reports WHERE course_id = $1 LIMIT 1",
      [id]
    );

    if (reportsCheck.rows.length > 0) {
      return sendError(res, "Cannot delete course with existing reports", 400);
    }

    const result = await executeQuery(
      "DELETE FROM courses WHERE id = $1 RETURNING *",
      [id]
    );

    if (!result.rows.length) {
      return sendError(res, "Course not found", 404);
    }

    sendSuccess(res, null, "Course deleted successfully");
  } catch (error) {
    console.error("❌ Delete course error:", error);
    sendError(res, "Failed to delete course: " + error.message);
  }
});

// ========================
// CLASS MANAGEMENT ROUTES
// ========================
app.post("/api/classes", authenticateToken, async (req, res) => {
  try {
    const { class_name, course_id, lecturer_id, venue, scheduled_time } = req.body;

    if (!class_name || !course_id) {
      return sendError(res, "Class name and course are required", 400);
    }

    const result = await executeQuery(
      "INSERT INTO classes (class_name, course_id, lecturer_id, venue, scheduled_time) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [class_name, course_id, lecturer_id || null, venue || null, scheduled_time || null]
    );

    sendCreated(res, result.rows[0], "Class created successfully");
  } catch (error) {
    console.error("❌ Create class error:", error);
    sendError(res, "Failed to create class: " + error.message);
  }
});

app.put("/api/classes/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { class_name, course_id, lecturer_id, venue, scheduled_time } = req.body;

    if (!class_name || !course_id) {
      return sendError(res, "Class name and course are required", 400);
    }

    const result = await executeQuery(
      "UPDATE classes SET class_name = $1, course_id = $2, lecturer_id = $3, venue = $4, scheduled_time = $5 WHERE id = $6 RETURNING *",
      [class_name, course_id, lecturer_id || null, venue || null, scheduled_time || null, id]
    );

    if (!result.rows.length) {
      return sendError(res, "Class not found", 404);
    }

    sendSuccess(res, result.rows[0], "Class updated successfully");
  } catch (error) {
    console.error("❌ Update class error:", error);
    sendError(res, "Failed to update class: " + error.message);
  }
});

app.delete("/api/classes/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if class has any reports
    const reportsCheck = await executeQuery(
      "SELECT id FROM reports WHERE class_id = $1 LIMIT 1",
      [id]
    );

    if (reportsCheck.rows.length > 0) {
      return sendError(res, "Cannot delete class with existing reports", 400);
    }

    const result = await executeQuery(
      "DELETE FROM classes WHERE id = $1 RETURNING *",
      [id]
    );

    if (!result.rows.length) {
      return sendError(res, "Class not found", 404);
    }

    sendSuccess(res, null, "Class deleted successfully");
  } catch (error) {
    console.error("❌ Delete class error:", error);
    sendError(res, "Failed to delete class: " + error.message);
  }
});

// ========================
// FEEDBACK MANAGEMENT ROUTES
// ========================
app.get("/api/reports/:id/feedback", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await executeQuery(
      `SELECT r.feedback, r.feedback_at, 
              CONCAT(u.first_name, ' ', u.last_name) as reviewer_name,
              u.role as reviewer_role
       FROM reports r
       JOIN users u ON r.feedback_by = u.id
       WHERE r.id = $1 AND r.feedback IS NOT NULL`,
      [id]
    );

    sendSuccess(res, result.rows, "Feedback fetched successfully");
  } catch (error) {
    console.error("❌ Get feedback error:", error);
    sendError(res, "Failed to fetch feedback: " + error.message);
  }
});

// ========================
// STUDENT MONITORING ROUTES
// ========================
app.get("/api/students/attendance", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Student') {
      return sendError(res, "Access denied. Students only.", 403);
    }

    const { course_id, month, time_range = 'current_semester' } = req.query;

    let query = `
      SELECT r.*, c.name as course_name, c.code as course_code,
             CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
             cl.class_name, f.name as faculty_name
      FROM reports r
      JOIN courses c ON r.course_id = c.id
      JOIN users u ON r.lecturer_id = u.id
      JOIN classes cl ON r.class_id = cl.id
      JOIN faculties f ON r.faculty_id = f.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    // Add course filter if provided
    if (course_id) {
      paramCount++;
      query += ` AND r.course_id = $${paramCount}`;
      params.push(course_id);
    }

    // Add time range filter
    if (time_range === 'last_7_days') {
      query += ` AND r.lecture_date >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (time_range === 'last_30_days') {
      query += ` AND r.lecture_date >= CURRENT_DATE - INTERVAL '30 days'`;
    } else if (time_range === 'current_semester') {
      query += ` AND r.lecture_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'`;
    }

    query += ` ORDER BY r.lecture_date DESC`;

    const result = await executeQuery(query, params);

    // Calculate attendance stats
    const totalClasses = result.rows.length;
    const attendedClasses = result.rows.filter(report => report.actual_present > 0).length;
    const attendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

    sendSuccess(res, {
      reports: result.rows,
      stats: {
        totalClasses,
        attendedClasses,
        missedClasses: totalClasses - attendedClasses,
        attendanceRate: Math.round(attendanceRate)
      }
    }, "Attendance data fetched successfully");

  } catch (error) {
    console.error("❌ Student attendance error:", error);
    sendError(res, "Failed to fetch attendance data: " + error.message);
  }
});

app.get("/api/students/stats", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Student') {
      return sendError(res, "Access denied. Students only.", 403);
    }

    const { time_range = 'current_semester' } = req.query;

    let dateFilter = '';
    if (time_range === 'last_7_days') {
      dateFilter = "AND r.lecture_date >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (time_range === 'last_30_days') {
      dateFilter = "AND r.lecture_date >= CURRENT_DATE - INTERVAL '30 days'";
    } else if (time_range === 'current_semester') {
      dateFilter = "AND r.lecture_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'";
    }

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT r.id) as total_classes,
        COUNT(DISTINCT CASE WHEN r.actual_present > 0 THEN r.id END) as attended_classes,
        COUNT(DISTINCT r.course_id) as courses_enrolled,
        COUNT(DISTINCT r.lecturer_id) as lecturers_count,
        EXTRACT(WEEK FROM CURRENT_DATE) as current_week
      FROM reports r
      WHERE 1=1 ${dateFilter}
    `;

    const statsResult = await executeQuery(statsQuery);

    const stats = statsResult.rows[0];
    const attendanceRate = stats.total_classes > 0 ? 
      (stats.attended_classes / stats.total_classes) * 100 : 0;

    sendSuccess(res, {
      overview: {
        total_classes: parseInt(stats.total_classes) || 0,
        attended_classes: parseInt(stats.attended_classes) || 0,
        missed_classes: parseInt(stats.total_classes) - parseInt(stats.attended_classes) || 0,
        attendance_rate: Math.round(attendanceRate) || 0,
        courses_enrolled: parseInt(stats.courses_enrolled) || 0,
        lecturers_count: parseInt(stats.lecturers_count) || 0,
        current_week: parseInt(stats.current_week) || 1
      }
    }, "Student stats fetched successfully");

  } catch (error) {
    console.error("❌ Student stats error:", error);
    sendError(res, "Failed to fetch student statistics: " + error.message);
  }
});

app.get("/api/students/performance", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Student') {
      return sendError(res, "Access denied. Students only.", 403);
    }

    const performanceQuery = `
      SELECT 
        c.id as course_id,
        c.name as course_name,
        c.code as course_code,
        COUNT(r.id) as total_classes,
        COUNT(CASE WHEN r.actual_present > 0 THEN r.id END) as attended_classes,
        CASE 
          WHEN COUNT(r.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN r.actual_present > 0 THEN r.id END)::decimal / COUNT(r.id)) * 100)
          ELSE 0 
        END as attendance_rate,
        COALESCE(AVG(rat.rating), 0) as performance_score,
        CASE 
          WHEN COALESCE(AVG(rat.rating), 0) >= 4.5 THEN 'A'
          WHEN COALESCE(AVG(rat.rating), 0) >= 3.5 THEN 'B'
          WHEN COALESCE(AVG(rat.rating), 0) >= 2.5 THEN 'C'
          WHEN COALESCE(AVG(rat.rating), 0) >= 1.5 THEN 'D'
          ELSE 'F'
        END as grade
      FROM courses c
      LEFT JOIN reports r ON c.id = r.course_id
      LEFT JOIN ratings rat ON c.id = rat.course_id AND rat.user_id = $1
      GROUP BY c.id, c.name, c.code
      HAVING COUNT(r.id) > 0
      ORDER BY c.name
    `;

    const result = await executeQuery(performanceQuery, [req.user.id]);

    sendSuccess(res, result.rows, "Performance data fetched successfully");

  } catch (error) {
    console.error("❌ Student performance error:", error);
    sendError(res, "Failed to fetch performance data: " + error.message);
  }
});

// ========================
// ANALYTICS ROUTES
// ========================
app.get("/api/analytics/overview", authenticateToken, async (req, res) => {
  try {
    if (!['PRL', 'Admin'].includes(req.user.role)) {
      return sendError(res, "Access denied. PRL and Admin only.", 403);
    }

    const overviewQuery = `
      SELECT 
        -- Overall stats
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN r.name = 'Student' THEN u.id END) as total_students,
        COUNT(DISTINCT CASE WHEN r.name = 'Lecturer' THEN u.id END) as total_lecturers,
        COUNT(DISTINCT c.id) as total_courses,
        COUNT(DISTINCT cl.id) as total_classes,
        COUNT(DISTINCT rep.id) as total_reports,
        
        -- Attendance stats
        ROUND(AVG(rep.actual_present::decimal / NULLIF(rep.total_registered, 0)) * 100, 2) as avg_attendance_rate,
        
        -- Rating stats
        ROUND(AVG(rat.rating), 2) as avg_rating,
        COUNT(rat.id) as total_ratings,
        
        -- Recent activity
        COUNT(DISTINCT CASE WHEN rep.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN rep.id END) as recent_reports,
        COUNT(DISTINCT CASE WHEN rat.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN rat.id END) as recent_ratings
        
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN courses c ON 1=1
      LEFT JOIN classes cl ON 1=1
      LEFT JOIN reports rep ON 1=1
      LEFT JOIN ratings rat ON 1=1
    `;

    const result = await executeQuery(overviewQuery);

    sendSuccess(res, result.rows[0], "Analytics overview fetched successfully");

  } catch (error) {
    console.error("❌ Analytics overview error:", error);
    sendError(res, "Failed to fetch analytics overview: " + error.message);
  }
});

app.get("/api/analytics/trends", authenticateToken, async (req, res) => {
  try {
    if (!['PRL', 'Admin'].includes(req.user.role)) {
      return sendError(res, "Access denied. PRL and Admin only.", 403);
    }

    const trendsQuery = `
      SELECT 
        DATE_TRUNC('week', rep.created_at) as week_start,
        COUNT(rep.id) as reports_count,
        ROUND(AVG(rep.actual_present::decimal / NULLIF(rep.total_registered, 0)) * 100, 2) as avg_attendance,
        COUNT(DISTINCT rep.lecturer_id) as active_lecturers,
        COUNT(DISTINCT rep.course_id) as courses_covered
      FROM reports rep
      WHERE rep.created_at >= CURRENT_DATE - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', rep.created_at)
      ORDER BY week_start DESC
      LIMIT 12
    `;

    const result = await executeQuery(trendsQuery);

    sendSuccess(res, result.rows, "Trends data fetched successfully");

  } catch (error) {
    console.error("❌ Analytics trends error:", error);
    sendError(res, "Failed to fetch trends data: " + error.message);
  }
});

// ========================
// USER MANAGEMENT ROUTES (Admin only)
// ========================
app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return sendError(res, "Access denied. Admin only.", 403);
    }

    const usersQuery = `
      SELECT 
        u.id, u.first_name, u.last_name, u.email, 
        r.name as role, u.created_at,
        COUNT(DISTINCT rep.id) as total_reports,
        COUNT(DISTINCT rat.id) as total_ratings
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN reports rep ON u.id = rep.lecturer_id
      LEFT JOIN ratings rat ON u.id = rat.user_id
      GROUP BY u.id, u.first_name, u.last_name, u.email, r.name, u.created_at
      ORDER BY u.created_at DESC
    `;

    const result = await executeQuery(usersQuery);

    sendSuccess(res, result.rows, "Users fetched successfully");

  } catch (error) {
    console.error("❌ Get users error:", error);
    sendError(res, "Failed to fetch users: " + error.message);
  }
});

app.put("/api/users/:id/role", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return sendError(res, "Access denied. Admin only.", 403);
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return sendError(res, "Role is required", 400);
    }

    // Get role_id from role name
    const roleRes = await executeQuery(
      "SELECT id FROM roles WHERE name = $1",
      [role]
    );

    if (!roleRes.rows.length) {
      return sendError(res, "Invalid role specified", 400);
    }

    const role_id = roleRes.rows[0].id;

    const result = await executeQuery(
      "UPDATE users SET role_id = $1 WHERE id = $2 RETURNING *",
      [role_id, id]
    );

    if (!result.rows.length) {
      return sendError(res, "User not found", 404);
    }

    sendSuccess(res, result.rows[0], "User role updated successfully");

  } catch (error) {
    console.error("❌ Update user role error:", error);
    sendError(res, "Failed to update user role: " + error.message);
  }
});

// ========================
// COURSE STATS ROUTE
// ========================
app.get("/api/reports/course-stats", authenticateToken, async (req, res) => {
  try {
    const courseStatsQuery = `
      SELECT 
        c.id,
        c.name as course_name,
        c.code as course_code,
        COUNT(r.id) as report_count,
        ROUND(AVG(r.actual_present::decimal / NULLIF(r.total_registered, 0)) * 100, 2) as avg_attendance,
        c.total_registered,
        COUNT(DISTINCT r.lecturer_id) as lecturers_count
      FROM courses c
      LEFT JOIN reports r ON c.id = r.course_id
      GROUP BY c.id, c.name, c.code, c.total_registered
      ORDER BY report_count DESC
    `;

    const result = await executeQuery(courseStatsQuery);

    sendSuccess(res, result.rows, "Course statistics fetched successfully");

  } catch (error) {
    console.error("❌ Course stats error:", error);
    sendError(res, "Failed to fetch course statistics: " + error.message);
  }
});

// ========================
// WEEKLY TREND ROUTE
// ========================
app.get("/api/reports/weekly-trend", authenticateToken, async (req, res) => {
  try {
    const weeklyTrendQuery = `
      SELECT 
        week_of_reporting as week,
        COUNT(id) as reports_count,
        ROUND(AVG(actual_present::decimal / NULLIF(total_registered, 0)) * 100, 2) as avg_attendance,
        COUNT(DISTINCT lecturer_id) as active_lecturers
      FROM reports
      WHERE week_of_reporting IS NOT NULL
      GROUP BY week_of_reporting
      ORDER BY week_of_reporting DESC
      LIMIT 10
    `;

    const result = await executeQuery(weeklyTrendQuery);

    sendSuccess(res, result.rows, "Weekly trends fetched successfully");

  } catch (error) {
    console.error("❌ Weekly trend error:", error);
    sendError(res, "Failed to fetch weekly trends: " + error.message);
  }
});
// ========================
// LECTURERS ROUTES
// ========================
app.get("/api/lecturers", authenticateToken, async (req, res) => {
  try {
    const rows = await executeQuery(
      `SELECT u.id, u.first_name, u.last_name, u.email,
              COUNT(DISTINCT r.id) as total_ratings,
              COALESCE(AVG(rat.rating), 0) as average_rating
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN ratings rat ON u.id = rat.lecturer_id
       WHERE r.name = 'Lecturer'
       GROUP BY u.id, u.first_name, u.last_name, u.email
       ORDER BY u.first_name, u.last_name`
    );

    sendSuccess(res, rows.rows, "Lecturers fetched successfully");
  } catch (error) {
    console.error("❌ Fetch Lecturers Error:", error);
    sendError(res, "Failed to fetch lecturers");
  }
});

// ========================
// ENHANCED RATINGS ROUTES
// ========================
app.get("/api/ratings/my-ratings", authenticateToken, async (req, res) => {
  try {
    const rows = await executeQuery(
      `SELECT r.*, 
              c.name as course_name, c.code as course_code,
              CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
              CASE 
                WHEN r.lecturer_id IS NOT NULL THEN 'lecturer'
                WHEN r.course_id IS NOT NULL THEN 'course'
              END as rating_type
       FROM ratings r
       LEFT JOIN courses c ON r.course_id = c.id
       LEFT JOIN users u ON r.lecturer_id = u.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    sendSuccess(res, rows.rows, "Your ratings fetched successfully");
  } catch (error) {
    console.error("❌ Fetch My Ratings Error:", error);
    sendError(res, "Failed to fetch your ratings");
  }
});

app.get("/api/ratings/lecturer", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "Lecturer") {
      return sendError(res, "Only lecturers can access this endpoint", 403);
    }

    const rows = await executeQuery(
      `SELECT r.*, 
              c.name as course_name, c.code as course_code,
              CONCAT(u.first_name, ' ', u.last_name) as student_name,
              u.email as student_email
       FROM ratings r
       LEFT JOIN courses c ON r.course_id = c.id
       JOIN users u ON r.user_id = u.id
       WHERE r.lecturer_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    sendSuccess(res, rows.rows, "Lecturer ratings fetched successfully");
  } catch (error) {
    console.error("❌ Fetch Lecturer Ratings Error:", error);
    sendError(res, "Failed to fetch ratings");
  }
});

app.post("/api/ratings", authenticateToken, async (req, res) => {
  try {
    const { lecturer_id, course_id, rating, comment } = req.body;

    if (!rating) {
      return sendError(res, "Rating is required", 400);
    }

    if (rating < 1 || rating > 5) {
      return sendError(res, "Rating must be between 1 and 5", 400);
    }

    // Validate that either lecturer_id or course_id is provided, but not both
    if ((!lecturer_id && !course_id) || (lecturer_id && course_id)) {
      return sendError(res, "Please rate either a lecturer or a course, but not both", 400);
    }

    // Check if user already rated this lecturer
    if (lecturer_id) {
      const existing = await executeQuery(
        "SELECT id FROM ratings WHERE user_id = $1 AND lecturer_id = $2",
        [req.user.id, lecturer_id]
      );

      if (existing.rows.length > 0) {
        return sendError(res, "You have already rated this lecturer", 400);
      }
    }

    // Check if user already rated this course
    if (course_id) {
      const existing = await executeQuery(
        "SELECT id FROM ratings WHERE user_id = $1 AND course_id = $2",
        [req.user.id, course_id]
      );

      if (existing.rows.length > 0) {
        return sendError(res, "You have already rated this course", 400);
      }
    }

    const result = await executeQuery(
      "INSERT INTO ratings (user_id, lecturer_id, course_id, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [req.user.id, lecturer_id || null, course_id || null, rating, comment || null]
    );

    sendCreated(res, result.rows[0], "Rating submitted successfully");
  } catch (error) {
    console.error("❌ Submit Rating Error:", error);
    if (error.code === '23505') {
      return sendError(res, "You have already submitted this rating", 400);
    }
    sendError(res, "Failed to submit rating");
  }
});

// -----------------
// REPORTS ROUTES
// -----------------
app.get("/api/reports", authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT r.*, f.name as faculty_name, cl.class_name,
             c.code as course_code, c.name as course_name,
             CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
             fb.first_name as feedback_by_first_name,
             fb.last_name as feedback_by_last_name
      FROM reports r
      JOIN faculties f ON r.faculty_id = f.id
      JOIN classes cl ON r.class_id = cl.id
      JOIN courses c ON r.course_id = c.id
      JOIN users u ON r.lecturer_id = u.id
      LEFT JOIN users fb ON r.feedback_by = fb.id
    `;

    // If user is a lecturer, only show their reports
    if (req.user.role === 'Lecturer') {
      query += ` WHERE r.lecturer_id = $1 ORDER BY r.created_at DESC LIMIT 50`;
      const rows = await executeQuery(query, [req.user.id]);
      return sendSuccess(res, rows.rows, "Reports fetched successfully");
    }

    // For other roles, show all reports
    query += ` ORDER BY r.created_at DESC LIMIT 50`;
    const rows = await executeQuery(query);
    sendSuccess(res, rows.rows, "Reports fetched successfully");

  } catch (error) {
    console.error("❌ Reports error:", error);
    sendError(res, "Failed to fetch reports: " + error.message);
  }
});

app.get("/api/reports/stats", authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT 
        COUNT(*) as total_reports,
        COALESCE(AVG(r.actual_present::float / NULLIF(r.total_registered, 0)) * 100, 0) as avg_attendance,
        COUNT(DISTINCT r.lecturer_id) as active_lecturers,
        COUNT(DISTINCT r.course_id) as courses_covered
      FROM reports r
    `;

    if (req.user.role === 'Lecturer') {
      query += ` WHERE r.lecturer_id = $1`;
      const stats = await executeQuery(query, [req.user.id]);
      return sendSuccess(res, {
        total_reports: parseInt(stats.rows[0].total_reports) || 0,
        avg_attendance: parseFloat(stats.rows[0].avg_attendance) || 0,
        active_lecturers: parseInt(stats.rows[0].active_lecturers) || 0,
        courses_covered: parseInt(stats.rows[0].courses_covered) || 0
      }, "Statistics fetched successfully");
    }

    const stats = await executeQuery(query);
    sendSuccess(res, {
      total_reports: parseInt(stats.rows[0].total_reports) || 0,
      avg_attendance: parseFloat(stats.rows[0].avg_attendance) || 0,
      active_lecturers: parseInt(stats.rows[0].active_lecturers) || 0,
      courses_covered: parseInt(stats.rows[0].courses_covered) || 0
    }, "Statistics fetched successfully");

  } catch (error) {
    console.error("❌ Stats error:", error);
    sendError(res, "Failed to fetch statistics: " + error.message);
  }
});

app.post("/api/reports", authenticateToken, validateReport, async (req, res) => {
  try {
    const {
      faculty_id,
      class_id,
      week_of_reporting,
      lecture_date,
      course_id,
      actual_present,
      total_registered,
      venue,
      scheduled_time,
      topic,
      learning_outcomes,
      recommendations,
    } = req.body;

    // Get course code for the report
    const courseRes = await executeQuery("SELECT code FROM courses WHERE id = $1", [course_id]);
    if (!courseRes.rows.length) return sendError(res, "Course not found", 404);
    const course_code = courseRes.rows[0].code;

    const insertRes = await executeQuery(
      `INSERT INTO reports (
        faculty_id, class_id, week_of_reporting, lecture_date,
        course_id, course_code, lecturer_id, actual_present, total_registered, 
        venue, scheduled_time, topic, learning_outcomes, recommendations, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()) 
       RETURNING id`,
      [
        faculty_id,
        class_id,
        week_of_reporting,
        lecture_date,
        course_id,
        course_code,
        req.user.id,
        actual_present,
        total_registered || 0,
        venue || null,
        scheduled_time || null,
        topic || '',
        learning_outcomes || '',
        recommendations || null,
      ]
    );

    console.log('✅ Report created successfully by user:', req.user.id);
    sendCreated(res, { id: insertRes.rows[0].id }, "Report created successfully");

  } catch (error) {
    console.error("❌ Create report error:", error);
    sendError(res, "Failed to create report: " + error.message);
  }
});

app.get("/api/reports/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await executeQuery(
      `SELECT r.*, f.name as faculty_name, cl.class_name,
              c.code as course_code, c.name as course_name,
              CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
              fb.first_name as feedback_by_first_name,
              fb.last_name as feedback_by_last_name
       FROM reports r
       JOIN faculties f ON r.faculty_id = f.id
       JOIN classes cl ON r.class_id = cl.id
       JOIN courses c ON r.course_id = c.id
       JOIN users u ON r.lecturer_id = u.id
       LEFT JOIN users fb ON r.feedback_by = fb.id
       WHERE r.id = $1`,
      [id]
    );

    if (!rows.rows.length) return sendError(res, "Report not found", 404);
    
    sendSuccess(res, rows.rows[0], "Report fetched successfully");
  } catch (error) {
    console.error("❌ Get report error:", error);
    sendError(res, "Failed to fetch report: " + error.message);
  }
});

app.post("/api/reports/:id/feedback", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    console.log(`📝 Submitting feedback for report ${id} by user ${req.user.id}`);

    const result = await executeQuery(
      `UPDATE reports SET feedback = $1, feedback_by = $2, feedback_at = NOW()
       WHERE id = $3 RETURNING *`,
      [feedback, req.user.id, id]
    );

    if (!result.rows.length) return sendError(res, "Report not found", 404);

    console.log('✅ Feedback submitted successfully');
    sendSuccess(res, result.rows[0], "Feedback submitted successfully");
  } catch (error) {
    console.error("❌ Feedback error:", error);
    sendError(res, "Failed to submit feedback: " + error.message);
  }
});

// ========================
// ENHANCED SEARCH ROUTE
// ========================
app.get("/api/search", authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return sendSuccess(res, { courses: [], reports: [], lecturers: [], users: [] });

    const searchTerm = `%${q}%`;

    // Search courses
    const coursesRes = await executeQuery(
      `SELECT c.id, c.code as course_code, c.name as course_name, 
              c.total_registered, f.name as faculty_name
       FROM courses c
       JOIN faculties f ON c.faculty_id = f.id
       WHERE (c.name ILIKE $1 OR c.code ILIKE $1)
       ORDER BY c.name
       LIMIT 10`,
      [searchTerm]
    );

    // Search reports
    const reportsRes = await executeQuery(
      `SELECT r.*, c.name as course_name, c.code as course_code,
              CONCAT(u.first_name, ' ', u.last_name) as lecturer_name
       FROM reports r
       JOIN courses c ON r.course_id = c.id
       JOIN users u ON r.lecturer_id = u.id
       WHERE c.name ILIKE $1 OR c.code ILIKE $1 OR r.topic ILIKE $1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [searchTerm]
    );

    // Search lecturers
    const lecturersRes = await executeQuery(
      `SELECT u.id, u.first_name, u.last_name, u.email
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE r.name = 'Lecturer' 
         AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.email ILIKE $1)
       ORDER BY u.first_name, u.last_name
       LIMIT 10`,
      [searchTerm]
    );

    // Search users (only for admin/PRL/PL)
    let usersRes = { rows: [] };
    if (["Admin", "PRL", "PL"].includes(req.user.role)) {
      usersRes = await executeQuery(
        `SELECT u.id, u.first_name, u.last_name, u.email, r.name as role
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.email ILIKE $1
         ORDER BY u.first_name, u.last_name
         LIMIT 10`,
        [searchTerm]
      );
    }

    sendSuccess(res, {
      courses: coursesRes.rows,
      reports: reportsRes.rows,
      lecturers: lecturersRes.rows,
      users: usersRes.rows
    }, "Search completed successfully");

  } catch (error) {
    console.error("❌ Search Error:", error);
    sendError(res, "Search failed: " + error.message);
  }
});

// -----------------
// HEALTH & ROOT
// -----------------
app.get("/api/health", async (req, res) => {
  try {
    await executeQuery('SELECT 1');
    sendSuccess(res, { 
      uptime: process.uptime(),
      database: 'connected',
      databaseStatus: isDatabaseConnected,
      timestamp: new Date().toISOString()
    }, "API is healthy");
  } catch (error) {
    sendSuccess(res, { 
      uptime: process.uptime(),
      database: 'disconnected',
      databaseStatus: false,
      timestamp: new Date().toISOString(),
      error: error.message
    }, "API is running but database is disconnected");
  }
});

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head><title>LUCT Reports API</title></head>
      <body>
        <h1>LUCT Reports API</h1>
        <p>PostgreSQL backend is running</p>
        <p>Database Status: ${isDatabaseConnected ? '✅ Connected' : '❌ Disconnected'}</p>
        <ul>
          <li><a href="/api/health">Health Check</a></li>
          <li><a href="/api/test">Test Endpoint</a></li>
          <li>Use existing accounts to login</li>
        </ul>
      </body>
    </html>
  `);
});

// -----------------
// Start server
// -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: Render.com PostgreSQL`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Using fallback'}`);
  console.log(`🌐 CORS Enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`📧 Pre-created accounts available (e.g., borotho@luct.ac.ls / password123)`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});