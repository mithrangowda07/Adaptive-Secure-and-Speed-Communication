const jwt = require("jsonwebtoken");
const db = require("../database/db");

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET || "super-secret-key-change-me",
    { expiresIn: "8h" }
  );
}

function loginUser(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const user = db
      .prepare("SELECT id, username, password FROM users WHERE username = ?")
      .get(username);

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = generateToken(user);
    return res.json({
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
}

module.exports = { loginUser, generateToken };
