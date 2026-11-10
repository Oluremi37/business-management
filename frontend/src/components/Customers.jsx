import { useEffect, useState, useCallback } from "react";
import { request } from "../api";

const empty = { name: "", email: "", phone: "", status: "active" };

export default function Customers({ onChange }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCustomers(
        await request(`/api/customers?search=${encodeURIComponent(search)}`),
      );
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  // wait 300ms after typing before searching
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Name is required");
    if (!/^\S+@\S+\.\S+$/.test(form.email))
      return setError("Enter a valid email");
    setSaving(true);
    setError("");
    try {
      await request(
        editingId ? `/api/customers/${editingId}` : "/api/customers",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(form),
        },
      );
      setForm(empty);
      setEditingId(null);
      await load();
      onChange(); // refresh the dashboard cards
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone || "",
      status: c.status,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(empty);
    setError("");
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete ${c.name}?`)) return;
    try {
      await request(`/api/customers/${c.id}`, { method: "DELETE" });
      await load();
      onChange();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <form className="card form" onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit customer" : "Register new customer"}</h2>
        {error && <p className="error">{error}</p>}
        <div className="grid">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="actions">
          <button className="btn" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update" : "Add customer"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn secondary"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <div className="table-head">
          <h2>Customers</h2>
          <input
            className="search"
            placeholder="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : customers.length === 0 ? (
          <p>No customers found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone || "-"}</td>
                    <td>
                      <span className={`badge ${c.status}`}>{c.status}</span>
                    </td>
                    <td className="row-actions">
                      <button
                        className="btn small"
                        onClick={() => startEdit(c)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn small danger"
                        onClick={() => remove(c)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
