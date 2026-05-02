# Project Change Log - Airline Management System Overhaul

This document records the major architectural and functional changes implemented to resolve technical debt, ensure transactional integrity, and automate database management.

## 1. Database & Infrastructure

### **[NEW] Database Injection Pipeline (`dbPipeline.js`)**
- Created an idempotent SQL injection pipeline that automatically handles schema creation, table initialization, and stored procedure/trigger deployment.
- Integrated `runSchemaPipeline` into the backend startup flow (`server.js`), eliminating the need for manual MySQL Workbench imports.
- Added `npm run db:init` command for standalone database bootstrapping.

### **[MODIFY] Database Schema (`schema.sql`)**
- Reordered insertion sequence (Aircraft -> Seat -> Schedule) to resolve foreign key and trigger dependency deadlocks.
- Implemented `Error_Log` table for centralized logging of database-level exceptions.
- Added atomic triggers (`sync_payment_status_insert`/`update`) to synchronize payment states with booking records automatically.
- Standardized character sets and collation for all tables.

## 2. Backend Engineering

### **[MODIFY] Flight Controller & Model**
- **Dynamic Data Generation:** Restored `image`, `tags`, and `oldPrice` fields using server-side logic (e.g., `ui-avatars` for branding) to support frontend dependencies without hardcoded assets.
- **Booked Capacity:** Updated `getFlightsBaseQuery` to perform real-time joins with the `Booking` table, providing accurate "Booked Seats" metrics for the admin dashboard.

### **[MODIFY] Booking System**
- Refactored `bookingModel.js` to prioritize payment insertion as the source of truth, leveraging database triggers for status propagation.
- Standardized `getBookingHistory` to ensure consistent data structures across customer and admin views.

### **[NEW] Error Middleware**
- Implemented `errorMiddleware.js` with automatic SQL sanitization to prevent raw database query leaks in production API responses.

## 3. Frontend Enhancements

### **[MODIFY] Admin Dashboard (`admindash.jsx`)**
- **Dynamic Sidebar:** Replaced hardcoded counts (e.g., "45 flights") with live length-based metrics (`getAirlineMenu`).
- **State Integrity:** Removed all legacy seed fallbacks (`bookingSeed`, `flightSeed`, etc.) to prevent "vanishing data" or "ghost entries" during API loading states.
- **Consistency Fix:** Unified metric banners across the main Overview and "All Flights" sub-pages, ensuring synchronized Revenue and Booking counts.

### **[MODIFY] Booking Review & Seat Selection**
- **Seat Locking:** Implemented a 5-minute countdown timer for seat locks in `SeatSelection.jsx`.
- **Validation:** Removed hardcoded flight fallbacks in `BookingReview.jsx`, forcing strict reliance on the selected flight instance.

---
**Status:** All core systems are verified as stable and production-ready.
