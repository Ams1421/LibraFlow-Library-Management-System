
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

// GET /api/transactions
// List transactions with pagination and optional status filtering.
exports.getTransactions = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.status) {
      if (!["Issued", "Returned"].includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be Issued or Returned",
        });
      }

      filter.status = req.query.status;
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("book", "title author isbn")
        .populate("member", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: transactions,
    });
  } catch (error) {
    console.error("Get transactions error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve transactions",
    });
  }
};

// GET /api/transactions/:id
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("book", "title author isbn")
      .populate("member", "name email")
      .lean();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    const invalidId = error instanceof mongoose.Error.CastError;

    res.status(invalidId ? 400 : 500).json({
      success: false,
      message: invalidId
        ? "Invalid transaction ID"
        : "Failed to retrieve transaction",
    });
  }
};


const Book = require("../models/Book");
const Member = require("../models/Member");

// POST /api/transactions/issue
exports.issueBook = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { bookId, memberId, dueDate } = req.body || {};

    if (
      typeof bookId !== "string" ||
      typeof memberId !== "string" ||
      !dueDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Book ID, member ID, and due date are required",
      });
    }

    if (
      !mongoose.isValidObjectId(bookId) ||
      !mongoose.isValidObjectId(memberId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID or member ID",
      });
    }

    const parsedDueDate = new Date(dueDate);

    if (
      Number.isNaN(parsedDueDate.getTime()) ||
      parsedDueDate <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Due date must be a valid future date",
      });
    }

    let transaction;

    await session.withTransaction(async () => {
      const member = await Member.findById(memberId).session(session);

      if (!member) {
        const error = new Error("Member not found");
        error.status = 404;
        throw error;
      }

      const book = await Book.findOneAndUpdate(
        {
          _id: bookId,
          availableQuantity: { $gt: 0 },
        },
        {
          $inc: { availableQuantity: -1 },
        },
        {
          new: true,
          session,
        }
      );

      if (!book) {
        const existingBook = await Book.findById(bookId).session(session);

        const error = new Error(
          existingBook
            ? "No copies of this book are currently available"
            : "Book not found"
        );

        error.status = existingBook ? 409 : 404;
        throw error;
      }

      [transaction] = await Transaction.create(
        [
          {
            book: bookId,
            member: memberId,
            dueDate: parsedDueDate,
            status: "Issued",
          },
        ],
        { session }
      );
    });

    res.status(201).json({
      success: true,
      message: "Book issued successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Issue book error:", error.message);

    res.status(error.status || 500).json({
      success: false,
      message: error.status
        ? error.message
        : "Failed to issue book",
    });
  } finally {
    await session.endSession();
  }
};

// PUT /api/transactions/:id/return
exports.returnBook = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    let transaction;

    await session.withTransaction(async () => {
      transaction = await Transaction.findOneAndUpdate(
        {
          _id: id,
          status: "Issued",
          returnDate: null,
        },
        {
          $set: {
            status: "Returned",
            returnDate: new Date(),
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!transaction) {
        const existing = await Transaction.findById(id).session(session);

        const error = new Error(
          !existing
            ? "Transaction not found"
            : "This transaction has already been returned"
        );

        error.status = existing ? 409 : 404;
        throw error;
      }

      const book = await Book.findByIdAndUpdate(
        transaction.book,
        {
          $inc: { availableQuantity: 1 },
        },
        {
          new: true,
          session,
        }
      );

      if (!book) {
        throw new Error(
          "Associated book was not found; return operation cancelled"
        );
      }
    });

    res.status(200).json({
      success: true,
      message: "Book returned successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Return book error:", error.message);

    res.status(error.status || 500).json({
      success: false,
      message: error.status
        ? error.message
        : "Failed to return book",
    });
  } finally {
    await session.endSession();
  }
};
