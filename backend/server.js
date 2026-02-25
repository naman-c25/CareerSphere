import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import postRoutes from "./routes/post.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());
app.use(postRoutes);
app.use(userRoutes);
app.use(express.static("uploads"));


const start = async () => {
    const connectDB = await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    app.listen(9090, () => {
        console.log(`server is listening on 9090`);
    })
}

start();