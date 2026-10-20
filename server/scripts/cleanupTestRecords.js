require("dotenv").config();

const mongoose = require("mongoose");
const Book = require("../models/Book");
const Member = require("../models/Member");
const Transaction = require("../models/Transaction");

const transactionId = "6ad642977668db4eaf882ca1";
const bookId = "6ad642577668db4eaf882ca0";
const memberId = "6ad642097668db4eaf882c9f";

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      console.log("Test transaction already removed.");
    } else {
      if (transaction.status !== "Returned") {
        throw new Error("Safety check failed: transaction is not Returned.");
      }

      await Transaction.deleteOne({ _id: transactionId });
      console.log("Test transaction removed.");
    }

    const activeTransaction = await Transaction.exists({
      $or: [{ book: bookId }, { member: memberId }],
      status: "Issued",
    });

    if (activeTransaction) {
      throw new Error("Safety check failed: an active loan references a test record.");
    }

    await Book.deleteOne({
      _id: bookId,
      title: "Issue Return Test Book",
      isbn: "9780000000019",
    });
    console.log("Test book cleanup checked.");

    await Member.deleteOne({
      _id: memberId,
      email: "issue.return.test@example.com",
    });
    console.log("Test member cleanup checked.");

    console.log("Cleanup completed. Imported books were not targeted.");
  } catch (error) {
    console.error("Cleanup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

cleanup();

