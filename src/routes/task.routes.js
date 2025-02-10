import express from "express";
import auth from "../middlewares/authMiddleware.js";
import { createPersonalTask, deletePersonalTask, listPersonalTasks, updatePersonalTask, updatePersonalTaskStatus } from "../controllers/personalTask.controllers.js";

const taskRouter = express.Router();

// Personal Task Routes
taskRouter.use(auth);
taskRouter.post("/task", createPersonalTask);
taskRouter.patch("/task/:taskId/status", updatePersonalTaskStatus);
taskRouter.patch("/task/:taskId", updatePersonalTask);
taskRouter.delete("/task/:taskId", deletePersonalTask);
taskRouter.get("/", listPersonalTasks);

export default taskRouter;