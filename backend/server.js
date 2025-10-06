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
  connectionString: process.env.DATABASE_URL || "postgresql://luct_reports_user:VfNK4tNbsVQ58Bvh4glC1dVQ4cPDjbm5@dpg-cv8dqpaen0hk4nq9v9q0-a.oregon-postgres.render.com/luct_reports_47k5",
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
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

// ========================
// CORS CONFIGURATION
// ========================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://frontend-cbjcz3iqp-thomonyaneneo-gmailcoms-projects.vercel.app',
  'https://frontend-git-main-thomonyaneneo-gmailcoms-projects.vercel.app',
  'https://frontend-thomonyaneneo-gmailcoms-projects.vercel.app',
  'https://luct-reporting-app.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS allowed for origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// Handle preflight requests
app.options('*', cors(corsOptions));

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
  const { class_name, week_of_reporting, lecture_date, course_id, actual_present } = req.body;
  
  if (!class_name || !week_of_reporting || !lecture_date || !course_id || actual_present === undefined) {
    return sendError(res, "All required fields must be filled", 400);
  }
  
  const classRegex = /^[A-Z]{3,}[A-Z0-9]*-\w+$/;
  if (!class_name.match(classRegex)) {
    return sendError(res, "Class name must be in format: ProgramCodeYear-Group (e.g., BSCSEM1-A, BSCITY2-B)", 400);
  }
  
  let weekNumber = week_of_reporting;
  
  if (typeof week_of_reporting === 'string') {
    const weekMatch = week_of_reporting.match(/\d+/);
    if (weekMatch) {
      weekNumber = parseInt(weekMatch[0]);
    } else {
      weekNumber = parseInt(week_of_reporting);
    }
  }
  
  if (isNaN(weekNumber) || Number(weekNumber) < 1 || Number(weekNumber) > 52) {
    return sendError(res, "Week must be a number between 1 and 52", 400);
  }
  
  if (Number(actual_present) < 0) return sendError(res, "Actual present cannot be negative", 400);
  
  const lectureDate = new Date(lecture_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (lectureDate > today) {
    return sendError(res, "Lecture date cannot be in the future", 400);
  }
  
  req.body.week_of_reporting = Number(weekNumber);
  next();
}

// ========================
// RATINGS VALIDATION
// ========================
function validateRating(req, res, next) {
  const { lecturer_id, course_id, rating, comment, rating_type } = req.body;
  
  if (!lecturer_id || !course_id || !rating || !rating_type) {
    return sendError(res, "Lecturer, course, rating, and rating type are required", 400);
  }
  
  if (rating < 1 || rating > 5) {
    return sendError(res, "Rating must be between 1 and 5", 400);
  }
  
  const validRatingTypes = ["teaching", "subject_knowledge", "communication", "punctuality", "overall"];
  if (!validRatingTypes.includes(rating_type)) {
    return sendError(res, "Invalid rating type", 400);
  }
  
  if (comment && comment.length > 500) {
    return sendError(res, "Comment must be less than 500 characters", 400);
  }
  
  next();
}

// ========================
// CLASS VALIDATION
// ========================
function validateClass(req, res, next) {
  const { class_name, course_id } = req.body;
  
  if (!class_name || !course_id) {
    return sendError(res, "Class name and course are required", 400);
  }
  
  if (class_name.length < 2) {
    return sendError(res, "Class name must be at least 2 characters long", 400);
  }
  
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
      databaseStatus: isDatabaseConnected ? "Connected" : "Disconnected",
      cors: "Enabled for Vercel deployment",
      environment: process.env.NODE_ENV || "development"
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
    
    const exists = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (exists.rows.length) {
      await client.query('ROLLBACK');
      return sendError(res, "Email already registered", 400);
    }

    const roleRes = await client.query("SELECT id FROM roles WHERE name = $1", [role]);
    if (!roleRes.rows.length) {
      await client.query('ROLLBACK');
      return sendError(res, "Invalid role specified", 400);
    }
    const role_id = roleRes.rows[0].id;

    const hash = await bcrypt.hash(password, 12);
    
    const insertRes = await client.query(
      `INSERT INTO users (role_id, first_name, last_name, email, password_hash) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, first_name, last_name, email, role_id`,
      [role_id, first_name || "", last_name || "", email, hash]
    );
    
    const user = insertRes.rows[0];

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

// ========================
// ENHANCED CLASSES ENDPOINTS
// ========================
app.get("/api/classes", authenticateToken, async (req, res) => {
  try {
    console.log('📚 Fetching classes for user:', req.user.email, 'Role:', req.user.role);
    
    const rows = await executeQuery(
      `SELECT 
        cl.id, 
        cl.class_name as name,
        cl.class_name as code,
        cl.venue,
        cl.scheduled_time as schedule,
        c.name as course_name,
        c.code as course_code,
        f.name as faculty_name,
        CONCAT(u.first_name, ' ', u.last_name) as instructor_name,
        u.id as instructor_id,
        -- Mock data for frontend compatibility
        30 as enrolled_students,
        1 as sections,
        'active' as status,
        'Class description for ' || cl.class_name as description
       FROM classes cl
       LEFT JOIN courses c ON cl.course_id = c.id
       LEFT JOIN faculties f ON c.faculty_id = f.id
       LEFT JOIN users u ON cl.lecturer_id = u.id
       ORDER BY cl.class_name`
    );

    console.log('✅ Classes fetched successfully:', rows.rows.length, 'classes found');
    
    // Enhanced response with better structure
    const classesData = rows.rows.map(cls => ({
      id: cls.id,
      code: cls.code || `CLASS-${cls.id}`,
      name: cls.name || `Class ${cls.id}`,
      description: cls.description || 'No description available',
      status: cls.status || 'active',
      enrolled_students: cls.enrolled_students || 0,
      sections: cls.sections || 1,
      instructor_name: cls.instructor_name || 'TBA',
      instructor_id: cls.instructor_id,
      schedule: cls.schedule || 'Schedule not set',
      venue: cls.venue || 'Venue not set',
      course_name: cls.course_name,
      course_code: cls.course_code,
      faculty_name: cls.faculty_name
    }));

    sendSuccess(res, classesData, "Classes fetched successfully");

  } catch (error) {
    console.error("❌ Classes error:", error);
    
    // Provide fallback data if database query fails
    if (error.message.includes('relation "classes" does not exist')) {
      console.log('⚠️ Classes table does not exist, providing fallback data');
      
      const fallbackClasses = [
        {
          id: 1,
          code: 'BSCSEM1-A',
          name: 'Software Engineering Methodology',
          description: 'Introduction to software engineering principles and methodologies',
          status: 'active',
          enrolled_students: 45,
          sections: 2,
          instructor_name: 'Dr. Sarah Johnson',
          schedule: 'Mon/Wed 10:00 AM - 11:30 AM',
          venue: 'Lab 101',
          course_name: 'Software Engineering',
          course_code: 'CS301'
        },
        {
          id: 2,
          code: 'BSCITY2-B',
          name: 'Database Systems',
          description: 'Fundamentals of database design and management',
          status: 'active',
          enrolled_students: 38,
          sections: 1,
          instructor_name: 'Prof. Michael Chen',
          schedule: 'Tue/Thu 2:00 PM - 3:30 PM',
          venue: 'Room 205',
          course_name: 'Database Management',
          course_code: 'CS202'
        },
        {
          id: 3,
          code: 'BSCNET3-C',
          name: 'Network Security',
          description: 'Advanced network security protocols and implementation',
          status: 'upcoming',
          enrolled_students: 0,
          sections: 1,
          instructor_name: 'Dr. Emily Rodriguez',
          schedule: 'Fri 1:00 PM - 4:00 PM',
          venue: 'Lab 302',
          course_name: 'Network Security',
          course_code: 'CS405'
        }
      ];
      
      return sendSuccess(res, fallbackClasses, "Classes fetched successfully (fallback data)");
    }
    
    sendError(res, "Failed to fetch classes: " + error.message);
  }
});

// ========================
// PROGRAM CLASSES ENDPOINT
// ========================
app.get("/api/programs/:programId/classes", authenticateToken, async (req, res) => {
  try {
    const { programId } = req.params;
    console.log('📚 Fetching program classes for program:', programId);
    
    // For now, return all classes since we don't have program-specific logic
    const rows = await executeQuery(
      `SELECT 
        cl.id, 
        cl.class_name as name,
        cl.class_name as code,
        cl.venue,
        cl.scheduled_time as schedule,
        c.name as course_name,
        CONCAT(u.first_name, ' ', u.last_name) as instructor_name,
        30 as enrolled_students,
        1 as sections,
        'active' as status,
        'Class description for ' || cl.class_name as description
       FROM classes cl
       LEFT JOIN courses c ON cl.course_id = c.id
       LEFT JOIN users u ON cl.lecturer_id = u.id
       WHERE cl.class_name ILIKE $1
       ORDER BY cl.class_name`,
      [`%${programId}%`]
    );

    console.log('✅ Program classes fetched successfully:', rows.rows.length, 'classes found');
    
    const classesData = rows.rows.map(cls => ({
      id: cls.id,
      code: cls.code,
      name: cls.name,
      description: cls.description,
      status: cls.status,
      enrolled_students: cls.enrolled_students,
      sections: cls.sections,
      instructor_name: cls.instructor_name,
      schedule: cls.schedule,
      venue: cls.venue,
      course_name: cls.course_name
    }));

    sendSuccess(res, classesData, "Program classes fetched successfully");

  } catch (error) {
    console.error("❌ Program classes error:", error);
    
    // Fallback to regular classes endpoint
    try {
      console.log('🔄 Falling back to regular classes endpoint');
      const regularClasses = await executeQuery(
        `SELECT 
          cl.id, 
          cl.class_name as name,
          cl.class_name as code,
          cl.venue,
          cl.scheduled_time as schedule,
          c.name as course_name,
          CONCAT(u.first_name, ' ', u.last_name) as instructor_name,
          30 as enrolled_students,
          1 as sections,
          'active' as status
         FROM classes cl
         LEFT JOIN courses c ON cl.course_id = c.id
         LEFT JOIN users u ON cl.lecturer_id = u.id
         ORDER BY cl.class_name
         LIMIT 20`
      );
      
      sendSuccess(res, regularClasses.rows, "Program classes fetched successfully (fallback)");
    } catch (fallbackError) {
      sendError(res, "Failed to fetch program classes: " + error.message);
    }
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
             COUNT(DISTINCT r.id) as total_reports,
             COUNT(DISTINCT c.id) as courses_taught,
             COALESCE(AVG(rat.rating), 0) as avg_rating
       FROM users u
       LEFT JOIN reports r ON u.id = r.lecturer_id
       LEFT JOIN classes cl ON u.id = cl.lecturer_id
       LEFT JOIN courses c ON cl.course_id = c.id
       LEFT JOIN ratings rat ON u.id = rat.lecturer_id
       WHERE u.role_id = (SELECT id FROM roles WHERE name = 'Lecturer')
       GROUP BY u.id, u.first_name, u.last_name, u.email
       ORDER BY u.first_name, u.last_name`
    );
    sendSuccess(res, rows.rows, "Lecturers fetched successfully");
  } catch (error) {
    console.error("❌ Lecturers error:", error);
    sendError(res, "Failed to fetch lecturers: " + error.message);
  }
});

// -----------------
// REPORTS ROUTES
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

    if (req.user.role === 'Lecturer') {
      query += ` WHERE r.lecturer_id = $1 ORDER BY r.created_at DESC LIMIT 50`;
      const rows = await executeQuery(query, [req.user.id]);
      return sendSuccess(res, rows.rows, "Reports fetched successfully");
    }

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
    
    if (error.code === '42703') {
      return sendError(res, "Database schema error: " + error.message, 500);
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
// RATINGS ROUTES
// ========================
app.get("/api/ratings", authenticateToken, async (req, res) => {
  try {
    const rows = await executeQuery(
      `SELECT r.*, 
              CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
              c.name as course_name,
              c.code as course_code,
              CONCAT(stud.first_name, ' ', stud.last_name) as student_name
       FROM ratings r
       JOIN users u ON r.lecturer_id = u.id
       JOIN courses c ON r.course_id = c.id
       JOIN users stud ON r.student_id = stud.id
       ORDER BY r.created_at DESC
       LIMIT 100`
    );
    sendSuccess(res, rows.rows, "Ratings fetched successfully");
  } catch (error) {
    console.error("❌ Ratings error:", error);
    sendError(res, "Failed to fetch ratings: " + error.message);
  }
});

app.get("/api/ratings/my-ratings", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Student') {
      return sendError(res, "Access denied. Students only.", 403);
    }

    const rows = await executeQuery(
      `SELECT r.*, 
              CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
              c.name as course_name,
              c.code as course_code
       FROM ratings r
       JOIN users u ON r.lecturer_id = u.id
       JOIN courses c ON r.course_id = c.id
       WHERE r.student_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    sendSuccess(res, rows.rows, "My ratings fetched successfully");
  } catch (error) {
    console.error("❌ My ratings error:", error);
    sendError(res, "Failed to fetch your ratings: " + error.message);
  }
});

app.get("/api/ratings/lecturer", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Lecturer') {
      return sendError(res, "Access denied. Lecturers only.", 403);
    }

    const rows = await executeQuery(
      `SELECT r.*, 
              c.name as course_name,
              c.code as course_code,
              CONCAT(stud.first_name, ' ', stud.last_name) as student_name
       FROM ratings r
       JOIN courses c ON r.course_id = c.id
       JOIN users stud ON r.student_id = stud.id
       WHERE r.lecturer_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    sendSuccess(res, rows.rows, "Lecturer ratings fetched successfully");
  } catch (error) {
    console.error("❌ Lecturer ratings error:", error);
    sendError(res, "Failed to fetch lecturer ratings: " + error.message);
  }
});

app.post("/api/ratings", authenticateToken, validateRating, async (req, res) => {
  if (!isDatabaseConnected) {
    return sendError(res, "Database temporarily unavailable. Please try again later.", 503);
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { lecturer_id, course_id, rating, comment, rating_type } = req.body;

    console.log('⭐ Rating submission:', { 
      lecturer_id, 
      course_id, 
      rating, 
      rating_type,
      student_id: req.user.id 
    });

    // Check if student has already rated this lecturer for this course and rating type
    const existingRating = await client.query(
      `SELECT id FROM ratings 
       WHERE student_id = $1 AND lecturer_id = $2 AND course_id = $3 AND rating_type = $4`,
      [req.user.id, lecturer_id, course_id, rating_type]
    );

    if (existingRating.rows.length > 0) {
      await client.query('ROLLBACK');
      return sendError(res, "You have already rated this lecturer for this course and rating type", 400);
    }

    const insertRes = await client.query(
      `INSERT INTO ratings (student_id, lecturer_id, course_id, rating, comment, rating_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, rating, rating_type`,
      [req.user.id, lecturer_id, course_id, rating, comment || null, rating_type]
    );

    await client.query('COMMIT');
    
    console.log('✅ Rating submitted successfully:', {
      id: insertRes.rows[0].id,
      rating: insertRes.rows[0].rating,
      rating_type: insertRes.rows[0].rating_type
    });
    
    sendCreated(res, { 
      id: insertRes.rows[0].id,
      rating: insertRes.rows[0].rating,
      rating_type: insertRes.rows[0].rating_type
    }, "Rating submitted successfully");

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Submit rating error:", error);
    sendError(res, "Failed to submit rating: " + error.message);
  } finally {
    client.release();
  }
});

// Get lecturer rating statistics
app.get("/api/ratings/lecturer/:id/stats", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await executeQuery(
      `SELECT 
        rating_type,
        COUNT(*) as total_ratings,
        ROUND(AVG(rating), 2) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
       FROM ratings
       WHERE lecturer_id = $1
       GROUP BY rating_type
       ORDER BY rating_type`,
      [id]
    );

    const overallStats = await executeQuery(
      `SELECT 
        ROUND(AVG(rating), 2) as overall_rating,
        COUNT(*) as total_ratings
       FROM ratings
       WHERE lecturer_id = $1`,
      [id]
    );

    const recentComments = await executeQuery(
      `SELECT r.comment, r.rating, r.created_at,
              c.name as course_name,
              CONCAT(u.first_name, ' ', u.last_name) as student_name
       FROM ratings r
       JOIN courses c ON r.course_id = c.id
       JOIN users u ON r.student_id = u.id
       WHERE r.lecturer_id = $1 AND r.comment IS NOT NULL
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [id]
    );

    sendSuccess(res, {
      rating_breakdown: stats.rows,
      overall: overallStats.rows[0] || { overall_rating: 0, total_ratings: 0 },
      recent_comments: recentComments.rows
    }, "Lecturer rating statistics fetched successfully");

  } catch (error) {
    console.error("❌ Lecturer stats error:", error);
    sendError(res, "Failed to fetch lecturer statistics: " + error.message);
  }
});

// Get course rating statistics
app.get("/api/ratings/course/:id/stats", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await executeQuery(
      `SELECT 
        r.rating_type,
        COUNT(*) as total_ratings,
        ROUND(AVG(r.rating), 2) as average_rating,
        CONCAT(u.first_name, ' ', u.last_name) as lecturer_name
       FROM ratings r
       JOIN users u ON r.lecturer_id = u.id
       WHERE r.course_id = $1
       GROUP BY r.rating_type, u.first_name, u.last_name
       ORDER BY r.rating_type, lecturer_name`,
      [id]
    );

    sendSuccess(res, stats.rows, "Course rating statistics fetched successfully");
  } catch (error) {
    console.error("❌ Course stats error:", error);
    sendError(res, "Failed to fetch course statistics: " + error.message);
  }
});

// ========================
// ENHANCED CLASS MANAGEMENT ROUTES
// ========================
app.post("/api/classes", authenticateToken, validateClass, async (req, res) => {
  if (!isDatabaseConnected) {
    return sendError(res, "Database temporarily unavailable. Please try again later.", 503);
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { class_name, course_id, lecturer_id, venue, scheduled_time, description } = req.body;

    console.log('📝 Creating class:', { class_name, course_id, lecturer_id });

    // Check if course exists
    const courseRes = await client.query("SELECT name, code FROM courses WHERE id = $1", [course_id]);
    if (!courseRes.rows.length) {
      await client.query('ROLLBACK');
      return sendError(res, "Course not found", 404);
    }

    const course = courseRes.rows[0];

    const result = await client.query(
      `INSERT INTO classes (class_name, course_id, lecturer_id, venue, scheduled_time) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [class_name, course_id, lecturer_id || null, venue || null, scheduled_time || null]
    );

    const newClass = result.rows[0];
    
    // Get instructor name if lecturer_id is provided
    let instructor_name = 'TBA';
    if (lecturer_id) {
      const lecturerRes = await client.query(
        "SELECT CONCAT(first_name, ' ', last_name) as name FROM users WHERE id = $1",
        [lecturer_id]
      );
      if (lecturerRes.rows.length) {
        instructor_name = lecturerRes.rows[0].name;
      }
    }

    await client.query('COMMIT');
    
    // Enhanced response with frontend-compatible structure
    const classResponse = {
      id: newClass.id,
      code: newClass.class_name,
      name: newClass.class_name,
      description: description || `Class for ${course.name}`,
      status: 'active',
      enrolled_students: 0,
      sections: 1,
      instructor_name: instructor_name,
      instructor_id: lecturer_id,
      schedule: newClass.scheduled_time || 'Schedule not set',
      venue: newClass.venue || 'Venue not set',
      course_name: course.name,
      course_code: course.code
    };

    console.log('✅ Class created successfully:', classResponse.name);
    sendCreated(res, classResponse, "Class created successfully");

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Create class error:", error);
    
    // Handle table doesn't exist error
    if (error.message.includes('relation "classes" does not exist')) {
      return sendError(res, "Classes table not configured. Please check database setup.", 500);
    }
    
    // Handle duplicate class name
    if (error.code === '23505') {
      return sendError(res, "Class name already exists", 400);
    }
    
    sendError(res, "Failed to create class: " + error.message);
  } finally {
    client.release();
  }
});

app.put("/api/classes/:id", authenticateToken, validateClass, async (req, res) => {
  if (!isDatabaseConnected) {
    return sendError(res, "Database temporarily unavailable. Please try again later.", 503);
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { class_name, course_id, lecturer_id, venue, scheduled_time, description } = req.body;

    console.log('📝 Updating class:', id);

    // Check if class exists
    const existingClass = await client.query("SELECT * FROM classes WHERE id = $1", [id]);
    if (!existingClass.rows.length) {
      await client.query('ROLLBACK');
      return sendError(res, "Class not found", 404);
    }

    // Check if course exists
    const courseRes = await client.query("SELECT name, code FROM courses WHERE id = $1", [course_id]);
    if (!courseRes.rows.length) {
      await client.query('ROLLBACK');
      return sendError(res, "Course not found", 404);
    }

    const course = courseRes.rows[0];

    const result = await client.query(
      `UPDATE classes 
       SET class_name = $1, course_id = $2, lecturer_id = $3, venue = $4, scheduled_time = $5 
       WHERE id = $6 
       RETURNING *`,
      [class_name, course_id, lecturer_id || null, venue || null, scheduled_time || null, id]
    );

    // Get instructor name if lecturer_id is provided
    let instructor_name = 'TBA';
    if (lecturer_id) {
      const lecturerRes = await client.query(
        "SELECT CONCAT(first_name, ' ', last_name) as name FROM users WHERE id = $1",
        [lecturer_id]
      );
      if (lecturerRes.rows.length) {
        instructor_name = lecturerRes.rows[0].name;
      }
    }

    await client.query('COMMIT');

    const updatedClass = result.rows[0];
    const classResponse = {
      id: updatedClass.id,
      code: updatedClass.class_name,
      name: updatedClass.class_name,
      description: description || `Class for ${course.name}`,
      status: 'active',
      enrolled_students: 30, // Mock data for now
      sections: 1,
      instructor_name: instructor_name,
      instructor_id: lecturer_id,
      schedule: updatedClass.scheduled_time || 'Schedule not set',
      venue: updatedClass.venue || 'Venue not set',
      course_name: course.name,
      course_code: course.code
    };

    console.log('✅ Class updated successfully:', classResponse.name);
    sendSuccess(res, classResponse, "Class updated successfully");

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Update class error:", error);
    
    // Handle duplicate class name
    if (error.code === '23505') {
      return sendError(res, "Class name already exists", 400);
    }
    
    sendError(res, "Failed to update class: " + error.message);
  } finally {
    client.release();
  }
});

app.delete("/api/classes/:id", authenticateToken, async (req, res) => {
  if (!isDatabaseConnected) {
    return sendError(res, "Database temporarily unavailable. Please try again later.", 503);
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    console.log('🗑️ Deleting class:', id);

    // Check if class exists
    const existingClass = await client.query("SELECT * FROM classes WHERE id = $1", [id]);
    if (!existingClass.rows.length) {
      await client.query('ROLLBACK');
      return sendError(res, "Class not found", 404);
    }

    // Check if class has reports
    const reportsCheck = await client.query(
      "SELECT id FROM reports WHERE class_name = $1 LIMIT 1",
      [existingClass.rows[0].class_name]
    );

    if (reportsCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return sendError(res, "Cannot delete class with existing reports", 400);
    }

    const result = await client.query(
      "DELETE FROM classes WHERE id = $1 RETURNING *",
      [id]
    );

    await client.query('COMMIT');

    console.log('✅ Class deleted successfully:', result.rows[0].class_name);
    sendSuccess(res, null, "Class deleted successfully");

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Delete class error:", error);
    sendError(res, "Failed to delete class: " + error.message);
  } finally {
    client.release();
  }
});

// ========================
// SEARCH ROUTES
// ========================
app.get("/api/search", authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return sendError(res, "Search query must be at least 2 characters long", 400);
    }

    const searchTerm = `%${q}%`;
    
    // Search courses
    const courses = await executeQuery(
      `SELECT id, code, name as course_name, 'course' as type
       FROM courses 
       WHERE code ILIKE $1 OR name ILIKE $1
       LIMIT 10`,
      [searchTerm]
    );

    // Search lecturers
    const lecturers = await executeQuery(
      `SELECT id, CONCAT(first_name, ' ', last_name) as name, 'lecturer' as type
       FROM users 
       WHERE role_id = (SELECT id FROM roles WHERE name = 'Lecturer')
       AND (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)
       LIMIT 10`,
      [searchTerm]
    );

    // Search classes
    const classes = await executeQuery(
      `SELECT id, class_name as name, 'class' as type
       FROM classes 
       WHERE class_name ILIKE $1
       LIMIT 10`,
      [searchTerm]
    );

    sendSuccess(res, {
      courses: courses.rows,
      lecturers: lecturers.rows,
      classes: classes.rows
    }, "Search results fetched successfully");

  } catch (error) {
    console.error("❌ Search error:", error);
    sendError(res, "Failed to perform search: " + error.message);
  }
});

// ========================
// STUDENT ROUTES
// ========================
app.get("/api/students/attendance", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Student') {
      return sendError(res, "Access denied. Students only.", 403);
    }

    const rows = await executeQuery(
      `SELECT c.name as course_name, c.code as course_code,
              r.week_of_reporting, r.lecture_date, r.actual_present, r.total_registered,
              CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
              ROUND((r.actual_present::float / NULLIF(r.total_registered, 0)) * 100, 2) as attendance_percentage
       FROM reports r
       JOIN courses c ON r.course_id = c.id
       JOIN users u ON r.lecturer_id = u.id
       WHERE r.class_name LIKE $1
       ORDER BY r.lecture_date DESC
       LIMIT 50`,
      [`%${req.user.role === 'Student' ? req.user.id : ''}%`]
    );

    sendSuccess(res, rows.rows, "Student attendance fetched successfully");
  } catch (error) {
    console.error("❌ Student attendance error:", error);
    sendError(res, "Failed to fetch student attendance: " + error.message);
  }
});

app.get("/api/students/stats", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Student') {
      return sendError(res, "Access denied. Students only.", 403);
    }

    const stats = await executeQuery(
      `SELECT 
        COUNT(DISTINCT r.course_id) as total_courses,
        COUNT(*) as total_classes,
        ROUND(AVG(r.actual_present::float / NULLIF(r.total_registered, 0)) * 100, 2) as overall_attendance,
        COUNT(DISTINCT r.lecturer_id) as lecturers_count
       FROM reports r
       WHERE r.class_name LIKE $1`,
      [`%${req.user.id}%`]
    );

    sendSuccess(res, stats.rows[0] || {
      total_courses: 0,
      total_classes: 0,
      overall_attendance: 0,
      lecturers_count: 0
    }, "Student statistics fetched successfully");
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

    const performance = await executeQuery(
      `SELECT 
        c.name as course_name,
        c.code as course_code,
        COUNT(*) as classes_attended,
        ROUND(AVG(r.actual_present::float / NULLIF(r.total_registered, 0)) * 100, 2) as attendance_rate,
        CONCAT(u.first_name, ' ', u.last_name) as lecturer_name
       FROM reports r
       JOIN courses c ON r.course_id = c.id
       JOIN users u ON r.lecturer_id = u.id
       WHERE r.class_name LIKE $1
       GROUP BY c.id, c.name, c.code, u.first_name, u.last_name
       ORDER BY attendance_rate DESC`,
      [`%${req.user.id}%`]
    );

    sendSuccess(res, performance.rows, "Student performance fetched successfully");
  } catch (error) {
    console.error("❌ Student performance error:", error);
    sendError(res, "Failed to fetch student performance: " + error.message);
  }
});

// ========================
// ANALYTICS ROUTES
// ========================
app.get("/api/analytics/overview", authenticateToken, async (req, res) => {
  try {
    if (!['Admin', 'PRL', 'PL'].includes(req.user.role)) {
      return sendError(res, "Access denied. Admins, PRL, and PL only.", 403);
    }

    const overview = await executeQuery(
      `SELECT 
        (SELECT COUNT(*) FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'Student')) as total_students,
        (SELECT COUNT(*) FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'Lecturer')) as total_lecturers,
        (SELECT COUNT(*) FROM courses) as total_courses,
        (SELECT COUNT(*) FROM reports) as total_reports,
        (SELECT COALESCE(AVG(actual_present::float / NULLIF(total_registered, 0)) * 100, 0) FROM reports) as avg_attendance,
        (SELECT COUNT(*) FROM ratings) as total_ratings,
        (SELECT COALESCE(AVG(rating), 0) FROM ratings) as avg_rating,
        (SELECT COUNT(*) FROM classes) as total_classes
      `
    );

    sendSuccess(res, overview.rows[0], "Analytics overview fetched successfully");
  } catch (error) {
    console.error("❌ Analytics overview error:", error);
    sendError(res, "Failed to fetch analytics overview: " + error.message);
  }
});

app.get("/api/analytics/trends", authenticateToken, async (req, res) => {
  try {
    if (!['Admin', 'PRL', 'PL'].includes(req.user.role)) {
      return sendError(res, "Access denied. Admins, PRL, and PL only.", 403);
    }

    const trends = await executeQuery(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as reports_count,
        COALESCE(AVG(actual_present::float / NULLIF(total_registered, 0)) * 100, 0) as daily_attendance
       FROM reports
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`
    );

    sendSuccess(res, trends.rows, "Analytics trends fetched successfully");
  } catch (error) {
    console.error("❌ Analytics trends error:", error);
    sendError(res, "Failed to fetch analytics trends: " + error.message);
  }
});

// ========================
// USER MANAGEMENT ROUTES
// ========================
app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    if (!['Admin', 'PRL'].includes(req.user.role)) {
      return sendError(res, "Access denied. Admins and PRL only.", 403);
    }

    const rows = await executeQuery(
      `SELECT u.id, u.first_name, u.last_name, u.email, r.name as role, u.created_at
       FROM users u
       JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );

    sendSuccess(res, rows.rows, "Users fetched successfully");
  } catch (error) {
    console.error("❌ Users error:", error);
    sendError(res, "Failed to fetch users: " + error.message);
  }
});

app.put("/api/users/:id/role", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return sendError(res, "Access denied. Admins only.", 403);
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return sendError(res, "Role is required", 400);
    }

    const validRoles = ["Student", "Lecturer", "PRL", "PL", "Admin"];
    if (!validRoles.includes(role)) {
      return sendError(res, "Invalid role specified", 400);
    }

    const roleRes = await executeQuery("SELECT id FROM roles WHERE name = $1", [role]);
    if (!roleRes.rows.length) {
      return sendError(res, "Invalid role specified", 400);
    }

    const result = await executeQuery(
      "UPDATE users SET role_id = $1 WHERE id = $2 RETURNING id, first_name, last_name, email",
      [roleRes.rows[0].id, id]
    );

    if (!result.rows.length) {
      return sendError(res, "User not found", 404);
    }

    sendSuccess(res, { 
      user: result.rows[0],
      new_role: role 
    }, "User role updated successfully");
  } catch (error) {
    console.error("❌ Update user role error:", error);
    sendError(res, "Failed to update user role: " + error.message);
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
      timestamp: new Date().toISOString(),
      cors: 'Enabled for Vercel deployment',
      modules: {
        auth: 'active',
        reports: 'active',
        ratings: 'active',
        courses: 'active',
        classes: 'active',
        search: 'active',
        analytics: 'active',
        students: 'active',
        users: 'active'
      }
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
        <p>CORS: ✅ Enabled for Vercel deployment</p>
        <p>Modules: ✅ Reports, ✅ Ratings, ✅ Courses, ✅ Classes, ✅ Search, ✅ Analytics</p>
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
  
  console.log(`🔗 Test endpoint: https://luct-7.onrender.com/api/test`);
  console.log(`📧 Pre-created accounts available (e.g., borotho@luct.ac.ls / password123)`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});