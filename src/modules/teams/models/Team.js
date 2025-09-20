const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema({
  name:      { type: String, required: true, unique: true, minlength: 3, maxlength: 30, trim: true },
  avatarUrl: { type: String, required: true },
  owners:    [{ type: String }],
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.models.Team || mongoose.model("Team", TeamSchema);
