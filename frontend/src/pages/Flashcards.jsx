import { useEffect, useMemo, useState } from 'react'

export default function Flashcards({ title, loader }) {
  const [items, setItems] = useState([])
  const [idx, setIdx] = useState(0)
  const [show, setShow] = useState(false)
  const [topic, setTopic] = useState('all')
  const [level, setLevel] = useState('all')

  useEffect(() => {
    loader().then(d => setItems(Array.isArray(d) ? d : (d.questions || [])))
  }, [loader])

  const topics = useMemo(() => ['all', ...new Set(items.map(i => i.topic).filter(Boolean))], [items])
  const levels = useMemo(() => ['all', ...new Set(items.map(i => i.level).filter(Boolean))], [items])

  const filtered = items.filter(i =>
    (topic === 'all' || i.topic === topic) && (level === 'all' || i.level === level))

  const card = filtered[idx]
  const next = () => { setShow(false); setIdx((idx + 1) % filtered.length) }
  const rand = () => { setShow(false); setIdx(Math.floor(Math.random() * filtered.length)) }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{title} <span className="text-base text-slate-400">({filtered.length})</span></h1>

      <div className="flex gap-3 flex-wrap">
        <select value={topic} onChange={e => { setTopic(e.target.value); setIdx(0) }} className="border rounded p-2">
          {topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={level} onChange={e => { setLevel(e.target.value); setIdx(0) }} className="border rounded p-2">
          {levels.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {card ? (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-xs text-slate-400 mb-2">{card.topic} · {card.level} · #{card.id} · {idx + 1}/{filtered.length}</div>
          <p className="text-lg mb-4">{card.question}</p>
          <button onClick={() => setShow(!show)} className="px-3 py-1 bg-blue-600 text-white rounded">
            {show ? 'Скрыть' : 'Показать ответ'}
          </button>
          {show && <p className="mt-4 text-slate-700 whitespace-pre-wrap">{card.answer}</p>}
          <div className="mt-5 flex gap-2">
            <button onClick={next} className="px-3 py-1 border rounded">Следующий →</button>
            <button onClick={rand} className="px-3 py-1 border rounded">🎲 Случайный</button>
          </div>
        </div>
      ) : <p>Загрузка…</p>}
    </div>
  )
}
