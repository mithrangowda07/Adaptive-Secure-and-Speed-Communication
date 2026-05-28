const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { upload, uploadFile } = require("../controllers/messageController");

const router = express.Router();
router.post("/upload", authMiddleware, upload.single("file"), uploadFile);

module.exports = router;
