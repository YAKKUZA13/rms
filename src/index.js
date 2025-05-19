const express = require('express');
const cors = require('cors');
const path = require('path');
const ticketRoutes = require('./routes/ticketRoutes');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', ticketRoutes);

app.get('/api-docs', (req, res) => {
  res.send(`
    <h1>Ticket Management API</h1>
    <h2>Доступные эндпоинты:</h2>
    <ul>
      <li><strong>POST /api/tickets</strong> - Создать новое обращение</li>
      <li><strong>PUT /api/tickets/cancel-all-in-progress</strong> - Отменить все обращения "В работе"</li>
      <li><strong>PUT /api/tickets/:id/take</strong> - Взять обращение в работу</li>
      <li><strong>PUT /api/tickets/:id/complete</strong> - Завершить обработку обращения</li>
      <li><strong>PUT /api/tickets/:id/cancel</strong> - Отменить обращение</li>
      <li><strong>GET /api/tickets</strong> - Получить список обращений с фильтрацией по дате</li>
    </ul>
  `);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
}); 