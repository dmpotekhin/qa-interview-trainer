import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { getSql, checkSql } from '../api.js'

const DB_SCHEMA = {
  ecommerce: [
    ['client',        'id BIGINT PK', 'name VARCHAR(255)', 'email VARCHAR(255)'],
    ['address',       'id BIGINT PK', 'client_id BIGINT FK', 'country VARCHAR', 'city VARCHAR', 'street VARCHAR', 'zip_code INTEGER', 'house VARCHAR', 'flat INTEGER'],
    ['shipping_type', 'id BIGINT PK', 'type VARCHAR'],
    ['product',       'id BIGINT PK', 'name VARCHAR', 'price NUMERIC'],
    ['"order"',       'id BIGINT PK', 'client_id BIGINT FK', 'shipping_type_id BIGINT FK', 'shipping_address_id BIGINT FK', 'sum NUMERIC', 'shipping_price NUMERIC', 'shipping_method VARCHAR', 'status VARCHAR', 'created_date DATE'],
    ['order_product', 'order_id BIGINT FK', 'product_id BIGINT FK', 'count INTEGER', 'price NUMERIC'],
  ],
  banking: [
    ['users',              'id UUID PK', 'email VARCHAR', 'fullname VARCHAR', 'status VARCHAR', 'created_at TIMESTAMP'],
    ['accounts',            'id UUID PK', 'user_id UUID FK', 'account_number VARCHAR', 'balance DECIMAL', 'currency CHAR(3)', 'status VARCHAR', 'created_at TIMESTAMP'],
    ['transactions',        'id UUID PK', 'source_account_id UUID FK', 'destination_account_id UUID FK', 'amount DECIMAL', 'currency CHAR(3)', 'status VARCHAR', 'idempotency_key VARCHAR UK', 'failure_reason VARCHAR', 'created_at TIMESTAMP'],
    ['payment_templates',   'id UUID PK', 'user_id UUID FK', 'template_name VARCHAR', 'last_amount DECIMAL', 'created_at TIMESTAMP'],
    ['outbox_events',       'id BIGSERIAL PK', 'event_type VARCHAR', 'payload JSON', 'processed BOOLEAN', 'created_at TIMESTAMP'],
  ]
}

export default function SqlTrainer() {
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(null)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [showSchema, setShowSchema] = useState(false)

  useEffect(() => {
    getSql().then(d => {
      const items = Array.isArray(d) ? d : (d.sql_questions || d.questions || [])
      setQuestions(items)
      if (items[0]) setCurrent(items[0])
    })
  }, [])

  const check = async () => {
    setResult(await checkSql(current.id, query))
  }

  const renderTable = ([name, ...cols]) => (
    <div key={name} className="mb-3 bg-slate-50 rounded p-2 text-xs">
      <div className="font-mono font-bold text-blue-700 mb-1">{name}</div>
      {cols.map((c, i) => <div key={i} className="font-mono text-slate-600 pl-3">  {c}</div>)}
    </div>
  )

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <aside className="bg-white rounded-xl shadow p-3 max-h-[70vh] overflow-auto">
        <button onClick={() => setShowSchema(!showSchema)}
          className="w-full text-left text-sm font-semibold mb-2 px-2 py-1 rounded hover:bg-slate-100">
          {showSchema ? '▾ Схема БД' : '▸ Схема БД'}
        </button>
        {showSchema && (
          <div className="mb-3 border-b pb-2">
            <div className="text-xs font-bold text-slate-500 mb-1">ECOMMERCE</div>
            {DB_SCHEMA.ecommerce.map(renderTable)}
            <div className="text-xs font-bold text-slate-500 mb-1 mt-3">BANKING</div>
            {DB_SCHEMA.banking.map(renderTable)}
          </div>
        )}
        {questions.map(q => (
          <button key={q.id}
            onClick={() => { setCurrent(q); setResult(null); setQuery('') }}
            className={'block w-full text-left p-2 rounded text-sm ' +
              (current?.id === q.id ? 'bg-blue-100' : 'hover:bg-slate-100')}>
            <span className="font-mono text-xs text-slate-400">{q.level || ''}</span> {q.question?.slice(0, 60)}
          </button>
        ))}
      </aside>

      <section className="md:col-span-2 space-y-3">
        {current && (
          <>
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold">Задача #{current.id}</h2>
              <p className="text-slate-700">{current.question}</p>
            </div>

            {current.hint && (
              <details className="bg-amber-50 border border-amber-300 rounded-xl p-4">
                <summary className="cursor-pointer font-semibold text-amber-800">
                  💡 Подсказка
                </summary>
                <pre className="mt-2 text-sm text-slate-700 whitespace-pre-wrap font-sans">{current.hint}</pre>
              </details>
            )}

            <CodeMirror value={query} height="180px" extensions={[sql()]} onChange={setQuery} />
            <button onClick={check} className="px-4 py-2 bg-green-600 text-white rounded">Проверить</button>

            {result && (
              <div className="bg-white rounded-xl shadow p-4">
                {result.error && <p className="text-red-600">Ошибка: {result.error}</p>}
                {result.correct === true && <p className="text-green-600 font-semibold">✅ Верно!</p>}
                {result.correct === false && !result.error && <p className="text-red-600 font-semibold">❌ Не совпадает с эталоном</p>}
                {result.user_result && (
                  <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(result.user_result.rows, null, 2)}</pre>
                )}

                {current.answer && (
                  <details className="mt-3 bg-green-50 border border-green-300 rounded-xl p-4">
                    <summary className="cursor-pointer font-semibold text-green-800">
                      ✅ Эталонный ответ
                    </summary>
                    <pre className="mt-2 text-sm bg-slate-900 text-green-200 p-3 rounded overflow-auto">{current.answer}</pre>
                  </details>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
