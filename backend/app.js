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