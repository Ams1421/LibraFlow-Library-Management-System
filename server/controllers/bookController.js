
const Book = require("../models/Book");
const Transaction = require("../models/Transaction");

// GET /api/books
// Retrieve books with pagination and optional search/filtering.
exports.getBooks = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.search?.trim()) {
      const search = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(search, "i");

      filter.$or = [
        { title: regex },
        { author: regex },
        { isbn: regex },
      ];
    }

    if (req.query.category?.trim()) {
      filter.category = new RegExp(
        req.query.category.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
    }

    const [books, total] = await Promise.all([
      Book.find(filter)
        .sort({ title: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Book.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: books.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: books,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve books",
    });
  }
};

// GET /api/books/:id
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    const invalidId = error.name === "CastError";

    res.status(invalidId ? 400 : 500).json({
      success: false,
      message: invalidId ? "Invalid book ID" : "Failed to retrieve book",
    });
  }
};

// POST /api/books
exports.createBook = async (req, res) => {
  try {
    const { title, author, category, isbn, quantity } = req.body;

    if (
      !title?.trim() ||
      !author?.trim() ||
      !category?.trim() ||
      !isbn?.trim() ||
      quantity === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, author, category, ISBN, and quantity are required",
      });
    }

    const parsedQuantity = Number(quantity);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a non-negative integer",
      });
    }

    const normalizedIsbn = isbn.trim().replace(/[-\s]/g, "").toUpperCase();

    const existingBook = await Book.findOne({ isbn: normalizedIsbn });

    if (existingBook) {
      return res.status(409).json({
        success: false,
        message: "A book with this ISBN already exists",
      });
    }

    const book = await Book.create({
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      isbn: normalizedIsbn,
      quantity: parsedQuantity,
      availableQuantity: parsedQuantity,
    });

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: book,
    });
  
  } catch (error) {
    console.error("Create book error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A book with this ISBN already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create book",
      error: error.message,
    });
  }
};

// PUT /api/books/:id
exports.updateBook = async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "author",
      "category",
      "isbn",
      "quantity",
      "availableQuantity",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.isbn !== undefined) {
      updates.isbn = String(updates.isbn)
        .trim()
        .replace(/[-\s]/g, "")
        .toUpperCase();
    }

    for (const field of ["title", "author", "category"]) {
      if (updates[field] !== undefined) {
        if (
          typeof updates[field] !== "string" ||
          !updates[field].trim()
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a non-empty string`,
          });
        }

        updates[field] = updates[field].trim();
      }
    }

    for (const field of ["quantity", "availableQuantity"]) {
      if (updates[field] !== undefined) {
        const value = Number(updates[field]);

        if (!Number.isInteger(value) || value < 0) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a non-negative integer`,
          });
        }

        updates[field] = value;
      }
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: book,
    });
  } catch (error) {
    const status = error.code === 11000
      ? 409
      : error.name === "ValidationError" || error.name === "CastError"
        ? 400
        : 500;

    res.status(status).json({
      success: false,
      message: status === 409
        ? "A book with this ISBN already exists"
        : status === 400
          ? error.message
          : "Failed to update book",
    });
  }
};

// DELETE /api/books/:id
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const activeTransaction = await Transaction.exists({
      book: book._id,
      status: "Issued",
    });

    if (activeTransaction) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete a book with active loans",
      });
    }

    await Book.deleteOne({ _id: book._id });

    return res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    const invalidId = error.name === "CastError";

    return res.status(invalidId ? 400 : 500).json({
      success: false,
      message: invalidId
        ? "Invalid book ID"
        : "Failed to delete book",
    });
  }
};

