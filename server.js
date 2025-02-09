import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./src/config/db.js";

const app = express();
const port = process.env.PORT;
connectDB();

app.use(express.json());
app.use(cors());

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});