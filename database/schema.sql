-- ═══════════════════════════════════════════════════════
-- AIRLINE MANAGEMENT SYSTEM — FIXED + NON-DESTRUCTIVE
-- Safe to run multiple times. Nothing drops. Nothing breaks.
-- ═══════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS Airline_mangemnt_System;
USE Airline_mangemnt_System;

SET FOREIGN_KEY_CHECKS = 0;

-- ═══════════════════════════════
-- TABLES (IF NOT EXISTS)
-- ═══════════════════════════════

CREATE TABLE IF NOT EXISTS Airline (
    airline_id   INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    airline_code VARCHAR(10) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS Airport (
    airport_id INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    city       VARCHAR(100),
    country    VARCHAR(100),
    code       VARCHAR(10) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS Users (
    user_id    INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(100) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    phone      VARCHAR(15),
    role       ENUM('CUSTOMER','AIRLINE_STAFF','ADMIN','SUPER_ADMIN') NOT NULL,
    airline_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (airline_id) REFERENCES Airline(airline_id)
);

CREATE TABLE IF NOT EXISTS Aircraft (
    aircraft_id       INT AUTO_INCREMENT PRIMARY KEY,
    airline_id        INT NOT NULL,
    model             VARCHAR(100) NOT NULL,
    total_seats       INT NOT NULL,
    business_seats    INT DEFAULT 0,
    first_class_seats INT DEFAULT 0,
    status            ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
    is_available      BOOLEAN DEFAULT TRUE,
    registration_code VARCHAR(100) UNIQUE,
    range_km          INT,
    cruise_speed      INT,
    max_altitude      INT,
    registration_date DATE,
    next_maintenance  DATE,
    FOREIGN KEY (airline_id) REFERENCES Airline(airline_id)
);

CREATE TABLE IF NOT EXISTS Seat (
    seat_id     INT AUTO_INCREMENT PRIMARY KEY,
    aircraft_id INT NOT NULL,
    seat_no     VARCHAR(10) NOT NULL,
    seat_row    INT NOT NULL,
    seat_label  CHAR(1) NOT NULL,
    seat_type   ENUM('NORMAL','PREMIUM','EMERGENCY') DEFAULT 'NORMAL',
    class       ENUM('ECONOMY','BUSINESS','FIRST') DEFAULT 'ECONOMY',
    UNIQUE (aircraft_id, seat_no),
    FOREIGN KEY (aircraft_id) REFERENCES Aircraft(aircraft_id)
);

CREATE TABLE IF NOT EXISTS Flight (
    flight_id              INT AUTO_INCREMENT PRIMARY KEY,
    flight_number          VARCHAR(20) UNIQUE NOT NULL,
    airline_id             INT NOT NULL,
    aircraft_id            INT NOT NULL,
    source_airport_id      INT NOT NULL,
    destination_airport_id INT NOT NULL,
    duration               INT,
    FOREIGN KEY (airline_id)             REFERENCES Airline(airline_id),
    FOREIGN KEY (aircraft_id)            REFERENCES Aircraft(aircraft_id),
    FOREIGN KEY (source_airport_id)      REFERENCES Airport(airport_id),
    FOREIGN KEY (destination_airport_id) REFERENCES Airport(airport_id)
);

CREATE TABLE IF NOT EXISTS Schedule (
    schedule_id    INT AUTO_INCREMENT PRIMARY KEY,
    flight_id      INT NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time   TIME NOT NULL,
    date           DATE NOT NULL,
    price          DECIMAL(10,2) NOT NULL,
    status         ENUM('SCHEDULED','DELAYED','CANCELLED') DEFAULT 'SCHEDULED',
    FOREIGN KEY (flight_id) REFERENCES Flight(flight_id)
);

CREATE TABLE IF NOT EXISTS Schedule_Seat (
    schedule_seat_id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id      INT NOT NULL,
    seat_id          INT NOT NULL,
    status           ENUM('AVAILABLE','BOOKED','LOCKED') DEFAULT 'AVAILABLE',
    last_updated     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (schedule_id, seat_id),
    FOREIGN KEY (schedule_id) REFERENCES Schedule(schedule_id),
    FOREIGN KEY (seat_id)     REFERENCES Seat(seat_id)
);

CREATE TABLE IF NOT EXISTS Booking (
    booking_id     INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    schedule_id    INT NOT NULL,
    total_amount   DECIMAL(10,2),
    status         ENUM('PENDING','CONFIRMED','CANCELLED') DEFAULT 'PENDING',
    payment_status ENUM('PENDING','SUCCESS','FAILED') DEFAULT 'PENDING',
    booking_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)     REFERENCES Users(user_id),
    FOREIGN KEY (schedule_id) REFERENCES Schedule(schedule_id)
);

CREATE TABLE IF NOT EXISTS Passenger (
    passenger_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id   INT NOT NULL,
    name         VARCHAR(100) NOT NULL,
    age          INT,
    gender       ENUM('MALE','FEMALE','OTHER'),
    passport_no  VARCHAR(50),
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id)
);

CREATE TABLE IF NOT EXISTS Ticket (
    ticket_id        INT AUTO_INCREMENT PRIMARY KEY,
    booking_id       INT NOT NULL,
    passenger_id     INT NOT NULL,
    schedule_seat_id INT NOT NULL,
    ticket_number    VARCHAR(100) UNIQUE,
    status           ENUM('BOOKED','CANCELLED') DEFAULT 'BOOKED',
    issue_date       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id)       REFERENCES Booking(booking_id),
    FOREIGN KEY (passenger_id)     REFERENCES Passenger(passenger_id),
    FOREIGN KEY (schedule_seat_id) REFERENCES Schedule_Seat(schedule_seat_id)
);

CREATE TABLE IF NOT EXISTS Payment (
    payment_id     INT AUTO_INCREMENT PRIMARY KEY,
    booking_id     INT NOT NULL,
    amount         DECIMAL(10,2),
    payment_status ENUM('PENDING','SUCCESS','FAILED') DEFAULT 'PENDING',
    payment_method ENUM('UPI','CARD','NETBANKING'),
    transaction_id VARCHAR(100) UNIQUE,
    payment_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id)
);

CREATE TABLE IF NOT EXISTS Seat_Lock (
    lock_id          INT AUTO_INCREMENT PRIMARY KEY,
    schedule_seat_id INT NOT NULL,
    user_id          INT NOT NULL,
    locked_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lock_expiry_time DATETIME NOT NULL,
    UNIQUE (schedule_seat_id),
    FOREIGN KEY (schedule_seat_id) REFERENCES Schedule_Seat(schedule_seat_id),
    FOREIGN KEY (user_id)          REFERENCES Users(user_id)
);

CREATE TABLE IF NOT EXISTS Error_Log (
    log_id       INT AUTO_INCREMENT PRIMARY KEY,
    context      VARCHAR(100),
    reference_id INT,
    error_msg    TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SET FOREIGN_KEY_CHECKS = 1;

-- ═══════════════════════════════
-- ALTER for pre-existing tables
-- ═══════════════════════════════
-- Seat.class may not exist if table was created before this schema version
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Airline_mangemnt_System' AND TABLE_NAME = 'Seat' AND COLUMN_NAME = 'class');
SET @sql := IF(@col = 0, "ALTER TABLE Seat ADD COLUMN class ENUM('ECONOMY','BUSINESS','FIRST') DEFAULT 'ECONOMY' AFTER seat_type", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ═══════════════════════════════
-- INDEXES (safe — skip if exists)
-- ═══════════════════════════════

SET @idx := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'Airline_mangemnt_System' AND TABLE_NAME = 'Schedule' AND INDEX_NAME = 'idx_schedule');
SET @sql := IF(@idx = 0, 'CREATE INDEX idx_schedule ON Schedule(flight_id, date)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'Airline_mangemnt_System' AND TABLE_NAME = 'Schedule_Seat' AND INDEX_NAME = 'idx_schedule_seat');
SET @sql := IF(@idx = 0, 'CREATE INDEX idx_schedule_seat ON Schedule_Seat(schedule_id, status)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'Airline_mangemnt_System' AND TABLE_NAME = 'Booking' AND INDEX_NAME = 'idx_booking_user');
SET @sql := IF(@idx = 0, 'CREATE INDEX idx_booking_user ON Booking(user_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'Airline_mangemnt_System' AND TABLE_NAME = 'Payment' AND INDEX_NAME = 'idx_payment_booking');
SET @sql := IF(@idx = 0, 'CREATE INDEX idx_payment_booking ON Payment(booking_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'Airline_mangemnt_System' AND TABLE_NAME = 'Seat_Lock' AND INDEX_NAME = 'idx_seat_lock_expiry');
SET @sql := IF(@idx = 0, 'CREATE INDEX idx_seat_lock_expiry ON Seat_Lock(lock_expiry_time)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ═══════════════════════════════
-- TRIGGERS (drop-if-exists first)
-- ═══════════════════════════════
DELIMITER //

DROP TRIGGER IF EXISTS auto_create_schedule_seats //
CREATE TRIGGER auto_create_schedule_seats
AFTER INSERT ON Schedule
FOR EACH ROW
BEGIN
    DECLARE seat_count INT DEFAULT 0;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        INSERT INTO Error_Log (context, reference_id, error_msg)
        VALUES ('auto_create_schedule_seats', NEW.schedule_id, 'Exception during Schedule_Seat population');
    END;
    SELECT COUNT(*) INTO seat_count FROM Seat s JOIN Flight f ON s.aircraft_id = f.aircraft_id WHERE f.flight_id = NEW.flight_id;
    IF seat_count = 0 THEN
        INSERT INTO Error_Log (context, reference_id, error_msg)
        VALUES ('auto_create_schedule_seats', NEW.schedule_id, CONCAT('No seats found for flight_id=', NEW.flight_id));
    ELSE
        INSERT IGNORE INTO Schedule_Seat (schedule_id, seat_id)
        SELECT NEW.schedule_id, s.seat_id FROM Seat s JOIN Flight f ON s.aircraft_id = f.aircraft_id WHERE f.flight_id = NEW.flight_id;
    END IF;
END //

DROP TRIGGER IF EXISTS prevent_overbooking //
CREATE TRIGGER prevent_overbooking
BEFORE INSERT ON Ticket
FOR EACH ROW
BEGIN
    DECLARE seat_status_val VARCHAR(20) DEFAULT NULL;
    SELECT status INTO seat_status_val FROM Schedule_Seat WHERE schedule_seat_id = NEW.schedule_seat_id;
    IF seat_status_val = 'BOOKED' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Seat already booked';
    END IF;
    IF seat_status_val IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid schedule_seat_id';
    END IF;
END //

DROP TRIGGER IF EXISTS after_ticket_insert //
CREATE TRIGGER after_ticket_insert
AFTER INSERT ON Ticket
FOR EACH ROW
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        INSERT INTO Error_Log (context, reference_id, error_msg)
        VALUES ('after_ticket_insert', NEW.ticket_id, 'Failed to mark seat BOOKED after ticket insert');
    END;
    UPDATE Schedule_Seat SET status = 'BOOKED' WHERE schedule_seat_id = NEW.schedule_seat_id;
END //

DROP TRIGGER IF EXISTS sync_payment_status_insert //
CREATE TRIGGER sync_payment_status_insert
AFTER INSERT ON Payment
FOR EACH ROW
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        INSERT INTO Error_Log (context, reference_id, error_msg)
        VALUES ('sync_payment_status_insert', NEW.payment_id, 'Failed to sync payment status to Booking on insert');
    END;
    UPDATE Booking
    SET payment_status = NEW.payment_status,
        status = CASE
            WHEN NEW.payment_status = 'SUCCESS' THEN 'CONFIRMED'
            WHEN NEW.payment_status = 'FAILED'  THEN 'CANCELLED'
            ELSE 'PENDING'
        END
    WHERE booking_id = NEW.booking_id;
END //

DROP TRIGGER IF EXISTS sync_payment_status_update //
CREATE TRIGGER sync_payment_status_update
AFTER UPDATE ON Payment
FOR EACH ROW
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        INSERT INTO Error_Log (context, reference_id, error_msg)
        VALUES ('sync_payment_status_update', NEW.payment_id, 'Failed to sync payment status to Booking on update');
    END;
    UPDATE Booking
    SET payment_status = NEW.payment_status,
        status = CASE
            WHEN NEW.payment_status = 'SUCCESS' THEN 'CONFIRMED'
            WHEN NEW.payment_status = 'FAILED'  THEN 'CANCELLED'
            ELSE 'PENDING'
        END
    WHERE booking_id = NEW.booking_id;
END //

DELIMITER ;

-- ═══════════════════════════════
-- EVENTS
-- ═══════════════════════════════
SET GLOBAL event_scheduler = ON;

DROP EVENT IF EXISTS clean_expired_locks;
DELIMITER //
CREATE EVENT clean_expired_locks
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        INSERT INTO Error_Log (context, reference_id, error_msg)
        VALUES ('clean_expired_locks', NULL, 'Event failed during lock cleanup');
    END;
    UPDATE Schedule_Seat SET status = 'AVAILABLE'
    WHERE schedule_seat_id IN (SELECT schedule_seat_id FROM Seat_Lock WHERE lock_expiry_time < NOW())
      AND status = 'LOCKED';
    DELETE FROM Seat_Lock WHERE lock_expiry_time < NOW();
END //
DELIMITER ;

-- ═══════════════════════════════
-- PROCEDURES
-- ═══════════════════════════════
DELIMITER //

DROP PROCEDURE IF EXISTS SafeBooking //
CREATE PROCEDURE SafeBooking(
    IN p_user_id          INT,
    IN p_schedule_id      INT,
    IN p_schedule_seat_id INT,
    IN p_passenger_id     INT,
    IN p_total_amount     DECIMAL(10,2)
)
BEGIN
    DECLARE seat_status_val      VARCHAR(20) DEFAULT NULL;
    DECLARE v_passenger_booking  INT DEFAULT NULL;
    DECLARE v_booking_id         INT DEFAULT NULL;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        INSERT INTO Error_Log (context, reference_id, error_msg)
        VALUES ('SafeBooking', p_schedule_seat_id, 'Transaction failed and rolled back');
        SELECT 'Error: booking failed. Transaction rolled back.' AS message;
    END;
    START TRANSACTION;
    SELECT booking_id INTO v_passenger_booking FROM Passenger WHERE passenger_id = p_passenger_id;
    IF v_passenger_booking IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid passenger_id: not found';
    END IF;
    SELECT booking_id INTO v_booking_id FROM Booking WHERE booking_id = v_passenger_booking AND user_id = p_user_id;
    IF v_booking_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Passenger does not belong to this user';
    END IF;
    SELECT status INTO seat_status_val FROM Schedule_Seat WHERE schedule_seat_id = p_schedule_seat_id FOR UPDATE;
    IF seat_status_val IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid schedule_seat_id';
    END IF;
    IF seat_status_val = 'BOOKED' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Seat already booked';
    END IF;
    INSERT INTO Booking (user_id, schedule_id, total_amount) VALUES (p_user_id, p_schedule_id, p_total_amount);
    SET v_booking_id = LAST_INSERT_ID();
    INSERT INTO Ticket (booking_id, passenger_id, schedule_seat_id, ticket_number)
    VALUES (v_booking_id, p_passenger_id, p_schedule_seat_id, UUID());
    DELETE FROM Seat_Lock WHERE schedule_seat_id = p_schedule_seat_id AND user_id = p_user_id;
    COMMIT;
    SELECT 'Booking successful' AS message, v_booking_id AS booking_id;
END //

DROP PROCEDURE IF EXISTS GetAllAircraftModels //
CREATE PROCEDURE GetAllAircraftModels()
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        INSERT INTO Error_Log (context, reference_id, error_msg)
        VALUES ('GetAllAircraftModels', NULL, 'Query failed');
        SELECT 'Error fetching aircraft models' AS message;
    END;
    SELECT a.aircraft_id, a.model, a.registration_code, a.status, a.total_seats, al.name AS airline_name
    FROM Aircraft a JOIN Airline al ON a.airline_id = al.airline_id ORDER BY a.aircraft_id;
END //

DROP PROCEDURE IF EXISTS GetFlightRevenue //
CREATE PROCEDURE GetFlightRevenue(IN p_flight_id INT)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        INSERT INTO Error_Log (context, reference_id, error_msg)
        VALUES ('GetFlightRevenue', p_flight_id, 'Query failed');
        SELECT 'Error fetching revenue' AS message;
    END;
    SELECT f.flight_number, SUM(p.amount) AS total_revenue, COUNT(b.booking_id) AS total_bookings
    FROM Booking b
    JOIN Payment p  ON p.booking_id  = b.booking_id
    JOIN Schedule s ON b.schedule_id = s.schedule_id
    JOIN Flight f   ON s.flight_id   = f.flight_id
    WHERE f.flight_id = p_flight_id AND p.payment_status = 'SUCCESS'
    GROUP BY f.flight_number;
END //

DROP PROCEDURE IF EXISTS SeatSummary //
CREATE PROCEDURE SeatSummary(IN p_schedule_id INT)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        INSERT INTO Error_Log (context, reference_id, error_msg)
        VALUES ('SeatSummary', p_schedule_id, 'Query failed');
        SELECT 'Error fetching seat summary' AS message;
    END;
    SELECT COUNT(*) AS total_seats, SUM(status = 'BOOKED') AS booked_seats,
           SUM(status = 'AVAILABLE') AS available_seats, SUM(status = 'LOCKED') AS locked_seats
    FROM Schedule_Seat WHERE schedule_id = p_schedule_id;
END //

DROP PROCEDURE IF EXISTS BookSeat //
-- BookSeat is deprecated. All bookings go through SafeBooking or the application layer.

DELIMITER ;

-- ═══════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════
DELIMITER //

DROP FUNCTION IF EXISTS GetUserBookingCount //
CREATE FUNCTION GetUserBookingCount(p_user_id INT)
RETURNS INT READS SQL DATA
BEGIN
    DECLARE total INT DEFAULT 0;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET total = -1;
    SELECT COUNT(*) INTO total FROM Booking WHERE user_id = p_user_id;
    RETURN IFNULL(total, 0);
END //

DROP FUNCTION IF EXISTS GetAvailableSeats //
CREATE FUNCTION GetAvailableSeats(p_schedule_id INT)
RETURNS INT READS SQL DATA
BEGIN
    DECLARE available INT DEFAULT 0;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET available = -1;
    SELECT COUNT(*) INTO available FROM Schedule_Seat WHERE schedule_id = p_schedule_id AND status = 'AVAILABLE';
    RETURN IFNULL(available, 0);
END //

DROP FUNCTION IF EXISTS GetTotalRevenue //
CREATE FUNCTION GetTotalRevenue()
RETURNS DECIMAL(10,2) READS SQL DATA
BEGIN
    DECLARE revenue DECIMAL(10,2) DEFAULT 0.00;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET revenue = -1.00;
    SELECT SUM(amount) INTO revenue FROM Payment WHERE payment_status = 'SUCCESS';
    RETURN IFNULL(revenue, 0.00);
END //

DELIMITER ;
-- ═══════════════════════════════
-- Cursors 
-- ═══════════════════════════════
DELIMITER //

CREATE PROCEDURE Cursor_SeatStatus(IN p_schedule_id INT)
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_seat_id INT;
    DECLARE v_status VARCHAR(20);

    DECLARE cur_seat CURSOR FOR
        SELECT schedule_seat_id, status
        FROM Schedule_Seat
        WHERE schedule_id = p_schedule_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur_seat;

    read_loop: LOOP
        FETCH cur_seat INTO v_seat_id, v_status;

        IF done THEN
            LEAVE read_loop;
        END IF;

        SELECT v_seat_id AS Seat_ID, v_status AS Seat_Status;
    END LOOP;

    CLOSE cur_seat;
END //

CREATE PROCEDURE Cursor_TotalRevenue()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_amount DECIMAL(10,2);
    DECLARE total DECIMAL(10,2) DEFAULT 0;

    DECLARE cur_payment CURSOR FOR
        SELECT amount 
        FROM Payment 
        WHERE payment_status = 'SUCCESS';

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur_payment;

    read_loop: LOOP
        FETCH cur_payment INTO v_amount;

        IF done THEN
            LEAVE read_loop;
        END IF;

        SET total = total + v_amount;
    END LOOP;

    CLOSE cur_payment;

    SELECT total AS Total_Revenue;
END //

CREATE PROCEDURE Cursor_UserBookings(IN p_user_id INT)
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_booking_id INT;
    DECLARE v_amount DECIMAL(10,2);

    DECLARE cur_booking CURSOR FOR
        SELECT booking_id, total_amount
        FROM Booking
        WHERE user_id = p_user_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur_booking;

    read_loop: LOOP
        FETCH cur_booking INTO v_booking_id, v_amount;

        IF done THEN
            LEAVE read_loop;
        END IF;

        SELECT v_booking_id AS Booking_ID, v_amount AS Amount;
    END LOOP;

    CLOSE cur_booking;
END //

DELIMITER ;

-- ═══════════════════════════════
-- SEED DATA (INSERT IGNORE — safe to re-run)
-- ═══════════════════════════════

INSERT IGNORE INTO Airline (name, airline_code) VALUES
('Air India','AI'),('IndiGo','6E'),('SpiceJet','SG'),('Vistara','UK'),
('Akasa Air','QP'),('GoAir','G8'),('Alliance Air','9I'),
('TruJet','2T'),('AirAsia India','I5'),('Zoom Air','Z5');

INSERT IGNORE INTO Airport (name, city, country, code) VALUES
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

INSERT IGNORE INTO Aircraft
(airline_id,model,total_seats,business_seats,first_class_seats,
 registration_code,range_km,cruise_speed,max_altitude,registration_date,next_maintenance)
VALUES
(1,'A320',150,20,12,'AI-A320-001',6000,840,39000,'2024-01-01','2026-01-01'),
(2,'B737',144,18,12,'6E-B737-001',5500,820,37000,'2023-01-01','2025-01-01'),
(3,'A321',180,24,16,'SG-A321-001',6500,860,41000,'2024-02-01','2026-02-01'),
(4,'B787',242,30,20,'UK-B787-001',14000,900,43000,'2022-01-01','2025-01-01'),
(5,'A319',124,16,12,'QP-A319-001',5900,830,38000,'2023-03-01','2025-03-01'),
(6,'B777',396,35,25,'G8-B777-001',15000,905,43000,'2022-02-01','2025-02-01'),
(7,'A330',335,32,23,'9I-A330-001',13500,890,42000,'2023-04-01','2026-04-01'),
(8,'B767',269,25,20,'2T-B767-001',12000,880,41000,'2023-05-01','2025-05-01'),
(9,'E190',114,10,15,'I5-E190-001',4500,780,35000,'2024-06-01','2026-06-01'),
(10,'ATR72',72,8,12,'Z5-ATR72-001',1500,500,25000,'2024-07-01','2025-07-01');

-- Seats BEFORE schedules — trigger depends on seats existing
INSERT IGNORE INTO Seat (aircraft_id, seat_no, seat_row, seat_label, class)
SELECT
    a.aircraft_id,
    CONCAT(r.row_num, s.seat_letter),
    r.row_num,
    s.seat_letter,
    CASE
        WHEN r.row_num <= 2  THEN 'FIRST'
        WHEN r.row_num <= 7  THEN 'BUSINESS'
        ELSE 'ECONOMY'
    END
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
) s;

INSERT IGNORE INTO Users (name,email,password,phone,role) VALUES
('Alice Sharma','alice@mail.com','$2b$10$hashed1','9876543201','CUSTOMER'),
('Bob Mehta','bob@mail.com','$2b$10$hashed2','9876543202','CUSTOMER'),
('Carol Singh','carol@mail.com','$2b$10$hashed3','9876543203','CUSTOMER'),
('David Rao','david@mail.com','$2b$10$hashed4','9876543204','CUSTOMER'),
('Eva Patel','eva@mail.com','$2b$10$hashed5','9876543205','CUSTOMER'),
('Admin User','admin@airline.com','$2b$10$hashed6','9876543206','ADMIN'),
('Staff One','staff1@airline.com','$2b$10$hashed7','9876543207','AIRLINE_STAFF'),
('Staff Two','staff2@airline.com','$2b$10$hashed8','9876543208','AIRLINE_STAFF'),
('Frank Das','frank@mail.com','$2b$10$hashed9','9876543209','CUSTOMER'),
('Grace Nair','grace@mail.com','$2b$10$hashed10','9876543210','CUSTOMER');

INSERT IGNORE INTO Flight
(flight_number,airline_id,aircraft_id,source_airport_id,destination_airport_id,duration)
VALUES
('AI-101',1,1,1,2,120),('6E-201',2,2,2,3,90), ('SG-301',3,3,3,4,110),
('UK-401',4,4,4,5,130),('QP-501',5,5,5,6,100),('G8-601',6,6,6,7,80),
('9I-701',7,7,7,8,95), ('2T-801',8,8,8,9,115),('I5-901',9,9,9,10,75),
('Z5-001',10,10,10,1,60);

-- Schedules last — trigger auto-populates Schedule_Seat
INSERT IGNORE INTO Schedule
(flight_id,departure_time,arrival_time,date,price) VALUES
(1,'10:00','12:00','2026-06-01',5000.00),
(2,'11:00','13:00','2026-06-01',5200.00),
(3,'12:00','14:00','2026-06-01',5400.00),
(4,'13:00','15:00','2026-06-01',5600.00),
(5,'14:00','16:00','2026-06-01',5800.00),
(6,'15:00','17:00','2026-06-01',6000.00),
(7,'16:00','18:00','2026-06-01',6200.00),
(8,'17:00','19:00','2026-06-01',6400.00),
(9,'18:00','20:00','2026-06-01',6600.00),
(10,'19:00','21:00','2026-06-01',6800.00);

-- NO manual Schedule_Seat INSERT — trigger is the single source of truth

-- ═══════════════════════════════
-- VERIFY (fail loud not silent)
-- ═══════════════════════════════
SELECT 'Airlines'     AS entity, COUNT(*) AS count FROM Airline
UNION ALL SELECT 'Airports',    COUNT(*) FROM Airport
UNION ALL SELECT 'Aircraft',    COUNT(*) FROM Aircraft
UNION ALL SELECT 'Seats',       COUNT(*) FROM Seat
UNION ALL SELECT 'Flights',     COUNT(*) FROM Flight
UNION ALL SELECT 'Schedules',   COUNT(*) FROM Schedule
UNION ALL SELECT 'SchedSeats',  COUNT(*) FROM Schedule_Seat
UNION ALL SELECT 'Users',       COUNT(*) FROM Users;

SELECT
    CASE WHEN COUNT(*) = 0
        THEN '❌ WARNING: Schedule_Seat empty — trigger may have failed'
        ELSE CONCAT('✅ Schedule_Seat populated: ', COUNT(*), ' rows')
    END AS schedule_seat_check
FROM Schedule_Seat;

SELECT
    CASE WHEN COUNT(*) = 0
        THEN '✅ No errors logged'
        ELSE CONCAT('⚠️  Error_Log has ', COUNT(*), ' entries — review!')
    END AS error_log_check
FROM Error_Log;

SELECT GetAvailableSeats(1) AS avail_schedule_1;
SELECT GetTotalRevenue()    AS total_revenue;
