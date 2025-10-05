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

// Test database connection on startup and run migrations
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully');
    
    // Run schema migration to ensure class_name column exists
    console.log('🔄 Checking database schema...');
    
    // Check if class_name column exists in reports table
    const schemaCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'reports' AND column_name = 'class_name'
    `);
    
    if (schemaCheck.rows.length === 0) {
      console.log('🔄 Adding class_name column to reports table...');
      await client.query(`
        ALTER TABLE reports ADD COLUMN class_name VARCHAR(255)
      `);
      console.log('✅ Added class_name column to reports table');
    } else {
      console.log('✅ class_name column already exists in reports table');
    }
    
    client.release();
    isDatabaseConnected = true;
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    isDatabaseConnected = false;
    return false;
  }
}

initializeDatabase().then(success => {
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

// ---------- UPDATED Validation middlewares ----------
function validateRegister(req, res, next) {
  const { email, password, role } = req.body;
  if (!email || !password || !role) return sendError(res, "Email, password, and role are required", 400);
  if (!validateEmail(email)) return sendError(res, "Invalid email format", 400);
  if (password.length < 6) return sendError(res, "Password must be at least 6 characters long", 400);
  const validRoles = ["Student", "Lecturer", "PRL", "PL", "Admin"];
  if (!validRoles.includes(role)) return sendError(res, "Invalid role specified", 400);
  next();
}

// UPDATED: Improved week validation that handles both numbers and "week X" format
function validateReport(req, res, next) {
  const { class_name, week_of_reporting, lecture_date, course_id, actual_present } = req.body;
  
  // Updated to require class_name instead of class_id
  if (!class_name || !week_of_reporting || !lecture_date || !course_id || actual_present === undefined) {
    return sendError(res, "All required fields must be filled", 400);
  }
  
  // Validate class name format (BSCSEM1-A, BSCITY2-B, etc.)
  const classRegex = /^[A-Z]{3,}[A-Z0-9]*-\w+$/;
  if (!class_name.match(classRegex)) {
    return sendError(res, "Class name must be in format: ProgramCodeYear-Group (e.g., BSCSEM1-A, BSCITY2-B)", 400);
  }
  
  // IMPROVED: Better week validation that handles both numbers and "week X" format
  let weekNumber = week_of_reporting;
  
  // If it's a string, try to extract number from "week X" format
  if (typeof week_of_reporting === 'string') {
    const weekMatch = week_of_reporting.match(/\d+/);
    if (weekMatch) {
      weekNumber = parseInt(weekMatch[0]);
    } else {
      // Try to parse as number directly
      weekNumber = parseInt(week_of_reporting);
    }
  }
  
  // Final validation
  if (isNaN(weekNumber) || Number(weekNumber) < 1 || Number(weekNumber) > 52) {
    return sendError(res, "Week must be a number between 1 and 52", 400);
  }
  
  if (Number(actual_present) < 0) return sendError(res, "Actual present cannot be negative", 400);
  
  const lectureDate = new Date(lecture_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison
  
  if (lectureDate > today) {
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

// -----------------
// UPDATED REPORTS ROUTES - Now using ONLY class_name (class_id removed)
// -----------------
app.get("/api/reports", authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT r.*, f.name as faculty_name, r.class_name,
             c.code as course_code, c.name as course_name,
             CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
             fb.first_name as feedback_by_first_name,
             fb.last_name as feedback_by_last_name
      FROM reports r
      JOIN faculties f ON r.faculty_id = f.id
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

// FIXED: Report creation - class_name column now exists
app.post("/api/reports", authenticateToken, validateReport, async (req, res) => {
  if (!isDatabaseConnected) {
    return sendError(res, "Database temporarily unavailable. Please try again later.", 503);
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      faculty_id,
      class_name,
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

    console.log('📝 Creating report with class name:', class_name);

    // Get course code for the report
    const courseRes = await client.query("SELECT code FROM courses WHERE id = $1", [course_id]);
    if (!courseRes.rows.length) {
      await client.query('ROLLBACK');
      return sendError(res, "Course not found", 404);
    }
    const course_code = courseRes.rows[0].code;

    const insertRes = await client.query(
      `INSERT INTO reports (
        faculty_id, class_name, week_of_reporting, lecture_date,
        course_id, course_code, lecturer_id, actual_present, total_registered, 
        venue, scheduled_time, topic, learning_outcomes, recommendations, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()) 
       RETURNING id, class_name`,
      [
        faculty_id,
        class_name.toUpperCase(),
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

    await client.query('COMMIT');
    
    console.log('✅ Report created successfully:', {
      id: insertRes.rows[0].id,
      class_name: insertRes.rows[0].class_name,
      lecturer: req.user.id
    });
    
    sendCreated(res, { 
      id: insertRes.rows[0].id,
      class_name: insertRes.rows[0].class_name
    }, "Report created successfully");

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Create report error:", error);
    
    // Handle specific database errors
    if (error.code === '42703') { // undefined column error
      return sendError(res, "Database schema needs update. Please add 'class_name' column to reports table.", 500);
    }
    
    sendError(res, "Failed to create report: " + error.message);
  } finally {
    client.release();
  }
});

app.get("/api/reports/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await executeQuery(
      `SELECT r.*, f.name as faculty_name, r.class_name,
              c.code as course_code, c.name as course_name,
              CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
              fb.first_name as feedback_by_first_name,
              fb.last_name as feedback_by_last_name
       FROM reports r
       JOIN faculties f ON r.faculty_id = f.id
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
// HEALTH & ROOT
// ========================
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