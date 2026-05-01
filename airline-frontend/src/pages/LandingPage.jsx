import React, { useState } from "react";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";

const LandingPage = () => {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Hero darkMode={darkMode} />
    </>
  );
};

export default LandingPage;
