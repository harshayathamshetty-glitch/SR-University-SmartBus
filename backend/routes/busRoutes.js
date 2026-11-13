
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// JWT authentication middleware
const authMiddleware = require("../middleware/authMiddleware");

// Protect all bus APIs
router.use(authMiddleware);


// =====================================
// BUS APIs
// =====================================

// GET: Display all buses
router.get("/", (req, res) => {

    db.query("SELECT * FROM buses", (err, results) => {

        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.status(200).json(results);

    });

});


// POST: Add a bus
router.post("/", (req, res) => {

    const { bus_number, driver_name, route_name, status } = req.body;

    const sql = `
        INSERT INTO buses (bus_number, driver_name, route_name, status)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [bus_number, driver_name, route_name, status], (err, result) => {

        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
            message: "Bus added successfully",
            bus_id: result.insertId
        });

    });

});


// PUT: Update a bus
router.put("/:id", (req, res) => {

    const { bus_number, driver_name, route_name, status } = req.body;
    const { id } = req.params;

    const sql = `
        UPDATE buses
        SET bus_number = ?, driver_name = ?, route_name = ?, status = ?
        WHERE bus_id = ?
    `;

    db.query(sql, [bus_number, driver_name, route_name, status, id], (err, result) => {

        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Bus not found" });
        }

        res.json({ message: "Bus updated successfully" });

    });

});


// DELETE: Delete a bus
router.delete("/:id", (req, res) => {

    const { id } = req.params;

    db.query("DELETE FROM buses WHERE bus_id = ?", [id], (err, result) => {

        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Bus not found" });
        }

        res.json({ message: "Bus deleted successfully" });

    });

});


// =====================================
// BUS LOCATION APIs
// =====================================

// GET: Display locations of all buses
router.get("/locations", (req, res) => {

    const sql = `
        SELECT
            buses.bus_id,
            buses.bus_number,
            buses.driver_name,
            bus_locations.latitude,
            bus_locations.longitude,
            bus_locations.updated_at
        FROM buses
        LEFT JOIN bus_locations
        ON buses.bus_id = bus_locations.bus_id
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.status(200).json(results);

    });

});


// GET: Display location of one bus
router.get("/:id/location", (req, res) => {

    const busId = Number(req.params.id);

    if (!Number.isInteger(busId) || busId <= 0) {
        return res.status(400).json({ error: "Invalid bus ID" });
    }

    const sql = `
        SELECT *
        FROM bus_locations
        WHERE bus_id = ?
    `;

    db.query(sql, [busId], (err, results) => {

        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Bus location not found" });
        }

        res.status(200).json(results[0]);

    });

});


// PUT: Add or update the latest location of a bus
router.put("/:id/location", (req, res) => {

    const busId = Number(req.params.id);
    const { latitude, longitude } = req.body;

    if (!Number.isInteger(busId) || busId <= 0) {
        return res.status(400).json({ error: "Invalid bus ID" });
    }

    if (
        latitude === undefined ||
        longitude === undefined ||
        latitude === null ||
        longitude === null ||
        !Number.isFinite(Number(latitude)) ||
        !Number.isFinite(Number(longitude))
    ) {
        return res.status(400).json({
            error: "Please provide valid latitude and longitude"
        });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
            error: "Latitude or longitude is outside the valid range"
        });
    }

    const sql = `
        INSERT INTO bus_locations (bus_id, latitude, longitude)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
            latitude = ?,
            longitude = ?,
            updated_at = CURRENT_TIMESTAMP
    `;

    db.query(sql, [busId, lat, lng, lat, lng], (err) => {

        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.status(200).json({
            message: "Bus location saved successfully",
            bus_id: busId,
            latitude: lat,
            longitude: lng
        });

    });

});

module.exports = router;
