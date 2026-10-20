import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BookPlus,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  LayoutDashboard,
  Menu,
  Plus,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
  UserRoundPlus,
  X,
} from "lucide-react";
import "./App.css";
import libraFlowLogo from "./assets/logo.png";
import Books from "./pages/Books";
import Members from "./pages/Members";
import IssueReturn from "./pages/IssueReturn";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";

const API_URL = "http://localhost:5000/api";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Books", icon: BookOpen },
  { label: "Members", icon: Users },
  { label: "Issue / Return", icon: RefreshCw },
  { label: "Transactions", icon: Activity },
];

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

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : "Unable to connect to the backend.";
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [stats, setStats] = useState({
    books: 0,
    members: 0,
    issued: 0,
    returned: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const responses = await Promise.all([
        fetch(`${API_URL}/books?limit=1`),
        fetch(`${API_URL}/members?limit=1`),
        fetch(`${API_URL}/transactions?limit=5`),
        fetch(`${API_URL}/transactions?status=Issued&limit=1`),
        fetch(`${API_URL}/transactions?status=Returned&limit=1`),
      ]);

      if (responses.some((response) => !response.ok)) {
        throw new Error("One or more API requests failed. Check the backend.");
      }

      const [
        booksResult,
        membersResult,
        transactionsResult,
        issuedResult,
        returnedResult,
      ] = await Promise.all(responses.map((response) => response.json()));

      if (
        !booksResult.success ||
        !membersResult.success ||
        !transactionsResult.success ||
        !issuedResult.success ||
        !returnedResult.success
      ) {
        throw new Error("The backend returned an unsuccessful response.");
      }

      setStats({
        books: booksResult.total ?? 0,
        members: membersResult.total ?? 0,
        issued: issuedResult.total ?? 0,
        returned: returnedResult.total ?? 0,
      });

      setTransactions(
        Array.isArray(transactionsResult.data) ? transactionsResult.data : [],
      );
      setLastUpdated(new Date());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch live dashboard data when the component mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, [loadDashboard]);

  const selectPage = (label) => {
    setActivePage(label);
    setMobileMenuOpen(false);
  };

  const pageDescriptions = {
    Books: "Manage your library collection, inventory and book records.",
    Members: "Manage registered members and their contact information.",
    "Issue / Return": "Issue available books and process returned copies.",
    Transactions: "Review issue history, due dates and returned books.",
  };

  return (
    <div className="app-shell">
      {mobileMenuOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon-custom-lf" aria-label="LibraFlow logo">
            <img
              src={libraFlowLogo}
              alt="LibraFlow book and LF emblem"
              className="brand-logo-image"
            />
          </div>
          <div className="brand-copy">
            <strong>
              Libra<span>Flow</span>
            </strong>
            <small>LIBRARY MANAGEMENT</small>
          </div>
          <button
            className="icon-button sidebar-close"
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? "nav-active" : ""}`}
              onClick={() => selectPage(label)}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Issue / Return" && (
                <span className="nav-badge">{stats.issued}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-divider" />

        <div className="workspace-label">SYSTEM</div>
        <button
          className={`nav-item ${activePage === "Settings" ? "nav-active" : ""}`}
          onClick={() => selectPage("Settings")}
        >
          <SettingsIcon size={19} strokeWidth={1.8} />
          <span>Settings</span>
        </button>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <ShieldCheck size={20} />
            </div>
            <strong>Your library, organized.</strong>
            <p>Manage books and members from one place.</p>
          </div>
          <div className="sidebar-profile">
            <div className="profile-avatar">LB</div>
            <div className="profile-copy">
              <strong>Library Admin</strong>
              <span>Administrator</span>
            </div>
            <ChevronDown size={16} className="profile-chevron" />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-separator">/</span>
              <strong>{activePage}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="system-status">
              <span className="status-dot" />
              <span>Library workspace</span>
            </div>
            <button
              className="icon-button notification-button"
              aria-label="Refresh dashboard data"
              title="Refresh dashboard data"
              onClick={loadDashboard}
            >
              <RefreshCw size={18} />
            </button>
            <div className="topbar-avatar">LB</div>
          </div>
        </header>

        <div className="page-content">
          {activePage === "Members" ? (
            <Members />
          ) : activePage === "Books" ? (
            <Books />
          ) : activePage === "Issue / Return" ? (
            <IssueReturn />
          ) : activePage === "Transactions" ? (
            <Transactions />
          ) : activePage === "Settings" ? (
            <Settings />
          ) : activePage === "Dashboard" ? (
            <>
              <section className="welcome-section">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-line" />
                    LIBRARY OVERVIEW
                  </div>
                  <h1>
                    Good day, Admin <span className="wave">✦</span>
                  </h1>
                  <p className="welcome-subtitle">
                    Here&apos;s what&apos;s happening in your library today.
                  </p>
                </div>
                <div className="welcome-actions">
                  <button
                    className="button button-secondary"
                    onClick={loadDashboard}
                  >
                    <RefreshCw size={16} className={loading ? "spin" : ""} />
                    Refresh
                  </button>
                  <button
                    className="button button-primary"
                    onClick={() => selectPage("Books")}
                  >
                    <Plus size={18} />
                    Manage library
                  </button>
                </div>
              </section>

              {error && (
                <div className="error-banner" role="alert">
                  <span>{error}</span>
                  <button onClick={loadDashboard}>Try again</button>
                </div>
              )}

              <section className="stats-grid" aria-label="Library statistics">
                <article className="stat-card">
                  <div className="stat-top">
                    <span className="stat-icon icon-blue">
                      <BookOpen size={21} />
                    </span>
                    <span className="stat-label">Total Books</span>
                    <span className="stat-menu">•••</span>
                  </div>
                  <div className="stat-value">
                    {loading && !lastUpdated
                      ? "—"
                      : stats.books.toLocaleString("en-IN")}
                  </div>
                  <div className="stat-bottom">
                    <span className="stat-caption">
                      Book records in collection
                    </span>
                    <span className="stat-mini-icon blue-text">
                      <BookOpen size={16} />
                    </span>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span className="stat-icon icon-purple">
                      <Users size={21} />
                    </span>
                    <span className="stat-label">Registered Members</span>
                    <span className="stat-menu">•••</span>
                  </div>
                  <div className="stat-value">
                    {loading && !lastUpdated
                      ? "—"
                      : stats.members.toLocaleString("en-IN")}
                  </div>
                  <div className="stat-bottom">
                    <span className="stat-caption">Member records</span>
                    <span className="stat-mini-icon purple-text">
                      <Users size={16} />
                    </span>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span className="stat-icon icon-orange">
                      <BookPlus size={21} />
                    </span>
                    <span className="stat-label">Books Issued</span>
                    <span className="stat-menu">•••</span>
                  </div>
                  <div className="stat-value">
                    {loading && !lastUpdated
                      ? "—"
                      : stats.issued.toLocaleString("en-IN")}
                  </div>
                  <div className="stat-bottom">
                    <span className="stat-caption">Currently on loan</span>
                    <span className="stat-mini-icon orange-text">
                      <ArrowUpRight size={17} />
                    </span>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span className="stat-icon icon-green">
                      <CheckCircle2 size={21} />
                    </span>
                    <span className="stat-label">Books Returned</span>
                    <span className="stat-menu">•••</span>
                  </div>
                  <div className="stat-value">
                    {loading && !lastUpdated
                      ? "—"
                      : stats.returned.toLocaleString("en-IN")}
                  </div>
                  <div className="stat-bottom">
                    <span className="stat-caption">Completed returns</span>
                    <span className="stat-mini-icon green-text">
                      <ArrowDownRight size={17} />
                    </span>
                  </div>
                </article>
              </section>

              <section className="dashboard-grid">
                <article className="panel transactions-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recent transactions</h2>
                      <p>Your latest book issue and return activity.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => selectPage("Transactions")}
                    >
                      View all <ArrowRight size={15} />
                    </button>
                  </div>

                  <div className="table-wrap">
                    <table className="transactions-table">
                      <thead>
                        <tr>
                          <th>BOOK / MEMBER</th>
                          <th>ISSUE DATE</th>
                          <th>DUE DATE</th>
                          <th>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => (
                          <tr key={transaction._id}>
                            <td>
                              <div className="book-cell">
                                <div className="table-book-icon">
                                  <BookOpen size={18} />
                                </div>
                                <div className="book-cell-copy">
                                  <strong>
                                    {transaction.book?.title ||
                                      "Book unavailable"}
                                  </strong>
                                  <span>
                                    {transaction.member?.name ||
                                      "Member unavailable"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>{formatDate(transaction.issueDate)}</td>
                            <td>{formatDate(transaction.dueDate)}</td>
                            <td>
                              <span
                                className={`status-pill ${
                                  transaction.status === "Returned"
                                    ? "status-returned"
                                    : "status-issued"
                                }`}
                              >
                                <span />
                                {transaction.status}
                              </span>
                            </td>
                          </tr>
                        ))}

                        {!loading && transactions.length === 0 && (
                          <tr>
                            <td colSpan="4" className="empty-cell">
                              <div className="empty-state">
                                <BookOpen size={26} />
                                <strong>No transactions yet</strong>
                                <span>
                                  Issued and returned books will appear here.
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}

                        {loading && transactions.length === 0 && (
                          <tr>
                            <td colSpan="4" className="empty-cell">
                              Loading transactions...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="panel-footer">
                    <span>
                      {transactions.length} recent record
                      {transactions.length === 1 ? "" : "s"}
                    </span>
                    <span className="footer-live">
                      <span className="status-dot" /> Live API data
                    </span>
                  </div>
                </article>

                <aside className="right-column">
                  <article className="panel quick-actions-panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Quick actions</h2>
                        <p>Common library tasks.</p>
                      </div>
                    </div>

                    <button
                      className="quick-action"
                      onClick={() => selectPage("Books")}
                    >
                      <span className="quick-icon quick-blue">
                        <BookPlus size={19} />
                      </span>
                      <span className="quick-copy">
                        <strong>Manage books</strong>
                        <small>Browse your collection</small>
                      </span>
                      <ArrowRight size={17} className="quick-arrow" />
                    </button>

                    <button
                      className="quick-action"
                      onClick={() => selectPage("Members")}
                    >
                      <span className="quick-icon quick-purple">
                        <UserRoundPlus size={19} />
                      </span>
                      <span className="quick-copy">
                        <strong>Manage members</strong>
                        <small>View registered members</small>
                      </span>
                      <ArrowRight size={17} className="quick-arrow" />
                    </button>

                    <button
                      className="quick-action"
                      onClick={() => selectPage("Issue / Return")}
                    >
                      <span className="quick-icon quick-orange">
                        <RefreshCw size={19} />
                      </span>
                      <span className="quick-copy">
                        <strong>Issue or return</strong>
                        <small>Manage book circulation</small>
                      </span>
                      <ArrowRight size={17} className="quick-arrow" />
                    </button>
                  </article>

                  <article className="overview-card">
                    <div className="overview-card-top">
                      <div className="overview-symbol">
                        <CalendarDays size={21} />
                      </div>
                      <span className="overview-tag">OVERVIEW</span>
                    </div>
                    <h3>Keep your library in sync.</h3>
                    <p>
                      Refresh your dashboard to see the latest records from your
                      database.
                    </p>
                    <button onClick={loadDashboard}>
                      Update overview <ArrowRight size={15} />
                    </button>
                    <div className="overview-decoration overview-decoration-one" />
                    <div className="overview-decoration overview-decoration-two" />
                  </article>
                </aside>
              </section>

              <footer className="page-footer">
                <span>LibraFlow · Library Management System</span>
                <span>
                  {lastUpdated
                    ? `Last synced at ${lastUpdated.toLocaleTimeString(
                        "en-IN",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}`
                    : "Waiting for API data"}
                </span>
              </footer>
            </>
          ) : (
            <section className="placeholder-page">
              <div className="placeholder-icon">
                {activePage === "Books" ? (
                  <BookOpen size={30} />
                ) : activePage === "Members" ? (
                  <Users size={30} />
                ) : activePage === "Issue / Return" ? (
                  <RefreshCw size={30} />
                ) : activePage === "Transactions" ? (
                  <Activity size={30} />
                ) : (
                  <SettingsIcon size={30} />
                )}
              </div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> LIBRARY WORKSPACE
              </div>
              <h1>{activePage}</h1>
              <p>
                {pageDescriptions[activePage] ||
                  "Configure your library workspace and preferences."}
              </p>
              <div className="placeholder-info">
                <Clock3 size={20} />
                <div>
                  <strong>This page is next in development.</strong>
                  <span>
                    The dashboard is connected to your backend. We'll build this
                    page next.
                  </span>
                </div>
              </div>
              <button
                className="button button-primary"
                onClick={() => selectPage("Dashboard")}
              >
                Back to dashboard <ArrowRight size={16} />
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
