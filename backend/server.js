import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import postRoutes from "./routes/post.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());

app.use(express.json());
app.use(postRoutes);
app.use(userRoutes);
app.use(express.static(path.join(__dirname, "uploads")));


const start = async () => {
    const connectDB = await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    app.listen(9090, () => {
        console.log(`server is listening on 9090`);
    })
}

start();