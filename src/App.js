import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import MainPage from "./components/MainPage";

const App = () => (
  <Router>
    <Routes>
      {/* Default route redirects to /login */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/main" element={<MainPage />} />
    </Routes>
  </Router>
);

export default App;
