require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/database");
const PORT = process.env.PORT || 3000;

(async () => {
  await connectDB();
  app.listen(PORT, ()=>console.log(`Server up: http://localhost:${PORT}`));
})();
