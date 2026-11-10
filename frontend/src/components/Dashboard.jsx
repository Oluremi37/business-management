import { useEffect, useState, useCallback } from "react";
import { request } from "../api";
import Customers from "./Customers";

export default function Dashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    try {
      setStats(await request("/api/stats"));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    request("/api/stats")
      .then((data) => {
        if (!cancelled) {
          setStats(data);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    ["Total customers", stats?.total],
    ["Active customers", stats?.active],
    ["Inactive customers", stats?.inactive],
    ["New this month", stats?.newThisMonth],
  ];

  return (
    <div className="container">
      <header className="topbar">
        <h1>Business Dashboard</h1>
        <button className="btn secondary" onClick={onLogout}>
          Log out
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="stats">
        {cards.map(([label, value]) => (
          <div className="card stat" key={label}>
            <span>{label}</span>
            <strong>{stats ? value : "..."}</strong>
          </div>
        ))}
      </section>

      <Customers onChange={loadStats} />
    </div>
  );
}
