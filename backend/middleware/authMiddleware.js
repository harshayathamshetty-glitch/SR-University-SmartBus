
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {

    // Get token from request header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Access denied. Please login first."
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Store student details in request
        req.student = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            error: "Invalid or expired token. Please login again."
        });

    }

}

module.exports = authMiddleware;
