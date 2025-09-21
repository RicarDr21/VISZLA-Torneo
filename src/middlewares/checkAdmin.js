/**
 * src/middlewares/checkAdmin.js
 * Producción: requiere req.user?.role === "admin"
 * Dev/Test: además acepta X-Demo-Admin:true, cookie x_demo_admin=true o ?demoAdmin=true
 */
function parseCookies(req){
  const raw = req.headers?.cookie || "";
  return raw.split(";").map(s=>s.trim()).filter(Boolean).reduce((acc,kv)=>{
    const i = kv.indexOf("="); if(i>0){ acc[kv.slice(0,i)] = decodeURIComponent(kv.slice(i+1)); }
    return acc;
  }, {});
}

module.exports = function checkAdmin(req, res, next) {
  const isProd = process.env.NODE_ENV === "production";
  const byRole   = !!(req.user && req.user.role === "admin");

  let allowDev = false;
  if (!isProd) {
    const cookies = parseCookies(req);
    const byHeader = req.get("X-Demo-Admin") === "true";
    const byCookie = cookies["x_demo_admin"] === "true";
    const byQuery  = (req.query && (req.query.demoAdmin === "true" || req.query.admin === "demo"));
    if (byQuery && !byCookie) { res.setHeader("Set-Cookie", "x_demo_admin=true; Path=/"); }
    allowDev = byHeader || byCookie || byQuery;
  }

  const isAdmin = byRole || allowDev;
  if (!isAdmin) return res.status(403).json({ ok:false, message:"Acceso restringido a administradores." });
  next();
};
