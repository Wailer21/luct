// ========================
// RATING MANAGEMENT ROUTES
// ========================

// Get all lecturers for rating
app.get("/api/lecturers", authenticateToken, async (req, res) => {
  try {
    const rows = await executeQuery(
      `SELECT u.id, u.first_name, u.last_name, u.email, r.name as role
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE r.name = 'Lecturer'
       ORDER BY u.first_name, u.last_name`
    );
    sendSuccess(res, rows.rows, "Lecturers fetched successfully");
  } catch (error) {
    console.error("❌ Lecturers error:", error);
    sendError(res, "Failed to fetch lecturers: " + error.message);
  }
});

// Create ratings table (run this SQL first)
app.post("/api/migrate/ratings-table", authenticateToken, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return sendError(res, "Admin access required", 403);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create ratings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        lecturer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT chk_rating_target CHECK (
          (lecturer_id IS NOT NULL AND course_id IS NULL) OR 
          (course_id IS NOT NULL AND lecturer_id IS NULL)
        )
      )
    `);

    // Create index for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
      CREATE INDEX IF NOT EXISTS idx_ratings_lecturer_id ON ratings(lecturer_id);
      CREATE INDEX IF NOT EXISTS idx_ratings_course_id ON ratings(course_id);
    `);

    await client.query('COMMIT');
    sendSuccess(res, null, "Ratings table created successfully");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Migration error:", error);
    sendError(res, "Migration failed: " + error.message);
  } finally {
    client.release();
  }
});

// Submit a rating
app.post("/api/ratings", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { lecturer_id, course_id, rating, comment } = req.body;
    
    // Validate input
    if (!rating || (rating < 1 || rating > 5)) {
      await client.query('ROLLBACK');
      return sendError(res, "Rating must be between 1 and 5", 400);
    }
    
    if (!lecturer_id && !course_id) {
      await client.query('ROLLBACK');
      return sendError(res, "Must rate either a lecturer or a course", 400);
    }
    
    if (lecturer_id && course_id) {
      await client.query('ROLLBACK');
      return sendError(res, "Cannot rate both lecturer and course in same rating", 400);
    }

    // Check if user already rated this lecturer/course
    const existingRating = await client.query(
      `SELECT id FROM ratings 
       WHERE user_id = $1 AND 
             (lecturer_id = $2 OR course_id = $3)`,
      [req.user.id, lecturer_id, course_id]
    );

    if (existingRating.rows.length > 0) {
      await client.query('ROLLBACK');
      return sendError(res, "You have already rated this " + (lecturer_id ? "lecturer" : "course"), 400);
    }

    // Insert rating
    const result = await client.query(
      `INSERT INTO ratings (user_id, lecturer_id, course_id, rating, comment) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [req.user.id, lecturer_id, course_id, rating, comment || null]
    );

    await client.query('COMMIT');
    sendCreated(res, result.rows[0], "Rating submitted successfully");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Create rating error:", error);
    sendError(res, "Failed to submit rating: " + error.message);
  } finally {
    client.release();
  }
});

// Get my ratings
app.get("/api/ratings/my-ratings", authenticateToken, async (req, res) => {
  try {
    const rows = await executeQuery(
      `SELECT r.*, 
              lect.first_name as lecturer_first_name, 
              lect.last_name as lecturer_last_name,
              c.code as course_code, 
              c.name as course_name,
              CASE 
                WHEN r.lecturer_id IS NOT NULL THEN 'lecturer'
                WHEN r.course_id IS NOT NULL THEN 'course'
              END as rating_type
       FROM ratings r
       LEFT JOIN users lect ON r.lecturer_id = lect.id
       LEFT JOIN courses c ON r.course_id = c.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    sendSuccess(res, rows.rows, "Ratings fetched successfully");
  } catch (error) {
    console.error("❌ Get ratings error:", error);
    sendError(res, "Failed to fetch ratings: " + error.message);
  }
});

// Get lecturer ratings (for lecturers to see their ratings)
app.get("/api/ratings/lecturer", authenticateToken, async (req, res) => {
  try {
    const rows = await executeQuery(
      `SELECT r.*, 
              u.first_name as user_first_name, 
              u.last_name as user_last_name,
              c.code as course_code,
              c.name as course_name
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN courses c ON r.course_id = c.id
       WHERE r.lecturer_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    sendSuccess(res, rows.rows, "Lecturer ratings fetched successfully");
  } catch (error) {
    console.error("❌ Get lecturer ratings error:", error);
    sendError(res, "Failed to fetch lecturer ratings: " + error.message);
  }
});

// Get course average ratings
app.get("/api/ratings/course-stats", authenticateToken, async (req, res) => {
  try {
    const rows = await executeQuery(
      `SELECT 
         course_id,
         c.code as course_code,
         c.name as course_name,
         COUNT(*) as total_ratings,
         ROUND(AVG(rating)::numeric, 2) as average_rating
       FROM ratings r
       JOIN courses c ON r.course_id = c.id
       WHERE course_id IS NOT NULL
       GROUP BY course_id, c.code, c.name
       ORDER BY average_rating DESC`
    );
    sendSuccess(res, rows.rows, "Course rating stats fetched successfully");
  } catch (error) {
    console.error("❌ Course stats error:", error);
    sendError(res, "Failed to fetch course stats: " + error.message);
  }
});

// Get lecturer average ratings
app.get("/api/ratings/lecturer-stats", authenticateToken, async (req, res) => {
  try {
    const rows = await executeQuery(
      `SELECT 
         lecturer_id,
         u.first_name,
         u.last_name,
         COUNT(*) as total_ratings,
         ROUND(AVG(rating)::numeric, 2) as average_rating
       FROM ratings r
       JOIN users u ON r.lecturer_id = u.id
       WHERE lecturer_id IS NOT NULL
       GROUP BY lecturer_id, u.first_name, u.last_name
       ORDER BY average_rating DESC`
    );
    sendSuccess(res, rows.rows, "Lecturer rating stats fetched successfully");
  } catch (error) {
    console.error("❌ Lecturer stats error:", error);
    sendError(res, "Failed to fetch lecturer stats: " + error.message);
  }
});