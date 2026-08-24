import axios, { AxiosError } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Session expired or invalid — let the caller handle it.
    // AuthContext clears user state; protected pages redirect to /login.
    return Promise.reject(error)
  }
)

export const getApiBaseUrl = () => API_BASE_URL

export default api