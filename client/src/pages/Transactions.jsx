
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import "./Transactions.css";

const API_URL = "http://localhost:5000/api/transactions";
const PAGE_SIZE = 10;

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(data, fallback) {
  return data?.message || data?.error || fallback;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (status !== "All") {
        params.set("status", status);
      }

      const response = await fetch(`${API_URL}?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(result, "Unable to load transactions.")
        );
      }

      let rows = Array.isArray(result.data) ? result.data : [];

      // Search the currently loaded page by book title or member name.
      if (search.trim()) {
        const query = search.trim().toLowerCase();

        rows = rows.filter((transaction) => {
          const bookTitle = transaction.book?.title || "";
          const memberName = transaction.member?.name || "";
          const memberEmail = transaction.member?.email || "";

          return (
            bookTitle.toLowerCase().includes(query) ||
            memberName.toLowerCase().includes(query) ||
            memberEmail.toLowerCase().includes(query)
          );
        });
      }

      setTransactions(rows);
      setTotal(result.total ?? 0);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
      setTransactions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    // Fetching records when filters or pagination change is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTransactions();
  }, [loadTransactions]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const issuedCount = transactions.filter(
    (transaction) => transaction.status === "Issued"
  ).length;

  const returnedCount = transactions.filter(
    (transaction) => transaction.status === "Returned"
  ).length;

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <main className="transactions-page">
      <header className="transactions-heading">
        <div>
          <span className="transactions-eyebrow">LIBRARY ACTIVITY</span>
          <h1>Transactions</h1>
          <p>Track borrowing history, due dates, and completed returns.</p>
        </div>

        <button
          type="button"
          className="transactions-button transactions-button-secondary"
          onClick={loadTransactions}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="transactions-alert" role="alert">
          {error}
          <button type="button" onClick={() => setError("")} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <section className="transactions-stats">
        <article className="transactions-stat-card">
          <span className="transactions-stat-icon transactions-blue">
            <Activity size={21} />
          </span>
          <div>
            <p>Total transactions</p>
            <strong>{total}</strong>
          </div>
        </article>

        <article className="transactions-stat-card">
          <span className="transactions-stat-icon transactions-orange">
            <Clock3 size={21} />
          </span>
          <div>
            <p>Issued on this page</p>
            <strong>{issuedCount}</strong>
          </div>
        </article>

        <article className="transactions-stat-card">
          <span className="transactions-stat-icon transactions-green">
            <CheckCircle2 size={21} />
          </span>
          <div>
            <p>Returned on this page</p>
            <strong>{returnedCount}</strong>
          </div>
        </article>
      </section>

      <section className="transactions-panel">
        <div className="transactions-toolbar">
          <div>
            <h2>Transaction history</h2>
            <p>Browse and search library borrowing records.</p>
          </div>

          <select
            className="transactions-filter"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            aria-label="Filter transactions by status"
          >
            <option value="All">All transactions</option>
            <option value="Issued">Issued</option>
            <option value="Returned">Returned</option>
          </select>
        </div>

        <form className="transactions-search" onSubmit={handleSearch}>
          <div className="transactions-search-field">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search book title, member, or email..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <button
            type="submit"
            className="transactions-button transactions-button-primary"
          >
            Search
          </button>
        </form>

        <div className="transactions-table-wrapper">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>BOOK</th>
                <th>MEMBER</th>
                <th>ISSUE DATE</th>
                <th>DUE DATE</th>
                <th>RETURN DATE</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="transactions-empty">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="transactions-empty">
                    <BookOpen size={28} />
                    <strong>No transactions found</strong>
                    <span>
                      {search
                        ? "Try another search term."
                        : "Issued and returned books will appear here."}
                    </span>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td className="transactions-book">
                      {transaction.book?.title || "Book unavailable"}
                    </td>
                    <td>
                      <div className="transactions-member">
                        <Users size={15} />
                        <span>
                          {transaction.member?.name || "Member unavailable"}
                        </span>
                      </div>
                      {transaction.member?.email && (
                        <small className="transactions-email">
                          {transaction.member.email}
                        </small>
                      )}
                    </td>
                    <td>{formatDate(transaction.issueDate)}</td>
                    <td>{formatDate(transaction.dueDate)}</td>
                    <td>{formatDate(transaction.returnDate)}</td>
                    <td>
                      <span
                        className={`transactions-status transactions-status-${transaction.status?.toLowerCase()}`}
                      >
                        {transaction.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="transactions-pagination">
          <span>
            {total === 0
              ? "No records"
              : `Page ${page} of ${totalPages || 1} · ${total} total records`}
          </span>

          <div>
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || loading}
            >
              Previous
            </button>
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

        {lastUpdated && (
          <p className="transactions-updated">
            Last refreshed: {lastUpdated.toLocaleTimeString("en-IN")}
          </p>
        )}
      </section>
    </main>
  );
}
