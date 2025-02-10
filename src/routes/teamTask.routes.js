import express from "express";
import auth from "../middlewares/authMiddleware.js";
import { addMemberToTeam, addTaskToTeam, createTeam, deleteTaskContent, deleteTeam, editContent, editMaxMembers, editTaskStatus, leaveTeam } from "../controllers/teamTask.controllers.js";

const teamRouter = express.Router();

teamRouter.use(auth);

// Team Routes
teamRouter.post("/team", createTeam);
teamRouter.put("/team/:teamId/member", addMemberToTeam);
teamRouter.delete("/team/:teamId/leave", leaveTeam);
teamRouter.put("/team/:teamId/maxMembers", editMaxMembers);
teamRouter.delete("/team/:teamId", deleteTeam);

// Team Task Routes
teamRouter.post("/team/:teamId/task", addTaskToTeam);
teamRouter.patch("/team/:teamId/content/:taskId", auth, editContent);
teamRouter.patch("/team/:teamId/task/:taskId/status", auth, editTaskStatus);
teamRouter.delete("/team/:teamId/task/:taskId", auth, deleteTaskContent);

export default teamRouter;