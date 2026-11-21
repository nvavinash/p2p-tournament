const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getMatches, registerForMatch } = require("../controllers/matchController");

router.get("/", protect, getMatches);
router.post("/:id/register", protect, registerForMatch);

module.exports = router;
