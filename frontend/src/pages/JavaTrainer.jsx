import { useEffect, useState } from 'react'
import { getJavaTrainer } from '../api.js'

export default function JavaTrainer() {
  const [data, setData] = useState(null)
  const [openId, setOpenId] = useState(null)

  useEffect(() => { getJavaTrainer().then(setData) }, [])
  if (!data) return <p>Загрузка…</p>

  const tasks = data.livecoding_tasks || data.live_coding || data.tasks || (Array.isArray(data) ? data : [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Java live-coding</h1>
      {tasks.map(t => (
        <div key={t.id} className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold">#{t.id} {t.title || ''}</h2>
          <p className="text-slate-700 whitespace-pre-wrap">{t.question || t.task || t.description}</p>
          <button onClick={() => setOpenId(openId === t.id ? null : t.id)}
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded">
            {openId === t.id ? 'Скрыть решение' : 'Показать решение'}
          </button>
          {openId === t.id && (
            <pre className="mt-3 bg-slate-900 text-green-200 p-3 rounded overflow-auto text-sm">
{t.answer || t.solution}
            </pre>
          )}
        </div>
      ))}
    </div>
  )
}
