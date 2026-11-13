
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();

// Student Registration
router.post("/register", async (req, res) => {
    const { roll_number, student_name, password } = req.body;

    if (!roll_number || !student_name || !password) {
        return res.status(400).json({
            error: "Please provide all details"
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO students
            (roll_number, student_name, password_hash)
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [roll_number, student_name, hashedPassword],
            (error, result) => {
                if (error) {
                    return res.status(400).json({
                        error: "Registration failed. Check whether the roll number already exists."
                    });
                }

                res.status(201).json({
                    message: "Student registered successfully",
                    student_id: result.insertId
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Student Login
router.post("/login", (req, res) => {
    const { roll_number, password } = req.body;

    if (!roll_number || !password) {
        return res.status(400).json({
            error: "Please enter roll number and password"
        });
    }

    const sql = `
        SELECT * FROM students
        WHERE roll_number = ?
    `;

    db.query(sql, [roll_number], async (error, results) => {
        if (error) {
            return res.status(500).json({ error: "Database error" });
        }

        if (results.length === 0 || !results[0].password_hash) {
            return res.status(401).json({
                error: "Invalid credentials or student not registered"
            });
        }

        try {
            const validPassword = await bcrypt.compare(
                password,
                results[0].password_hash
            );

            if (!validPassword) {
                return res.status(401).json({
                    error: "Invalid credentials"
                });
            }

            const token = jwt.sign(
                {
                    student_id: results[0].student_id,
                    roll_number: results[0].roll_number
                },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.json({
                message: "Login successful",
                token: token,
                student: {
                    student_id: results[0].student_id,
                    roll_number: results[0].roll_number,
                    student_name: results[0].student_name
                }
            });
        } catch (error) {
            res.status(500).json({ error: "Login failed" });
        }
    });
});

module.exports = router;
