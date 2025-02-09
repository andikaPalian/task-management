import express from "express";
import auth from "../middlewares/authMiddleware.js";
import { addMemberToTeam, createTeam, deleteTeam, editMaxMembers, leaveTeam } from "../controllers/teamTask.controllers.js";

const teamRouter = express.Router();

teamRouter.use(auth);
teamRouter.post("/team", createTeam);
teamRouter.put("/team/:teamId/member", addMemberToTeam);
teamRouter.delete("/team/:teamId/leave", leaveTeam);
teamRouter.put("/team/:teamId/maxMembers", editMaxMembers);
teamRouter.delete("/team/:teamId", deleteTeam);

export default teamRouter;