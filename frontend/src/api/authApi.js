import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const authApi = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: { "Content-Type": "application/json" },
});

authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const sendOTP = async (email, type = "login", captchaToken = null, expectedRole = null) => {
  const endpoint = type === "signup" ? "/signup/send-otp" : "/login/send-otp";
  const payload  = { email };
  if (captchaToken) payload.captchaToken = captchaToken;
  if (type === "login" && expectedRole) payload.expectedRole = expectedRole;
  const response = await authApi.post(endpoint, payload);
  return response.data;
};

export const verifyOTP = async (
  email,
  otp,
  role         = null,
  mobile       = null,
  firstName    = null,
  lastName     = null,
  type         = "login",
  expectedRole = null
) => {
  const endpoint = type === "signup"
    ? "/signup/verify-otp"
    : "/login/verify-otp";

  const payload = { email, otp };

  if (type === "signup") {
    payload.role      = role;
    payload.mobile    = mobile || "";
    payload.firstName = firstName;
    payload.lastName  = lastName;
  }

  if (type === "login" && expectedRole) {
    payload.expectedRole = expectedRole;
  }

  // Always re-throw the full axios error so callers can access
  // err.response.data.message and err.response.data.correctPortal
  const response = await authApi.post(endpoint, payload);
  return response.data;
};

export const logoutUser = async () => {
  const response = await authApi.post("/logout");
  return response.data;
};

export default authApi;