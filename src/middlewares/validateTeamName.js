const fs = require("fs");
const path = require("path");
const blacklistPath = path.join(__dirname, "policies", "blacklist-es.txt");

function loadList() {
  try { return fs.readFileSync(blacklistPath, "utf8").split("\n").map(x=>x.trim()).filter(Boolean); }
  catch { return []; }
}
function normalize(s) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/@|4/g,"a").replace(/3/g,"e").replace(/1|!/g,"i").replace(/0/g,"o").replace(/\$/g,"s")
    .replace(/(.)\1{2,}/g,"$1$1");
}
module.exports = function validateTeamName(req,res,next){
  const { name } = req.body;
  if (!name || typeof name !== "string") return res.status(400).json({ error:"Debe enviar 'name'." });
  if (!/^[a-z0-9 áéíóúüñ-]{3,30}$/i.test(name))
    return res.status(400).json({ error:"Nombre inválido. Usa letras, números, espacios o guiones (3–30)." });
  const clean = normalize(name);
  const banned = loadList().map(normalize);
  if (banned.some(w => clean.includes(w))) return res.status(400).json({ error:"El nombre contiene lenguaje ofensivo o prohibido." });
  next();
};
