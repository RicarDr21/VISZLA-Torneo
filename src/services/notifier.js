const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "public", "notifications.json");

function ensureFile() {
  try {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(file)) fs.writeFileSync(file, "[]", "utf8");
  } catch (_e) {}
}

function pushNotification(notif) {
  ensureFile();
  let arr = [];
  try { arr = JSON.parse(fs.readFileSync(file, "utf8") || "[]"); } catch (_e) {}
  arr.unshift(notif);
  arr = arr.slice(0, 20); // mantenemos últimas 20
  fs.writeFileSync(file, JSON.stringify(arr, null, 2), "utf8");
}

async function notifyTournamentPublished(doc) {
  pushNotification({
    type: "tournament_published",
    tournamentId: String(doc._id),
    name: doc.name,
    startDate: doc.startDate,
    endDate: doc.endDate,
    at: new Date().toISOString()
  });
  console.log(`[NOTIFY][front] "${doc.name}" publicado → notifications.json actualizado`);
}

module.exports = { notifyTournamentPublished };
