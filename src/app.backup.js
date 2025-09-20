const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req,res)=>res.json({status:"ok"}));

const tournamentRoutes = require("./modules/tournaments/routes/tournamentRoutes");
app.use("/api/tournaments", tournamentRoutes);

module.exports = app;
