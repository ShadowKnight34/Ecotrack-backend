import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// -------------------------------------------------------
// Axios instance pre-configured for the EcoTrack backend.
// Update BASE_URL once the backend API is deployed.
// -------------------------------------------------------

let rawBaseUrl = process.env.EXPO_PUBLIC_API_URL;
if (rawBaseUrl) {
    rawBaseUrl = rawBaseUrl.trim();
}
// Ensure /api is appended if not present, and fallback to emulator URL for local testing
const BASE_URL = rawBaseUrl
    ? (rawBaseUrl.endsWith('/api') ? rawBaseUrl : (rawBaseUrl.endsWith('/') ? `${rawBaseUrl}api` : `${rawBaseUrl}/api`))
    : 'http://10.0.2.2:3000/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 60000, // Increased to 60s to handle Render Free Tier cold-start spin-ups
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Request interceptor (e.g. attach auth token) ---
api.interceptors.request.use(
    async (config) => {
        try {
            // 1. Retrieve the token saved during Login
            const token = await AsyncStorage.getItem('userToken');

            // 2. If it exists, attach it to the headers
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error fetching token from storage', error);
        }
        return config;
    },
    (error) => Promise.reject(error),
);
// --- Response interceptor (e.g. global error handling) ---
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // TODO: Handle 401 / token refresh logic here
        return Promise.reject(error);
    },
);

export default api;
