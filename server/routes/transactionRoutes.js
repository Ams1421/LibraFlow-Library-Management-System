
const express = require("express");
const router = express.Router();

const {
  getTransactions,
  getTransactionById,
  issueBook,
  returnBook,
} = require("../controllers/transactionController");

// List transactions with optional status filtering
router.get("/", getTransactions);

// Issue a book
router.post("/issue", issueBook);

// Return an issued book
router.put("/:id/return", returnBook);

// Get one transaction by ID
router.get("/:id", getTransactionById);

module.exports = router;
