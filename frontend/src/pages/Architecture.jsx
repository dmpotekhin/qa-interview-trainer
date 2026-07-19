const steps = [
  ['User → API Gateway', 'Клиент отправляет POST /transfers/internal с Idempotency-Key и Authorization.'],
  ['API Gateway → Redis', 'Проверка идемпотентности: ключ уже обработан? Если да — вернуть прошлый ответ.'],
  ['Gateway → Transfer Service', 'Маршрутизация запроса в сервис переводов.'],
  ['Transfer Service → PostgreSQL', 'Списание и зачисление в рамках одной транзакции (ACID).'],
  ['Transfer Service → Kafka', 'Публикация события через outbox (гарантия доставки).'],
  ['Kafka → ClickHouse', 'Потребитель пишет событие в аналитическое хранилище.'],
  ['ClickHouse → Kibana', 'Дашборды и мониторинг переводов.'],
]

export default function Architecture() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Архитектура внутреннего перевода</h1>
      <div className="bg-white rounded-xl shadow p-4 font-mono text-sm overflow-auto">
        User → API Gateway → Redis → Transfer Service → PostgreSQL → Kafka → ClickHouse → Kibana
      </div>
      <ol className="space-y-2">
        {steps.map(([t, d], i) => (
          <li key={i} className="bg-white rounded-xl shadow p-4">
            <b>{i + 1}. {t}</b>
            <p className="text-slate-600">{d}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
