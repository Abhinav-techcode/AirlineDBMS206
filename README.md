# ✈️ Airline Management System

A full-stack Airline Management System designed to simulate real-world airline operations including flight booking, seat management, payments, and administrative control.

This project demonstrates strong integration of **frontend, backend, and advanced DBMS concepts**, featuring an automated database injection pipeline for seamless deployment.

---

## 🚀 Features

### 👤 User Features

* 🔍 Search flights based on source, destination, and date
* 💺 Seat selection with real-time seat locking (5-minute timer)
* 💳 Secure booking and payment flow with atomic transactional integrity
* 📋 View booking history with real-time status updates

### 🛠 Admin & Staff Features

* 🧑‍✈️ **Dynamic Dashboard:** Live statistics for flights, bookings, and revenue.
* ✈️ **Flight Management:** Configure aircraft, schedules, and pricing.
* 📊 **Automated Pipelines:** Zero-manual-config database management.

### 🧠 Advanced DBMS Concepts Used

* 🔁 **Triggers:** Automatic seat updates and payment-to-booking status synchronization.
* ⚙️ **Stored Procedures:** Atomic `SafeBooking` procedure for error-free transactions.
* 📊 **Functions:** Analytics like total revenue and seat availability.
* 🔄 **Cursors:** Iterative data processing for complex schedule updates.
* 🔐 **Transactions:** Full ACID compliance for booking and payment flows.

---

## 🛠 Tech Stack

| Layer    | Technology          |
| -------- | ------------------- |
| Frontend | React.js, Vanilla CSS |
| Backend  | Node.js, Express.js |
| Database | MySQL (with automated injection) |

---

## 📂 Project Structure

```bash
airline-project/
│── airline-frontend/   # React frontend
│── backend/            # Express backend + dbPipeline.js
│── database/           # schema.sql (Idempotent source of truth)
│── README.md
```

---

## ⚙️ Setup Instructions

### 🔹 1. Clone the Repository

```bash
git clone https://github.com/Abhinav-techcode/AirlineDBMS206.git
cd AirlineDBMS206
```

---

### 🔹 2. Backend & Database Setup (Automated)

The project includes a custom **Database Injection Pipeline**. You do NOT need to manually run scripts in MySQL Workbench.

1. Configure your environment in `backend/.env`.
2. Install and initialize:
```bash
cd backend
npm install
npm run db:init   # This creates the DB and applies the schema automatically
npm run dev       # Starts the server
```

---

### 🔹 3. Frontend Setup

```bash
cd airline-frontend
npm install
npm start
```

---

## 🔑 Test Credentials

| Role     | Username           | Password |
| -------- | ------------------ | -------- |
| Admin    | `admin@mail.com`   | `123`    |
| Traveler | `Abhinav@gmail.com`| `12345`  |

---

## 📸 Project Status

* ✅ Automated Database Pipeline (Idempotent)
* ✅ Transactional Integrity via DB Triggers
* ✅ Dynamic Admin Dashboard Metrics
* ✅ Real-time Seat Selection Logic

---

## ⭐ Acknowledgement

If you found this project useful, consider giving it a ⭐ on GitHub!

---
