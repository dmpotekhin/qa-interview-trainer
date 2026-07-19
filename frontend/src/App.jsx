import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import SqlTrainer from './pages/SqlTrainer.jsx'
import ApiCases from './pages/ApiCases.jsx'
import JavaTrainer from './pages/JavaTrainer.jsx'
import Flashcards from './pages/Flashcards.jsx'
import Architecture from './pages/Architecture.jsx'
import { getJavaCore, getQa } from './api.js'

const linkCls = ({ isActive }) =>
  'px-3 py-2 rounded ' + (isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-200')

export default function App() {
  return (
    <div className="min-h-screen">
      <nav className="flex flex-wrap gap-2 p-4 bg-white shadow sticky top-0 z-10">
        <span className="font-bold mr-4 self-center">🎯 QA Trainer</span>
        <NavLink to="/" className={linkCls} end>Дашборд</NavLink>
        <NavLink to="/sql" className={linkCls}>SQL</NavLink>
        <NavLink to="/api" className={linkCls}>API-кейсы</NavLink>
        <NavLink to="/java" className={linkCls}>Java live-coding</NavLink>
        <NavLink to="/java-core" className={linkCls}>Java Core</NavLink>
        <NavLink to="/qa" className={linkCls}>QA-вопросы</NavLink>
        <NavLink to="/architecture" className={linkCls}>Архитектура</NavLink>
      </nav>
      <main className="max-w-6xl mx-auto p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sql" element={<SqlTrainer />} />
          <Route path="/api" element={<ApiCases />} />
          <Route path="/java" element={<JavaTrainer />} />
          <Route path="/java-core" element={<Flashcards title="Java Core" loader={getJavaCore} bank="java-core" />} />
          <Route path="/qa" element={<Flashcards title="QA-вопросы" loader={getQa} bank="qa" />} />
          <Route path="/architecture" element={<Architecture />} />
        </Routes>
      </main>
    </div>
  )
}
