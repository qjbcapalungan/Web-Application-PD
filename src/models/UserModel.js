const UserModel = {
    username: "admin",
    password: "password123",
    validateCredentials(inputUsername, inputPassword) {
      return inputUsername === this.username && inputPassword === this.password;
    },
  };
  
  export default UserModel;
  