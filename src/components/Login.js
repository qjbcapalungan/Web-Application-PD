import React, { useState } from "react";
import "./css/Login.css";
import AuthController from "../controllers/AuthController";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (AuthController.login(username, password)) {
      navigate("/main");
    } else {
      setError("Invalid username or password");
    }
  };

  // Handle Enter key press for form submission
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  // Reset error when user starts typing
  const handleInputChange = (e, setValue) => {
    setValue(e.target.value);
    if (error) {
      setError(""); // Reset error when user types
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Left Section: Welcome Message */}
        <div className="welcome-section">
          <h2>Welcome<br />Back!</h2>
        </div>

        {/* Right Section: Login Form */}
        <div className="login-form-section">
          <h2>LOGIN</h2>
          {error && <p style={{ color: "red" }}>{error}</p>}
          
          {/* Input fields for username and password */}
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => handleInputChange(e, setUsername)}
              onKeyDown={handleKeyPress}
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => handleInputChange(e, setPassword)}
              onKeyDown={handleKeyPress}
            />
          </div>
          
          {/* Forgot password link */}
          <div className="forgot-password-container">
            <a href="/forgot-password" className="forgot-password">
              Forgot Password?
            </a>
          </div>

          {/* Login Button */}
          <button className="login-btn" onClick={handleLogin}>
            Login
          </button>

          {/* Don't have an account? Contact Us */}
          <div className="contact-us-container">
            <p className="contact-us">
              Don't have an account? <a href="/contact-us">Contact Us</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
