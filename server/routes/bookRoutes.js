
const express = require("express");
const router = express.Router();

const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");

// Get all books, with optional search and pagination
router.get("/", getBooks);

// Get one book by ID
router.get("/:id", getBookById);

// Add a new book
router.post("/", createBook);

// Update a book
router.put("/:id", updateBook);

// Delete a book
router.delete("/:id", deleteBook);

module.exports = router;
