
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const Book = require("../models/Book");

const TARGET_BOOKS = 500;
const PAGE_SIZE = 100;
const MAX_RETRIES = 3;
const REQUEST_DELAY_MS = 2000;

const DRY_RUN = process.argv.includes("--dry-run");

// Mixed general catalog. Additional categories help reach the target
// when some categories have duplicate ISBNs or incomplete metadata.
const SEARCHES = [
  { query: "subject:fiction", category: "Fiction" },
  { query: "subject:science", category: "Science" },
  { query: "subject:history", category: "History" },
  { query: "subject:computers", category: "Computers" },
  { query: "subject:philosophy", category: "Philosophy" },
  { query: "subject:biography", category: "Biography" },
  { query: "subject:poetry", category: "Poetry" },
  { query: "subject:art", category: "Art" },
  { query: "subject:mystery", category: "Mystery" },
  { query: "subject:travel", category: "Travel" },
];

const FIELDS = [
  "title",
  "author_name",
  "isbn",
  "subject",
  "key",
];

const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function normalizeIsbn(values = []) {
  for (const value of values) {
    const isbn = String(value)
      .replace(/[-\s]/g, "")
      .toUpperCase();

    if (/^(?:\d{10}|\d{9}X|\d{13})$/.test(isbn)) {
      return isbn;
    }
  }

  return null;
}

function normalizeBook(record, fallbackCategory) {
  const title =
    typeof record.title === "string"
      ? record.title.trim()
      : "";

  const author = Array.isArray(record.author_name)
    ? record.author_name.find(
        (name) =>
          typeof name === "string" && name.trim()
      )
    : null;

  const isbn = normalizeIsbn(record.isbn);

  // The current Mongoose model requires title, author,
  // category and ISBN. Skip records that cannot meet it.
  if (!title || !author || !isbn) {
    return null;
  }

  const subject = Array.isArray(record.subject)
    ? record.subject.find(
        (value) =>
          typeof value === "string" && value.trim()
      )
    : null;

  return {
    title,
    author: author.trim(),
    category: String(subject || fallbackCategory)
      .trim()
      .slice(0, 100),
    isbn,

    // These values represent library-owned inventory.
    // Open Library metadata does not tell us physical stock.
    quantity: 0,
    availableQuantity: 0,
  };
}

async function requestPage(url, category) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "LibraryManagementSystem/1.0 (academic catalog importer)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const retryable =
          response.status === 429 ||
          response.status >= 500;

        const message =
          `HTTP ${response.status} for ${category}`;

        if (!retryable || attempt === MAX_RETRIES) {
          throw new Error(message);
        }

        console.warn(
          `  ${message}. Retry ${attempt}/${MAX_RETRIES}...`
        );
      } else {
        return await response.json();
      }
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        throw error;
      }

      console.warn(
        `  Request failed for ${category}: ${error.message}. ` +
        `Retry ${attempt}/${MAX_RETRIES}...`
      );
    }

    // Exponential backoff: 2, 4, then 8 seconds.
    await delay(REQUEST_DELAY_MS * 2 ** (attempt - 1));
  }

  throw new Error(`Unable to retrieve ${category}`);
}


async function fetchBooks() {
  const collected = new Map();

  const stats = {
    categoriesAttempted: 0,
    failedPages: 0,
    invalidRecords: 0,
    duplicateIsbns: 0,
  };

  const quotaPerCategory = Math.floor(
    TARGET_BOOKS / SEARCHES.length
  );

  for (const search of SEARCHES) {
    if (collected.size >= TARGET_BOOKS) break;

    stats.categoriesAttempted++;

    let offset = 0;
    let validInCategory = 0;

    console.log(
      `\nSearching category: ${search.category} ` +
      `(target: ${quotaPerCategory} books)`
    );

    while (
      validInCategory < quotaPerCategory &&
      collected.size < TARGET_BOOKS
    ) {
      const params = new URLSearchParams({
        q: search.query,
        fields: FIELDS.join(","),
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });

      const url =
        `https://openlibrary.org/search.json?${params}`;

      let data;

      try {
        data = await requestPage(url, search.category);
      } catch (error) {
        stats.failedPages++;

        console.warn(
          `  Skipping remaining pages for ${search.category}: ` +
          error.message
        );

        break;
      }

      const records = Array.isArray(data.docs)
        ? data.docs
        : [];

      if (records.length === 0) {
        console.log("  No more results in this category.");
        break;
      }

      let validInPage = 0;

      for (const record of records) {
        const book = normalizeBook(record, search.category);

        if (!book) {
          stats.invalidRecords++;
          continue;
        }

        if (collected.has(book.isbn)) {
          stats.duplicateIsbns++;
          continue;
        }

        collected.set(book.isbn, book);
        validInPage++;
        validInCategory++;

        if (
          validInCategory >= quotaPerCategory ||
          collected.size >= TARGET_BOOKS
        ) {
          break;
        }
      }

      console.log(
        `  Offset ${offset}: ${records.length} received, ` +
        `${validInPage} added; category total ` +
        `${validInCategory}/${quotaPerCategory}; ` +
        `overall ${collected.size}/${TARGET_BOOKS}`
      );

      offset += records.length;

      if (records.length < PAGE_SIZE) {
        break;
      }

      if (
        validInCategory < quotaPerCategory &&
        collected.size < TARGET_BOOKS
      ) {
        await delay(REQUEST_DELAY_MS);
      }
    }

    console.log(
      `  Final valid additions for ${search.category}: ` +
      `${validInCategory}`
    );

    await delay(REQUEST_DELAY_MS);
  }

  return {
    books: [...collected.values()],
    stats,
  };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is missing from server/.env"
    );
  }

  try {
    const { books, stats } = await fetchBooks();

    console.log("\n========== COLLECTION SUMMARY ==========");
    console.log(`Valid unique books: ${books.length}`);
    console.log(`Target: ${TARGET_BOOKS}`);
    console.log(`Categories attempted: ${stats.categoriesAttempted}`);
    console.log(`Failed pages: ${stats.failedPages}`);
    console.log(`Invalid records skipped: ${stats.invalidRecords}`);
    console.log(`Duplicate ISBNs skipped: ${stats.duplicateIsbns}`);

    if (books.length === 0) {
      throw new Error(
        "No valid books were collected. Nothing will be imported."
      );
    }

    if (books.length < TARGET_BOOKS) {
      console.warn(
        `Only ${books.length} valid unique books were collected. ` +
        "The target was not reached; review the results before importing."
      );
    }

    if (DRY_RUN) {
      console.log("\nDRY RUN: MongoDB was not modified.");
      console.log("\nSample records:");

      console.log(
        JSON.stringify(books.slice(0, 5), null, 2)
      );

      return;
    }

    console.log("\nConnecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGODB_URI);

    let inserted = 0;
    let existing = 0;
    let failed = 0;

    for (const book of books) {
      try {
        // Insert only when the ISBN does not already exist.
        // $setOnInsert preserves existing metadata and inventory.
        const result = await Book.updateOne(
          { isbn: book.isbn },
          { $setOnInsert: book },
          {
            upsert: true,
            runValidators: true,
          }
        );

        if (result.upsertedCount > 0) {
          inserted++;
        } else {
          existing++;
        }
      } catch (error) {
        failed++;

        console.error(
          `Failed to import ISBN ${book.isbn}: ${error.message}`
        );
      }

      const processed = inserted + existing + failed;

      if (processed % 50 === 0 || processed === books.length) {
        console.log(
          `Progress: ${processed}/${books.length} processed`
        );
      }
    }

    console.log("\n========== IMPORT SUMMARY ==========");
    console.log(`Valid unique books collected: ${books.length}`);
    console.log(`New books inserted: ${inserted}`);
    console.log(`Existing ISBNs preserved: ${existing}`);
    console.log(`Failed imports: ${failed}`);
    console.log(
      "Inventory values for newly imported books: " +
      "quantity = 0, availableQuantity = 0"
    );

    const totalBooks = await Book.countDocuments();

    console.log(
      `Total books in the database collection: ${totalBooks}`
    );
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("MongoDB connection closed.");
    }
  }
}

main().catch((error) => {
  console.error("\nOperation failed:", error.message);
  process.exitCode = 1;
});
