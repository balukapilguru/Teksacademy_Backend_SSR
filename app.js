// Setup Express Server Here
import express from "express";
import indexRouter from "./routes/index.js";
import cors from "cors";
const app = express();

//middleware
app.use(express.json());
app.use(cors());


app.use("/api/v1", indexRouter);

app.get("/", (req, res) => {
  res.send("Welcome to TeksAcademy");
});

export default app;
