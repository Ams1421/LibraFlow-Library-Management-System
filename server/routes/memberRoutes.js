
const express = require("express");
const router = express.Router();

const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
} = require("../controllers/memberController");

// Get all members with optional search and pagination
router.get("/", getMembers);

// Get one member by ID
router.get("/:id", getMemberById);

// Register a new member
router.post("/", createMember);

// Update member details
router.put("/:id", updateMember);

// Delete a member
router.delete("/:id", deleteMember);

module.exports = router;
