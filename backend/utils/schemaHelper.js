const { pool } = require("../config/db");

const TABLE_CANDIDATES = {
  users: ["User", "Users", "user", "users", "Customer", "customer"],
  aircraft: ["Aircraft", "aircraft"],
  airports: ["Airport", "Airports", "airport", "airports"],
  flights: ["Flight", "Flights", "flight", "flights"],
  fares: ["Fare", "Fares", "fare", "fares"],
  schedules: ["Schedule", "Schedules", "schedule", "schedules"],
  instances: ["Flight_Instance", "FlightInstance", "flight_instance", "Instance", "instance", "instances"],
  seats: ["Seat", "Seats", "seat", "seats"],
  scheduleSeats: ["Schedule_Seat", "ScheduleSeat", "schedule_seat", "scheduleSeat"],
  seatLocks: ["Seat_Lock", "SeatLock", "seat_lock", "seatLock"],
  bookings: ["Booking", "Bookings", "booking", "bookings"],
  tickets: ["Ticket", "Tickets", "ticket", "tickets"],
  passengers: ["Passenger", "Passengers", "passenger", "passengers"],
  payments: ["Payment", "Payments", "payment", "payments"],
};

const COLUMN_CANDIDATES = {
  users: {
    id: ["user_id", "id", "customer_id"],
    name: ["name", "full_name", "username", "user_name"],
    email: ["email", "email_address"],
    password: ["password", "password_hash", "passwd", "hashed_password"],
    role: ["role", "user_role", "account_type", "type"],
    createdAt: ["created_at", "createdAt", "registration_date", "created_on"],
  },
  aircraft: {
    id: ["aircraft_id", "id"],
    model: ["model", "aircraft_model"],
    registrationCode: ["registration_code", "code", "aircraft_code"],
    capacity: ["total_seats", "capacity"],
    businessSeats: ["business_seats"],
    firstClassSeats: ["first_class_seats"],
    status: ["status"],
    isAvailable: ["is_available"],
  },
  airports: {
    id: ["airport_id", "id"],
    code: ["code", "airport_code", "iata_code"],
    city: ["city", "airport_city"],
    name: ["name", "airport_name"],
  },
  flights: {
    id: ["flight_id", "id"],
    number: ["flight_number", "flight_no", "code"],
    airlineName: ["airline_name", "airline", "carrier_name"],
    airlineCode: ["airline_code", "carrier_code", "code_prefix"],
    aircraftModel: ["aircraft_model", "aircraft", "aircraft_name", "model"],
    aircraftCode: ["aircraft_code"],
    sourceAirportId: ["source_airport_id", "from_airport_id", "origin_airport_id", "source_id"],
    destinationAirportId: [
      "destination_airport_id",
      "to_airport_id",
      "arrival_airport_id",
      "destination_id",
    ],
    duration: ["duration", "duration_minutes", "flight_duration"],
    cabin: ["cabin", "class", "travel_class"],
    status: ["status", "flight_status"],
  },
  fares: {
    id: ["fare_id", "id"],
    flightId: ["flight_id"],
    cabin: ["cabin", "class", "travel_class"],
    basePrice: ["base_price"],
    taxes: ["taxes"],
    totalPrice: ["total_price"],
  },
  schedules: {
    id: ["schedule_id", "id"],
    flightId: ["flight_id"],
    price: ["price", "fare", "base_price", "ticket_price"],
    departureTime: ["departure_time", "depart_time", "departure_at", "depart_at", "departure_datetime"],
    arrivalTime: ["arrival_time", "arrive_time", "arrival_at", "arrive_at", "arrival_datetime"],
    date: ["schedule_date", "travel_date", "departure_date", "date"],
    status: ["status", "schedule_status"],
    sourceAirportId: ["source_airport_id", "from_airport_id", "origin_airport_id"],
    destinationAirportId: ["destination_airport_id", "to_airport_id", "arrival_airport_id"],
    duration: ["duration", "duration_minutes"],
    cabin: ["cabin", "class", "travel_class"],
  },
  instances: {
    id: ["instance_id", "id"],
    scheduleId: ["schedule_id"],
    date: ["instance_date", "date"],
    capacity: ["capacity"],
    availableSeats: ["available_seats"],
    bookedSeats: ["booked_seats"],
    status: ["status", "instance_status"],
  },
  seats: {
    id: ["seat_id", "id"],
    seatNo: ["seat_no", "seat_number", "seat_name", "code"],
    cabin: ["cabin", "class", "seat_class"],
    rowNumber: ["row_no", "row_number"],
    columnName: ["column_name", "column_no", "seat_column"],
  },
  scheduleSeats: {
    id: ["schedule_seat_id", "id"],
    scheduleId: ["schedule_id"],
    seatId: ["seat_id"],
    seatNo: ["seat_no", "seat_number"],
    status: ["status", "seat_status", "booking_status"],
    price: ["price", "seat_price", "fare"],
    cabin: ["cabin", "class", "travel_class"],
  },
  seatLocks: {
    id: ["seat_lock_id", "lock_id", "id"],
    scheduleSeatId: ["schedule_seat_id"],
    userId: ["user_id"],
    expiry: ["expiry", "expires_at", "locked_until", "lock_expiry_time"],
    status: ["status", "lock_status"],
    createdAt: ["created_at", "locked_at"],
  },
  bookings: {
    id: ["booking_id", "id"],
    userId: ["user_id"],
    scheduleId: ["schedule_id"],
    instanceId: ["instance_id"],
    reference: ["booking_ref", "booking_reference", "pnr"],
    status: ["booking_status", "status"],
    bookedDate: ["booked_date", "booking_date", "created_at"],
    amount: ["amount", "total_amount", "price"],
    contactEmail: ["contact_email", "email"],
    contactMobile: ["contact_mobile", "mobile"],
  },
  tickets: {
    id: ["ticket_id", "id"],
    bookingId: ["booking_id"],
    passengerId: ["passenger_id"],
    scheduleSeatId: ["schedule_seat_id"],
    ticketNumber: ["ticket_number", "ticket_ref", "pnr"],
    status: ["status", "ticket_status"],
    amount: ["amount", "fare", "price"],
  },
  passengers: {
    id: ["passenger_id", "id"],
    bookingId: ["booking_id"],
    ticketId: ["ticket_id"],
    name: ["name", "full_name", "passenger_name"],
    firstName: ["first_name"],
    lastName: ["last_name"],
    age: ["age"],
    gender: ["gender"],
    email: ["email", "contact_email"],
  },
  payments: {
    id: ["payment_id", "id"],
    bookingId: ["booking_id"],
    amount: ["amount", "paid_amount"],
    status: ["payment_status", "status"],
    method: ["payment_method", "method"],
    transactionId: ["transaction_id", "payment_ref", "reference_id"],
    paidAt: ["paid_at", "payment_date", "updated_at"],
  },
};

let schemaCache = null;

const quote = (identifier) => `\`${String(identifier).replace(/`/g, "``")}\``;

const getRowValue = (row, expectedKey) => {
  if (!row || typeof row !== "object") {
    return null;
  }

  const expected = String(expectedKey).toLowerCase();
  const matchingKey = Object.keys(row).find((key) => String(key).toLowerCase() === expected);
  return matchingKey ? row[matchingKey] : null;
};

const pickCandidate = (availableValues, candidates = []) => {
  const valueMap = new Map(availableValues.map((value) => [String(value).toLowerCase(), value]));

  for (const candidate of candidates) {
    const match = valueMap.get(String(candidate).toLowerCase());
    if (match) {
      return match;
    }
  }

  return null;
};

const invalidateSchemaCache = () => {
  schemaCache = null;
};

const loadSchema = async (forceRefresh = false) => {
  if (schemaCache && !forceRefresh) {
    return schemaCache;
  }

  const [[databaseRow]] = await pool.query("SELECT DATABASE() AS database_name");

  const databaseName = getRowValue(databaseRow, "database_name");

  if (!databaseName) {
    throw new Error("Database connection is active but no default schema is selected.");
  }
  const [tableRows] = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
    [databaseName]
  );
  const [columnRows] = await pool.query(
    "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = ?",
    [databaseName]
  );
  const [procedureRows] = await pool.query(
    "SELECT routine_name FROM information_schema.routines WHERE routine_schema = ? AND routine_type = 'PROCEDURE'",
    [databaseName]
  );

  const tables = tableRows.map((row) => getRowValue(row, "table_name")).filter(Boolean);
  const columnsByTable = columnRows.reduce((accumulator, row) => {
    const tableName = getRowValue(row, "table_name");
    const columnName = getRowValue(row, "column_name");

    if (!tableName || !columnName) {
      return accumulator;
    }

    accumulator[tableName] = accumulator[tableName] || [];
    accumulator[tableName].push(columnName);
    return accumulator;
  }, {});

  const entities = Object.entries(TABLE_CANDIDATES).reduce((accumulator, [entityKey, candidates]) => {
    const table = pickCandidate(tables, candidates);
    const availableColumns = table ? columnsByTable[table] || [] : [];
    const resolvedColumns = Object.entries(COLUMN_CANDIDATES[entityKey] || {}).reduce(
      (columnAccumulator, [columnKey, columnCandidates]) => {
        columnAccumulator[columnKey] = pickCandidate(availableColumns, columnCandidates);
        return columnAccumulator;
      },
      {}
    );

    accumulator[entityKey] = {
      table,
      availableColumns,
      columns: resolvedColumns,
    };
    return accumulator;
  }, {});

  schemaCache = {
    databaseName,
    entities,
    procedures: new Set(procedureRows.map((row) => getRowValue(row, "routine_name")).filter(Boolean)),
  };

  return schemaCache;
};

const ensureEntity = async (entityKey, requiredColumns = []) => {
  const schema = await loadSchema();
  const entity = schema.entities[entityKey];

  if (!entity?.table) {
    const error = new Error(`Expected table for "${entityKey}" was not found in schema "${schema.databaseName}".`);
    error.statusCode = 500;
    throw error;
  }

  const missingColumns = requiredColumns.filter((columnKey) => !entity.columns[columnKey]);
  if (missingColumns.length > 0) {
    const error = new Error(
      `Table "${entity.table}" is missing expected columns: ${missingColumns.join(", ")}.`
    );
    error.statusCode = 500;
    throw error;
  }

  return { schema, entity };
};

const mapStatus = (value, fallback = "available") => {
  const status = String(value || "").trim().toLowerCase();

  if (!status) {
    return fallback;
  }

  if (["booked", "occupied", "confirmed", "reserved", "sold"].includes(status)) {
    return "occupied";
  }

  if (["locked", "hold", "held"].includes(status)) {
    return "locked";
  }

  return "available";
};

const normaliseProcedureResult = (resultSets) => {
  if (!Array.isArray(resultSets)) {
    return [];
  }

  return resultSets.flatMap((entry) => {
    if (!Array.isArray(entry)) {
      return [];
    }

    return entry.filter((row) => row && typeof row === "object" && !Array.isArray(row));
  });
};

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const calculateAge = (dateOfBirth) => {
  const date = parseDateValue(dateOfBirth);
  if (!date) {
    return null;
  }

  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDelta = now.getMonth() - date.getMonth();
  const dayDelta = now.getDate() - date.getDate();

  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const parseDurationToMinutes = (value) => {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  const raw = String(value).trim();
  const hhmmssMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (hhmmssMatch) {
    return Number(hhmmssMatch[1]) * 60 + Number(hhmmssMatch[2]);
  }

  const hourMatch = raw.match(/(\d+)\s*h/i);
  const minuteMatch = raw.match(/(\d+)\s*m/i);

  if (hourMatch || minuteMatch) {
    return Number(hourMatch?.[1] || 0) * 60 + Number(minuteMatch?.[1] || 0);
  }

  const numericValue = Number(raw);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const formatDuration = (minutes) => {
  const totalMinutes = Number(minutes);
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return "N/A";
  }

  const hours = Math.floor(totalMinutes / 60);
  const remainder = totalMinutes % 60;

  if (hours === 0) {
    return `${remainder}m`;
  }

  if (remainder === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
};

const joinPassengerName = (passenger = {}) => {
  if (passenger.name) {
    return passenger.name.trim();
  }

  return [passenger.title, passenger.firstName, passenger.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
};

module.exports = {
  quote,
  loadSchema,
  ensureEntity,
  invalidateSchemaCache,
  mapStatus,
  normaliseProcedureResult,
  calculateAge,
  parseDurationToMinutes,
  formatDuration,
  joinPassengerName,
};
