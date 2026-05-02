import React, { useEffect, useMemo, useState } from "react";

import { apiRequest } from "../../utils/api";

const getAirlineMenu = (counts) => [
  {
    key: "dashboard",
    label: "Dashboard",
    count: null,
    children: [{ key: "dashboard-overview", label: "Overview", count: null }],
  },
  {
    key: "aircraft-management",
    label: "Aircraft Management",
    count: counts.aircraft,
    children: [
      { key: "all-aircraft", label: "All Aircraft", count: counts.aircraft },
      { key: "create-aircraft", label: "Create Aircraft", count: null },
    ],
  },
  {
    key: "flight-management",
    label: "Flight Management",
    count: counts.flights,
    children: [
      { key: "all-flights", label: "All Flights", count: counts.flights },
      { key: "create-flight", label: "Create Flight", count: null },
      { key: "create-fare", label: "Create Fare", count: null },
      { key: "create-fare-rule", label: "Create Fare Rule", count: null },
      { key: "create-baggage-policy", label: "Create Baggage Policy", count: null },
    ],
  },
  {
    key: "flight-schedules",
    label: "Flight Schedules",
    count: counts.schedules,
    children: [
      { key: "all-schedules", label: "All Schedules", count: counts.schedules },
      { key: "create-schedule", label: "Create Schedule", count: null },
    ],
  },
  {
    key: "flight-instances",
    label: "Flight Instances",
    count: counts.instances,
    children: [
      { key: "all-instances", label: "All Instances", count: counts.instances },
      { key: "create-instance", label: "Create Instance", count: null },
    ],
  },
  {
    key: "ancillaries",
    label: "Ancillaries",
    count: null,
    children: [
      { key: "master-ancillaries", label: "Master Ancillaries", count: null },
      { key: "create-ancillary", label: "Create Ancillary", count: null },
      { key: "insurance-coverage", label: "Insurance Coverages", count: null },
    ],
  },
  {
    key: "meal-management",
    label: "Meal Management",
    count: null,
    children: [
      { key: "add-meal", label: "Add Meal", count: null },
      { key: "meal-status", label: "Meal Status", count: null },
    ],
  },
  {
    key: "pricing-discounts",
    label: "Pricing & Discounts",
    count: null,
    children: [
      { key: "create-discount", label: "Create Discount", count: null },
      { key: "existing-discounts", label: "Existing Discounts", count: null },
    ],
  },
  {
    key: "bookings",
    label: "Bookings",
    count: counts.bookings,
    children: [
      { key: "booking-statistics", label: "Booking Statistics", count: null },
      { key: "all-bookings", label: "All Bookings", count: counts.bookings },
      { key: "transactions", label: "Transactions", count: null },
    ],
  },
  {
    key: "reports-analytics",
    label: "Reports & Analytics",
    count: null,
    children: [{ key: "route-performance", label: "Route Performance", count: null }],
  },
];

const superAdminMenu = [
  { key: "platform-overview", label: "Platform Overview", count: null },
  {
    key: "airline-admin",
    label: "Airline Management",
    count: null,
    children: [
      { key: "all-airlines", label: "All Airlines", count: null },
      { key: "pending-approvals", label: "Pending Approvals", count: null },
      { key: "suspended", label: "Suspended", count: null },
      { key: "compliance", label: "Compliance", count: null },
      { key: "commission-rules", label: "Commission Rules", count: null },
    ],
  },
  {
    key: "airport-city",
    label: "Airport & City",
    count: null,
    children: [
      { key: "all-airports", label: "All Airports", count: null },
      { key: "cities", label: "Cities", count: null },
    ],
  },
  { key: "user-management", label: "User Management", count: null },
];

const airportMap = {
  BOM: {
    code: "BOM",
    city: "Mumbai",
    name: "Chhatrapati Shivaji Maharaj International Airport",
  },
  CCU: {
    code: "CCU",
    city: "Kolkata",
    name: "Netaji Subhas Chandra Bose International Airport",
  },
  DEL: {
    code: "DEL",
    city: "Delhi",
    name: "Indira Gandhi International Airport",
  },
  AMD: {
    code: "AMD",
    city: "Ahmedabad",
    name: "Sardar Vallabhbhai Patel International Airport",
  },
  BLR: {
    code: "BLR",
    city: "Bengaluru",
    name: "Kempegowda International Airport",
  },
  DXB: {
    code: "DXB",
    city: "Dubai",
    name: "Dubai International Airport",
  },
};

const aircraftSeed = [
  {
    aircraft_id: 3,
    airline_id: 1,
    airline_name: "Adi India",
    model: "Boeing 737-800",
    code: "B738",
    total_seats: 180,
    business_seats: 30,
    first_class_seats: 10,
    premium_economy_seats: 50,
    economy_seats: 90,
    range_km: 5430,
    cruising_speed: 870,
    max_altitude: 560,
    status: "ACTIVE",
    is_available: true,
    registration_date: "February 17, 2024",
    next_maintenance_date: "October 20, 2027",
    last_updated: "February 17, 2026",
    configuration: "Standard",
    cabinLayouts: [
      {
        id: "economy",
        name: "ECONOMY",
        tag: "Economy",
        active: true,
        totalSeats: 90,
        availableSeats: 90,
        totalRows: 15,
        seatsPerRow: "Varies",
        layoutName: "Standard Economy Layout",
        leftSeats: 3,
        rightSeats: 3,
      },
      {
        id: "premium",
        name: "PREMIUM_ECONOMY",
        tag: "Premium Economy",
        active: true,
        totalSeats: 50,
        availableSeats: 50,
        totalRows: 10,
        seatsPerRow: "Varies",
        layoutName: "Premium Economy Layout",
        leftSeats: 2,
        rightSeats: 3,
      },
      {
        id: "business",
        name: "BUSINESS",
        tag: "Business",
        active: true,
        totalSeats: 30,
        availableSeats: 30,
        totalRows: 10,
        seatsPerRow: "Varies",
        layoutName: "Business Class Layout",
        leftSeats: 2,
        rightSeats: 1,
      },
      {
        id: "first",
        name: "FIRST",
        tag: "First",
        active: true,
        totalSeats: 10,
        availableSeats: 10,
        totalRows: 5,
        seatsPerRow: "Varies",
        layoutName: "First Class Layout",
        leftSeats: 1,
        rightSeats: 1,
      },
    ],
  },
  {
    aircraft_id: 4,
    airline_id: 1,
    airline_name: "Adi India",
    model: "Airbus A320neo",
    code: "A20N",
    total_seats: 186,
    business_seats: 18,
    first_class_seats: 0,
    premium_economy_seats: 24,
    economy_seats: 144,
    range_km: 6100,
    cruising_speed: 828,
    max_altitude: 390,
    status: "ACTIVE",
    is_available: true,
    registration_date: "June 08, 2023",
    next_maintenance_date: "January 14, 2027",
    last_updated: "April 10, 2026",
    configuration: "Dual Cabin",
    cabinLayouts: [
      {
        id: "economy-a20n",
        name: "ECONOMY",
        tag: "Economy",
        active: true,
        totalSeats: 144,
        availableSeats: 120,
        totalRows: 24,
        seatsPerRow: "6",
        layoutName: "Dense Economy Layout",
        leftSeats: 3,
        rightSeats: 3,
      },
      {
        id: "business-a20n",
        name: "BUSINESS",
        tag: "Business",
        active: true,
        totalSeats: 18,
        availableSeats: 12,
        totalRows: 6,
        seatsPerRow: "4",
        layoutName: "Regional Business Layout",
        leftSeats: 2,
        rightSeats: 2,
      },
    ],
  },
];

const flightSeed = [
  {
    flight_id: 101,
    flight_number: "FT101",
    airline_id: 1,
    airline_name: "Adi India",
    aircraft_code: "B738",
    aircraft_model: "Boeing 737-800",
    source_airport_id: 1,
    destination_airport_id: 2,
    source_code: "BOM",
    destination_code: "CCU",
    duration: 180,
    status: "SCHEDULED",
    pricing: "Not set",
    cabins: { first: 10, business: 30, premium: 50, economy: 90 },
    last_modified: "2/17/2026",
  },
  {
    flight_id: 102,
    flight_number: "FT102",
    airline_id: 1,
    airline_name: "Adi India",
    aircraft_code: "B738",
    aircraft_model: "Boeing 737-800",
    source_airport_id: 3,
    destination_airport_id: 4,
    source_code: "DEL",
    destination_code: "AMD",
    duration: 120,
    status: "SCHEDULED",
    pricing: "Not set",
    cabins: { first: 10, business: 30, premium: 50, economy: 90 },
    last_modified: "2/17/2026",
  },
  {
    flight_id: 103,
    flight_number: "FT103",
    airline_id: 1,
    airline_name: "Adi India",
    aircraft_code: "B738",
    aircraft_model: "Boeing 737-800",
    source_airport_id: 5,
    destination_airport_id: 6,
    source_code: "BLR",
    destination_code: "DXB",
    duration: 240,
    status: "SCHEDULED",
    pricing: "Configured",
    cabins: { first: 10, business: 30, premium: 50, economy: 90 },
    last_modified: "3/11/2026",
  },
];

const scheduleSeed = [
  {
    schedule_id: 1,
    flight_number: "FT101",
    route: "BOM - CCU",
    source_name: airportMap.BOM.name,
    destination_name: airportMap.CCU.name,
    departure_time: "09:00:00",
    arrival_time: "12:00:00",
    recurrence: "Weekly (4d)",
    recurrence_days: "MON, TUE, WED, THU",
    duration: "3h 0m",
    status: "Active",
  },
  {
    schedule_id: 2,
    flight_number: "FT101",
    route: "BOM - CCU",
    source_name: airportMap.BOM.name,
    destination_name: airportMap.CCU.name,
    departure_time: "07:00:00",
    arrival_time: "09:00:00",
    recurrence: "Weekly (7d)",
    recurrence_days: "MON, TUE, WED, THU, FRI, SAT, SUN",
    duration: "2h 0m",
    status: "Active",
  },
  {
    schedule_id: 3,
    flight_number: "FT102",
    route: "DEL - AMD",
    source_name: airportMap.DEL.name,
    destination_name: airportMap.AMD.name,
    departure_time: "07:00:00",
    arrival_time: "09:00:00",
    recurrence: "Weekly (7d)",
    recurrence_days: "MON, TUE, WED, THU, FRI, SAT, SUN",
    duration: "2h 0m",
    status: "Active",
  },
  {
    schedule_id: 4,
    flight_number: "FT101",
    route: "BOM - CCU",
    source_name: airportMap.BOM.name,
    destination_name: airportMap.CCU.name,
    departure_time: "13:00:00",
    arrival_time: "15:00:00",
    recurrence: "Weekly (7d)",
    recurrence_days: "TUE, MON, WED, THU, FRI, SAT, SUN",
    duration: "2h 0m",
    status: "Active",
  },
];

const instanceSeed = [
  {
    instance_id: 62,
    flight_number: "FT101",
    airline_name: "Adi India",
    aircraft_code: "B738",
    route: "BOM - CCU",
    departure_code: "BOM",
    arrival_code: "CCU",
    departure_city: "Mumbai",
    arrival_city: "Kolkata",
    departure_airport: airportMap.BOM.name,
    arrival_airport: airportMap.CCU.name,
    departure_at: "03 Mar 2026, 09:00 am",
    arrival_at: "03 Mar 2026, 12:00 pm",
    departure_date: "March 3rd, 2026",
    duration_minutes: 180,
    capacity: 180,
    available_seats: 180,
    booked_seats: 0,
    status: "SCHEDULED",
    gate: "TBD",
    on_time_performance: "96%",
    load_factor: "0%",
    revenue_index: "A+",
    safety_rating: "5.0",
    amenities: ["Wi-Fi", "Beverages", "Meals", "Entertainment"],
  },
  {
    instance_id: 63,
    flight_number: "FT101",
    airline_name: "Adi India",
    aircraft_code: "B738",
    route: "BOM - CCU",
    departure_code: "BOM",
    arrival_code: "CCU",
    departure_city: "Mumbai",
    arrival_city: "Kolkata",
    departure_airport: airportMap.BOM.name,
    arrival_airport: airportMap.CCU.name,
    departure_at: "18 Feb 2026, 09:00 am",
    arrival_at: "18 Feb 2026, 12:00 pm",
    departure_date: "February 18th, 2026",
    duration_minutes: 180,
    capacity: 180,
    available_seats: 180,
    booked_seats: 0,
    status: "SCHEDULED",
    gate: "TBD",
  },
  {
    instance_id: 64,
    flight_number: "FT101",
    airline_name: "Adi India",
    aircraft_code: "B738",
    route: "BOM - CCU",
    departure_code: "BOM",
    arrival_code: "CCU",
    departure_city: "Mumbai",
    arrival_city: "Kolkata",
    departure_airport: airportMap.BOM.name,
    arrival_airport: airportMap.CCU.name,
    departure_at: "19 Feb 2026, 09:00 am",
    arrival_at: "19 Feb 2026, 12:00 pm",
    departure_date: "February 19th, 2026",
    duration_minutes: 180,
    capacity: 180,
    available_seats: 180,
    booked_seats: 0,
    status: "SCHEDULED",
    gate: "TBD",
  },
  {
    instance_id: 65,
    flight_number: "FT101",
    airline_name: "Adi India",
    aircraft_code: "B738",
    route: "BOM - CCU",
    departure_code: "BOM",
    arrival_code: "CCU",
    departure_city: "Mumbai",
    arrival_city: "Kolkata",
    departure_airport: airportMap.BOM.name,
    arrival_airport: airportMap.CCU.name,
    departure_at: "23 Feb 2026, 09:00 am",
    arrival_at: "23 Feb 2026, 12:00 pm",
    departure_date: "February 23rd, 2026",
    duration_minutes: 180,
    capacity: 180,
    available_seats: 180,
    booked_seats: 0,
    status: "SCHEDULED",
    gate: "TBD",
  },
];

const bookingSeed = [
  {
    booking_id: "BK290899C7",
    booking_ref: "BK290899C7",
    user_id: 1,
    passenger_names: ["Pranjal Raghuvanshi", "Raam Raghuvanshi"],
    primary_passenger: "Pranjal Raghuvanshi",
    flight_number: "FT101",
    route: `${airportMap.BOM.name}/IN - ${airportMap.CCU.name}`,
    departure_label: "13:00 Apr 3, 2026",
    amount: "5,300",
    booking_status: "CONFIRMED",
    payment_status: "SUCCESS",
    booked_date: "Mar 29, 2026",
    fare_type: "Economy Standard",
    base_fare: "INR 4,200",
    taxes: "INR 900",
    airline_fees: "INR 200",
    total_amount: "INR 5,300",
    payment_method: "CARD",
    tickets: [
      { ticket_number: "TKT-20260329-6553CCEE", name: "Raam Raghuvanshi", issue_date: "March 29, 2026", status: "BOOKED" },
      { ticket_number: "TKT-20260329-AB267E80", name: "Pranjal Raghuvanshi", issue_date: "March 29, 2026", status: "BOOKED" },
    ],
    ancillaries: [
      { name: "Extra Checked Bag 20kg", type: "BAGGAGE", code: "EB3", quantity: 1, availability: "Available", amount: "INR 990" },
      { name: "Extra Checked Bag 20kg", type: "BAGGAGE", code: "EB3", quantity: 1, availability: "Available", amount: "INR 990" },
      { name: "Trip Secure", type: "TRAVEL PROTECTION", code: "TP1", quantity: 1, availability: "Available", amount: "INR 4,999", note: "View 13 coverages" },
    ],
  },
  {
    booking_id: "BK1EF2B341",
    booking_ref: "BK1EF2B341",
    user_id: 1,
    passenger_names: ["Priya Virani", "Kush Virani"],
    primary_passenger: "Priya Virani",
    flight_number: "FT101",
    route: `${airportMap.BOM.name}/IN - ${airportMap.CCU.name}`,
    departure_label: "07:00 Apr 3, 2026",
    amount: "6,700",
    booking_status: "CONFIRMED",
    payment_status: "SUCCESS",
    booked_date: "Mar 29, 2026",
    fare_type: "Economy Flex",
    base_fare: "INR 5,400",
    taxes: "INR 900",
    airline_fees: "INR 400",
    total_amount: "INR 6,700",
    payment_method: "UPI",
    tickets: [],
    ancillaries: [],
  },
  {
    booking_id: "BK1C713776",
    booking_ref: "BK1C713776",
    user_id: 1,
    passenger_names: ["Viranshu Virani"],
    primary_passenger: "Viranshu Virani",
    flight_number: "FT101",
    route: `${airportMap.BOM.name}/IN - ${airportMap.CCU.name}`,
    departure_label: "07:00 Apr 3, 2026",
    amount: "14,400",
    booking_status: "CONFIRMED",
    payment_status: "SUCCESS",
    booked_date: "Mar 29, 2026",
    fare_type: "Business Saver",
    base_fare: "INR 12,900",
    taxes: "INR 1,100",
    airline_fees: "INR 400",
    total_amount: "INR 14,400",
    payment_method: "CARD",
    tickets: [],
    ancillaries: [],
  },
  {
    booking_id: "BK11782DF3",
    booking_ref: "BK11782DF3",
    user_id: 1,
    passenger_names: ["Pandu Ghorpade"],
    primary_passenger: "Pandu Ghorpade",
    flight_number: "FT101",
    route: `${airportMap.BOM.name}/IN - ${airportMap.CCU.name}`,
    departure_label: "13:00 Apr 3, 2026",
    amount: "5,300",
    booking_status: "CONFIRMED",
    payment_status: "SUCCESS",
    booked_date: "Mar 29, 2026",
    fare_type: "Economy Standard",
    base_fare: "INR 4,200",
    taxes: "INR 900",
    airline_fees: "INR 200",
    total_amount: "INR 5,300",
    payment_method: "NETBANKING",
    tickets: [],
    ancillaries: [],
  },
  {
    booking_id: "BK6E13EEF6",
    booking_ref: "BK6E13EEF6",
    user_id: 1,
    passenger_names: ["Ashok Zamariya"],
    primary_passenger: "Ashok Zamariya",
    flight_number: "FT101",
    route: `${airportMap.BOM.name}/IN - ${airportMap.CCU.name}`,
    departure_label: "09:00 Mar 4, 2026",
    amount: "4,200",
    booking_status: "CONFIRMED",
    payment_status: "SUCCESS",
    booked_date: "Feb 26, 2026",
    fare_type: "Economy Saver",
    base_fare: "INR 3,200",
    taxes: "INR 800",
    airline_fees: "INR 200",
    total_amount: "INR 4,200",
    payment_method: "CARD",
    tickets: [],
    ancillaries: [],
  },
];

const ancillarySeed = [
  { name: "Priority Baggage", type: "BAGGAGE", description: "Fast-track checked baggage handling", price: "INR 850" },
  { name: "Trip Secure", type: "INSURANCE", description: "Medical and disruption coverage", price: "INR 4,999" },
  { name: "Window Plus", type: "BAGGAGE", description: "Bundle with seat and cabin baggage", price: "INR 1,250" },
];

const discountSeed = [
  { name: "SUMMER25", scope: "Economy", status: "Active", burn: "6.4%" },
  { name: "BIZBOOST", scope: "Business", status: "Draft", burn: "0%" },
];

const mealSeed = [
  { name: "Masala Rice Bowl", type: "VEG", category: "REGULAR", price: "INR 320" },
  { name: "Chicken Teriyaki", type: "NON_VEG", category: "PREMIUM", price: "INR 540" },
  { name: "Protein Vegan Box", type: "VEGAN", category: "SPECIAL", price: "INR 420" },
];

const baggagePolicy = {
  cabin: { maxWeight: "7.0", weightPerPiece: "7.0", pieces: "1", maxDimension: "115.0" },
  checked: { maxWeight: "23.0", weightPerPiece: "23.0", pieces: "1", freeAllowance: "1" },
};

const defaultSections = [
  "dashboard",
  "aircraft-management",
  "flight-management",
  "flight-schedules",
  "flight-instances",
  "ancillaries",
  "meal-management",
  "pricing-discounts",
  "bookings",
  "reports-analytics",
];

const parseAmount = (value) => {
  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoneyLabel = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDateLabel = (value, includeTime = false) => {
  if (!value) {
    return "TBD";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  });
};

const buildCabinLayouts = (aircraft) => {
  if (Array.isArray(aircraft?.cabinLayouts) && aircraft.cabinLayouts.length > 0) {
    return aircraft.cabinLayouts;
  }

  const totalSeats = Number(aircraft?.total_seats || 0);
  const firstSeats = Number(aircraft?.first_class_seats || 0);
  const businessSeats = Number(aircraft?.business_seats || 0);
  const economySeats = Math.max(totalSeats - firstSeats - businessSeats, 0);

  return [
    {
      id: `first-${aircraft.aircraft_id || aircraft.id}`,
      name: "FIRST",
      tag: "First",
      active: firstSeats > 0,
      totalSeats: firstSeats,
      availableSeats: firstSeats,
      totalRows: Math.ceil(firstSeats / 4) || 0,
      seatsPerRow: "4",
      layoutName: "First Class Layout",
      leftSeats: 2,
      rightSeats: 2,
    },
    {
      id: `business-${aircraft.aircraft_id || aircraft.id}`,
      name: "BUSINESS",
      tag: "Business",
      active: businessSeats > 0,
      totalSeats: businessSeats,
      availableSeats: businessSeats,
      totalRows: Math.ceil(businessSeats / 4) || 0,
      seatsPerRow: "4",
      layoutName: "Business Class Layout",
      leftSeats: 2,
      rightSeats: 2,
    },
    {
      id: `economy-${aircraft.aircraft_id || aircraft.id}`,
      name: "ECONOMY",
      tag: "Economy",
      active: economySeats > 0,
      totalSeats: economySeats,
      availableSeats: economySeats,
      totalRows: Math.ceil(economySeats / 6) || 0,
      seatsPerRow: "6",
      layoutName: "Economy Layout",
      leftSeats: 3,
      rightSeats: 3,
    },
  ].filter((layout) => layout.totalSeats > 0);
};

const normaliseAircraftRecord = (aircraft) => ({
  ...aircraft,
  aircraft_id: aircraft.aircraft_id || aircraft.id,
  code: aircraft.code || aircraft.registration_code || `AC${aircraft.aircraft_id || aircraft.id}`,
  total_seats: Number(aircraft.total_seats || aircraft.capacity || 0),
  business_seats: Number(aircraft.business_seats || 0),
  first_class_seats: Number(aircraft.first_class_seats || 0),
  premium_economy_seats: Number(aircraft.premium_economy_seats || 0),
  economy_seats: Math.max(
    Number(aircraft.total_seats || aircraft.capacity || 0) -
      Number(aircraft.first_class_seats || 0) -
      Number(aircraft.business_seats || 0),
    0
  ),
  range_km: Number(aircraft.range_km || 0),
  cruising_speed: Number(aircraft.cruising_speed || 0),
  max_altitude: Number(aircraft.max_altitude || 0),
  status: aircraft.status || "ACTIVE",
  is_available: aircraft.is_available ?? true,
  registration_date: aircraft.registration_date ? formatDateLabel(aircraft.registration_date) : "Not set",
  next_maintenance_date: aircraft.next_maintenance_date
    ? formatDateLabel(aircraft.next_maintenance_date)
    : "Not set",
  configuration: aircraft.configuration || "Standard",
  last_updated: formatDateLabel(new Date()),
  cabinLayouts: buildCabinLayouts(aircraft),
});

const normaliseFlightRecord = (flight, aircraftMap = {}) => {
  const linkedAircraft = aircraftMap[flight.aircraft_id] || null;
  const totalSeats = Number(linkedAircraft?.total_seats || 0);
  const firstSeats = Number(linkedAircraft?.first_class_seats || 0);
  const businessSeats = Number(linkedAircraft?.business_seats || 0);
  const economySeats = Math.max(totalSeats - firstSeats - businessSeats, 0);

  return {
    ...flight,
    flight_id: flight.flight_id || flight.id,
    flight_number: flight.flight_number || flight.code,
    airline_name: flight.airline_name || flight.airline || "Air India",
    aircraft_code:
      flight.aircraft_code ||
      linkedAircraft?.code ||
      linkedAircraft?.registration_code ||
      `AC${flight.aircraft_id || ""}`,
    aircraft_model: flight.aircraft_model || linkedAircraft?.model || "Aircraft",
    source_city: flight.source_city || airportMap[flight.source_code]?.city || flight.source_code,
    destination_city: flight.destination_city || airportMap[flight.destination_code]?.city || flight.destination_code,
    status: flight.status || "SCHEDULED",
    pricing:
      Number(flight.starting_price || 0) > 0 ? formatMoneyLabel(flight.starting_price) : "Not set",
    cabins: {
      first: firstSeats,
      business: businessSeats,
      premium: 0,
      economy: economySeats,
    },
    last_modified: formatDateLabel(new Date()),
  };
};

const normaliseScheduleRecord = (schedule) => ({
  ...schedule,
  schedule_id: schedule.schedule_id || schedule.id,
  route: schedule.route || `${schedule.source_code} - ${schedule.destination_code}`,
  source_name: schedule.source_airport || airportMap[schedule.source_code]?.name || schedule.source_code,
  destination_name:
    schedule.destination_airport || airportMap[schedule.destination_code]?.name || schedule.destination_code,
  departure_time: schedule.departure_time,
  arrival_time: schedule.arrival_time,
  recurrence: formatDateLabel(schedule.departure_date || schedule.date),
  recurrence_days: "Operational Schedule",
  duration: schedule.duration || "Live",
  status: schedule.status || "SCHEDULED",
  price: Number(schedule.price || 0),
});

const normaliseInstanceRecord = (instance) => ({
  ...instance,
  instance_id: instance.instance_id || instance.id,
  route: instance.route || `${instance.departure_code} - ${instance.arrival_code}`,
  departure_at: instance.departure_at || `${formatDateLabel(instance.departure_date)} ${instance.departure_time || ""}`.trim(),
  arrival_at: instance.arrival_at || `${formatDateLabel(instance.departure_date)} ${instance.arrival_time || ""}`.trim(),
  departure_date: instance.departure_date ? formatDateLabel(instance.departure_date) : "TBD",
  capacity: Number(instance.capacity || 0),
  available_seats: Number(instance.available_seats || 0),
  booked_seats: Number(instance.booked_seats || 0),
  status: instance.status || "SCHEDULED",
  duration_minutes: Number(instance.duration_minutes || 0),
  on_time_performance: instance.on_time_performance || "95%",
  load_factor: instance.load_factor || "0%",
  revenue_index: instance.revenue_index || "Live",
  safety_rating: instance.safety_rating || "5.0",
  amenities: Array.isArray(instance.amenities) ? instance.amenities : ["Wi-Fi", "Beverages", "Meals"],
});

const normaliseBookingRecord = (booking, index = 0) => {
  const passengerNames = Array.isArray(booking.passengers)
    ? booking.passengers.map((passenger, passengerIndex) =>
        passenger?.name ||
        [passenger?.title, passenger?.firstName, passenger?.lastName].filter(Boolean).join(" ") ||
        `Passenger ${passengerIndex + 1}`
      )
    : [booking.primary_passenger || `Passenger ${index + 1}`];

  const amountNumber = Number(booking.amount_number || booking.amount || 0);

  return {
    ...booking,
    booking_id: booking.booking_id || booking.id || `BKLOCAL${index + 1}`,
    booking_ref: booking.booking_ref || booking.booking_id || `BKLOCAL${index + 1}`,
    passenger_names: passengerNames,
    primary_passenger: passengerNames[0] || `Passenger ${index + 1}`,
    departure_label: [booking.departure_time, formatDateLabel(booking.departure_date)].filter(Boolean).join(" "),
    amount: formatMoneyLabel(amountNumber),
    amount_number: amountNumber,
    booked_date: booking.booked_date ? formatDateLabel(booking.booked_date) : formatDateLabel(new Date()),
    fare_type: booking.fare_type || "Standard",
    base_fare: booking.base_fare || formatMoneyLabel(Math.max(amountNumber - Math.round(amountNumber * 0.1), 0)),
    taxes: booking.taxes || formatMoneyLabel(Math.round(amountNumber * 0.1)),
    airline_fees: booking.airline_fees || formatMoneyLabel(0),
    total_amount: booking.total_amount || formatMoneyLabel(amountNumber),
    tickets: Array.isArray(booking.tickets)
      ? booking.tickets.map((ticket, ticketIndex) => ({
          ...ticket,
          name: ticket.name || passengerNames[ticketIndex] || passengerNames[0],
          issue_date: ticket.issue_date || formatDateLabel(booking.booked_date || new Date()),
        }))
      : [],
    ancillaries: Array.isArray(booking.ancillaries) ? booking.ancillaries : [],
  };
};

const defaultAircraft = aircraftSeed[0];
const defaultInstance = instanceSeed[0];

const AdminDash = () => {
  const [activeTab, setActiveTab] = useState("dashboard-overview");
  const [superAdmin, setSuperAdmin] = useState(false);
  const [openSections, setOpenSections] = useState(defaultSections);
  const [bookings, setBookings] = useState([]);
  const [aircraftList, setAircraftList] = useState([]);
  const [flightList, setFlightList] = useState([]);
  const [scheduleList, setScheduleList] = useState([]);
  const [instanceList, setInstanceList] = useState([]);
  const [airportList, setAirportList] = useState(Object.values(airportMap));
  const [selectedAircraft, setSelectedAircraft] = useState(defaultAircraft);
  const [selectedCabin, setSelectedCabin] = useState(defaultAircraft.cabinLayouts[0]);
  const [aircraftScreen, setAircraftScreen] = useState("grid");
  const [selectedInstance, setSelectedInstance] = useState(defaultInstance);
  const [instanceScreen, setInstanceScreen] = useState("list");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("All Status");
  const [bookingFlightFilter, setBookingFlightFilter] = useState("All Flights");
  const [instanceDateFilter, setInstanceDateFilter] = useState("All Dates");
  const [instanceDepartureFilter, setInstanceDepartureFilter] = useState("All Departure Cities");
  const [instanceArrivalFilter, setInstanceArrivalFilter] = useState("All Arrival Cities");
  const [instanceFlightFilter, setInstanceFlightFilter] = useState("All Flights");
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");

  const loadLiveData = async () => {
    setLoadingData(true);
    setDataError("");

    try {
      const [aircraftResponse, flightsResponse, schedulesResponse, instancesResponse, bookingsResponse, airportsResponse] =
        await Promise.all([
          apiRequest("/aircraft"),
          apiRequest("/flights"),
          apiRequest("/schedules"),
          apiRequest("/instances"),
          apiRequest("/bookings"),
          apiRequest("/meta/airports"),
        ]);

      const nextAircraft = Array.isArray(aircraftResponse?.data)
        ? aircraftResponse.data.map(normaliseAircraftRecord)
        : [];
      const aircraftMap = nextAircraft.reduce((accumulator, aircraft) => {
        accumulator[aircraft.aircraft_id] = aircraft;
        return accumulator;
      }, {});
      const nextFlights = Array.isArray(flightsResponse?.data)
        ? flightsResponse.data.map((flight) => normaliseFlightRecord(flight, aircraftMap))
        : [];
      const nextSchedules = Array.isArray(schedulesResponse?.data)
        ? schedulesResponse.data.map(normaliseScheduleRecord)
        : [];
      const nextInstances = Array.isArray(instancesResponse?.data)
        ? instancesResponse.data.map(normaliseInstanceRecord)
        : [];
      const nextBookings = Array.isArray(bookingsResponse?.data)
        ? bookingsResponse.data.map(normaliseBookingRecord)
        : [];
      const nextAirports = Array.isArray(airportsResponse?.airports) ? airportsResponse.airports : [];

      setAircraftList(nextAircraft);
      setFlightList(nextFlights);
      setScheduleList(nextSchedules);
      setInstanceList(nextInstances);
      setBookings(nextBookings);
      setAirportList(nextAirports.length > 0 ? nextAirports : Object.values(airportMap));

      if (nextAircraft.length > 0) {
        const activeAircraft = nextAircraft.find(
          (aircraft) => aircraft.aircraft_id === selectedAircraft?.aircraft_id
        ) || nextAircraft[0];
        setSelectedAircraft(activeAircraft);
        setSelectedCabin(activeAircraft.cabinLayouts?.[0] || null);
      }

      if (nextInstances.length > 0) {
        setSelectedInstance(
          nextInstances.find((instance) => instance.instance_id === selectedInstance?.instance_id) ||
            nextInstances[0]
        );
      }
    } catch (error) {
      setDataError(error.message || "Unable to load dashboard data.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    const storedBookings = JSON.parse(localStorage.getItem("zoshAllBookings") || "null");
    if (!Array.isArray(storedBookings) || storedBookings.length === 0) {
      return;
    }

    const mapped = storedBookings.map((booking, index) => ({
      booking_id: booking.booking_id || `BKLOCAL${index + 1}`,
      booking_ref: booking.booking_id || `BKLOCAL${index + 1}`,
      user_id: booking.user_id || 1,
      passenger_names: [booking.passengerName || booking.name || `Passenger ${index + 1}`],
      primary_passenger: booking.passengerName || booking.name || `Passenger ${index + 1}`,
      flight_number: booking.flightNo || "FT101",
      route: `${airportMap[booking.from || "BOM"].name}/IN - ${airportMap[booking.to || "CCU"].name}`,
      departure_label: booking.departureLabel || "09:00 Apr 3, 2026",
      amount: booking.amount || "4,200",
      amount_number: parseAmount(booking.amount || 4200),
      booking_status: booking.status || "CONFIRMED",
      payment_status: booking.payment_status || "SUCCESS",
      booked_date: booking.booked_date || "Mar 29, 2026",
      fare_type: booking.cabin || "Economy Standard",
      base_fare: booking.baseFare || "INR 3,200",
      taxes: booking.taxes || "INR 800",
      airline_fees: booking.airlineFees || "INR 200",
      total_amount: booking.totalAmount || "INR 4,200",
      payment_method: booking.paymentMethod || "CARD",
      tickets: [],
      ancillaries: [],
    }));
    setBookings(mapped);
  }, []);

  useEffect(() => {
    loadLiveData();
    // loadLiveData intentionally runs once on mount here and is reused by form submissions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentCounts = {
    aircraft: aircraftList.length > 0 ? aircraftList.length : null,
    flights: flightList.length > 0 ? flightList.length : null,
    schedules: scheduleList.length > 0 ? scheduleList.length : null,
    instances: instanceList.length > 0 ? instanceList.length : null,
    bookings: bookings.length > 0 ? bookings.length : null,
  };

  const menuItems = superAdmin ? [...getAirlineMenu(currentCounts), ...superAdminMenu] : getAirlineMenu(currentCounts);

  const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.amount_number || 0), 0);

  const dashboardMetrics = useMemo(
    () => [
      { label: "Total Flights", value: `${flightList.length}`, accent: "#dbeafe", text: "#2563eb" },
      { label: "Active Flights", value: `${flightList.length}`, accent: "#dcfce7", text: "#16a34a" },
      { label: "Total Bookings", value: `${bookings.length}`, accent: "#f3e8ff", text: "#9333ea" },
      {
        label: "Avg Occupancy",
        value:
          instanceList.length > 0
            ? `${Math.round(
                instanceList.reduce((sum, instance) => {
                  const capacity = Number(instance.capacity || 0);
                  const booked = Number(instance.booked_seats || 0);
                  return sum + (capacity > 0 ? (booked / capacity) * 100 : 0);
                }, 0) / instanceList.length
              )}%`
            : "0%",
        accent: "#fef3c7",
        text: "#d97706",
      },
      {
        label: "Revenue",
        value: `Rs ${(totalRevenue / 100000).toFixed(1)}L`,
        accent: "#e0e7ff",
        text: "#4f46e5",
      },
    ],
    [bookings.length, flightList.length, instanceList, totalRevenue]
  );

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const searchBlob = `${booking.booking_ref} ${booking.primary_passenger} ${booking.flight_number} ${booking.route}`.toLowerCase();
      const matchesSearch = searchBlob.includes(bookingSearch.toLowerCase());
      const matchesStatus = bookingStatusFilter === "All Status" || booking.booking_status === bookingStatusFilter;
      const matchesFlight = bookingFlightFilter === "All Flights" || booking.flight_number === bookingFlightFilter;
      return matchesSearch && matchesStatus && matchesFlight;
    });
  }, [bookingFlightFilter, bookingSearch, bookingStatusFilter, bookings]);

  const filteredInstances = useMemo(() => {
    return instanceList.filter((instance) => {
      const matchesDate =
        instanceDateFilter === "All Dates" ||
        instanceDateFilter === instance.departure_date ||
        instanceDateFilter === formatDateLabel(instance.departure_date);
      const matchesDeparture = instanceDepartureFilter === "All Departure Cities" || instance.departure_city === instanceDepartureFilter;
      const matchesArrival = instanceArrivalFilter === "All Arrival Cities" || instance.arrival_city === instanceArrivalFilter;
      const matchesFlight = instanceFlightFilter === "All Flights" || instance.flight_number === instanceFlightFilter;
      return matchesDate && matchesDeparture && matchesArrival && matchesFlight;
    });
  }, [instanceArrivalFilter, instanceDateFilter, instanceDepartureFilter, instanceFlightFilter, instanceList]);

  const activeFlightsCount = flightList.filter((flight) => flight.status === "SCHEDULED").length || flightList.length;
  const totalSeats = selectedAircraft?.total_seats || 0;
  const cabinClassCount = selectedAircraft?.cabinLayouts?.length || 0;
  const openSection = (key) => {
    setOpenSections((current) => (current.includes(key) ? current : [...current, key]));
  };

  const handleMenuSelect = (key, parentKey) => {
    setActiveTab(key);
    if (parentKey) {
      openSection(parentKey);
    }

    if (key === "all-aircraft") {
      setAircraftScreen("grid");
    }
    if (key === "create-aircraft") {
      setAircraftScreen("create");
    }
    if (key === "all-instances") {
      setInstanceScreen("list");
    }
  };

  const toggleSection = (key) => {
    setOpenSections((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  };

  const openAircraftDetail = (aircraft) => {
    setSelectedAircraft(aircraft);
    setSelectedCabin(aircraft.cabinLayouts[0]);
    setAircraftScreen("detail");
    setActiveTab("all-aircraft");
  };

  const openSeatMap = (aircraft, cabin, mode) => {
    setSelectedAircraft(aircraft);
    setSelectedCabin(cabin);
    setAircraftScreen(mode);
    setActiveTab("all-aircraft");
  };

  const openInstanceDetail = (instance) => {
    setSelectedInstance(instance);
    setInstanceScreen("detail");
    setActiveTab("all-instances");
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case "dashboard-overview":
        return (
          <DashboardOverview
            metrics={dashboardMetrics}
            flights={flightList}
            onEditFlight={() => setActiveTab("create-flight")}
          />
        );
      case "all-aircraft":
        return renderAircraftArea();
      case "create-aircraft":
        return <CreateAircraftView onCreated={loadLiveData} />;
      case "all-flights":
        return <AllFlightsView flights={flightList} metrics={dashboardMetrics} />;
      case "create-flight":
        return <CreateFlightView aircrafts={aircraftList} airports={airportList} onCreated={loadLiveData} />;
      case "create-fare":
        return <CreateFareView flights={flightList} onCreated={loadLiveData} />;
      case "create-fare-rule":
        return <CreateFareRuleView />;
      case "create-baggage-policy":
        return <CreateBaggagePolicyView policy={baggagePolicy} />;
      case "all-schedules":
        return <SchedulesView schedules={scheduleList} />;
      case "create-schedule":
        return <CreateScheduleView flights={flightList} onCreated={loadLiveData} />;
      case "all-instances":
        return renderInstancesArea();
      case "create-instance":
        return (
          <CreateInstanceView
            schedules={scheduleList}
            flights={flightList}
            aircrafts={aircraftList}
            onCreated={loadLiveData}
          />
        );
      case "master-ancillaries":
        return <AncillaryMasterView items={ancillarySeed} />;
      case "create-ancillary":
        return <CreateAncillaryView />;
      case "insurance-coverage":
        return <InsuranceCoverageView />;
      case "add-meal":
        return <MealView meals={mealSeed} />;
      case "meal-status":
        return <MealStatusView />;
      case "create-discount":
        return <CreateDiscountView />;
      case "existing-discounts":
        return <DiscountListView discounts={discountSeed} />;
      case "booking-statistics":
      case "all-bookings":
      case "transactions":
        return (
          <BookingsView
            bookings={filteredBookings}
            allBookings={bookings}
            search={bookingSearch}
            onSearchChange={setBookingSearch}
            statusFilter={bookingStatusFilter}
            onStatusFilterChange={setBookingStatusFilter}
            flightFilter={bookingFlightFilter}
            onFlightFilterChange={setBookingFlightFilter}
            onOpenBooking={setSelectedBooking}
          />
        );
      case "route-performance":
      case "platform-overview":
      case "all-airlines":
      case "pending-approvals":
      case "suspended":
      case "compliance":
      case "commission-rules":
      case "all-airports":
      case "cities":
      case "user-management":
        return <SimpleAnalyticsView title={getPageTitle(activeTab)} />;
      default:
        return <SimpleAnalyticsView title={getPageTitle(activeTab)} />;
    }
  };

  const renderAircraftArea = () => {
    if (aircraftScreen === "detail") {
      return (
        <AircraftDetailView
          aircraft={selectedAircraft}
          onBack={() => setAircraftScreen("grid")}
          onViewSeatMap={(cabin) => openSeatMap(selectedAircraft, cabin, "seatmap")}
        />
      );
    }

    if (aircraftScreen === "seatmap") {
      return (
        <SeatMapView
          aircraft={selectedAircraft}
          cabin={selectedCabin}
          onBack={() => setAircraftScreen("detail")}
          onEdit={() => setAircraftScreen("seatmap-edit")}
        />
      );
    }

    if (aircraftScreen === "seatmap-edit") {
      return (
        <SeatMapEditView
          aircraft={selectedAircraft}
          cabin={selectedCabin}
          onCancel={() => setAircraftScreen("seatmap")}
        />
      );
    }

    if (aircraftScreen === "create") {
      return <CreateAircraftView onCreated={loadLiveData} />;
    }

    return (
      <AircraftGridView
        aircraft={selectedAircraft}
        totalSeats={totalSeats}
        cabinClassCount={cabinClassCount}
        onOpenDetail={openAircraftDetail}
        onOpenSeatMap={(cabin) => openSeatMap(selectedAircraft, cabin, "seatmap")}
      />
    );
  };

  const renderInstancesArea = () => {
    if (instanceScreen === "detail") {
      return <InstanceDetailView instance={selectedInstance} onBack={() => setInstanceScreen("list")} />;
    }

    return (
      <InstancesListView
        instances={filteredInstances}
        dateFilter={instanceDateFilter}
        onDateFilterChange={setInstanceDateFilter}
        departureFilter={instanceDepartureFilter}
        onDepartureFilterChange={setInstanceDepartureFilter}
        arrivalFilter={instanceArrivalFilter}
        onArrivalFilterChange={setInstanceArrivalFilter}
        flightFilter={instanceFlightFilter}
        onFlightFilterChange={setInstanceFlightFilter}
        onOpenInstance={openInstanceDetail}
      />
    );
  };

  return (
    <div style={styles.appShell}>
      <Sidebar
        activeTab={activeTab}
        items={menuItems}
        openSections={openSections}
        onToggleSection={toggleSection}
        onSelect={handleMenuSelect}
        superAdmin={superAdmin}
      />

      <div style={styles.mainShell}>
        <Topbar
          title={getPageTitle(activeTab)}
          subtitle={getPageSubtitle(activeTab)}
          superAdmin={superAdmin}
          onToggleSuperAdmin={() => setSuperAdmin((current) => !current)}
          activeFlightsCount={activeFlightsCount}
        />

        <div style={styles.contentShell}>
          {loadingData ? <div style={styles.inlineInfoBanner}>Loading live dashboard data...</div> : null}
          {dataError ? <div style={styles.inlineErrorBanner}>{dataError}</div> : null}
          {renderMainContent()}
        </div>
      </div>

      <BookingModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </div>
  );
};

const Sidebar = ({ activeTab, items, openSections, onToggleSection, onSelect, superAdmin }) => (
  <aside style={styles.sidebar}>
    <div style={styles.brandHeader}>
      <div>
        <div style={styles.brandTitle}>Airline Dashboard</div>
        <div style={styles.brandSubtitle}>{superAdmin ? "Platform Console" : "Management Console"}</div>
      </div>
      <button type="button" style={styles.brandCloseButton}>
        x
      </button>
    </div>

    <div style={styles.sidebarScroll}>
      {items.map((item) => (
        <div key={item.key} style={styles.sidebarGroup}>
          <button
            type="button"
            style={styles.sectionButton}
            onClick={() => (item.children ? onToggleSection(item.key) : onSelect(item.key))}
          >
            <div style={styles.sectionButtonLeft}>
              <span style={styles.sectionIcon}>{item.label.slice(0, 1)}</span>
              <span>{item.label}</span>
            </div>
            <div style={styles.sectionButtonRight}>
              {item.count ? <span style={styles.sidebarCount}>{item.count}</span> : null}
              {item.children ? <span style={styles.sidebarArrow}>{openSections.includes(item.key) ? "v" : ">"}</span> : null}
            </div>
          </button>

          {item.children && openSections.includes(item.key) ? (
            <div style={styles.childList}>
              {item.children.map((child) => (
                <button
                  key={child.key}
                  type="button"
                  onClick={() => onSelect(child.key, item.key)}
                  style={{
                    ...styles.childButton,
                    background: activeTab === child.key ? "#0ea5e9" : "transparent",
                    color: activeTab === child.key ? "#ffffff" : "#cbd5e1",
                  }}
                >
                  <span>{child.label}</span>
                  {child.count ? <span style={styles.sidebarCountSmall}>{child.count}</span> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  </aside>
);

const Topbar = ({ title, subtitle, superAdmin, onToggleSuperAdmin, activeFlightsCount }) => (
  <div style={styles.topbar}>
    <div>
      <div style={styles.pageTitle}>{title}</div>
      <div style={styles.pageSubtitle}>{subtitle}</div>
    </div>

    <div style={styles.topbarRight}>
      <button type="button" style={styles.topControl}>
        <span>Light</span>
        <span>v</span>
      </button>
      <button type="button" style={styles.topControl}>
        <span>Notifications</span>
        <span style={styles.notificationBubble}>3</span>
      </button>
      <button
        type="button"
        onClick={onToggleSuperAdmin}
        style={{
          ...styles.superAdminSwitch,
          background: superAdmin ? "#2563eb" : "#ffffff",
          color: superAdmin ? "#ffffff" : "#0f172a",
        }}
      >
        {superAdmin ? "Super Admin On" : "Super Admin Off"} - {activeFlightsCount} active
      </button>
    </div>
  </div>
);

const DashboardOverview = ({ metrics, flights, onEditFlight }) => (
  <div style={styles.stack24}>
    <div style={styles.metricRow}>
      {metrics.map((metric) => (
        <div key={metric.label} style={{ ...styles.metricCard, background: metric.accent }}>
          <div style={{ ...styles.metricValue, color: metric.text }}>{metric.value}</div>
          <div style={styles.metricLabel}>{metric.label}</div>
        </div>
      ))}
    </div>

    <div style={styles.listPageCard}>
      {flights.map((flight) => (
        <div key={flight.flight_id} style={styles.flightSummaryCard}>
          <div style={styles.flightSummaryHeader}>
            <div style={styles.flightBadge}>{flight.flight_number}</div>
            <StatusTag label={flight.status} tone="green" />
          </div>

          <div style={styles.flightSummaryGrid}>
            <SummaryBlock
              label="Route"
              value={`${flight.source_code} - ${flight.destination_code}`}
              subvalue={`${flight.source_city || airportMap[flight.source_code]?.city || flight.source_code} - ${flight.destination_city || airportMap[flight.destination_code]?.city || flight.destination_code}`}
            />
            <SummaryBlock label="Airline" value={flight.airline_name} subvalue="AI - SkyTeam" />
            <SummaryBlock label="Pricing" value={flight.pricing} subvalue="Configure pricing" />
            <SummaryBlock
              label="Capacity"
              value={`0 / ${flight.cabins?.economy + flight.cabins?.business + flight.cabins?.first || 0} booked`}
              subvalue="0% occupancy"
            />
          </div>

          <div style={styles.cabinStrip}>
            <MiniCabin label="First Class" value={`${flight.cabins.first}`} />
            <MiniCabin label="Business" value={`${flight.cabins.business}`} />
            <MiniCabin label="Premium Economy" value={`${flight.cabins.premium}`} />
            <MiniCabin label="Economy" value={`${flight.cabins.economy}`} />
          </div>

          <div style={styles.cardFooterRow}>
            <span style={styles.mutedText}>Last modified: {flight.last_modified}</span>
            <div style={styles.actionRow}>
              <button type="button" style={styles.ghostAction} onClick={onEditFlight}>
                Edit
              </button>
              <button type="button" style={styles.ghostAction}>
                View
              </button>
              <button type="button" style={styles.dangerAction}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AircraftGridView = ({ aircraft, totalSeats, cabinClassCount, onOpenDetail, onOpenSeatMap }) => (
  <div style={styles.stack24}>
    <div style={styles.sectionHeaderBar}>
      <div>
        <div style={styles.sectionHeading}>Aircraft Management</div>
        <div style={styles.sectionSubheading}>Manage aircraft details and configurations</div>
      </div>
    </div>

    <div style={styles.cardGridThree}>
      {aircraft.cabinLayouts.map((cabin) => (
        <div key={cabin.id} style={styles.aircraftCabinCard}>
          <div style={styles.cabinTitleRow}>
            <div style={styles.cabinName}>{cabin.name.replace("_", " ")}</div>
            <div style={styles.tagRow}>
              <StatusTag label={cabin.tag} tone="violet" />
              <StatusTag label="Active" tone="green" />
            </div>
          </div>

          <div style={styles.infoCols2}>
            <InfoPair label="Total Seats" value={`${cabin.totalSeats}`} />
            <InfoPair label="Available Seats" value={`${cabin.availableSeats}`} />
            <InfoPair label="Total Rows" value={`${cabin.totalRows}`} />
            <InfoPair label="Seats/Row" value={cabin.seatsPerRow} />
          </div>

          <div style={styles.layoutHint}>Layout: {cabin.layoutName}</div>

          <div style={styles.inlineActions}>
            <button type="button" style={styles.outlineButton} onClick={() => onOpenSeatMap(cabin)}>
              View Seatmap
            </button>
            <button type="button" style={styles.outlineButton} onClick={() => onOpenDetail(aircraft)}>
              Edit
            </button>
          </div>
        </div>
      ))}
    </div>

    <div style={styles.metricFooterRow}>
      <FooterMetric label="Total Seats" value={`${totalSeats}`} />
      <FooterMetric label="Cabin Classes" value={`${cabinClassCount}`} />
      <FooterMetric label="Range (km)" value={`${aircraft.range_km.toLocaleString("en-IN")}`} />
      <FooterMetric label="Status" value={aircraft.is_available ? "Available" : "Inactive"} />
    </div>
  </div>
);

const AircraftDetailView = ({ aircraft, onBack, onViewSeatMap }) => (
  <div style={styles.stack24}>
    <Breadcrumb
      title="Aircraft Management"
      subtitle="Manage aircraft details and configurations"
      trail={["Back to Aircraft", `Aircraft / ${aircraft.code}`]}
      onBack={onBack}
    />

    <div style={styles.detailCard}>
      <div style={styles.detailHeader}>
        <div style={styles.detailIdentity}>
          <div style={styles.detailBadge}>A</div>
          <div>
            <div style={styles.detailTitle}>{aircraft.code}</div>
            <div style={styles.detailSubtitle}>{aircraft.model} - Boeing</div>
          </div>
        </div>

        <div style={styles.inlineActions}>
          <StatusTag label={aircraft.status} tone="green" />
          <button type="button" style={styles.outlineButton}>
            Edit Aircraft
          </button>
        </div>
      </div>

      <div style={styles.detailColumns4}>
        <DetailGroup
          title="Basic Information"
          rows={[
            ["Registration", aircraft.code],
            ["Year", "2020"],
            ["Configuration", aircraft.configuration],
          ]}
        />
        <DetailGroup
          title="Seating Capacity"
          rows={[
            ["Total Seats", `${aircraft.total_seats}`],
            ["First", `${aircraft.first_class_seats}`],
            ["Business", `${aircraft.business_seats}`],
            ["Premium Economy", `${aircraft.premium_economy_seats}`],
            ["Economy", `${aircraft.economy_seats}`],
          ]}
        />
        <DetailGroup
          title="Performance"
          rows={[
            ["Range", `${aircraft.range_km.toLocaleString("en-IN")} km`],
            ["Cruising Speed", `${aircraft.cruising_speed} km/h`],
            ["Max Altitude", `${aircraft.max_altitude} ft`],
          ]}
        />
        <DetailGroup
          title="Important Dates"
          rows={[
            ["Registration Date", aircraft.registration_date],
            ["Next Maintenance", aircraft.next_maintenance_date],
            ["Last Updated", aircraft.last_updated],
          ]}
        />
      </div>

      <div style={styles.schedulePill}>Available for Scheduling</div>
    </div>

    <div style={styles.detailCard}>
      <div style={styles.cabinHeader}>
        <div>
          <div style={styles.sectionHeading}>Cabin Configuration</div>
          <div style={styles.sectionSubheading}>Manage cabin classes and seat configurations</div>
        </div>
        <button type="button" style={styles.primaryButton}>
          Add Cabin
        </button>
      </div>

      <div style={styles.cardGridThree}>
        {aircraft.cabinLayouts.map((cabin) => (
          <div key={cabin.id} style={styles.aircraftCabinCard}>
            <div style={styles.cabinTitleRow}>
              <div style={styles.cabinName}>{cabin.name.replace("_", " ")}</div>
              <div style={styles.tagRow}>
                <StatusTag label={cabin.tag} tone="soft" />
                <StatusTag label="Active" tone="green" />
              </div>
            </div>

            <div style={styles.infoCols2}>
              <InfoPair label="Total Seats" value={`${cabin.totalSeats}`} />
              <InfoPair label="Available Seats" value={`${cabin.availableSeats}`} />
              <InfoPair label="Total Rows" value={`${cabin.totalRows}`} />
              <InfoPair label="Seats/Row" value={`${cabin.leftSeats}-${cabin.rightSeats}`} />
            </div>

            <div style={styles.layoutHint}>Layout: {cabin.layoutName}</div>

            <div style={styles.inlineActions}>
              <button type="button" style={styles.outlineButton} onClick={() => onViewSeatMap(cabin)}>
                View Seatmap
              </button>
              <button type="button" style={styles.outlineButton}>
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SeatMapView = ({ aircraft, cabin, onBack, onEdit }) => (
  <div style={styles.stack24}>
    <Breadcrumb
      title="Aircraft Management"
      subtitle="Manage aircraft details and configurations"
      trail={["Back to Aircraft", `Aircraft / ${aircraft.code} / ${cabin.name} / Seat Map`]}
      onBack={onBack}
    />

    <div style={styles.detailCard}>
      <div style={styles.detailHeader}>
        <div style={styles.detailIdentity}>
          <div style={styles.detailBadge}>S</div>
          <div>
            <div style={styles.detailTitle}>{cabin.name.replace("_", " ")} Seat Map</div>
            <div style={styles.detailSubtitle}>Interactive seat map for {aircraft.code} - {cabin.name.replace("_", " ")}</div>
          </div>
        </div>

        <div style={styles.inlineActions}>
          <StatusTag label="Interactive Mode" tone="blue" />
          <button type="button" style={styles.primaryButton} onClick={onEdit}>
            Edit Seat Map
          </button>
        </div>
      </div>

      <div style={styles.detailColumns4}>
        <DetailGroup title="Aircraft" rows={[["Code", aircraft.code]]} />
        <DetailGroup title="Cabin Class" rows={[["Name", cabin.name.replace("_", " ")]]} />
        <DetailGroup title="Cabin Code" rows={[["Code", cabin.name.slice(0, 2)]]} />
        <DetailGroup title="Seat Map ID" rows={[["Mode", "view"]]} />
      </div>
    </div>

    <div style={styles.detailCard}>
      <div style={styles.sectionHeaderBar}>
        <div>
          <div style={styles.sectionHeading}>{cabin.name.replace("_", " ")} Seat Map</div>
          <div style={styles.sectionSubheading}>Click on any seat to view details and configuration options</div>
        </div>
        <div style={styles.inlineActions}>
          <button type="button" style={styles.iconButton}>100%</button>
          <button type="button" style={styles.iconButton}>Reset</button>
        </div>
      </div>

      <SeatLegend />
      <SeatMapGraphic cabin={cabin} />

      <div style={styles.checkboxRow}>
        <label style={styles.checkboxLabel}>
          <input type="checkbox" checked readOnly />
          <span>Show row numbers</span>
        </label>
        <label style={styles.checkboxLabel}>
          <input type="checkbox" checked readOnly />
          <span>Show seat labels</span>
        </label>
        <span style={styles.mutedText}>{cabin.totalSeats} total seats - {cabin.availableSeats} available - {cabin.layoutName}</span>
      </div>
    </div>

    <div style={styles.metricFooterRow}>
      <FooterMetric label="Total Seats" value={`${cabin.totalSeats}`} />
      <FooterMetric label="Available" value={`${cabin.availableSeats}`} />
      <FooterMetric label="Premium Seats" value={cabin.tag === "Premium Economy" ? `${cabin.totalSeats}` : "0"} />
      <FooterMetric label="Total Rows" value={`${cabin.totalRows}`} />
    </div>
  </div>
);

const SeatMapEditView = ({ aircraft, cabin, onCancel }) => (
  <div style={styles.centerFormWrap}>
    <div style={styles.formCardWide}>
      <div style={styles.sectionHeading}>Seat map information</div>

      <FormRow columns={1}>
        <FormInput label="Seat Map Name *" value={cabin.layoutName} helper="A descriptive name for this seat map configuration" />
      </FormRow>

      <div style={styles.formSectionTitle}>Layout Configuration</div>
      <FormRow columns={3}>
        <FormInput label="Total Rows *" value={`${cabin.totalRows}`} helper="Number of seat rows" />
        <FormInput label="Left Seats per Row *" value={`${cabin.leftSeats}`} helper="Seats on left side of aisle" />
        <FormInput label="Right Seats per Row *" value={`${cabin.rightSeats}`} helper="Seats on right side of aisle" />
      </FormRow>

      <div style={styles.formSectionTitle}>Layout Preview</div>
      <div style={styles.previewCard}>
        <div style={styles.previewSummary}>
          <PreviewMetric label="Configuration" value={`${cabin.leftSeats}-${cabin.rightSeats}`} />
          <PreviewMetric label="Total Seats" value={`${cabin.totalSeats}`} />
          <PreviewMetric label="Seats per Row" value={`${cabin.leftSeats + cabin.rightSeats}`} />
        </div>
        <SeatMapMiniPreview cabin={cabin} aircraft={aircraft} />
      </div>

      <div style={styles.formActions}>
        <button type="button" style={styles.outlineButton} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" style={styles.primaryButton}>
          Update Seat Map
        </button>
      </div>
    </div>
  </div>
);

const CreateAircraftView = ({ onCreated }) => {
  const initialState = {
    model: "",
    registrationCode: "",
    businessSeats: "0",
    firstClassSeats: "0",
    rangeKm: "0",
    cruisingSpeed: "0",
    maxAltitude: "0",
    status: "ACTIVE",
    isAvailable: true,
    registrationDate: "",
    nextMaintenanceDate: "",
    configuration: "Standard",
  };
  const [formState, setFormState] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const updateField = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setFormState(initialState);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const businessSeats = Number(formState.businessSeats || 0);
      const firstClassSeats = Number(formState.firstClassSeats || 0);

      await apiRequest("/aircraft", {
        method: "POST",
        body: {
          model: formState.model,
          registration_code: formState.registrationCode,
          business_seats: businessSeats,
          first_class_seats: firstClassSeats,
          total_seats: Math.max(180, businessSeats + firstClassSeats),
          range_km: Number(formState.rangeKm || 0),
          cruising_speed: Number(formState.cruisingSpeed || 0),
          max_altitude: Number(formState.maxAltitude || 0),
          status: formState.status,
          is_available: formState.isAvailable,
          registration_date: formState.registrationDate || null,
          next_maintenance_date: formState.nextMaintenanceDate || null,
          configuration: formState.configuration,
        },
      });

      setSuccessMessage("Aircraft created successfully.");
      resetForm();
      await onCreated?.();
    } catch (error) {
      setErrorMessage(error.message || "Unable to create the aircraft.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.centerFormWrap}>
      <div style={styles.formCard}>
        <div style={styles.sectionHeading}>Create New Aircraft</div>
        <FormFeedback errorMessage={errorMessage} successMessage={successMessage} />
        <FormRow columns={2}>
          <FormInput label="Model" placeholder="Boeing 737-800" value={formState.model} onChange={updateField("model")} />
          <FormInput
            label="Registration Code"
            placeholder="B738"
            value={formState.registrationCode}
            onChange={updateField("registrationCode")}
          />
        </FormRow>
        <FormRow columns={2}>
          <FormInput label="Business Seats" value={formState.businessSeats} onChange={updateField("businessSeats")} />
          <FormInput label="First Class Seats" value={formState.firstClassSeats} onChange={updateField("firstClassSeats")} />
        </FormRow>

        <div style={styles.formSectionTitle}>Performance Specifications</div>
        <FormRow columns={3}>
          <FormInput label="Range (km)" value={formState.rangeKm} onChange={updateField("rangeKm")} />
          <FormInput label="Cruising Speed (km/h)" value={formState.cruisingSpeed} onChange={updateField("cruisingSpeed")} />
          <FormInput label="Max Altitude (ft)" value={formState.maxAltitude} onChange={updateField("maxAltitude")} />
        </FormRow>

        <div style={styles.formSectionTitle}>Status and Dates</div>
        <FormRow columns={2}>
          <FormSelect
            label="Status"
            value={formState.status}
            onChange={updateField("status")}
            options={[
              { value: "ACTIVE", label: "ACTIVE" },
              { value: "INACTIVE", label: "INACTIVE" },
            ]}
          />
          <FormCheckbox label="Is Available" checked={formState.isAvailable} onChange={updateField("isAvailable")} />
        </FormRow>
        <FormRow columns={2}>
          <FormInput label="Registration Date" type="date" value={formState.registrationDate} onChange={updateField("registrationDate")} />
          <FormInput
            label="Next Maintenance Date"
            type="date"
            value={formState.nextMaintenanceDate}
            onChange={updateField("nextMaintenanceDate")}
          />
        </FormRow>

        <div style={styles.formSectionTitle}>Additional Information</div>
        <FormRow columns={1}>
          <FormInput label="Configuration" placeholder="Standard" value={formState.configuration} onChange={updateField("configuration")} />
        </FormRow>

        <div style={styles.formActions}>
          <button type="button" style={styles.outlineButton} onClick={resetForm}>
            Cancel
          </button>
          <button type="button" style={styles.primaryButton} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating..." : "Create Aircraft"}
          </button>
        </div>
      </div>
    </div>
  );
};

const AllFlightsView = ({ flights, metrics }) => (
  <div style={styles.stack24}>
    <div style={styles.sectionHeaderBar}>
      <div>
        <div style={styles.sectionHeading}>Dashboard Overview</div>
        <div style={styles.sectionSubheading}>Comprehensive overview of your airline operations</div>
      </div>
    </div>

    <div style={styles.metricRow}>
      {metrics.map((metric) => (
        <div key={metric.label} style={{ ...styles.metricCard, background: metric.accent }}>
          <div style={{ ...styles.metricValue, color: metric.text }}>{metric.value}</div>
          <div style={styles.metricLabel}>{metric.label}</div>
        </div>
      ))}
    </div>

    <div style={styles.listPageCard}>
      {flights.map((flight) => (
        <div key={flight.flight_id} style={styles.flightSummaryCard}>
          <div style={styles.flightSummaryHeader}>
            <div>
              <div style={styles.flightBadge}>{flight.flight_number}</div>
              <div style={styles.smallMuted}>{flight.aircraft_model}</div>
            </div>
            <StatusTag label={flight.status} tone="green" />
          </div>
          <div style={styles.flightSummaryGrid}>
            <SummaryBlock
              label="Route"
              value={`${flight.source_code} - ${flight.destination_code}`}
              subvalue={`${flight.source_city || airportMap[flight.source_code]?.city || flight.source_code} - ${flight.destination_city || airportMap[flight.destination_code]?.city || flight.destination_code}`}
            />
            <SummaryBlock label="Airline" value={flight.airline_name} subvalue="AI - SkyTeam" />
            <SummaryBlock label="Pricing" value={flight.pricing} subvalue="Configure pricing" />
            <SummaryBlock
              label="Capacity"
              value={`0 / ${flight.cabins?.economy + flight.cabins?.business + flight.cabins?.first || 0} booked`}
              subvalue="0% occupancy"
            />
          </div>
          <div style={styles.cabinStrip}>
            <MiniCabin label="First Class" value={`${flight.cabins.first}`} />
            <MiniCabin label="Business" value={`${flight.cabins.business}`} />
            <MiniCabin label="Premium Economy" value={`${flight.cabins.premium}`} />
            <MiniCabin label="Economy" value={`${flight.cabins.economy}`} />
          </div>
          <div style={styles.cardFooterRow}>
            <span style={styles.mutedText}>Last modified: {flight.last_modified}</span>
            <div style={styles.actionRow}>
              <button type="button" style={styles.ghostAction}>Edit</button>
              <button type="button" style={styles.ghostAction}>View</button>
              <button type="button" style={styles.dangerAction}>Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FormFeedback = ({ errorMessage, successMessage }) => {
  if (!errorMessage && !successMessage) {
    return null;
  }

  return (
    <div style={errorMessage ? styles.inlineErrorBanner : styles.inlineSuccessBanner}>
      {errorMessage || successMessage}
    </div>
  );
};

const CreateFlightView = ({ aircrafts, airports, onCreated }) => {
  const initialState = {
    flightNumber: "",
    aircraftId: aircrafts[0]?.aircraft_id || "",
    sourceAirportId: airports[0]?.airport_id || "",
    destinationAirportId: airports[1]?.airport_id || airports[0]?.airport_id || "",
  };
  const [formState, setFormState] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setFormState((current) => ({
      ...current,
      aircraftId: current.aircraftId || aircrafts[0]?.aircraft_id || "",
      sourceAirportId: current.sourceAirportId || airports[0]?.airport_id || "",
      destinationAirportId: current.destinationAirportId || airports[1]?.airport_id || airports[0]?.airport_id || "",
    }));
  }, [aircrafts, airports]);

  const updateField = (key) => (event) => {
    setFormState((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  };

  const resetForm = () => {
    setFormState(initialState);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await apiRequest("/flights", {
        method: "POST",
        body: {
          flight_number: formState.flightNumber,
          aircraft_id: Number(formState.aircraftId),
          source_airport_id: Number(formState.sourceAirportId),
          destination_airport_id: Number(formState.destinationAirportId),
          duration: 120,
        },
      });

      setSuccessMessage("Flight created successfully.");
      resetForm();
      await onCreated?.();
    } catch (error) {
      setErrorMessage(error.message || "Unable to create the flight.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.centerFormWrap}>
      <div style={styles.formCard}>
        <div style={styles.breadcrumbMini}>Back to Flights / Flight Management / New Flight</div>
        <div style={styles.formHero}>
          <div>
            <div style={styles.sectionHeading}>Create New Flight</div>
            <div style={styles.sectionSubheading}>Configure all flight details, aircraft selection, and dynamic fare pricing</div>
          </div>
          <div style={styles.smartPricing}>Aircraft, route, and price dropdowns now load from the backend database.</div>
        </div>

        <FormFeedback errorMessage={errorMessage} successMessage={successMessage} />

        <FormRow columns={2}>
          <FormInput
            label="Flight Number *"
            placeholder="e.g. ZA123"
            value={formState.flightNumber}
            onChange={updateField("flightNumber")}
          />
          <FormSelect
            label="Aircraft *"
            value={formState.aircraftId}
            onChange={updateField("aircraftId")}
            options={aircrafts.map((aircraft) => ({
              value: aircraft.aircraft_id,
              label: `${aircraft.code} - ${aircraft.model}`,
            }))}
          />
        </FormRow>
        <FormRow columns={2}>
          <FormSelect
            label="Departure Airport *"
            value={formState.sourceAirportId}
            onChange={updateField("sourceAirportId")}
            options={airports.map((airport) => ({
              value: airport.airport_id,
              label: `${airport.code} - ${airport.city}`,
            }))}
          />
          <FormSelect
            label="Arrival Airport *"
            value={formState.destinationAirportId}
            onChange={updateField("destinationAirportId")}
            options={airports.map((airport) => ({
              value: airport.airport_id,
              label: `${airport.code} - ${airport.city}`,
            }))}
          />
        </FormRow>

        <div style={styles.formActions}>
          <button type="button" style={styles.outlineButton} onClick={resetForm}>
            Cancel
          </button>
          <button type="button" style={styles.primaryButton} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating..." : "Create Flight"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateFareView = ({ flights, onCreated }) => {
  const initialState = {
    flightId: flights[0]?.flight_id || "",
    cabin: "ECONOMY",
    basePrice: "4200",
    taxes: "900",
  };
  const [formState, setFormState] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setFormState((current) => ({
      ...current,
      flightId: current.flightId || flights[0]?.flight_id || "",
    }));
  }, [flights]);

  const totalPrice = Number(formState.basePrice || 0) + Number(formState.taxes || 0);

  const updateField = (key) => (event) => {
    setFormState((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  };

  const resetForm = () => {
    setFormState(initialState);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await apiRequest("/fares", {
        method: "POST",
        body: {
          flight_id: Number(formState.flightId),
          cabin: formState.cabin,
          base_price: Number(formState.basePrice || 0),
          taxes: Number(formState.taxes || 0),
        },
      });

      setSuccessMessage("Fare created successfully.");
      resetForm();
      await onCreated?.();
    } catch (error) {
      setErrorMessage(error.message || "Unable to create the fare.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.centerFormWrap}>
      <div style={styles.formCard}>
        <div style={styles.sectionHeading}>Create Fare</div>
        <FormFeedback errorMessage={errorMessage} successMessage={successMessage} />
        <FormRow columns={2}>
          <FormSelect
            label="Flight"
            value={formState.flightId}
            onChange={updateField("flightId")}
            options={flights.map((flight) => ({
              value: flight.flight_id,
              label: `${flight.flight_number} - ${flight.route}`,
            }))}
          />
          <FormSelect
            label="Cabin"
            value={formState.cabin}
            onChange={updateField("cabin")}
            options={[
              { value: "ECONOMY", label: "Economy" },
              { value: "BUSINESS", label: "Business" },
              { value: "FIRST", label: "First" },
            ]}
          />
        </FormRow>
        <FormRow columns={3}>
          <FormInput label="Base Price" value={formState.basePrice} onChange={updateField("basePrice")} />
          <FormInput label="Taxes" value={formState.taxes} onChange={updateField("taxes")} />
          <FormInput label="Total" value={`${totalPrice}`} disabled />
        </FormRow>
        <div style={styles.formActions}>
          <button type="button" style={styles.primaryButton} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating..." : "Create Fare"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateFareRuleView = () => (
  <div style={styles.centerFormWrap}>
    <div style={styles.formCard}>
      <div style={styles.sectionHeading}>Create Fare Rule</div>
      <FormRow columns={2}>
        <FormSelect label="Fare Family" value="Economy Standard" />
        <FormSelect label="Refundability" value="Partially Refundable" />
      </FormRow>
      <FormRow columns={2}>
        <FormInput label="Change Fee" value="INR 2500" />
        <FormInput label="Cancellation Fee" value="INR 3000" />
      </FormRow>
      <FormRow columns={1}>
        <FormInput label="Notes" placeholder="Penalty, waiver, and reschedule notes" />
      </FormRow>
      <div style={styles.formActions}>
        <button type="button" style={styles.primaryButton}>Create Fare Rule</button>
      </div>
    </div>
  </div>
);

const CreateBaggagePolicyView = ({ policy }) => (
  <div style={styles.stack24}>
    <div style={styles.sectionHeaderBar}>
      <div>
        <div style={styles.sectionHeading}>Baggage Policies</div>
        <div style={styles.sectionSubheading}>Configure and manage baggage allowances for your airline</div>
      </div>
    </div>

    <div style={styles.formCardFull}>
      <PolicySection title="Cabin Baggage (Carry-On)" tone="blue">
        <FormRow columns={2}>
          <FormInput label="Max Weight (kg)" value={policy.cabin.maxWeight} helper="Maximum total weight allowed for cabin baggage" />
          <FormInput label="Number of Pieces" value={policy.cabin.pieces} helper="Number of cabin baggage pieces allowed" />
          <FormInput label="Weight per Piece (kg)" value={policy.cabin.weightPerPiece} helper="Maximum weight per piece of cabin baggage" />
          <FormInput label="Max Dimension (cm)" value={policy.cabin.maxDimension} helper="Sum of length + width + height (in cm)" />
        </FormRow>
      </PolicySection>

      <PolicySection title="Checked Baggage" tone="green">
        <FormRow columns={2}>
          <FormInput label="Max Weight (kg)" value={policy.checked.maxWeight} helper="Maximum total weight for checked baggage" />
          <FormInput label="Number of Pieces" value={policy.checked.pieces} helper="Number of checked baggage pieces allowed" />
          <FormInput label="Weight per Piece (kg)" value={policy.checked.weightPerPiece} helper="Maximum weight per piece of checked baggage" />
          <FormInput label="Free Bags Allowance" value={policy.checked.freeAllowance} helper="Number of free checked bags allowed" />
        </FormRow>
      </PolicySection>

      <PolicySection title="Baggage Benefits" tone="orange">
        <FormRow columns={2}>
          <FormToggle title="Priority Baggage" subtitle="Enable priority handling for checked baggage" />
          <FormToggle title="Extra Baggage Allowance" subtitle="Allow additional baggage beyond standard limits" />
        </FormRow>
      </PolicySection>
    </div>
  </div>
);

const SchedulesView = ({ schedules }) => (
  <div style={styles.stack24}>
    <div style={styles.sectionHeaderBar}>
      <div>
        <div style={styles.sectionHeading}>Flight Schedules</div>
        <div style={styles.sectionSubheading}>Manage recurring flight schedules and templates</div>
      </div>
      <button type="button" style={styles.primaryButton}>Create Schedule</button>
    </div>

    <div style={styles.listPageCard}>
      <div style={styles.tableHeadingRow}>
        <div style={styles.sectionHeadingSmall}>Flight Schedules ({schedules.length})</div>
        <div style={styles.mutedText}>29/3/2026</div>
      </div>
      <div style={styles.tableWrap}>
        <div style={styles.scheduleHeaderRow}>
          <div>Flight</div>
          <div>Route</div>
          <div>Schedule</div>
          <div>Recurrence</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        {schedules.map((schedule) => (
          <div key={schedule.schedule_id} style={styles.scheduleDataRow}>
            <div style={styles.flightRef}>{schedule.flight_number}</div>
            <div>
              <div style={styles.boldText}>{schedule.route}</div>
              <div style={styles.smallMuted}>{schedule.source_name}</div>
              <div style={styles.smallMuted}>{schedule.destination_name}</div>
            </div>
            <div>
              <div style={styles.boldText}>{schedule.departure_time} - {schedule.arrival_time}</div>
              <div style={styles.smallMuted}>{schedule.duration}</div>
            </div>
            <div>
              <StatusTag label={schedule.recurrence} tone="violet" />
              <div style={styles.smallMuted}>{schedule.recurrence_days}</div>
            </div>
            <div><StatusTag label={schedule.status} tone="green" /></div>
            <div style={styles.tableActionStack}>
              <button type="button" style={styles.tableTextButton}>View</button>
              <button type="button" style={styles.tableTextButton}>Edit</button>
              <button type="button" style={styles.tableDeleteButton}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CreateScheduleView = ({ flights, onCreated }) => {
  const initialState = {
    flightId: flights[0]?.flight_id || "",
    status: "SCHEDULED",
    departureTime: "09:00:00",
    arrivalTime: "12:00:00",
    date: "",
    price: "5000",
  };
  const [formState, setFormState] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setFormState((current) => ({
      ...current,
      flightId: current.flightId || flights[0]?.flight_id || "",
    }));
  }, [flights]);

  const updateField = (key) => (event) => {
    setFormState((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  };

  const resetForm = () => {
    setFormState(initialState);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await apiRequest("/schedules", {
        method: "POST",
        body: {
          flight_id: Number(formState.flightId),
          departure_time: formState.departureTime,
          arrival_time: formState.arrivalTime,
          date: formState.date,
          price: Number(formState.price || 0),
          status: formState.status,
        },
      });

      setSuccessMessage("Schedule created successfully.");
      resetForm();
      await onCreated?.();
    } catch (error) {
      setErrorMessage(error.message || "Unable to create the schedule.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.centerFormWrap}>
      <div style={styles.formCard}>
        <div style={styles.sectionHeading}>Create Schedule</div>
        <FormFeedback errorMessage={errorMessage} successMessage={successMessage} />
        <FormRow columns={2}>
          <FormSelect
            label="Flight"
            value={formState.flightId}
            onChange={updateField("flightId")}
            options={flights.map((flight) => ({
              value: flight.flight_id,
              label: `${flight.flight_number} - ${flight.route}`,
            }))}
          />
          <FormSelect
            label="Status"
            value={formState.status}
            onChange={updateField("status")}
            options={[
              { value: "SCHEDULED", label: "SCHEDULED" },
              { value: "ACTIVE", label: "ACTIVE" },
              { value: "CANCELLED", label: "CANCELLED" },
            ]}
          />
        </FormRow>
        <FormRow columns={2}>
          <FormInput label="Departure Time" value={formState.departureTime} onChange={updateField("departureTime")} />
          <FormInput label="Arrival Time" value={formState.arrivalTime} onChange={updateField("arrivalTime")} />
        </FormRow>
        <FormRow columns={2}>
          <FormInput label="Date" type="date" value={formState.date} onChange={updateField("date")} />
          <FormInput label="Price" value={formState.price} onChange={updateField("price")} />
        </FormRow>
        <div style={styles.formActions}>
          <button type="button" style={styles.primaryButton} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating..." : "Create Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
};

const InstancesListView = ({
  instances,
  dateFilter,
  onDateFilterChange,
  departureFilter,
  onDepartureFilterChange,
  arrivalFilter,
  onArrivalFilterChange,
  flightFilter,
  onFlightFilterChange,
  onOpenInstance,
}) => (
  <div style={styles.stack24}>
    <div style={styles.sectionHeaderBar}>
      <div>
        <div style={styles.sectionHeading}>Flight Instances</div>
        <div style={styles.sectionSubheading}>Manage flight schedules and operations</div>
      </div>
      <button type="button" style={styles.primaryButton}>Create Instance</button>
    </div>

    <div style={styles.listPageCard}>
      <div style={styles.filterBar}>
        <button type="button" style={styles.filterButtonWide} onClick={() => onDateFilterChange("All Dates")}>
          {dateFilter}
        </button>
        <select value={departureFilter} onChange={(event) => onDepartureFilterChange(event.target.value)} style={styles.filterSelectWide}>
          <option>All Departure Cities</option>
          {[...new Set(instances.map((instance) => instance.departure_city))].filter(Boolean).map((city) => (
            <option key={city}>{city}</option>
          ))}
        </select>
        <select value={arrivalFilter} onChange={(event) => onArrivalFilterChange(event.target.value)} style={styles.filterSelectWide}>
          <option>All Arrival Cities</option>
          {[...new Set(instances.map((instance) => instance.arrival_city))].filter(Boolean).map((city) => (
            <option key={city}>{city}</option>
          ))}
        </select>
        <select value={flightFilter} onChange={(event) => onFlightFilterChange(event.target.value)} style={styles.filterSelectWide}>
          <option>All Flights</option>
          {[...new Set(instances.map((instance) => instance.flight_number))].filter(Boolean).map((flightNumber) => (
            <option key={flightNumber}>{flightNumber}</option>
          ))}
        </select>
      </div>
    </div>

    <div style={styles.listPageCard}>
      <div style={styles.tableHeadingRow}>
        <div style={styles.sectionHeadingSmall}>Flight Instances ({instances.length})</div>
        <div style={styles.mutedText}>29/3/2026</div>
      </div>
      <div style={styles.tableWrap}>
        <div style={styles.instanceHeaderRow}>
          <div>Flight Number</div>
          <div>Route</div>
          <div>Departure</div>
          <div>Arrival</div>
          <div>Capacity</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        {instances.map((instance) => (
          <div key={instance.instance_id} style={styles.instanceDataRow}>
            <div style={styles.flightRef}>{instance.flight_number}</div>
            <div>
              <div style={styles.boldText}>{instance.route}</div>
              <div style={styles.smallMuted}>{instance.departure_city} - {instance.arrival_city}</div>
            </div>
            <div>{instance.departure_at}</div>
            <div>{instance.arrival_at}</div>
            <div>
              <div style={styles.capacityText}>0/{instance.capacity}</div>
              <div style={styles.smallMuted}>{instance.available_seats} available</div>
            </div>
            <div><StatusTag label={instance.status} tone="green" /></div>
            <div style={styles.actionRow}>
              <button type="button" style={styles.tableTextButton} onClick={() => onOpenInstance(instance)}>View</button>
              <button type="button" style={styles.tableTextButton}>Edit</button>
              <button type="button" style={styles.tableDeleteButton}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const InstanceDetailView = ({ instance, onBack }) => (
  <div style={styles.stack24}>
    <Breadcrumb
      title="Flight Instances"
      subtitle="Manage flight instances and cabin configurations"
      trail={["Back to Instances", instance.flight_number]}
      onBack={onBack}
    />

    <div style={styles.instanceHero}>
      <div style={styles.routeColumn}>
        <div style={styles.routeLabel}>Departure</div>
        <div style={styles.airportCodeBig}>{instance.departure_code}</div>
        <div style={styles.cityBig}>{instance.departure_city}</div>
        <div style={styles.smallMuted}>{instance.departure_airport}</div>
        <div style={styles.timeBadge}>{instance.departure_at}</div>
      </div>
      <div style={styles.routeMiddle}>
        <div style={styles.flightCircle}>FT</div>
        <div style={styles.durationText}>{instance.duration_minutes} min</div>
        <div style={styles.smallMuted}>Non-stop</div>
      </div>
      <div style={styles.routeColumn}>
        <div style={styles.routeLabel}>Arrival</div>
        <div style={styles.airportCodeBig}>{instance.arrival_code}</div>
        <div style={styles.cityBig}>{instance.arrival_city}</div>
        <div style={styles.smallMuted}>{instance.arrival_airport}</div>
        <div style={styles.timeBadgeAlt}>{instance.arrival_at}</div>
      </div>
    </div>

    <div style={styles.metricsRowFour}>
      <MetricInsight title="On-time Performance" value={instance.on_time_performance} note="+3% Above average" color="#16a34a" />
      <MetricInsight title="Load Factor" value={instance.load_factor} note="+8% Current occupancy" color="#2563eb" />
      <MetricInsight title="Revenue Index" value={instance.revenue_index} note="Excellent performance" color="#a855f7" />
      <MetricInsight title="Safety Rating" value={instance.safety_rating} note="Perfect score" color="#16a34a" />
    </div>

    <div style={styles.tabsRow}>
      <div style={styles.tabActive}>Overview</div>
      <div style={styles.tabItem}>Cabins</div>
      <div style={styles.tabItem}>Analytics</div>
    </div>

    <div style={styles.twoColumnLayout}>
      <div style={styles.detailCard}>
        <div style={styles.sectionHeading}>Flight Instance Information</div>
        <div style={styles.infoCols2}>
          <InfoPair label="Flight Number" value={instance.flight_number} />
          <InfoPair label="Airline" value={instance.airline_name} />
          <InfoPair label="Aircraft" value={instance.aircraft_code} />
          <InfoPair label="Registration" value={instance.aircraft_code} />
          <InfoPair label="Status" value={instance.status} />
          <InfoPair label="Gate" value={instance.gate} />
        </div>
      </div>

      <div style={styles.detailCard}>
        <div style={styles.sectionHeading}>Seat Statistics</div>
        <StatBar label="Total Seats" value={`${instance.capacity}`} width="100%" color="#dbeafe" />
        <StatBar label="Booked Seats" value={`${instance.booked_seats}`} width="0%" color="#dcfce7" />
        <StatBar label="Available Seats" value={`${instance.available_seats}`} width="100%" color="#ffedd5" />
        <div style={styles.progressRow}>
          <span>Occupancy Rate</span>
          <span>0%</span>
        </div>
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: "0%" }} />
        </div>
      </div>
    </div>

    <div style={styles.detailCard}>
      <div style={styles.sectionHeading}>Flight Amenities</div>
      <div style={styles.amenityRow}>
        {instance.amenities.map((amenity) => (
          <div key={amenity} style={styles.amenityCard}>
            <span>{amenity}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CreateInstanceView = ({ schedules, flights, aircrafts, onCreated }) => {
  const initialState = {
    scheduleId: schedules[0]?.schedule_id || "",
    status: "SCHEDULED",
    date: "",
  };
  const [formState, setFormState] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setFormState((current) => ({
      ...current,
      scheduleId: current.scheduleId || schedules[0]?.schedule_id || "",
    }));
  }, [schedules]);

  const selectedSchedule = schedules.find((schedule) => Number(schedule.schedule_id) === Number(formState.scheduleId));
  const selectedFlight = flights.find((flight) => Number(flight.flight_id) === Number(selectedSchedule?.flight_id));
  const selectedAircraft = aircrafts.find((aircraft) => Number(aircraft.aircraft_id) === Number(selectedFlight?.aircraft_id));
  const derivedSeats = selectedAircraft?.total_seats || 0;

  const updateField = (key) => (event) => {
    setFormState((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  };

  const resetForm = () => {
    setFormState(initialState);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await apiRequest("/instances", {
        method: "POST",
        body: {
          schedule_id: Number(formState.scheduleId),
          status: formState.status,
          date: formState.date || selectedSchedule?.departure_date || selectedSchedule?.date,
        },
      });

      setSuccessMessage("Instance created successfully.");
      resetForm();
      await onCreated?.();
    } catch (error) {
      setErrorMessage(error.message || "Unable to create the instance.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.centerFormWrap}>
      <div style={styles.formCard}>
        <div style={styles.sectionHeading}>Create Instance</div>
        <FormFeedback errorMessage={errorMessage} successMessage={successMessage} />
        <FormRow columns={2}>
          <FormSelect
            label="Schedule"
            value={formState.scheduleId}
            onChange={updateField("scheduleId")}
            options={schedules.map((schedule) => ({
              value: schedule.schedule_id,
              label: `${schedule.flight_number} - ${schedule.route} - ${formatDateLabel(schedule.departure_date || schedule.date)}`,
            }))}
          />
          <FormSelect
            label="Status"
            value={formState.status}
            onChange={updateField("status")}
            options={[
              { value: "SCHEDULED", label: "SCHEDULED" },
              { value: "ACTIVE", label: "ACTIVE" },
              { value: "CANCELLED", label: "CANCELLED" },
            ]}
          />
        </FormRow>
        <FormRow columns={2}>
          <FormInput label="Departure Date" type="date" value={formState.date} onChange={updateField("date")} />
          <FormInput label="Available Seats" value={`${derivedSeats}`} disabled />
        </FormRow>
        <div style={styles.formActions}>
          <button type="button" style={styles.primaryButton} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating..." : "Create Instance"}
          </button>
        </div>
      </div>
    </div>
  );
};

const BookingsView = ({
  bookings,
  allBookings,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  flightFilter,
  onFlightFilterChange,
  onOpenBooking,
}) => (
  <div style={styles.stack24}>
    <div style={styles.sectionHeaderBar}>
      <div>
        <div style={styles.sectionHeading}>Booking Management</div>
        <div style={styles.sectionSubheading}>View and manage passenger bookings</div>
      </div>
    </div>

    <div style={styles.metricRowFour}>
      <MetricSummary title="Total Bookings" value={`${allBookings.length}`} color="#2563eb" />
      <MetricSummary title="Confirmed" value={`${allBookings.filter((booking) => booking.booking_status === "CONFIRMED").length}`} color="#16a34a" />
      <MetricSummary title="Pending" value={`${allBookings.filter((booking) => booking.booking_status === "PENDING").length}`} color="#d97706" />
      <MetricSummary
        title="Revenue"
        value={`Rs ${(allBookings.reduce((sum, booking) => sum + Number(booking.amount_number || 0), 0) / 100000).toFixed(1)}L`}
        color="#9333ea"
      />
    </div>

    <div style={styles.listPageCard}>
      <div style={styles.sectionHeadingSmall}>Bookings</div>
      <div style={styles.bookingToolbar}>
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by PNR, passenger, email..."
          style={styles.searchInputWide}
        />
        <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)} style={styles.filterSelectBookings}>
          <option>All Status</option>
          <option>CONFIRMED</option>
          <option>PENDING</option>
          <option>CANCELLED</option>
        </select>
        <select value={flightFilter} onChange={(event) => onFlightFilterChange(event.target.value)} style={styles.filterSelectBookings}>
          <option>All Flights</option>
          {[...new Set(allBookings.map((booking) => booking.flight_number))].filter(Boolean).map((flightNumber) => (
            <option key={flightNumber}>{flightNumber}</option>
          ))}
        </select>
        <select style={styles.filterSelectBookings} defaultValue="Latest first">
          <option>Latest first</option>
          <option>Oldest first</option>
        </select>
        <button type="button" style={styles.outlineButton}>Export</button>
      </div>

      <div style={styles.bookingTable}>
        <div style={styles.bookingTableHeader}>
          <div>Ref</div>
          <div>Flight</div>
          <div>Route</div>
          <div>Passenger(s)</div>
          <div>Departure</div>
          <div>Amount</div>
          <div>Status</div>
          <div>Payment</div>
          <div>Booked</div>
          <div>Actions</div>
        </div>
        {bookings.map((booking) => (
          <div key={booking.booking_id} style={styles.bookingTableRow}>
            <div style={styles.bookingRef}>{booking.booking_ref}</div>
            <div>
              <div style={styles.boldText}>{booking.flight_number}</div>
              <div style={styles.smallMuted}>Mumbai - Kolkata</div>
              <div style={styles.smallMuted}>2h</div>
            </div>
            <div style={styles.routeCell}>{booking.route}</div>
            <div>
              <div style={styles.boldText}>{booking.primary_passenger}</div>
              <div style={styles.smallMuted}>+{Math.max(booking.passenger_names.length - 1, 0)} more</div>
            </div>
            <div>{booking.departure_label}</div>
            <div style={styles.boldText}>{booking.amount}</div>
            <div><StatusTag label={booking.booking_status} tone="green" /></div>
            <div><StatusTag label={booking.payment_status} tone="green" /></div>
            <div>{booking.booked_date}</div>
            <div style={styles.actionRow}>
              <button type="button" style={styles.tableTextButton} onClick={() => onOpenBooking(booking)}>View</button>
              <button type="button" style={styles.tableDeleteButton}>X</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const BookingModal = ({ booking, onClose }) => {
  if (!booking) {
    return null;
  }

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
        <div style={styles.modalTopRow}>
          <div>
            <div style={styles.modalTitle}>Booking Details</div>
            <div style={styles.modalSubtext}>Reference: {booking.booking_ref}</div>
          </div>
          <button type="button" style={styles.modalClose} onClick={onClose}>
            x
          </button>
        </div>

        <div style={styles.modalScroll}>
          <div style={styles.stack16}>
            {booking.ancillaries.map((ancillary, index) => (
              <div key={`${ancillary.name}-${index}`} style={styles.ancillaryCard}>
                <div>
                  <div style={styles.ancillaryName}>{ancillary.name}</div>
                  <div style={styles.tagRow}>
                    <StatusTag label={ancillary.type} tone="blue" />
                    <StatusTag label={ancillary.code} tone="soft" />
                  </div>
                  <div style={styles.smallMuted}>Max Qty: {ancillary.quantity}</div>
                  <div style={styles.availabilityText}>{ancillary.availability}</div>
                  {ancillary.note ? <div style={styles.linkText}>{ancillary.note}</div> : null}
                </div>
                <div style={styles.ancillaryAmount}>{ancillary.amount}</div>
              </div>
            ))}
          </div>

          <div style={styles.modalInfoGrid}>
            <div style={styles.modalPanel}>
              <div style={styles.modalPanelTitle}>Fare Breakdown</div>
              <div style={styles.modalInfoRows}>
                <ModalInfo label="Fare Type" value={booking.fare_type} />
                <ModalInfo label="Base Fare" value={booking.base_fare} />
                <ModalInfo label="Taxes & Fees" value={booking.taxes} />
                <ModalInfo label="Airline Fees" value={booking.airline_fees} />
                <div style={styles.modalDivider} />
                <ModalInfo label="Total Amount" value={booking.total_amount} strong />
              </div>
            </div>

            <div style={styles.modalPanel}>
              <div style={styles.modalPanelTitle}>Payment Information</div>
              <div style={styles.modalInfoRows}>
                <ModalInfo label="Payment Status" value={booking.payment_status} />
                <ModalInfo label="Booking Date" value={booking.booked_date} />
                <ModalInfo label="Last Modified" value={booking.booked_date} />
                <ModalInfo label="Payment Method" value={booking.payment_method} />
              </div>
            </div>

            <div style={styles.modalPanel}>
              <div style={styles.modalPanelTitle}>Tickets ({booking.tickets.length})</div>
              <div style={styles.stack12}>
                {booking.tickets.length === 0 ? <div style={styles.smallMuted}>Tickets will appear after issue.</div> : null}
                {booking.tickets.map((ticket) => (
                  <div key={ticket.ticket_number} style={styles.ticketCard}>
                    <div>
                      <div style={styles.boldText}>{ticket.ticket_number}</div>
                      <div style={styles.smallMuted}>{ticket.name}</div>
                      <div style={styles.smallMuted}>Issued: {ticket.issue_date}</div>
                    </div>
                    <StatusTag label={ticket.status} tone="soft" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AncillaryMasterView = ({ items }) => (
  <SimpleListCard
    title="Master Ancillaries"
    subtitle="Manage ancillary inventory linked to the booking and insurance schema"
    rows={items.map((item) => [item.name, `${item.type} - ${item.price}`, item.description])}
  />
);

const CreateAncillaryView = () => (
  <div style={styles.centerFormWrap}>
    <div style={styles.formCard}>
      <div style={styles.sectionHeading}>Create Ancillary</div>
      <FormRow columns={2}>
        <FormInput label="Ancillary Name" placeholder="Priority Baggage" />
        <FormSelect label="Type" value="BAGGAGE" />
      </FormRow>
      <FormRow columns={2}>
        <FormInput label="Price" value="850" />
        <FormInput label="Description" placeholder="Ancillary description" />
      </FormRow>
      <div style={styles.formActions}>
        <button type="button" style={styles.primaryButton}>Create Ancillary</button>
      </div>
    </div>
  </div>
);

const InsuranceCoverageView = () => (
  <SimpleListCard
    title="Insurance Coverage"
    subtitle="Travel protection products mapped to ancillary and booking records"
    rows={[
      ["Trip Secure", "INR 4,999", "Medical cover, baggage delay, missed connection"],
      ["Flex Cancel", "INR 1,250", "Partial cancellation protection for domestic sectors"],
    ]}
  />
);

const MealView = ({ meals }) => (
  <SimpleListCard
    title="Meal Management"
    subtitle="Meal records mapped to Meal and Passenger_Meal tables"
    rows={meals.map((meal) => [meal.name, `${meal.type} - ${meal.category}`, meal.price])}
  />
);

const MealStatusView = () => (
  <SimpleListCard
    title="Meal Status"
    subtitle="Operational meal uplifts and cabin delivery readiness"
    rows={[
      ["FT101", "Loaded", "Economy 90 / Business 30 / First 10"],
      ["FT102", "Pending Uplift", "Awaiting catering release"],
    ]}
  />
);

const CreateDiscountView = () => (
  <div style={styles.centerFormWrap}>
    <div style={styles.formCard}>
      <div style={styles.sectionHeading}>Create Discount</div>
      <FormRow columns={2}>
        <FormInput label="Discount Code" placeholder="SUMMER25" />
        <FormSelect label="Scope" value="Economy" />
      </FormRow>
      <FormRow columns={2}>
        <FormInput label="Value" value="25%" />
        <FormSelect label="Status" value="Active" />
      </FormRow>
      <div style={styles.formActions}>
        <button type="button" style={styles.primaryButton}>Create Discount</button>
      </div>
    </div>
  </div>
);

const DiscountListView = ({ discounts }) => (
  <SimpleListCard
    title="Existing Discounts"
    subtitle="Yield and promotion controls"
    rows={discounts.map((discount) => [discount.name, `${discount.scope} - ${discount.status}`, `Burn: ${discount.burn}`])}
  />
);

const SimpleAnalyticsView = ({ title }) => (
  <SimpleListCard
    title={title}
    subtitle="This section is scaffolded with schema-aware placeholders so the dashboard stays navigable in one file."
    rows={[
      ["Data source", "AirData schema", "Users, Airline, Aircraft, Flight, Schedule, Booking, Ticket"],
      ["View mode", "Ready", "Replace mock objects with API data when backend endpoints are available"],
      ["Status", "Operational", "UI structure aligned to the reference screens you shared"],
    ]}
  />
);

const SimpleListCard = ({ title, subtitle, rows }) => (
  <div style={styles.listPageCard}>
    <div style={styles.sectionHeading}>{title}</div>
    <div style={styles.sectionSubheading}>{subtitle}</div>
    <div style={styles.simpleTable}>
      {rows.map((row, index) => (
        <div key={`${title}-${index}`} style={styles.simpleRow}>
          <div style={styles.boldText}>{row[0]}</div>
          <div>{row[1]}</div>
          <div style={styles.smallMuted}>{row[2]}</div>
        </div>
      ))}
    </div>
  </div>
);

const Breadcrumb = ({ title, subtitle, trail, onBack }) => (
  <div style={styles.stack24}>
    <div style={styles.sectionHeaderBar}>
      <div>
        <div style={styles.sectionHeading}>{title}</div>
        <div style={styles.sectionSubheading}>{subtitle}</div>
      </div>
    </div>
    <div style={styles.breadcrumbBar}>
      <button type="button" style={styles.backButton} onClick={onBack}>
        {trail[0]}
      </button>
      <div style={styles.breadcrumbTrail}>{trail[1]}</div>
    </div>
  </div>
);

const PolicySection = ({ title, tone, children }) => (
  <div style={styles.policySection}>
    <div style={styles.policyHeader}>
      <span style={{ ...styles.policyIcon, background: getToneColor(tone) }} />
      <span style={styles.sectionHeadingSmall}>{title}</span>
    </div>
    {children}
  </div>
);

const FormRow = ({ columns, children }) => (
  <div
    style={{
      ...styles.formGrid,
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    }}
  >
    {children}
  </div>
);

const FormInput = ({ label, value, placeholder, helper, onChange, type = "text", disabled = false }) => (
  <div style={styles.formField}>
    <label style={styles.formLabel}>{label}</label>
    <input
      style={styles.input}
      {...(typeof onChange === "function" || disabled
        ? { value: value ?? "", onChange, readOnly: disabled && typeof onChange !== "function" }
        : { defaultValue: value })}
      placeholder={placeholder}
      type={type}
      disabled={disabled}
    />
    {helper ? <div style={styles.formHelper}>{helper}</div> : null}
  </div>
);

const FormSelect = ({ label, value, onChange, options = [] }) => (
  <div style={styles.formField}>
    <label style={styles.formLabel}>{label}</label>
    <select
      style={styles.input}
      {...(typeof onChange === "function" ? { value: value ?? "", onChange } : { defaultValue: value })}
    >
      {(options.length > 0 ? options : [{ value, label: value }]).map((option) => (
        <option key={`${label}-${option.value}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const FormCheckbox = ({ label, checked, onChange }) => (
  <div style={styles.formField}>
    <label style={styles.formLabel}>{label}</label>
    <label style={styles.checkboxLabel}>
      <input
        type="checkbox"
        {...(typeof onChange === "function" ? { checked: Boolean(checked), onChange } : { defaultChecked: checked })}
      />
      <span>{label}</span>
    </label>
  </div>
);

const FormToggle = ({ title, subtitle }) => (
  <div style={styles.toggleCard}>
    <div>
      <div style={styles.boldText}>{title}</div>
      <div style={styles.smallMuted}>{subtitle}</div>
    </div>
    <div style={styles.togglePill} />
  </div>
);

const DetailGroup = ({ title, rows }) => (
  <div>
    <div style={styles.detailGroupTitle}>{title}</div>
    <div style={styles.stack12}>
      {rows.map(([label, value]) => (
        <div key={label}>
          <div style={styles.detailLabel}>{label}</div>
          <div style={styles.detailValue}>{value}</div>
        </div>
      ))}
    </div>
  </div>
);

const InfoPair = ({ label, value }) => (
  <div>
    <div style={styles.detailLabel}>{label}</div>
    <div style={styles.detailValue}>{value}</div>
  </div>
);

const PreviewMetric = ({ label, value }) => (
  <div style={styles.previewMetric}>
    <div style={styles.detailLabel}>{label}</div>
    <div style={styles.previewMetricValue}>{value}</div>
  </div>
);

const FooterMetric = ({ label, value }) => (
  <div style={styles.footerMetric}>
    <div style={styles.footerMetricValue}>{value}</div>
    <div style={styles.footerMetricLabel}>{label}</div>
  </div>
);

const MetricSummary = ({ title, value, color }) => (
  <div style={styles.summaryMetricCard}>
    <div style={styles.detailLabel}>{title}</div>
    <div style={{ ...styles.summaryMetricValue, color }}>{value}</div>
  </div>
);

const MetricInsight = ({ title, value, note, color }) => (
  <div style={styles.insightMetricCard}>
    <div style={styles.detailLabel}>{title}</div>
    <div style={{ ...styles.summaryMetricValue, color }}>{value}</div>
    <div style={styles.smallMuted}>{note}</div>
  </div>
);

const SummaryBlock = ({ label, value, subvalue }) => (
  <div>
    <div style={styles.detailLabel}>{label}</div>
    <div style={styles.detailValue}>{value}</div>
    <div style={styles.smallMuted}>{subvalue}</div>
  </div>
);

const MiniCabin = ({ label, value }) => (
  <div style={styles.miniCabinBlock}>
    <div style={styles.smallMuted}>{label}</div>
    <div style={styles.boldText}>{value}</div>
  </div>
);

const ModalInfo = ({ label, value, strong }) => (
  <div style={styles.modalInfoRow}>
    <span style={styles.detailLabel}>{label}</span>
    <span style={strong ? styles.totalValue : styles.detailValue}>{value}</span>
  </div>
);

const StatusTag = ({ label, tone }) => {
  const map = {
    green: { background: "#dcfce7", color: "#15803d" },
    violet: { background: "#ede9fe", color: "#7c3aed" },
    blue: { background: "#dbeafe", color: "#2563eb" },
    orange: { background: "#ffedd5", color: "#d97706" },
    soft: { background: "#eff6ff", color: "#475569" },
  };

  return <span style={{ ...styles.statusTag, ...(map[tone] || map.soft) }}>{label}</span>;
};

const SeatLegend = () => (
  <div style={styles.legendRow}>
    <LegendItem label="Available" color="#dcfce7" border="#86efac" />
    <LegendItem label="Unavailable" color="#fee2e2" border="#fca5a5" />
    <LegendItem label="Premium/Extra Legroom" color="#f3e8ff" border="#d8b4fe" />
    <LegendItem label="Emergency Exit" color="#fef3c7" border="#fcd34d" />
    <LegendItem label="Blocked" color="#f3f4f6" border="#d1d5db" />
    <LegendItem label="Selected" color="#2563eb" border="#2563eb" dark />
  </div>
);

const LegendItem = ({ label, color, border, dark }) => (
  <div style={styles.legendItem}>
    <span
      style={{
        ...styles.legendBox,
        background: color,
        borderColor: border,
        boxShadow: dark ? "none" : undefined,
      }}
    />
    <span>{label}</span>
  </div>
);

const SeatMapGraphic = ({ cabin }) => {
  const rows = Array.from({ length: cabin.totalRows }, (_, index) => index + 1);
  const leftLabels = Array.from({ length: cabin.leftSeats }, (_, index) => String.fromCharCode(65 + index));
  const rightLabels = Array.from({ length: cabin.rightSeats }, (_, index) => String.fromCharCode(65 + cabin.leftSeats + index));

  return (
    <div style={styles.seatMapWrap}>
      <div style={styles.seatWing}>A</div>
      <div style={styles.seatGrid}>
        {rows.map((row) => (
          <div key={row} style={styles.seatMapRow}>
            <div style={styles.rowMarker}>{row}</div>
            <div style={styles.seatCluster}>
              {leftLabels.map((label) => (
                <SeatChip key={`${row}${label}`} value={label} />
              ))}
            </div>
            <div style={styles.aisleSpacer} />
            <div style={styles.seatCluster}>
              {rightLabels.map((label) => (
                <SeatChip key={`${row}${label}`} value={label} />
              ))}
            </div>
            <div style={styles.rowMarker}>{row}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SeatMapMiniPreview = ({ cabin }) => {
  const rows = [1, 2, 3];
  const leftLabels = Array.from({ length: cabin.leftSeats }, (_, index) => String.fromCharCode(65 + index));
  const rightLabels = Array.from({ length: cabin.rightSeats }, (_, index) => String.fromCharCode(65 + cabin.leftSeats + index));

  return (
    <div style={styles.miniPreviewWrap}>
      <div style={styles.detailLabel}>Seat Layout Example</div>
      {rows.map((row) => (
        <div key={row} style={styles.miniRow}>
          <span style={styles.detailLabel}>{row}</span>
          {leftLabels.map((label) => (
            <SeatChip key={`${row}-${label}`} value={label} mini />
          ))}
          <div style={styles.aisleSpacerMini} />
          {rightLabels.map((label) => (
            <SeatChip key={`${row}-${label}-r`} value={label} mini />
          ))}
        </div>
      ))}
      <div style={styles.smallMuted}>... {Math.max(cabin.totalRows - 3, 0)} more rows</div>
    </div>
  );
};

const SeatChip = ({ value, mini }) => (
  <div
    style={{
      ...styles.seatChip,
      width: mini ? 24 : 32,
      height: mini ? 24 : 32,
      fontSize: mini ? 11 : 13,
    }}
  >
    {value}
  </div>
);

const StatBar = ({ label, value, width, color }) => (
  <div style={styles.statBarCard}>
    <div style={styles.progressRow}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
    <div style={{ ...styles.progressTrack, background: color }}>
      <div style={{ ...styles.progressFill, width }} />
    </div>
  </div>
);

const getPageTitle = (tab) => {
  const allItems = [...getAirlineMenu({}), ...superAdminMenu];
  for (let index = 0; index < allItems.length; index += 1) {
    const item = allItems[index];
    if (item.key === tab) {
      return item.label;
    }
    if (item.children) {
      const child = item.children.find((entry) => entry.key === tab);
      if (child) {
        return child.label;
      }
    }
  }
  return "Dashboard";
};

const getPageSubtitle = (tab) => {
  const subtitles = {
    "dashboard-overview": "Comprehensive overview of your airline operations",
    "all-aircraft": "Manage aircraft details and configurations",
    "create-aircraft": "Register aircraft using the AirData schema fields",
    "all-flights": "Manage your flight schedules and operations",
    "create-flight": "Configure flight, aircraft, route, and pricing inputs",
    "create-fare": "Map fare pricing to schedule and cabin classes",
    "create-fare-rule": "Control penalties, waiver rules, and reschedules",
    "create-baggage-policy": "Cabin and checked baggage configuration",
    "all-schedules": "Manage recurring flight schedules and templates",
    "create-schedule": "Create schedule records linked to flights",
    "all-instances": "Manage flight instances and cabin configurations",
    "create-instance": "Instantiate scheduled flights for a specific date",
    "all-bookings": "View and manage passenger bookings",
    "booking-statistics": "Reservation funnel and payment monitoring",
    transactions: "Payment records and settlement tracking",
  };
  return subtitles[tab] || "Airline operations workspace";
};

const getToneColor = (tone) => {
  const colors = {
    blue: "#dbeafe",
    green: "#dcfce7",
    orange: "#ffedd5",
  };
  return colors[tone] || "#dbeafe";
};

const styles = {
  appShell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  sidebar: {
    width: 320,
    background: "linear-gradient(180deg, #16233e 0%, #101a30 100%)",
    color: "#ffffff",
    padding: "22px 12px 16px",
    boxShadow: "18px 0 36px rgba(15, 23, 42, 0.16)",
  },
  brandHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "10px 12px 20px",
    borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#38bdf8",
  },
  brandSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 8,
  },
  brandCloseButton: {
    border: "none",
    background: "transparent",
    color: "#cbd5e1",
    cursor: "pointer",
    fontSize: 18,
  },
  sidebarScroll: {
    marginTop: 16,
    overflowY: "auto",
    height: "calc(100vh - 110px)",
    paddingRight: 4,
  },
  sidebarGroup: {
    marginBottom: 8,
  },
  sectionButton: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "none",
    background: "rgba(255,255,255,0.04)",
    color: "#ffffff",
    borderRadius: 16,
    padding: "12px 14px",
    cursor: "pointer",
  },
  sectionButtonLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 14,
    fontWeight: 600,
  },
  sectionButtonRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #7c3aed 0%, #0ea5e9 100%)",
    fontSize: 12,
    fontWeight: 700,
  },
  sidebarCount: {
    minWidth: 28,
    height: 24,
    borderRadius: 999,
    background: "rgba(148, 163, 184, 0.2)",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    padding: "0 8px",
  },
  sidebarCountSmall: {
    minWidth: 24,
    height: 22,
    borderRadius: 999,
    background: "rgba(255,255,255,0.16)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    padding: "0 8px",
  },
  sidebarArrow: {
    color: "#94a3b8",
    fontSize: 14,
  },
  childList: {
    padding: "8px 0 0 18px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  childButton: {
    border: "none",
    borderRadius: 14,
    padding: "12px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 14,
    cursor: "pointer",
  },
  mainShell: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
  topbar: {
    background: "#ffffff",
    padding: "24px 32px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 800,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 6,
  },
  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  topControl: {
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: 14,
    padding: "12px 16px",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 600,
    cursor: "pointer",
  },
  notificationBubble: {
    width: 22,
    height: 22,
    borderRadius: 999,
    background: "#fee2e2",
    color: "#ef4444",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
  },
  superAdminSwitch: {
    border: "1px solid #dbeafe",
    borderRadius: 14,
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  contentShell: {
    padding: 24,
  },
  inlineInfoBanner: {
    marginBottom: 16,
    borderRadius: 14,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#2563eb",
    padding: "14px 16px",
    fontWeight: 700,
  },
  inlineErrorBanner: {
    marginBottom: 16,
    borderRadius: 14,
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#be123c",
    padding: "14px 16px",
    fontWeight: 700,
  },
  inlineSuccessBanner: {
    marginBottom: 16,
    borderRadius: 14,
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#047857",
    padding: "14px 16px",
    fontWeight: 700,
  },
  stack24: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  stack16: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  stack12: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  metricRow: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 16,
  },
  metricsRowFour: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 16,
  },
  metricRowFour: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 16,
  },
  metricCard: {
    borderRadius: 18,
    padding: "18px 18px 16px",
    border: "1px solid rgba(226, 232, 240, 0.9)",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 800,
  },
  metricLabel: {
    marginTop: 6,
    fontSize: 14,
    color: "#475569",
  },
  listPageCard: {
    background: "#ffffff",
    borderRadius: 22,
    padding: 18,
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.05)",
  },
  flightSummaryCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    background: "#ffffff",
  },
  flightSummaryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  flightBadge: {
    fontSize: 18,
    fontWeight: 800,
  },
  flightSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 18,
  },
  cabinStrip: {
    marginTop: 18,
    padding: "14px 12px",
    borderRadius: 14,
    background: "#f8fafc",
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },
  miniCabinBlock: {
    fontSize: 13,
  },
  cardFooterRow: {
    marginTop: 18,
    paddingTop: 16,
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  mutedText: {
    fontSize: 13,
    color: "#64748b",
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  ghostAction: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    borderRadius: 12,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 600,
  },
  dangerAction: {
    border: "1px solid #fecaca",
    background: "#ffffff",
    color: "#dc2626",
    borderRadius: 12,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },
  sectionHeaderBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: 800,
  },
  sectionHeadingSmall: {
    fontSize: 16,
    fontWeight: 800,
  },
  sectionSubheading: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  cardGridThree: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 20,
  },
  aircraftCabinCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
  },
  cabinTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },
  cabinName: {
    fontSize: 18,
    fontWeight: 800,
  },
  tagRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  statusTag: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
  },
  infoCols2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 18,
  },
  layoutHint: {
    marginTop: 16,
    fontSize: 13,
    color: "#64748b",
  },
  inlineActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  outlineButton: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    borderRadius: 12,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },
  primaryButton: {
    border: "none",
    background: "#6d28d9",
    color: "#ffffff",
    borderRadius: 12,
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 12px 22px rgba(109, 40, 217, 0.18)",
  },
  metricFooterRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 18,
  },
  footerMetric: {
    background: "#ffffff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    padding: 24,
    textAlign: "center",
  },
  footerMetricValue: {
    fontSize: 20,
    fontWeight: 800,
  },
  footerMetricLabel: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748b",
  },
  breadcrumbBar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    color: "#64748b",
    fontSize: 14,
  },
  backButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontWeight: 700,
    color: "#0f172a",
  },
  breadcrumbTrail: {
    color: "#94a3b8",
  },
  detailCard: {
    background: "#ffffff",
    borderRadius: 22,
    border: "1px solid #e5e7eb",
    padding: 24,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 24,
  },
  detailIdentity: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  detailBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "#e0e7ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 800,
  },
  detailSubtitle: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 14,
  },
  detailColumns4: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 24,
  },
  detailGroupTitle: {
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 700,
  },
  schedulePill: {
    marginTop: 18,
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    background: "#dcfce7",
    color: "#15803d",
    padding: "8px 12px",
    fontWeight: 700,
    fontSize: 13,
  },
  cabinHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  seatMapWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 18,
    padding: "14px 0 8px",
  },
  seatWing: {
    width: 68,
    height: 44,
    borderRadius: "50% 50% 0 0",
    background: "#e5e7eb",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    marginTop: 8,
  },
  seatGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  seatMapRow: {
    display: "grid",
    gridTemplateColumns: "28px auto 20px auto 28px",
    gap: 10,
    alignItems: "center",
  },
  rowMarker: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: 700,
    color: "#64748b",
  },
  seatCluster: {
    display: "flex",
    gap: 8,
  },
  aisleSpacer: {
    width: 20,
  },
  aisleSpacerMini: {
    width: 12,
  },
  seatChip: {
    borderRadius: 8,
    background: "#dcfce7",
    border: "2px solid #86efac",
    color: "#15803d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },
  legendRow: {
    display: "flex",
    gap: 14,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "#475569",
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    border: "1px solid",
  },
  checkboxRow: {
    marginTop: 18,
    display: "flex",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
  },
  checkboxLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: "#334155",
  },
  iconButton: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    borderRadius: 12,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },
  centerFormWrap: {
    display: "flex",
    justifyContent: "center",
  },
  formCard: {
    width: "min(980px, 100%)",
    background: "#ffffff",
    borderRadius: 22,
    border: "1px solid #e5e7eb",
    padding: 24,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
  },
  formCardWide: {
    width: "min(760px, 100%)",
    background: "#ffffff",
    borderRadius: 22,
    border: "1px solid #e5e7eb",
    padding: 24,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
  },
  formCardFull: {
    background: "#ffffff",
    borderRadius: 22,
    border: "1px solid #e5e7eb",
    padding: 18,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
  },
  formGrid: {
    display: "grid",
    gap: 16,
    marginTop: 16,
  },
  formField: {
    display: "flex",
    flexDirection: "column",
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
  },
  formHelper: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748b",
  },
  input: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    padding: "14px 14px",
    fontSize: 14,
    background: "#ffffff",
    boxSizing: "border-box",
  },
  formSectionTitle: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: 800,
  },
  formActions: {
    marginTop: 24,
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
  },
  previewCard: {
    marginTop: 16,
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    padding: 18,
  },
  previewSummary: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 18,
  },
  previewMetric: {
    textAlign: "center",
  },
  previewMetricValue: {
    fontSize: 18,
    fontWeight: 800,
    color: "#2563eb",
  },
  miniPreviewWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  miniRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  breadcrumbMini: {
    color: "#64748b",
    fontSize: 13,
    marginBottom: 14,
  },
  formHero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
    marginBottom: 8,
  },
  smartPricing: {
    maxWidth: 360,
    background: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
    borderRadius: 14,
    padding: "14px 16px",
    fontSize: 13,
    fontWeight: 700,
  },
  policySection: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  policyHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  policyIcon: {
    width: 16,
    height: 16,
    borderRadius: 999,
  },
  toggleCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: "18px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  togglePill: {
    width: 40,
    height: 22,
    borderRadius: 999,
    background: "#e5e7eb",
  },
  tableHeadingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  tableWrap: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    overflow: "hidden",
  },
  scheduleHeaderRow: {
    display: "grid",
    gridTemplateColumns: "0.8fr 2fr 1.2fr 1.4fr 0.8fr 0.8fr",
    gap: 16,
    padding: "14px 16px",
    background: "#f8fafc",
    fontSize: 13,
    fontWeight: 800,
    color: "#475569",
  },
  scheduleDataRow: {
    display: "grid",
    gridTemplateColumns: "0.8fr 2fr 1.2fr 1.4fr 0.8fr 0.8fr",
    gap: 16,
    padding: "18px 16px",
    borderTop: "1px solid #e5e7eb",
    alignItems: "start",
  },
  flightRef: {
    fontWeight: 800,
    color: "#1e3a8a",
  },
  smallMuted: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 4,
  },
  boldText: {
    fontWeight: 800,
  },
  tableActionStack: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-start",
  },
  tableTextButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#0f172a",
    fontWeight: 700,
    padding: 0,
  },
  tableDeleteButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#dc2626",
    fontWeight: 700,
    padding: 0,
  },
  filterBar: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
  },
  filterButtonWide: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    borderRadius: 14,
    padding: "14px 16px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: 14,
  },
  filterSelectWide: {
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: "14px 16px",
    fontSize: 14,
    background: "#ffffff",
  },
  instanceHeaderRow: {
    display: "grid",
    gridTemplateColumns: "0.9fr 1.3fr 1.2fr 1.2fr 0.9fr 0.9fr 1fr",
    gap: 16,
    padding: "14px 16px",
    background: "#f8fafc",
    fontSize: 13,
    fontWeight: 800,
    color: "#475569",
  },
  instanceDataRow: {
    display: "grid",
    gridTemplateColumns: "0.9fr 1.3fr 1.2fr 1.2fr 0.9fr 0.9fr 1fr",
    gap: 16,
    padding: "16px 16px",
    borderTop: "1px solid #e5e7eb",
    alignItems: "center",
  },
  capacityText: {
    color: "#16a34a",
    fontWeight: 800,
  },
  instanceHero: {
    background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
    borderRadius: 22,
    border: "1px solid #e5e7eb",
    padding: 24,
    display: "grid",
    gridTemplateColumns: "1fr 0.6fr 1fr",
    gap: 20,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
  },
  routeColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  routeLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  airportCodeBig: {
    fontSize: 34,
    fontWeight: 900,
    color: "#2563eb",
  },
  cityBig: {
    fontSize: 18,
    fontWeight: 800,
  },
  timeBadge: {
    marginTop: 10,
    display: "inline-flex",
    alignItems: "center",
    background: "#e0e7ff",
    color: "#1e3a8a",
    padding: "12px 14px",
    borderRadius: 14,
    fontWeight: 700,
  },
  timeBadgeAlt: {
    marginTop: 10,
    display: "inline-flex",
    alignItems: "center",
    background: "#f3e8ff",
    color: "#7c3aed",
    padding: "12px 14px",
    borderRadius: 14,
    fontWeight: 700,
  },
  routeMiddle: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  flightCircle: {
    width: 64,
    height: 64,
    borderRadius: 999,
    background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    boxShadow: "0 16px 30px rgba(124, 58, 237, 0.2)",
  },
  durationText: {
    fontSize: 18,
    fontWeight: 800,
  },
  tabsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },
  tabActive: {
    background: "#ffffff",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    padding: "12px 16px",
    textAlign: "center",
    fontWeight: 800,
  },
  tabItem: {
    background: "#eff6ff",
    borderRadius: 14,
    padding: "12px 16px",
    textAlign: "center",
    fontWeight: 700,
    color: "#334155",
  },
  twoColumnLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },
  insightMetricCard: {
    background: "#ffffff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    padding: 20,
  },
  summaryMetricCard: {
    background: "#ffffff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    padding: 20,
  },
  summaryMetricValue: {
    fontSize: 20,
    fontWeight: 900,
  },
  statBarCard: {
    padding: "12px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  progressRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 700,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    background: "#e5e7eb",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #7c3aed 0%, #60a5fa 100%)",
    borderRadius: 999,
  },
  amenityRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
    marginTop: 18,
  },
  amenityCard: {
    borderRadius: 16,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    padding: "18px 20px",
    fontWeight: 800,
    color: "#15803d",
  },
  bookingToolbar: {
    display: "grid",
    gridTemplateColumns: "2fr 0.8fr 0.8fr 0.8fr auto",
    gap: 12,
    marginTop: 18,
    marginBottom: 18,
  },
  searchInputWide: {
    width: "100%",
    borderRadius: 14,
    border: "1px solid #d1d5db",
    padding: "14px 16px",
    fontSize: 14,
    boxSizing: "border-box",
  },
  filterSelectBookings: {
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: "14px 16px",
    fontSize: 14,
    background: "#ffffff",
  },
  bookingTable: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    overflow: "hidden",
  },
  bookingTableHeader: {
    display: "grid",
    gridTemplateColumns: "0.9fr 1fr 2fr 1fr 0.9fr 0.7fr 0.8fr 0.8fr 0.8fr 0.7fr",
    gap: 14,
    padding: "14px 16px",
    background: "#f8fafc",
    fontSize: 13,
    fontWeight: 800,
    color: "#475569",
  },
  bookingTableRow: {
    display: "grid",
    gridTemplateColumns: "0.9fr 1fr 2fr 1fr 0.9fr 0.7fr 0.8fr 0.8fr 0.8fr 0.7fr",
    gap: 14,
    padding: "16px",
    borderTop: "1px solid #e5e7eb",
    alignItems: "center",
  },
  bookingRef: {
    color: "#2563eb",
    fontWeight: 800,
  },
  routeCell: {
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.45,
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.42)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 40,
    padding: 20,
  },
  modalCard: {
    width: "min(900px, 100%)",
    maxHeight: "88vh",
    background: "#ffffff",
    borderRadius: 22,
    border: "1px solid #e5e7eb",
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.22)",
    overflow: "hidden",
  },
  modalTopRow: {
    padding: "22px 24px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 900,
  },
  modalSubtext: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 14,
  },
  modalClose: {
    border: "none",
    background: "transparent",
    fontSize: 20,
    cursor: "pointer",
    color: "#475569",
  },
  modalScroll: {
    overflowY: "auto",
    maxHeight: "calc(88vh - 88px)",
    padding: 24,
  },
  ancillaryCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "flex-start",
  },
  ancillaryName: {
    fontSize: 16,
    fontWeight: 900,
    marginBottom: 10,
  },
  availabilityText: {
    color: "#16a34a",
    fontWeight: 800,
    marginTop: 4,
  },
  linkText: {
    marginTop: 10,
    color: "#2563eb",
    fontWeight: 700,
    fontSize: 13,
  },
  ancillaryAmount: {
    fontSize: 18,
    fontWeight: 900,
    color: "#2563eb",
    whiteSpace: "nowrap",
  },
  modalInfoGrid: {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 18,
  },
  modalPanel: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 20,
    background: "#ffffff",
  },
  modalPanelTitle: {
    fontSize: 16,
    fontWeight: 900,
    marginBottom: 16,
  },
  modalInfoRows: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  modalInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 900,
    color: "#9333ea",
  },
  modalDivider: {
    borderTop: "1px solid #e5e7eb",
  },
  ticketCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 14,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  simpleTable: {
    marginTop: 18,
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    overflow: "hidden",
  },
  simpleRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 2fr",
    gap: 16,
    padding: "16px 18px",
    borderTop: "1px solid #e5e7eb",
  },
};

export default AdminDash;
