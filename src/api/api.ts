import axios from 'axios';
import { encrypt, decrypt } from  "@/Utils/encryptionHelper"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const isLoginPath = config.url?.includes('/login');

  if (config.data && token && !isLoginPath) {
    const encrypted = encrypt(config.data, token);
    console.log("Encrypting request:", config.url, encrypted); 
    config.data = { data: encrypted };
  }

  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use((response) => {
  // --- 1. HANDLE LOGIN RESPONSE WRAPPER ---
  // If the response is { token: "...", data: [...] }
  if (response.data && response.data.token && Array.isArray(response.data.data)) {
    const { token: freshToken, data: encryptedArray } = response.data;
    
    try {
      const decrypted = decrypt(encryptedArray, freshToken);
      // Merge the token back so LoginPage can see it
      response.data = { ...decrypted, token: freshToken };
      return response;
    } catch (e) {
      console.error("Login decryption failed:", e);
    }
  }

  // --- 2. HANDLE STANDARD ENCRYPTED RESPONSE ---
  // This is for Invoices, Profile, etc.
  const tokenInStorage = sessionStorage.getItem('token');
  const payload = response.data?.data ?? response.data;

  if (Array.isArray(payload) && payload.length === 2 && tokenInStorage) {
    try {
      response.data = decrypt(payload, tokenInStorage);
    } catch (e) {
      console.error("Standard decryption failed:", e);
    }
  }

  return response;
}, (error) => {
  // Error decryption logic remains the same
  return Promise.reject(error);
});

export default api;