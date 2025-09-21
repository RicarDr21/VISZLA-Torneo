const mongoose = require("mongoose");

const TournamentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  conditions: { type: String, required: true },
  rewards: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date(), index: true },
  registrationOpen: { type: Boolean, default: false },
  status: { type: String, enum: ["draft", "published", "closed"], default: "draft" }
}, { versionKey: false });

module.exports = mongoose.model("Tournament", TournamentSchema);
