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

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(postRoutes);
app.use(userRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const connectDB = mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("MongoDB connected");
});

// Local dev
if (process.env.NODE_ENV !== "production") {
  app.listen(9090, () => {
    console.log("server is listening on 9090");
  });
}

export default app;