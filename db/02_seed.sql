-- ============================================================
--  02_seed.sql
--  Тестовые данные для QA Automation Interview Trainer
--  Содержит "подсаженные" баги для тренировки баг-хантинга.
--  Запускается ПОСЛЕ 01_schema.sql
-- ============================================================

-- ================= ECOMMERCE =================
SET search_path TO ecommerce;

-- --- Клиенты ---
INSERT INTO client (id, name, email, created_at) VALUES
  (1, 'Иван Петров',      'ivan@example.com',    NOW() - INTERVAL '120 days'),
  (2, 'Мария Сидорова',   'maria@example.com',   NOW() - INTERVAL '90 days'),
  (3, 'Алексей Кузнецов', 'alex@example.com',    NOW() - INTERVAL '60 days'),
  (4, 'Ольга Смирнова',   'olga@example.com',    NOW() - INTERVAL '30 days'),
  -- BUG-10: клиент без единого заказа (для задачи "клиенты без заказов")
  (5, 'Дмитрий Новиков',  'dmitry@example.com',  NOW() - INTERVAL '10 days');

-- --- Адреса (привязаны к клиентам) ---
INSERT INTO address (id, client_id, city, street, zip) VALUES
  (1, 1, 'Москва',          'ул. Ленина, 1',      '101000'),
  (2, 2, 'Санкт-Петербург', 'Невский пр., 10',     '190000'),
  (3, 3, 'Казань',          'ул. Баумана, 5',      '420000'),
  (4, 4, 'Новосибирск',     'Красный пр., 20',     '630000');

-- --- Типы доставки ---
INSERT INTO shipping_type (id, name, price) VALUES
  (1, 'Courier',      350.00),
  (2, 'Pickup',         0.00),
  (3, 'Post',         200.00);

-- --- Товары ---
INSERT INTO product (id, name, price) VALUES
  (1, 'Клавиатура',  2500.00),
  (2, 'Мышь',        1200.00),
  (3, 'Монитор',    15000.00),
  (4, 'Наушники',    4000.00),
  (5, 'Веб-камера',  3000.00);

-- --- Заказы ---
-- order — зарезервированное слово, поэтому в кавычках
INSERT INTO "order" (id, client_id, shipping_address_id, shipping_type_id, status, sum, created_at) VALUES
  -- нормальный заказ: 1*2500 + 2*1200 = 4900
  (1, 1, 1, 1, 'COMPLETED', 4900.00, NOW() - INTERVAL '20 days'),
  -- BUG-1: sum не совпадает с реальной суммой позиций (3*15000=45000, а тут 45000.99)
  (2, 2, 2, 1, 'COMPLETED', 45000.99, NOW() - INTERVAL '15 days'),
  -- BUG-2: shipping_address_id=1 принадлежит клиенту 1, а заказ клиента 3
  (3, 3, 1, 2, 'COMPLETED', 3000.00, NOW() - INTERVAL '5 days'),
  -- BUG-3: мусорный статус
  (4, 4, 4, 3, 'in_progres', 4000.00, NOW() - INTERVAL '2 days'),
  -- свежий заказ (для "за последние 30 дней")
  (5, 1, 1, 1, 'NEW',        1200.00, NOW() - INTERVAL '1 days');

-- --- Позиции заказов ---
INSERT INTO order_product (order_id, product_id, count, price) VALUES
  (1, 1, 1, 2500.00),
  (1, 2, 2, 1200.00),
  (2, 3, 3, 15000.00),   -- реально 45000, но в order.sum = 45000.99 (BUG-1)
  (3, 5, 1, 3000.00),
  (4, 4, 1, 4000.00),
  (5, 2, 1, 1200.00);

-- Синхронизируем sequence (на случай SERIAL/IDENTITY)
SELECT setval(pg_get_serial_sequence('ecommerce.client', 'id'),        (SELECT MAX(id) FROM client));
SELECT setval(pg_get_serial_sequence('ecommerce.address', 'id'),       (SELECT MAX(id) FROM address));
SELECT setval(pg_get_serial_sequence('ecommerce.shipping_type', 'id'), (SELECT MAX(id) FROM shipping_type));
SELECT setval(pg_get_serial_sequence('ecommerce.product', 'id'),       (SELECT MAX(id) FROM product));
SELECT setval(pg_get_serial_sequence('ecommerce."order"', 'id'),       (SELECT MAX(id) FROM "order"));


-- ================= BANKING =================
SET search_path TO banking;

-- --- Пользователи ---
INSERT INTO users (id, full_name, email, status, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Иван Петров',      'ivan.b@example.com',   'ACTIVE',  NOW() - INTERVAL '200 days'),
  ('22222222-2222-2222-2222-222222222222', 'Мария Сидорова',   'maria.b@example.com',  'ACTIVE',  NOW() - INTERVAL '150 days'),
  ('33333333-3333-3333-3333-333333333333', 'Алексей Кузнецов', 'alex.b@example.com',   'BLOCKED', NOW() - INTERVAL '100 days'),
  -- BUG-9: пользователь без активного счёта
  ('44444444-4444-4444-4444-444444444444', 'Ольга Смирнова',   'olga.b@example.com',   'ACTIVE',  NOW() - INTERVAL '50 days');

-- --- Счета ---
INSERT INTO accounts (id, user_id, balance, currency, status, created_at) VALUES
  ('a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 100000.00, 'RUB', 'ACTIVE', NOW() - INTERVAL '199 days'),
  ('a0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',  50000.00, 'RUB', 'ACTIVE', NOW() - INTERVAL '149 days'),
  -- счёт заблокированного пользователя, сам счёт FROZEN
  ('a0000003-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333',  20000.00, 'RUB', 'FROZEN', NOW() - INTERVAL '99 days'),
  -- валютный счёт (для проверки несовпадения валют)
  ('a0000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111',   1000.00, 'USD', 'ACTIVE', NOW() - INTERVAL '80 days');
  -- у пользователя 44444444 (Ольга) НЕТ счёта вообще -> BUG-9

-- --- Транзакции ---
INSERT INTO transactions
  (id, source_account_id, destination_account_id, amount, currency, status, idempotency_key, created_at) VALUES
  -- нормальный завершённый перевод RUB
  ('c0000001-0000-0000-0000-000000000001',
   'a0000001-0000-0000-0000-000000000001', 'a0000002-0000-0000-0000-000000000002',
   5000.00, 'RUB', 'COMPLETED', 'key-0001', NOW() - INTERVAL '10 days'),

  -- BUG-4: зависшая транзакция в PENDING старше 1 часа
  ('c0000002-0000-0000-0000-000000000002',
   'a0000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001',
   1500.00, 'RUB', 'PENDING', 'key-0002', NOW() - INTERVAL '3 hours'),

  -- BUG-5: перевод самому себе (source = destination)
  ('c0000003-0000-0000-0000-000000000003',
   'a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001',
   100.00, 'RUB', 'COMPLETED', 'key-0003', NOW() - INTERVAL '5 days'),

  -- BUG-6: COMPLETED перевод СО счёта в статусе FROZEN
  ('c0000004-0000-0000-0000-000000000004',
   'a0000003-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001',
   2000.00, 'RUB', 'COMPLETED', 'key-0004', NOW() - INTERVAL '4 days'),

  -- BUG-7: валюта транзакции (EUR) не совпадает с валютой счёта-источника (RUB)
  ('c0000005-0000-0000-0000-000000000005',
   'a0000001-0000-0000-0000-000000000001', 'a0000002-0000-0000-0000-000000000002',
   300.00, 'EUR', 'COMPLETED', 'key-0005', NOW() - INTERVAL '3 days'),

  -- BUG-8 (часть): два COMPLETED с одинаковым idempotency_key -> дубликат
  ('c0000006-0000-0000-0000-000000000006',
   'a0000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001',
   700.00, 'RUB', 'COMPLETED', 'key-DUP', NOW() - INTERVAL '2 days'),
  ('c0000007-0000-0000-0000-000000000007',
   'a0000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001',
   700.00, 'RUB', 'COMPLETED', 'key-DUP', NOW() - INTERVAL '2 days' + INTERVAL '1 second'),

  -- одна FAILED транзакция (для процента ошибок по дням)
  ('c0000008-0000-0000-0000-000000000008',
   'a0000001-0000-0000-0000-000000000001', 'a0000002-0000-0000-0000-000000000002',
   999.00, 'RUB', 'FAILED', 'key-0008', NOW() - INTERVAL '1 days');

-- --- Шаблоны платежей ---
INSERT INTO payment_templates (id, user_id, name, destination_account_id, amount, currency, created_at) VALUES
  ('d0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Маме на телефон', 'a0000002-0000-0000-0000-000000000002', 1000.00, 'RUB', NOW() - INTERVAL '30 days');

-- --- Outbox events ---
INSERT INTO outbox_events (id, aggregate_id, event_type, payload, processed, created_at) VALUES
  -- обработанное событие
  ('e0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001',
   'transfer_completed', '{"amount":5000}', TRUE,  NOW() - INTERVAL '10 days'),
  -- BUG-8(b): необработанное событие старше 5 минут
  ('e0000002-0000-0000-0000-000000000002', 'c0000006-0000-0000-0000-000000000006',
   'transfer_completed', '{"amount":700}',  FALSE, NOW() - INTERVAL '2 hours');

-- ============================================================
--  Карта багов (для проверки себя):
--  BUG-1  order.sum != SUM(count*price)      -> "order" id=2
--  BUG-2  адрес чужого клиента                -> "order" id=3 (address клиента 1)
--  BUG-3  мусорный статус 'in_progres'        -> "order" id=4
--  BUG-4  зависший PENDING > 1 часа           -> transaction c...02
--  BUG-5  перевод самому себе                 -> transaction c...03
--  BUG-6  COMPLETED со счёта FROZEN           -> transaction c...04
--  BUG-7  валюта tx != валюта счёта           -> transaction c...05
--  BUG-8  дубль idempotency_key 'key-DUP' +
--         необработанный outbox > 5 мин       -> tx c...06/07, event e...02
--  BUG-9  пользователь без активного счёта     -> user 4444... (Ольга)
--  BUG-10 клиент без заказов                  -> client id=5 (Дмитрий)
-- ============================================================
