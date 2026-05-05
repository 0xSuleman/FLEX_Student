import axios from 'axios'

// Use a relative baseURL so the app works behind a Cloudflare / ngrok HTTPS
// tunnel and on the LAN. Vite's dev server proxies /api → localhost:8090
// (see vite.config.js), so requests land on the Spring backend regardless
// of how the page itself was reached.
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('flex_token') || sessionStorage.getItem('flex_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('flex_token')
      localStorage.removeItem('flex_user')
      sessionStorage.removeItem('flex_token')
      sessionStorage.removeItem('flex_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
