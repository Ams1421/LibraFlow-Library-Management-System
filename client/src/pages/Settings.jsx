
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Database,
  Info,
  RefreshCw,
  ShieldCheck,
  Server,
  Wifi,
  WifiOff,
} from "lucide-react";
import "./Settings.css";

const HEALTH_URL = "http://localhost:5000/api/health";

export default function Settings() {
  const [health, setHealth] = useState("checking");
  const [message, setMessage] = useState("");
  const [lastChecked, setLastChecked] = useState(null);

  const checkConnection = useCallback(async () => {
    setHealth("checking");
    setMessage("");

    try {
      const response = await fetch(HEALTH_URL);
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Backend health check failed.");
      }

      setHealth("connected");
      setMessage(
        result.message || "The backend health endpoint responded successfully."
      );
      setLastChecked(new Date());
    } catch {
      setHealth("disconnected");
      setMessage(
        "Unable to reach the backend. Confirm that the server is running on port 5000."
      );
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    // Run the health check when the Settings page opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkConnection();
  }, [checkConnection]);

  return (
    <main className="settings-page">
      <header className="settings-heading">
        <div>
          <span className="settings-eyebrow">SYSTEM CONFIGURATION</span>
          <h1>Settings</h1>
          <p>Application information and system connection status.</p>
        </div>

        <button
          type="button"
          className="settings-button"
          onClick={checkConnection}
          disabled={health === "checking"}
        >
          <RefreshCw size={16} />
          {health === "checking" ? "Checking..." : "Check connection"}
        </button>
      </header>

      <section className="settings-overview">
        <article className="settings-card">
          <span className="settings-icon settings-icon-blue">
            <Activity size={21} />
          </span>
          <div>
            <p>Application</p>
            <strong>LibraFlow</strong>
            <span>Library Management System</span>
          </div>
        </article>

        <article className="settings-card">
          <span className="settings-icon settings-icon-purple">
            <Server size={21} />
          </span>
          <div>
            <p>Backend API</p>
            <strong>localhost:5000</strong>
            <span>Express REST API</span>
          </div>
        </article>

        <article className="settings-card">
          <span className="settings-icon settings-icon-green">
            <Database size={21} />
          </span>
          <div>
            <p>Database</p>
            <strong>MongoDB</strong>
            <span>Connection configured on server</span>
          </div>
        </article>
      </section>

      <section className="settings-panel">
        <div className="settings-panel-heading">
          <div className="settings-panel-icon">
            <Wifi size={20} />
          </div>
          <div>
            <h2>Backend connectivity</h2>
            <p>Live check of the configured backend health endpoint.</p>
          </div>
        </div>

        <div className="settings-connection">
          <div className="settings-connection-info">
            <span
              className={`settings-status-dot settings-dot-${health}`}
            />
            <div>
              <strong>
                {health === "connected"
                  ? "Backend connected"
                  : health === "disconnected"
                    ? "Backend unavailable"
                    : "Checking connection"}
              </strong>
              <p>{message || "Contacting the backend health endpoint..."}</p>
            </div>
          </div>

          {health === "connected" ? (
            <span className="settings-status settings-status-connected">
              <CheckCircle2 size={15} />
              Connected
            </span>
          ) : health === "disconnected" ? (
            <span className="settings-status settings-status-disconnected">
              <WifiOff size={15} />
              Unavailable
            </span>
          ) : (
            <span className="settings-status settings-status-checking">
              <RefreshCw size={15} />
              Checking
            </span>
          )}
        </div>

        <div className="settings-details">
          <div>
            <span>Health endpoint</span>
            <code>/api/health</code>
          </div>
          <div>
            <span>API base URL</span>
            <code>http://localhost:5000/api</code>
          </div>
          <div>
            <span>Last checked</span>
            <strong>
              {lastChecked
                ? lastChecked.toLocaleString("en-IN")
                : "Not checked yet"}
            </strong>
          </div>
        </div>
      </section>

      <section className="settings-panel">
        <div className="settings-panel-heading">
          <div className="settings-panel-icon settings-panel-icon-green">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2>Security and configuration</h2>
            <p>Basic information about how this application is configured.</p>
          </div>
        </div>

        <div className="settings-info-list">
          <div>
            <span>Authentication</span>
            <strong>Not configured in this page</strong>
          </div>
          <div>
            <span>Database credentials</span>
            <strong>Kept in the server environment</strong>
          </div>
          <div>
            <span>API communication</span>
            <strong>Local development HTTP</strong>
          </div>
        </div>

        <div className="settings-note">
          <Info size={18} />
          <p>
            This page reports application connectivity and configuration
            information. It does not change environment variables or database
            credentials. Before production deployment, configure HTTPS,
            appropriate authentication, and secure environment variables.
          </p>
        </div>
      </section>

      <p className="settings-footer">
        LibraFlow · Library Management System
      </p>
    </main>
  );
}
