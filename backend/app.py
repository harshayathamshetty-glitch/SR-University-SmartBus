
from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)


# MySQL database connection
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Harsha@3699",
        database="smart_bus_tracking"
    )


# Home page
@app.route("/")
def home():
    return "SR University SmartBus Backend is Running!"


# Test MySQL connection
@app.route("/api/health", methods=["GET"])
def health():
    connection = None

    try:
        connection = get_db_connection()

        return jsonify({
            "status": "success",
            "message": "SmartBus backend connected to MySQL successfully!"
        })

    except mysql.connector.Error as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:
        if connection and connection.is_connected():
            connection.close()


# Student login using university Roll Number
@app.route("/api/login", methods=["POST"])
def student_login():
    connection = None
    cursor = None

    try:
        data = request.get_json()
        roll_number = data.get("roll_number", "").strip()

        if not roll_number:
            return jsonify({
                "message": "Please enter your Roll Number."
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT roll_number, student_name FROM students WHERE roll_number = %s",
            (roll_number,)
        )

        student = cursor.fetchone()

        if student:
            return jsonify({
                "status": "success",
                "message": "Login successful!",
                "student_name": student["student_name"],
                "roll_number": student["roll_number"]
            })

        return jsonify({
            "status": "error",
            "message": "Invalid Roll Number. Please try again."
        }), 401

    except mysql.connector.Error as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# Get all available buses
@app.route("/api/buses", methods=["GET"])
def get_buses():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM buses WHERE status = 'Active'"
        )

        buses = cursor.fetchall()

        return jsonify(buses)

    except mysql.connector.Error as error:
        return jsonify({"error": str(error)}), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
