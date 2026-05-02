import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8090/api',
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
