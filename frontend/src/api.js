const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // token expired or invalid: send the user back to login
    if (res.status === 401 && token) {
      localStorage.removeItem("token");
      window.location.reload();
    }
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}
