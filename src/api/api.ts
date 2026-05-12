import axios from "axios";
import { encrypt, decrypt } from "@/Utils/encryptionHelper";

const HEX = /^[0-9a-f]+$/i;

const isEncryptedPair = (payload: unknown): payload is [string, string] =>
  Array.isArray(payload) &&
  payload.length === 2 &&
  typeof payload[0] === 'string' &&
  typeof payload[1] === 'string' &&
  HEX.test(payload[0]) &&
  HEX.test(payload[1]) &&
  payload[0].length === 32;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const isLoginPath = config.url?.includes("/login");

    if (config.data && token && !isLoginPath && config.method !== 'get') {
      const encrypted = encrypt(config.data, token);
      console.log("Encrypting request:", config.url, encrypted);
      config.data = { data: encrypted };
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response: decrypt incoming body ─────────────────────────────────────────
// ── Response: decrypt incoming body ─────────────────────────────────────────
api.interceptors.response.use(

  (response) => {

    // LOGIN: backend returns token alongside encrypted payload
    if (response.data?.token && Array.isArray(response.data.data)) {
      try {
        const decrypted = decrypt(response.data.data, response.data.token);

        response.data = {
          ...decrypted,
          token: response.data.token,
        };

      } catch (e) {
        if (import.meta.env.DEV) {
          console.error("Login decryption failed:", e);
        }
      }

      return response;
    }

    // NORMAL: unwrap then decrypt
    const token = sessionStorage.getItem('token') ?? '';
    const payload = response.data?.data ?? response.data;

    if (isEncryptedPair(payload)) {

      // Authenticated endpoints use token,
      // public endpoints use empty string
      const attempts = token ? [token, ''] : [''];

      for (const t of attempts) {
        try {
          const decrypted = decrypt(payload, t);

          response.data =
            typeof decrypted === 'string'
              ? JSON.parse(decrypted)
              : decrypted;

          break;

        } catch {
          // try next token
        }
      }
    }

    return response;
  },

  // ERROR RESPONSE DECRYPTION
  (error) => {

    const token = sessionStorage.getItem('token') ?? '';
    const payload = error.response?.data?.data ?? error.response?.data;

    if (isEncryptedPair(payload)) {

      const attempts = token ? [token, ''] : [''];

      for (const t of attempts) {
        try {

          const decrypted = decrypt(payload, t);

          error.response.data =
            typeof decrypted === 'string'
              ? JSON.parse(decrypted)
              : decrypted;

          console.log("Decrypted Error Response:", error.response.data);

          break;

        } catch {
          // try next token
        }
      }
    }

    return Promise.reject(error);
  }

);
export default api;
