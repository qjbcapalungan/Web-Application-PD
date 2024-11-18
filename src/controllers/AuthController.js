import UserModel from "../models/UserModel";

const AuthController = {
  login(username, password) {
    return UserModel.validateCredentials(username, password);
  },
};

export default AuthController;
