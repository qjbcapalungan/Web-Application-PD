const AuthController = {
  async login(username, password) {
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        return true; // Login successful
      } else {
        const errorData = await response.json();
        console.error("Login failed:", errorData.message);
        return false; // Login failed
      }
    } catch (error) {
      console.error("Error during login:", error);
      return false; // Handle server errors gracefully
    }
  },
};

export default AuthController;
