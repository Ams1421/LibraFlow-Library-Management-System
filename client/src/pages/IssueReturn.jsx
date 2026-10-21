import { useCallback, useEffect, useState } from "react";
import {
  ArrowRightLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  RotateCcw,
  UserRound,
} from "lucide-react";
import "./IssueReturn.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const PAGE_SIZE = 10;

async function fetchAllBooks() {
  const pageSize = 100;

  const firstResponse = await fetch(
    `${API_URL}/books?page=1&limit=${pageSize}`,
  );
  const firstResult = await firstResponse.json();

  if (!firstResponse.ok || !firstResult.success) {
    throw new Error(getErrorMessage(firstResult, "Unable to load books."));
  }

  const allBooks = [...(firstResult.data || [])];
  const totalPages = firstResult.totalPages || 1;

  if (totalPages > 1) {
    const remainingResponses = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        fetch(`${API_URL}/books?page=${index + 2}&limit=${pageSize}`),
      ),
    );

    const remainingResults = await Promise.all(
      remainingResponses.map(async (response) => {
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            getErrorMessage(result, "Unable to load more books."),
          );
        }

        return result.data || [];
      }),
    );

    remainingResults.forEach((books) => allBooks.push(...books));
  }

  return allBooks;
}

function getErrorMessage(data, fallback) {
  return data?.message || data?.error || fallback;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export default function IssueReturn() {
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("Issued");
  const [bookId, setBookId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [allBooks, membersResponse, transactionsResponse] =
        await Promise.all([
          fetchAllBooks(),
          fetch(`${API_URL}/members?limit=1000`),
          fetch(
            `${API_URL}/transactions?page=${page}&limit=${PAGE_SIZE}&status=${status}`,
          ),
        ]);

      const [membersResult, transactionsResult] = await Promise.all([
        membersResponse.json(),
        transactionsResponse.json(),
      ]);

      if (
        !membersResponse.ok ||
        !transactionsResponse.ok ||
        !membersResult.success ||
        !transactionsResult.success
      ) {
        throw new Error(
          getErrorMessage(
            !membersResult.success ? membersResult : transactionsResult,
            "Unable to load library data.",
          ),
        );
      }

      setBooks(allBooks);
      setMembers(Array.isArray(membersResult.data) ? membersResult.data : []);
      setTransactions(
        Array.isArray(transactionsResult.data) ? transactionsResult.data : [],
      );
      setTotal(transactionsResult.total ?? 0);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    // Loading data when the page or transaction filter changes is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  async function handleIssue(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!bookId || !memberId || !dueDate) {
      setError("Select a book, a member, and a due date.");
      return;
    }

    if (new Date(`${dueDate}T23:59:59`) < new Date()) {
      setError("The due date must be today or a future date.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/transactions/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, memberId, dueDate }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(getErrorMessage(result, "Unable to issue this book."));
      }

      setNotice("Book issued successfully.");
      setBookId("");
      setMemberId("");
      setDueDate("");
      setStatus("Issued");
      setPage(1);

      // Refresh the list immediately, even if the filter was already Issued.
      const refreshed = await fetch(
        `${API_URL}/transactions?page=1&limit=${PAGE_SIZE}&status=Issued`,
      );
      const refreshedResult = await refreshed.json();

      if (refreshed.ok && refreshedResult.success) {
        setTransactions(refreshedResult.data || []);
        setTotal(refreshedResult.total ?? 0);
      }

      await loadData();
    } catch (err) {
      setError(err.message || "Unable to issue this book.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReturn(transactionId) {
    const confirmed = window.confirm(
      "Are you sure you want to mark this book as returned?",
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/transactions/${transactionId}/return`,
        { method: "PUT" },
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(getErrorMessage(result, "Unable to return this book."));
      }

      setNotice("Book returned successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to return this book.");
    }
  }

  const availableBooks = books.filter(
    (book) => Number(book.availableQuantity) > 0,
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function getBookName(transaction) {
    return transaction.book?.title || "Book unavailable";
  }

  function getMemberName(transaction) {
    return transaction.member?.name || "Member unavailable";
  }

  return (
    <main className="issue-page">
      <header className="issue-heading">
        <div>
          <span className="issue-eyebrow">CIRCULATION MANAGEMENT</span>
          <h1>Issue / Return</h1>
          <p>Manage book loans, due dates, and returns.</p>
        </div>

        <button
          type="button"
          className="issue-button issue-button-secondary"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      {notice && (
        <div className="issue-alert issue-alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="issue-alert issue-alert-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <section className="issue-stats">
        <article className="issue-stat-card">
          <span className="issue-stat-icon issue-icon-blue">
            <BookOpen size={21} />
          </span>
          <div>
            <p>Available book titles</p>
            <strong>{availableBooks.length}</strong>
          </div>
        </article>

        <article className="issue-stat-card">
          <span className="issue-stat-icon issue-icon-purple">
            <UserRound size={21} />
          </span>
          <div>
            <p>Registered members</p>
            <strong>{members.length}</strong>
          </div>
        </article>

        <article className="issue-stat-card">
          <span className="issue-stat-icon issue-icon-orange">
            <Clock3 size={21} />
          </span>
          <div>
            <p>Transactions in this view</p>
            <strong>{total}</strong>
          </div>
        </article>
      </section>

      <section className="issue-panel">
        <div className="issue-panel-heading">
          <div>
            <h2>Issue a book</h2>
            <p>Select an available book and a registered member.</p>
          </div>
          <span className="issue-panel-heading-icon">
            <ArrowRightLeft size={21} />
          </span>
        </div>

        <form className="issue-form" onSubmit={handleIssue}>
          <label>
            Book
            <select
              value={bookId}
              onChange={(event) => setBookId(event.target.value)}
              required
            >
              <option value="">Select an available book</option>
              {availableBooks.map((book) => (
                <option key={book._id} value={book._id}>
                  {book.title} — {book.availableQuantity} available
                </option>
              ))}
            </select>
          </label>

          <label>
            Member
            <select
              value={memberId}
              onChange={(event) => setMemberId(event.target.value)}
              required
            >
              <option value="">Select a member</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
          </label>

          <label>
            Due date
            <span className="issue-date-input">
              <CalendarDays size={17} />
              <input
                type="date"
                value={dueDate}
                min={new Date().toLocaleDateString("en-CA")}
                onChange={(event) => setDueDate(event.target.value)}
                required
              />
            </span>
          </label>

          <button
            type="submit"
            className="issue-button issue-button-primary"
            disabled={submitting || loading}
          >
            {submitting ? "Issuing..." : "Issue book"}
          </button>
        </form>

        {availableBooks.length === 0 && !loading && (
          <p className="issue-hint">
            No books currently have available copies. Update a book's inventory
            before issuing it.
          </p>
        )}

        {members.length === 0 && !loading && (
          <p className="issue-hint">Register a member before issuing a book.</p>
        )}
      </section>

      <section className="issue-panel issue-transactions">
        <div className="issue-panel-heading">
          <div>
            <h2>Transaction records</h2>
            <p>Review loans and process book returns.</p>
          </div>

          <select
            className="issue-status-filter"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
              setNotice("");
            }}
            aria-label="Filter transactions by status"
          >
            <option value="Issued">Issued books</option>
            <option value="Returned">Returned books</option>
          </select>
        </div>

        <div className="issue-table-wrapper">
          <table className="issue-table">
            <thead>
              <tr>
                <th>BOOK</th>
                <th>MEMBER</th>
                <th>ISSUE DATE</th>
                <th>DUE DATE</th>
                <th>STATUS</th>
                {status === "Issued" && <th>ACTION</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={status === "Issued" ? 6 : 5}
                    className="issue-empty"
                  >
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={status === "Issued" ? 6 : 5}
                    className="issue-empty"
                  >
                    <BookOpen size={27} />
                    <strong>No {status.toLowerCase()} transactions</strong>
                    <span>Records will appear here when available.</span>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td className="issue-book-cell">
                      {getBookName(transaction)}
                    </td>
                    <td>{getMemberName(transaction)}</td>
                    <td>{formatDate(transaction.issueDate)}</td>
                    <td>{formatDate(transaction.dueDate)}</td>
                    <td>
                      <span
                        className={`issue-status issue-status-${transaction.status?.toLowerCase()}`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    {status === "Issued" && (
                      <td>
                        <button
                          type="button"
                          className="issue-return-button"
                          onClick={() => handleReturn(transaction._id)}
                        >
                          <RotateCcw size={14} />
                          Return
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="issue-pagination">
          <span>
            {total === 0
              ? "No records"
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                  page * PAGE_SIZE,
                  total,
                )} of ${total} records`}
          </span>

          <div>
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || loading}
            >
              Previous
            </button>
            <span>
              Page {totalPages === 0 ? 0 : page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page >= totalPages || loading}
            >
              Next
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
