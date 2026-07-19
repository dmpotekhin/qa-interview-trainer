import { useEffect, useState } from 'react'
import { getQotd, getProgress } from '../api.js'

export default function Dashboard() {
  const [qotd, setQotd] = useState(null)
  const [show, setShow] = useState(false)
  const [progress, setProgress] = useState([])

  useEffect(() => {
    getQotd().then(setQotd).catch(() => {})
    getProgress().then(d => setProgress(d.by_bank || [])).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Добро пожаловать 👋</h1>

      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold mb-2">📅 Вопрос дня</h2>
        {qotd ? (
          <>
            <p className="mb-3">{qotd.question}</p>
            <button onClick={() => setShow(!show)} className="px-3 py-1 bg-blue-600 text-white rounded">
              {show ? 'Скрыть ответ' : 'Показать ответ'}
            </button>
            {show && <p className="mt-3 text-slate-600">{qotd.answer}</p>}
          </>
        ) : <p>Загрузка…</p>}
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold mb-3">📊 Прогресс</h2>
        {progress.length === 0 && <p className="text-slate-500">Пока нет данных. Начни решать задачи!</p>}
        <ul className="space-y-1">
          {progress.map(p => (
            <li key={p.bank}>{p.bank}: {p.correct}/{p.total} ✅</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
