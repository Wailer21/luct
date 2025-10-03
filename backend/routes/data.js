// routes/data.js
const express = require("express");
const router = express.Router();
const pool = require("../db"); // <-- your pool.js file

// GET all reports (example)
router.get("/reports", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM reports");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching reports:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// GET single report by ID
router.get("/reports/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM reports WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Report not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching report:", err);
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

// POST create a new report
router.post("/reports", async (req, res) => {
  try {
    const { title, description } = req.body;
    const [result] = await pool.query(
      "INSERT INTO reports (title, description) VALUES (?, ?)",
      [title, description]
    );
    res.status(201).json({ id: result.insertId, title, description });
  } catch (err) {
    console.error("Error creating report:", err);
    res.status(500).json({ error: "Failed to create report" });
  }
});

// PUT update a report
router.put("/reports/:id", async (req, res) => {
  try {
    const { title, description } = req.body;
    const [result] = await pool.query(
      "UPDATE reports SET title = ?, description = ? WHERE id = ?",
      [title, description, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Report not found" });
    res.json({ id: req.params.id, title, description });
  } catch (err) {
    console.error("Error updating report:", err);
    res.status(500).json({ error: "Failed to update report" });
  }
});

// DELETE report
router.delete("/reports/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM reports WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Report not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting report:", err);
    res.status(500).json({ error: "Failed to delete report" });
  }
});

module.exports = router;
