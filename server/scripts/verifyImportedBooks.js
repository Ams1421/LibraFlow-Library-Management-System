
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const mongoose = require("mongoose");
const Book = require("../models/Book");

async function verifyBooks() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from server/.env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const totalBooks = await Book.countDocuments();

    const zeroInventoryBooks = await Book.countDocuments({
      quantity: 0,
      availableQuantity: 0,
    });

    const missingIsbnBooks = await Book.countDocuments({
      $or: [
        { isbn: { $exists: false } },
        { isbn: "" },
      ],
    });

    console.log("\n========== DATABASE VERIFICATION ==========");
    console.log({
      totalBooks,
      zeroInventoryBooks,
      missingIsbnBooks,
    });

    const samples = await Book.find()
      .select(
        "title author category isbn quantity availableQuantity"
      )
      .limit(3)
      .lean();

    console.log("\nSample records:");
    console.log(JSON.stringify(samples, null, 2));

    if (totalBooks >= 500 && zeroInventoryBooks >= 500) {
      console.log(
        "\nPASS: At least 500 books exist and have zero inventory."
      );
    } else {
      console.log(
        "\nCHECK: The counts differ from the expected import results."
      );
    }
  } catch (error) {
    console.error("\nVerification failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

verifyBooks();
