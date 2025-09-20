const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.warn("MONGO_URI no está definida. Saltando conexión a BD."); return; }
  try { await mongoose.connect(uri); console.log("MongoDB conectado"); }
  catch (err) { console.error("Error conectando a MongoDB:", err.message); throw err; }
}
module.exports = connectDB;
