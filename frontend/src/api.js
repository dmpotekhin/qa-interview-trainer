import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const api = axios.create({ baseURL })

export const getSql        = () => api.get('/api/sql').then(r => r.data)
export const checkSql      = (question_id, query) => api.post('/api/sql/check', { question_id, query }).then(r => r.data)
export const getJavaCore   = () => api.get('/api/java-core').then(r => r.data)
export const getQa         = () => api.get('/api/qa').then(r => r.data)
export const getJavaTrainer= () => api.get('/api/java-trainer').then(r => r.data)
export const getQotd       = () => api.get('/api/question-of-the-day').then(r => r.data)
export const getProgress   = (uid='default') => api.get(`/api/progress/${uid}`).then(r => r.data)
