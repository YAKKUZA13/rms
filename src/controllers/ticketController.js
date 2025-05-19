const pool = require('../db/db');

// Константы статусов для обработки кодировки
const STATUS_NEW = 'Новое';
const STATUS_IN_PROGRESS = 'В работе';
const STATUS_COMPLETED = 'Завершено';
const STATUS_CANCELED = 'Отменено';

function compareStatus(dbStatus, expectedStatus) {
  if (expectedStatus === STATUS_NEW) {
    return dbStatus === STATUS_NEW || 
           dbStatus === '╨Э╨╛╨▓╨╛╨╡' || 
           dbStatus === 'ютюх' || 
           dbStatus === 'PH', // Измененные символы
           dbStatus.includes('ов');
  }
  
  // Для статуса "В работе"
  if (expectedStatus === STATUS_IN_PROGRESS) {
    return dbStatus === STATUS_IN_PROGRESS || 
           dbStatus === '╨Т ╤А╨░╨▒╨╛╤В╨╡' || 
           dbStatus === 'P', // Измененные символы
           dbStatus.includes('абот');
  }
  
  // Для статуса "Завершено"
  if (expectedStatus === STATUS_COMPLETED) {
    return dbStatus === STATUS_COMPLETED || 
           dbStatus === '╨Ч╨░╨▓╨╡╤А╤И╨╡╨╜╨╛' || 
           dbStatus === 'P3', // Измененные символы
           dbStatus.includes('ерш');
  }
  
  // Для статуса "Отменено"
  if (expectedStatus === STATUS_CANCELED) {
    return dbStatus === STATUS_CANCELED || 
           dbStatus === '╨Ю╤В╨╝╨╡╨╜╨╡╨╜╨╛' || 
           dbStatus === 'PO', // Измененные символы
           dbStatus.includes('мен');
  }
  
  return false;
}

exports.createTicket = async (req, res) => {
  try {
    const { subject, content } = req.body;
    
    if (!subject || !content) {
      return res.status(400).json({ message: 'Необходимо указать тему и текст обращения' });
    }
    
    const result = await pool.query(
      'INSERT INTO appeals (subject, text) VALUES ($1, $2) RETURNING *',
      [subject, content]
    );
    
    const ticket = result.rows[0];
    if (ticket) {
      ticket.status = STATUS_NEW;
    }
    
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании обращения' });
  }
};

exports.takeTicket = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ticketResult = await pool.query('SELECT * FROM appeals WHERE id = $1', [id]);
    
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ message: 'Обращение не найдено' });
    }
    
    const ticket = ticketResult.rows[0];
    console.log('Текущий статус обращения:', ticket.status);
    
    const result = await pool.query(
      'UPDATE appeals SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [STATUS_IN_PROGRESS, id]
    );
    
    const updatedTicket = result.rows[0];
    if (updatedTicket) {
      updatedTicket.status = STATUS_IN_PROGRESS;
    }
    
    res.json(updatedTicket);
  } catch (error) {
    console.error('Error taking ticket:', error);
    res.status(500).json({ message: 'Ошибка сервера при взятии обращения в работу' });
  }
};

exports.completeTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { solution } = req.body;
    
    if (!solution) {
      return res.status(400).json({ message: 'Необходимо указать решение проблемы' });
    }
    
    const ticketResult = await pool.query('SELECT * FROM appeals WHERE id = $1', [id]);
    
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ message: 'Обращение не найдено' });
    }
    
    const ticket = ticketResult.rows[0];
    console.log('Текущий статус обращения:', ticket.status);
    
    const result = await pool.query(
      'UPDATE appeals SET status = $1, solution = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [STATUS_COMPLETED, solution, id]
    );
    
    const updatedTicket = result.rows[0];
    if (updatedTicket) {
      updatedTicket.status = STATUS_COMPLETED;
    }
    
    res.json(updatedTicket);
  } catch (error) {
    console.error('Error completing ticket:', error);
    res.status(500).json({ message: 'Ошибка сервера при завершении обращения' });
  }
};

exports.cancelTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;
    
    if (!cancellation_reason) {
      return res.status(400).json({ message: 'Необходимо указать причину отмены' });
    }
    
    const ticketResult = await pool.query('SELECT * FROM appeals WHERE id = $1', [id]);
    
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ message: 'Обращение не найдено' });
    }
    
    const ticket = ticketResult.rows[0];
    console.log('Текущий статус обращения:', ticket.status);
    
    const result = await pool.query(
      'UPDATE appeals SET status = $1, cancellation_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [STATUS_CANCELED, cancellation_reason, id]
    );
    
    const updatedTicket = result.rows[0];
    if (updatedTicket) {
      updatedTicket.status = STATUS_CANCELED;
    }
    
    res.json(updatedTicket);
  } catch (error) {
    console.error('Error canceling ticket:', error);
    res.status(500).json({ message: 'Ошибка сервера при отмене обращения' });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM appeals';
    let params = [];
    
    if (date) {
      query += ' WHERE DATE(created_at) = $1';
      params.push(date);
    } else if (startDate && endDate) {
      query += ' WHERE DATE(created_at) BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    const tickets = result.rows.map(ticket => {
      const t = {...ticket};
      if (compareStatus(t.status, STATUS_NEW)) t.status = STATUS_NEW;
      else if (compareStatus(t.status, STATUS_IN_PROGRESS)) t.status = STATUS_IN_PROGRESS;
      else if (compareStatus(t.status, STATUS_COMPLETED)) t.status = STATUS_COMPLETED;
      else if (compareStatus(t.status, STATUS_CANCELED)) t.status = STATUS_CANCELED;
      return t;
    });
    
    res.json(tickets);
  } catch (error) {
    console.error('Error getting tickets:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении списка обращений' });
  }
};

exports.cancelAllInProgressTickets = async (req, res) => {
  try {
    const { cancellation_reason } = req.body;
    
    if (!cancellation_reason) {
      return res.status(400).json({ message: 'Необходимо указать причину отмены' });
    }
    
    const statuses = ['В работе', '╨Т ╤А╨░╨▒╨╛╤В╨╡', 'P']; // Измененные символы
    const placeholders = statuses.map((_, i) => `$${i + 2}`).join(', ');
    
    const result = await pool.query(
      `UPDATE appeals SET status = $1, cancellation_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE status IN (${placeholders}) RETURNING *`,
      [STATUS_CANCELED, cancellation_reason, ...statuses]
    );
    
    const tickets = result.rows.map(ticket => {
      const t = {...ticket};
      t.status = STATUS_CANCELED;
      return t;
    });
    
    res.json({
      message: `Отменено ${tickets.length} обращений в работе`,
      tickets: tickets
    });
  } catch (error) {
    console.error('Error canceling in-progress tickets:', error);
    res.status(500).json({ message: 'Ошибка сервера при отмене обращений в работе' });
  }
}; 