import express from "express";
import { loginUser, registerUser, userDashboard } from "../controllers/user.controllers.js";
import auth from "../middlewares/authMiddleware.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/dashboard", auth, userDashboard);

export default userRouter;