const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "super-secret-key-change-me");
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token.", error: error.message });
  }
}

module.exports = authMiddleware;
