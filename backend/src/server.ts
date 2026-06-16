import dotenv from "dotenv";
dotenv.config();
import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
dns.setDefaultResultOrder("ipv4first");
import express from "express";
import cors from "cors";
import database from "./config/database";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import quizRoutes from "./routes/quiz.routes";
import submissionRoutes from "./routes/submission.routes";
import classroomRoutes from "./routes/classroom.routes";

const app = express();
const PORT = process.env.PORT || 3000;
dns.setDefaultResultOrder("ipv4first");
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/classrooms", classroomRoutes); // ← thêm dòng này

// Server 1st page
app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

const start = async () => {
  await database.connect();
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

start();

process.on("SIGINT", async () => {
  await database.disconnect();
  process.exit(0);
});
