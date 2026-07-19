import { useState } from 'react'
import axios from 'axios'

const MOCK_URL = import.meta.env.VITE_MOCK_URL || 'http://localhost:8080'

export default function ApiCases() {
  const [resp, setResp] = useState(null)
  const [amount, setAmount] = useState('1500.50')

  const send = async () => {
    try {
      const r = await axios.post(`${MOCK_URL}/api/v1/transfers/internal`, {
        source_account_id: '83740e53-609c-4822-9213-4f9e61c22401',
        destination_account_id: '11259624-5f5c-4830-9973-77405085440a',
        amount: parseFloat(amount), currency: 'USD',
        description: 'Payment for rent'
      }, { headers: { 'Idempotency-Key': 'demo-key', 'Authorization': 'Bearer demo-token' } })
      setResp(r.data)
    } catch (e) {
      setResp({ error: e.message })
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">API-кейсы: POST /api/v1/transfers/internal</h1>
      <div className="bg-amber-50 border border-amber-300 rounded p-4">
        🐞 <b>Баг округления:</b> отправь amount = 1500.50 — в ответе придёт 1500.00.
      </div>
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <label className="block">amount:
          <input value={amount} onChange={e => setAmount(e.target.value)} className="border rounded p-1 ml-2" />
        </label>
        <button onClick={send} className="px-4 py-2 bg-green-600 text-white rounded">Отправить запрос</button>
        {resp && <pre className="bg-slate-900 text-green-200 p-3 rounded text-sm overflow-auto">{JSON.stringify(resp, null, 2)}</pre>}
      </div>
    </div>
  )
}
