import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import MainPage from "./components/MainPage";
import LoggerDetails from "./components/LoggerDetails";  

const App = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/main" element={<MainPage />} />
      <Route path="/logger/:id" element={<LoggerDetails />} />
    </Routes>
  </Router>
);

export default App;
