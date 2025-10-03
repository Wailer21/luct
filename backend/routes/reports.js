// backend/routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");

// Create a report
router.post("/reports", authenticate, async (req, res) => {
  try {
    const {
      faculty_id,
      class_id,
      week_of_reporting,
      lecture_date,
      course_id,
      course_code,
      lecturer_id,
      actual_present,
      total_registered,
      venue,
      scheduled_time,
      topic,
      learning_outcomes,
      recommendations,
    } = req.body;

    // Check required fields
    if (
      !faculty_id ||
      !class_id ||
      !week_of_reporting ||
      !lecture_date ||
      !course_id ||
      !lecturer_id ||
      !actual_present ||
      !total_registered
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [result] = await db.query(
      `INSERT INTO reports 
        (faculty_id, class_id, week_of_reporting, lecture_date, course_id, course_code, lecturer_id, actual_present, total_registered, venue, scheduled_time, topic, learning_outcomes, recommendations) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        faculty_id,
        class_id,
        week_of_reporting,
        lecture_date,
        course_id,
        course_code,
        lecturer_id,
        actual_present,
        total_registered,
        venue || null,
        scheduled_time || null,
        topic || null,
        learning_outcomes || null,
        recommendations || null,
      ]
    );

    res.status(201).json({ message: "Report created", id: result.insertId });
  } catch (err) {
    console.error("Error inserting report:", err);
    res.status(500).json({ error: "Failed to create report" });
  }
});

module.exports = router;
