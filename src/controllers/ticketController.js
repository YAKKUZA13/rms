const pool = require('../db/db');

const STATUS_NEW = 'Новое';
const STATUS_IN_PROGRESS = 'В работе';
const STATUS_COMPLETED = 'Завершено';
const STATUS_CANCELED = 'Отменено';

exports.createTicket = async (req, res) => {
  try {
    const { subject, text } = req.body;
    
    if (!subject || !text) {
      return res.status(400).json({ message: 'Необходимо указать тему и текст обращения' });
    }
    
    const result = await pool.query(
      'INSERT INTO appeals (subject, text) VALUES ($1, $2) RETURNING *',
      [subject, text]
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
    
    res.json(result.rows);
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
    
    const result = await pool.query(
      `UPDATE appeals SET status = $1, cancellation_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE status = $3 RETURNING *`,
      [STATUS_CANCELED, cancellation_reason, STATUS_IN_PROGRESS]
    );
    
    res.json({
      message: `Отменено ${result.rows.length} обращений в работе`,
      tickets: result.rows
    });
  } catch (error) {
    console.error('Error canceling in-progress tickets:', error);
    res.status(500).json({ message: 'Ошибка сервера при отмене обращений в работе' });
  }
}; 