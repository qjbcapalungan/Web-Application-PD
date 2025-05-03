import React, { useState } from "react";
import "./css/Login.css";
import AuthController from "../controllers/AuthController";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State for toggling password visibility
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const isAuthenticated = await AuthController.login(username, password);
      if (isAuthenticated) {
        navigate("/main");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const handleInputChange = (e, setValue) => {
    setValue(e.target.value);
    if (error) {
      setError("");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="welcome-section">
          <h2>
            Welcome
            <br />
            Back!
          </h2>
        </div>

        <div className="login-form-section">
          <h2>LOGIN</h2>
          {error && <p style={{ color: "red" }}>{error}</p>}

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
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"} // Toggle between text and password
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => handleInputChange(e, setPassword)}
                onKeyDown={handleKeyPress}
              />
              <span
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)} // Toggle showPassword state
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>
          </div>

          <div className="forgot-password-container">
            <a href="/forgot-password" className="forgot-password">
              Forgot Password?
            </a>
          </div>

          <button className="login-btn" onClick={handleLogin}>
            Login
          </button>

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
