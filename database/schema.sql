-- ================= RESET DATABASE =================

CREATE DATABASE Airline_mangemnt_System;
USE  Airline_mangemnt_System;

SET FOREIGN_KEY_CHECKS = 0;

-- ================= USERS =================
CREATE TABLE Users (
   user_id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(100) NOT NULL,
   email VARCHAR(100) UNIQUE NOT NULL,
   password VARCHAR(255) NOT NULL,
   phone VARCHAR(15),
   role ENUM('CUSTOMER','AIRLINE_STAFF','ADMIN','SUPER_ADMIN') NOT NULL,
   airline_id INT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================= AIRPORT =================
CREATE TABLE Airport (
   airport_id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(150) NOT NULL,
   city VARCHAR(100),
   country VARCHAR(100),
   code VARCHAR(10) UNIQUE NOT NULL
);

-- ================= AIRLINE =================
CREATE TABLE Airline (
   airline_id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(150) NOT NULL,
   airline_code VARCHAR(10) UNIQUE NOT NULL
);

ALTER TABLE Users
ADD FOREIGN KEY (airline_id) REFERENCES Airline(airline_id);

-- ================= AIRCRAFT (ONLY MODIFIED PART) =================
CREATE TABLE Aircraft (
   aircraft_id INT AUTO_INCREMENT PRIMARY KEY,
   airline_id INT NOT NULL,
   model VARCHAR(100) NOT NULL,
   total_seats INT NOT NULL,
   business_seats INT DEFAULT 0,
   first_class_seats INT DEFAULT 0,
   status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
   is_available BOOLEAN DEFAULT TRUE,

   -- 🔥 added fields (only change)
   registration_code VARCHAR(100),
   range_km INT,
   cruise_speed INT,
   max_altitude INT,
   registration_date DATE,
   next_maintenance DATE,

   FOREIGN KEY (airline_id) REFERENCES Airline(airline_id)
);

-- ================= SEAT =================
CREATE TABLE Seat (
   seat_id INT AUTO_INCREMENT PRIMARY KEY,
   aircraft_id INT NOT NULL,
   seat_no VARCHAR(10) NOT NULL,
   seat_row INT NOT NULL,
   seat_label CHAR(1) NOT NULL,
   seat_type ENUM('NORMAL','PREMIUM','EMERGENCY') DEFAULT 'NORMAL',
   UNIQUE (aircraft_id, seat_no),
   FOREIGN KEY (aircraft_id) REFERENCES Aircraft(aircraft_id)
);

-- ================= FLIGHT =================
CREATE TABLE Flight (
   flight_id INT AUTO_INCREMENT PRIMARY KEY,
   flight_number VARCHAR(20) UNIQUE NOT NULL,
   airline_id INT NOT NULL,
   aircraft_id INT NOT NULL,
   source_airport_id INT NOT NULL,
   destination_airport_id INT NOT NULL,
   duration INT,
   FOREIGN KEY (airline_id) REFERENCES Airline(airline_id),
   FOREIGN KEY (aircraft_id) REFERENCES Aircraft(aircraft_id),
   FOREIGN KEY (source_airport_id) REFERENCES Airport(airport_id),
   FOREIGN KEY (destination_airport_id) REFERENCES Airport(airport_id)
);

-- ================= SCHEDULE =================
CREATE TABLE Schedule (
   schedule_id INT AUTO_INCREMENT PRIMARY KEY,
   flight_id INT NOT NULL,
   departure_time TIME NOT NULL,
   arrival_time TIME NOT NULL,
   date DATE NOT NULL,
   price DECIMAL(10,2) NOT NULL,
   status ENUM('SCHEDULED','DELAYED','CANCELLED') DEFAULT 'SCHEDULED',
   FOREIGN KEY (flight_id) REFERENCES Flight(flight_id)
);

-- ================= SCHEDULE SEAT =================
CREATE TABLE Schedule_Seat (
   schedule_seat_id INT AUTO_INCREMENT PRIMARY KEY,
   schedule_id INT NOT NULL,
   seat_id INT NOT NULL,
   status ENUM('AVAILABLE','BOOKED','LOCKED') DEFAULT 'AVAILABLE',
   last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   UNIQUE (schedule_id, seat_id),
   FOREIGN KEY (schedule_id) REFERENCES Schedule(schedule_id),
   FOREIGN KEY (seat_id) REFERENCES Seat(seat_id)
);

-- ================= BOOKING =================
CREATE TABLE Booking (
   booking_id INT AUTO_INCREMENT PRIMARY KEY,
   user_id INT NOT NULL,
   schedule_id INT NOT NULL,
   total_amount DECIMAL(10,2),
   status ENUM('PENDING','CONFIRMED','CANCELLED') DEFAULT 'PENDING',
   payment_status ENUM('PENDING','SUCCESS','FAILED') DEFAULT 'PENDING',
   booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (user_id) REFERENCES Users(user_id),
   FOREIGN KEY (schedule_id) REFERENCES Schedule(schedule_id)
);

-- ================= PASSENGER =================
CREATE TABLE Passenger (
   passenger_id INT AUTO_INCREMENT PRIMARY KEY,
   booking_id INT NOT NULL,
   name VARCHAR(100) NOT NULL,
   age INT,
   gender ENUM('MALE','FEMALE','OTHER'),
   FOREIGN KEY (booking_id) REFERENCES Booking(booking_id)
);

-- ================= TICKET =================
CREATE TABLE Ticket (
   ticket_id INT AUTO_INCREMENT PRIMARY KEY,
   booking_id INT NOT NULL,
   passenger_id INT NOT NULL,
   schedule_seat_id INT NOT NULL,
   ticket_number VARCHAR(100) UNIQUE,
   status ENUM('BOOKED','CANCELLED') DEFAULT 'BOOKED',
   issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (booking_id) REFERENCES Booking(booking_id),
   FOREIGN KEY (passenger_id) REFERENCES Passenger(passenger_id),
   FOREIGN KEY (schedule_seat_id) REFERENCES Schedule_Seat(schedule_seat_id)
);

-- ================= PAYMENT =================
CREATE TABLE Payment (
   payment_id INT AUTO_INCREMENT PRIMARY KEY,
   booking_id INT NOT NULL,
   amount DECIMAL(10,2),
   payment_status ENUM('PENDING','SUCCESS','FAILED') DEFAULT 'PENDING',
   payment_method ENUM('UPI','CARD','NETBANKING'),
   transaction_id VARCHAR(100),
   payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (booking_id) REFERENCES Booking(booking_id)
);

CREATE TABLE Seat_Lock (
   lock_id INT AUTO_INCREMENT PRIMARY KEY,
   schedule_seat_id INT NOT NULL,
   user_id INT NOT NULL,
   lock_expiry_time DATETIME NOT NULL,
   FOREIGN KEY (schedule_seat_id) REFERENCES Schedule_Seat(schedule_seat_id),
   FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
CREATE INDEX idx_schedule ON Schedule(flight_id, date);
CREATE INDEX idx_schedule_seat ON Schedule_Seat(schedule_id, status);
CREATE INDEX idx_booking_user ON Booking(user_id);

-- ================= TRIGGER =================
DELIMITER //

CREATE TRIGGER after_ticket_insert
AFTER INSERT ON Ticket
FOR EACH ROW
BEGIN
    UPDATE Schedule_Seat
    SET status = 'BOOKED'
    WHERE schedule_seat_id = NEW.schedule_seat_id;
END //

DELIMITER ;

-- ================= SEAT LOCK CLEANUP =================
SET GLOBAL event_scheduler = ON;

CREATE EVENT clean_expired_locks
ON SCHEDULE EVERY 1 MINUTE
DO
DELETE FROM Seat_Lock WHERE lock_expiry_time < NOW();

-- ================= FINAL BOOKING PROCEDURE =================
DELIMITER //
CREATE PROCEDURE BookSeat(
    IN p_user_id INT,
    IN p_schedule_id INT,
    IN p_schedule_seat_id INT
)
BEGIN
    DECLARE seat_status_val VARCHAR(20);

    START TRANSACTION;

    SELECT status INTO seat_status_val
    FROM Schedule_Seat
    WHERE schedule_seat_id = p_schedule_seat_id
    FOR UPDATE;

    IF seat_status_val = 'BOOKED' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Seat already booked';
    END IF;

    INSERT INTO Booking (user_id, schedule_id, total_amount)
    VALUES (p_user_id, p_schedule_id, 5000);

    INSERT INTO Ticket (booking_id, passenger_id, schedule_seat_id, ticket_number)
    VALUES (LAST_INSERT_ID(), 1, p_schedule_seat_id, UUID());

    UPDATE Schedule_Seat
    SET status = 'BOOKED'
    WHERE schedule_seat_id = p_schedule_seat_id;

    COMMIT;
END //

DELIMITER //
DELIMITER //

CREATE PROCEDURE GetAllAircraftModels()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_model VARCHAR(100);

    -- cursor declaration
    DECLARE aircraft_cursor CURSOR FOR
        SELECT model FROM Aircraft;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN aircraft_cursor;

    read_loop: LOOP
        FETCH aircraft_cursor INTO v_model;

        IF done THEN
            LEAVE read_loop;
        END IF;

        -- output each model
        SELECT v_model AS Aircraft_Model;

    END LOOP;

    CLOSE aircraft_cursor;
END //

DELIMITER ;
DELIMITER //

CREATE PROCEDURE GetFlightRevenue(IN p_flight_id INT)
BEGIN
    SELECT 
        f.flight_number,
        SUM(b.total_amount) AS total_revenue,
        COUNT(b.booking_id) AS total_bookings
    FROM Booking b
    JOIN Schedule s ON b.schedule_id = s.schedule_id
    JOIN Flight f ON s.flight_id = f.flight_id
    WHERE f.flight_id = p_flight_id
    GROUP BY f.flight_number;
END //

DELIMITER ;
DELIMITER //

CREATE TRIGGER prevent_overbooking
BEFORE INSERT ON Ticket
FOR EACH ROW
BEGIN
    DECLARE seat_status_val VARCHAR(20);

    SELECT status INTO seat_status_val
    FROM Schedule_Seat
    WHERE schedule_seat_id = NEW.schedule_seat_id;

    IF seat_status_val = 'BOOKED' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Seat already booked!';
    END IF;
END //

DELIMITER ;
DELIMITER //

CREATE PROCEDURE SeatSummary(IN p_schedule_id INT)
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_status VARCHAR(20);

    DECLARE total INT DEFAULT 0;
    DECLARE booked INT DEFAULT 0;

    DECLARE seat_cursor CURSOR FOR
        SELECT status FROM Schedule_Seat
        WHERE schedule_id = p_schedule_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN seat_cursor;

    read_loop: LOOP
        FETCH seat_cursor INTO v_status;

        IF done THEN
            LEAVE read_loop;
        END IF;

        SET total = total + 1;

        IF v_status = 'BOOKED' THEN
            SET booked = booked + 1;
        END IF;

    END LOOP;

    CLOSE seat_cursor;

    SELECT 
        total AS total_seats,
        booked AS booked_seats,
        (total - booked) AS available_seats;
END //

DELIMITER ;

USE  Airline_mangemnt_System;
INSERT INTO Airline (name, airline_code) VALUES
('Air India','AI'),('IndiGo','6E'),('SpiceJet','SG'),('Vistara','UK'),
('Akasa Air','QP'),('GoAir','G8'),('Alliance Air','9I'),
('TruJet','2T'),('AirAsia India','I5'),('Zoom Air','Z5');

INSERT INTO Airport (name, city, country, code) VALUES
('Delhi Airport','Delhi','India','DEL'),
('Mumbai Airport','Mumbai','India','BOM'),
('Bangalore Airport','Bangalore','India','BLR'),
('Chennai Airport','Chennai','India','MAA'),
('Kolkata Airport','Kolkata','India','CCU'),
('Hyderabad Airport','Hyderabad','India','HYD'),
('Pune Airport','Pune','India','PNQ'),
('Jaipur Airport','Jaipur','India','JAI'),
('Ahmedabad Airport','Ahmedabad','India','AMD'),
('Goa Airport','Goa','India','GOI');


INSERT INTO Aircraft 
(airline_id, model, total_seats, business_seats, first_class_seats,
 registration_code, range_km, cruise_speed, max_altitude, registration_date, next_maintenance)
VALUES
(1,'A320',32,20,12,'A1',6000,840,39000,'2024-01-01','2026-01-01'),
(2,'B737',30,18,12,'A2',5500,820,37000,'2023-01-01','2025-01-01'),
(3,'A321',40,24,16,'A3',6500,860,41000,'2024-02-01','2026-02-01'),
(4,'B787',50,30,20,'A4',14000,900,43000,'2022-01-01','2025-01-01'),
(5,'A319',28,16,12,'A5',5900,830,38000,'2023-03-01','2025-03-01'),
(6,'B777',60,35,25,'A6',15000,905,43000,'2022-02-01','2025-02-01'),
(7,'A330',55,32,23,'A7',13500,890,42000,'2023-04-01','2026-04-01'),
(8,'B767',45,25,20,'A8',12000,880,41000,'2023-05-01','2025-05-01'),
(9,'E190',25,10,15,'A9',4500,780,35000,'2024-06-01','2026-06-01'),
(10,'ATR72',20,8,12,'A10',1500,500,25000,'2024-07-01','2025-07-01');


INSERT INTO Users (name,email,password,role) VALUES
('User1','u1@mail.com','123','CUSTOMER'),
('User2','u2@mail.com','123','CUSTOMER'),
('User3','u3@mail.com','123','CUSTOMER'),
('User4','u4@mail.com','123','CUSTOMER'),
('User5','u5@mail.com','123','CUSTOMER'),
('Admin','admin@mail.com','123','ADMIN'),
('Staff1','s1@mail.com','123','AIRLINE_STAFF'),
('Staff2','s2@mail.com','123','AIRLINE_STAFF'),
('User6','u6@mail.com','123','CUSTOMER'),
('User7','u7@mail.com','123','CUSTOMER');







INSERT INTO Flight (flight_number, airline_id, aircraft_id, source_airport_id, destination_airport_id) VALUES
('F1',1,1,1,2),('F2',2,2,2,3),('F3',3,3,3,4),
('F4',4,4,4,5),('F5',5,5,5,6),('F6',6,6,6,7),
('F7',7,7,7,8),('F8',8,8,8,9),('F9',9,9,9,10),
('F10',10,10,10,1);


INSERT INTO Schedule (flight_id, departure_time, arrival_time, date, price) VALUES
(1,'10:00','12:00','2026-05-01',5000),
(2,'11:00','13:00','2026-05-01',5200),
(3,'12:00','14:00','2026-05-01',5400),
(4,'13:00','15:00','2026-05-01',5600),
(5,'14:00','16:00','2026-05-01',5800),
(6,'15:00','17:00','2026-05-01',6000),
(7,'16:00','18:00','2026-05-01',6200),
(8,'17:00','19:00','2026-05-01',6400),
(9,'18:00','20:00','2026-05-01',6600),
(10,'19:00','21:00','2026-05-01',6800);


INSERT INTO Schedule_Seat (schedule_id, seat_id)
SELECT s.schedule_id, seat.seat_id
FROM Schedule s
JOIN Flight f ON s.flight_id = f.flight_id
JOIN Seat seat ON seat.aircraft_id = f.aircraft_id;

INSERT INTO Booking (user_id, schedule_id, total_amount) VALUES
(1,1,5000),(2,2,5200),(3,3,5400),(4,4,5600),(5,5,5800),
(6,6,6000),(7,7,6200),(8,8,6400),(9,9,6600),(10,10,6800);


INSERT INTO Passenger (booking_id, name, age, gender) VALUES
(1,'P1',25,'MALE'),(2,'P2',26,'FEMALE'),(3,'P3',30,'MALE'),
(4,'P4',22,'FEMALE'),(5,'P5',35,'MALE'),
(6,'P6',28,'FEMALE'),(7,'P7',33,'MALE'),
(8,'P8',29,'FEMALE'),(9,'P9',40,'MALE'),
(10,'P10',21,'FEMALE');



INSERT INTO Payment (booking_id, amount, payment_status, payment_method)
VALUES
(1,5000,'SUCCESS','UPI'),
(2,5200,'SUCCESS','CARD'),
(3,5400,'SUCCESS','UPI'),
(4,5600,'SUCCESS','NETBANKING'),
(5,5800,'SUCCESS','CARD'),
(6,6000,'SUCCESS','UPI'),
(7,6200,'SUCCESS','CARD'),
(8,6400,'SUCCESS','UPI'),
(9,6600,'SUCCESS','CARD'),
(10,6800,'SUCCESS','UPI');




DELIMITER //

CREATE TRIGGER auto_create_schedule_seats
AFTER INSERT ON Schedule
FOR EACH ROW
BEGIN
    INSERT INTO Schedule_Seat (schedule_id, seat_id)
    SELECT NEW.schedule_id, s.seat_id
    FROM Seat s
    JOIN Flight f ON s.aircraft_id = f.aircraft_id
    WHERE f.flight_id = NEW.flight_id;
END //

DELIMITER ;

INSERT INTO Seat (aircraft_id, seat_no, seat_row, seat_label)
SELECT 
  a.aircraft_id,
  CONCAT(r.row_num, s.seat_letter),
  r.row_num,
  s.seat_letter
FROM Aircraft a
JOIN (
  SELECT 1 row_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
  UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
  UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15
  UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
  UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25
) r
JOIN (
  SELECT 'A' seat_letter UNION SELECT 'B' UNION SELECT 'C'
  UNION SELECT 'D' UNION SELECT 'E' UNION SELECT 'F'
) s
WHERE a.aircraft_id IN (2,3,4,5,6,7,8,9,10);




INSERT INTO Schedule_Seat (schedule_id, seat_id)
SELECT s.schedule_id, se.seat_id
FROM Schedule s
JOIN Flight f ON s.flight_id = f.flight_id
JOIN Seat se ON se.aircraft_id = f.aircraft_id
WHERE NOT EXISTS (
  SELECT 1 FROM Schedule_Seat ss
  WHERE ss.schedule_id = s.schedule_id
  AND ss.seat_id = se.seat_id
);



DELIMITER //

CREATE PROCEDURE SafeBooking(
    IN p_user_id INT,
    IN p_schedule_id INT,
    IN p_schedule_seat_id INT
)
BEGIN
    DECLARE seat_status_val VARCHAR(20);

    -- ✅ Exception handling block
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error occurred. Transaction rolled back.' AS message;
    END;

    START TRANSACTION;

    SELECT status INTO seat_status_val
    FROM Schedule_Seat
    WHERE schedule_seat_id = p_schedule_seat_id
    FOR UPDATE;

    IF seat_status_val = 'BOOKED' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Seat already booked';
    END IF;

    INSERT INTO Booking (user_id, schedule_id, total_amount)
    VALUES (p_user_id, p_schedule_id, 5000);

    INSERT INTO Ticket (booking_id, passenger_id, schedule_seat_id, ticket_number)
    VALUES (LAST_INSERT_ID(), 1, p_schedule_seat_id, UUID());

    UPDATE Schedule_Seat
    SET status = 'BOOKED'
    WHERE schedule_seat_id = p_schedule_seat_id;

    COMMIT;
END //

DELIMITER ;



-- ================= FUNCTIONS =================
DELIMITER //

-- 🔹 1. Get total bookings of a user
CREATE FUNCTION GetUserBookingCount(p_user_id INT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE total INT;

    SELECT COUNT(*) INTO total
    FROM Booking
    WHERE user_id = p_user_id;

    RETURN IFNULL(total, 0);
END //

-- 🔹 2. Get available seats for a schedule
CREATE FUNCTION GetAvailableSeats(p_schedule_id INT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE available INT;

    SELECT COUNT(*) INTO available
    FROM Schedule_Seat
    WHERE schedule_id = p_schedule_id
    AND status = 'AVAILABLE';

    RETURN IFNULL(available, 0);
END //

-- 🔹 3. Get total revenue
CREATE FUNCTION GetTotalRevenue()
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE revenue DECIMAL(10,2);

    SELECT SUM(total_amount) INTO revenue
    FROM Booking
    WHERE payment_status = 'SUCCESS';

    RETURN IFNULL(revenue, 0);
END //

DELIMITER ;