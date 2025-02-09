import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./src/config/db.js";
import userRouter from "./src/routes/user.routes.js";
import taskRouter from "./src/routes/task.routes.js";
import teamRouter from "./src/routes/teamTask.routes.js";

const app = express();
const port = process.env.PORT;
connectDB();

app.use(express.json());
app.use(cors());

app.use("/api/users", userRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/teamsTasks", teamRouter);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});