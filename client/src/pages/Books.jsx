import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  RefreshCw,
} from "lucide-react";
import "../App.css";
import "./Books.css";

const API_URL = "http://localhost:5000/api/books";
const PAGE_SIZE = 10;

const emptyForm = {
  title: "",
  author: "",
  category: "",
  isbn: "",
  quantity: "0",
};

export default function Books() {
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (search) params.set("search", search);

      const response = await fetch(`${API_URL}?${params}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load books.");
      }

      setBooks(Array.isArray(result.data) ? result.data : []);
      setTotal(result.total ?? 0);
      setTotalPages(result.totalPages ?? 0);
    } catch (err) {
      setError(err.message || "Unable to connect to the Books API.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    // Loading remote API data is an intentional side effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBooks();
  }, [loadBooks]);

  const openAddModal = () => {
    setEditingBook(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setForm({
      title: book.title || "",
      author: book.author || "",
      category: book.category || "",
      isbn: book.isbn || "",
      quantity: String(book.quantity ?? 0),
    });
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (!saving) setModalOpen(false);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveBook = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const quantity = Number(form.quantity);

      if (!Number.isInteger(quantity) || quantity < 0) {
        throw new Error("Quantity must be a non-negative whole number.");
      }

      const payload = {
        title: form.title.trim(),
        author: form.author.trim(),
        category: form.category.trim(),
        isbn: form.isbn.trim(),
        quantity,
      };

      let response;

      if (editingBook) {
        // Preserve inventory already on loan when changing total quantity.
        const currentlyIssued =
          editingBook.quantity - editingBook.availableQuantity;

        if (quantity < currentlyIssued) {
          throw new Error(
            `Total quantity cannot be less than ${currentlyIssued}, the number currently on loan.`,
          );
        }

        const availableQuantity = quantity - currentlyIssued;

        response = await fetch(`${API_URL}/${editingBook._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, availableQuantity }),
        });
      } else {
        response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            availableQuantity: quantity,
          }),
        });
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save the book.");
      }

      setModalOpen(false);
      setNotice(
        editingBook ? "Book updated successfully." : "Book added successfully.",
      );

      if (!editingBook) {
        setPage(1);
        setSearch("");
        setSearchInput("");
      } else {
        await loadBooks();
      }
    } catch (err) {
      setError(err.message || "Unable to save the book.");
    } finally {
      setSaving(false);
    }
  };

  const deleteBook = async (book) => {
    const confirmed = window.confirm(
      `Delete "${book.title}"?\n\nThis action cannot be undone. Books with active loans cannot be deleted.`,
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/${book._id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to delete the book.");
      }

      setNotice("Book deleted successfully.");

      if (books.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadBooks();
      }
    } catch (err) {
      setError(err.message || "Unable to delete the book.");
    }
  };

  const firstRecord = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastRecord = Math.min(page * PAGE_SIZE, total);

  return (
    <section className="books-page">
      <div className="books-page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            COLLECTION MANAGEMENT
          </div>
          <h1>Books</h1>
          <p className="books-subtitle">
            Search, organize and maintain your library collection.
          </p>
        </div>

        <button className="button button-primary" onClick={openAddModal}>
          <Plus size={17} />
          Add book
        </button>
      </div>

      <div className="books-summary-grid">
        <article className="books-summary-card">
          <span className="books-summary-icon books-summary-blue">
            <BookOpen size={20} />
          </span>
          <div>
            <span>Total book records</span>
            <strong>{total.toLocaleString("en-IN")}</strong>
          </div>
        </article>

        <article className="books-summary-card">
          <span className="books-summary-icon books-summary-green">
            <RefreshCw size={20} />
          </span>
          <div>
            <span>Records on this page</span>
            <strong>{books.length}</strong>
          </div>
        </article>
      </div>

      {error && (
        <div className="books-alert books-alert-error" role="alert">
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className="books-alert books-alert-success" role="status">
          <span>{notice}</span>
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="books-table-panel">
        <div className="books-toolbar">
          <div>
            <h2>Book collection</h2>
            <p>Browse and manage individual book records.</p>
          </div>

          <form className="books-search" onSubmit={handleSearch}>
            <Search size={17} />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search title, author, ISBN..."
              aria-label="Search books"
            />
            {searchInput && (
              <button
                type="button"
                className="books-clear-search"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
            <button className="books-search-submit" type="submit">
              Search
            </button>
          </form>
        </div>

        <div className="books-table-scroll">
          <table className="books-table">
            <thead>
              <tr>
                <th>BOOK DETAILS</th>
                <th>ISBN</th>
                <th>CATEGORY</th>
                <th>TOTAL</th>
                <th>AVAILABLE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book._id}>
                  <td>
                    <div className="books-title-cell">
                      <div className="books-cover">
                        <BookOpen size={19} />
                      </div>
                      <div className="books-title-copy">
                        <strong title={book.title}>{book.title}</strong>
                        <span>{book.author}</span>
                      </div>
                    </div>
                  </td>
                  <td className="books-isbn">{book.isbn || "—"}</td>
                  <td>
                    <span className="books-category">
                      {book.category || "Uncategorized"}
                    </span>
                  </td>
                  <td>{book.quantity ?? 0}</td>
                  <td>
                    <span
                      className={`books-availability ${
                        book.availableQuantity > 0
                          ? "is-available"
                          : "is-unavailable"
                      }`}
                    >
                      {book.availableQuantity ?? 0}
                    </span>
                  </td>
                  <td>
                    <div className="books-row-actions">
                      <button
                        className="books-action-button"
                        title="Edit book"
                        aria-label={`Edit ${book.title}`}
                        onClick={() => openEditModal(book)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="books-action-button books-delete-button"
                        title="Delete book"
                        aria-label={`Delete ${book.title}`}
                        onClick={() => deleteBook(book)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && books.length === 0 && (
                <tr>
                  <td colSpan="6" className="books-empty">
                    <BookOpen size={28} />
                    <strong>No books found</strong>
                    <span>
                      {search
                        ? "Try another search term."
                        : "Add a book to get started."}
                    </span>
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="6" className="books-empty">
                    Loading books...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="books-pagination">
          <span>
            Showing{" "}
            <strong>
              {firstRecord}–{lastRecord}
            </strong>{" "}
            of <strong>{total}</strong> books
          </span>
          <div className="books-pagination-actions">
            <button
              className="books-page-button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
            </button>
            <span>
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <button
              className="books-page-button"
              disabled={page >= totalPages || loading || totalPages === 0}
              onClick={() => setPage((current) => current + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="books-modal-backdrop" onMouseDown={closeModal}>
          <section
            className="books-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="books-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="books-modal-heading">
              <div>
                <h2 id="books-modal-title">
                  {editingBook ? "Edit book" : "Add a new book"}
                </h2>
                <p>
                  {editingBook
                    ? "Update the selected book record."
                    : "Enter the details for your new book."}
                </p>
              </div>
              <button
                className="books-action-button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close dialog"
              >
                <X size={19} />
              </button>
            </div>

            <form className="books-form" onSubmit={saveBook}>
              <label>
                Book title *
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  required
                  maxLength={200}
                  placeholder="Enter book title"
                />
              </label>

              <label>
                Author *
                <input
                  name="author"
                  value={form.author}
                  onChange={handleFormChange}
                  required
                  maxLength={150}
                  placeholder="Enter author name"
                />
              </label>

              <div className="books-form-row">
                <label>
                  Category *
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    required
                    maxLength={100}
                    placeholder="e.g. Science"
                  />
                </label>

                <label>
                  ISBN *
                  <input
                    name="isbn"
                    value={form.isbn}
                    onChange={handleFormChange}
                    required
                    maxLength={20}
                    placeholder="Enter ISBN"
                  />
                </label>
              </div>

              <label>
                Total copies *
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={form.quantity}
                  onChange={handleFormChange}
                  required
                />
                <span className="books-field-help">
                  {editingBook
                    ? "Copies currently on loan are preserved automatically."
                    : "New books start with all copies available."}
                </span>
              </label>

              {error && (
                <div className="books-alert books-alert-error" role="alert">
                  {error}
                </div>
              )}

              <div className="books-form-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingBook
                      ? "Save changes"
                      : "Add book"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
