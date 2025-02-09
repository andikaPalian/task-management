import express from "express";
import auth from "../middlewares/authMiddleware.js";
import { createPersonalTask, deletePersonalTask, listPersonalTasks, updatePersonalTask, updatePersonalTaskStatus } from "../controllers/personalTask.controllers.js";

const taskRouter = express.Router();

// Personal Task Routes
taskRouter.post("/task", auth, createPersonalTask);
taskRouter.put("/task/:taskId/status", auth, updatePersonalTaskStatus);
taskRouter.patch("/task/:taskId", auth, updatePersonalTask);
taskRouter.delete("/task/:taskId", auth, deletePersonalTask);
taskRouter.get("/", auth, listPersonalTasks);

export default taskRouter;