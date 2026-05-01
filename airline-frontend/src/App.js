import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";

// dashboards (your file names)
import AdminDash from "./pages/dashboard/admindash";
import AirlineDash from "./pages/dashboard/airlineDash";
import CustDash from "./pages/dashboard/CustDash";

// results page
import FlightResults from "./pages/dashboard/FlightResults";
import FareSelection from "./pages/dashboard/FareSelection";
import SeatSelection from "./pages/dashboard/SeatSelection";
import BookingReview from "./pages/dashboard/BookingReview";
import PaymentPage from "./pages/dashboard/PaymentPage";
import BookingConfirmed from "./pages/dashboard/BookingConfirmed";
import MyBookings from "./pages/dashboard/MyBookings";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LANDING */}
        <Route path="/" element={<LandingPage />} />

        {/* LOGIN */}
        <Route path="/login/customer" element={<LoginPage role="CUSTOMER" />} />
        <Route path="/login/airline" element={<LoginPage role="AIRLINE" />} />
        <Route path="/login/admin" element={<LoginPage role="ADMIN" />} />

        {/* DASHBOARDS */}
        <Route path="/dashboard/customer" element={<CustDash />} />
        <Route path="/dashboard/airline" element={<AirlineDash />} />
        <Route path="/dashboard/admin" element={<AdminDash />} />

        {/* ✅ NEW FLIGHT RESULTS PAGE */}
        <Route path="/flights" element={<FlightResults />} />
        <Route path="/fare" element={<FareSelection />} />
        <Route path="/seats" element={<SeatSelection />} />
        <Route path="/booking-review" element={<BookingReview />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/booking-confirmed" element={<BookingConfirmed />} />
        <Route path="/my-bookings" element={<MyBookings />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
