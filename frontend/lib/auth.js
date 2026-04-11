import api from "./api";

export async function signup(name, email, password) {
  const res = await api.post("/auth/signup", { name, email, password });
  localStorage.setItem("token", res.data.token);
  localStorage.setItem("user", JSON.stringify(res.data.user));
  return res.data;
}

export async function login(email, password) {
  const res = await api.post("/auth/login", { email, password });
  localStorage.setItem("token", res.data.token);
  localStorage.setItem("user", JSON.stringify(res.data.user));
  return res.data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

export function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}

export function isLoggedIn() {
  return !!getToken();
}