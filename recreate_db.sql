DROP DATABASE IF EXISTS tickets_utf8;

CREATE DATABASE tickets_utf8 WITH ENCODING = 'UTF8' LC_COLLATE = 'Russian_Russia.UTF8' LC_CTYPE = 'Russian_Russia.UTF8' TEMPLATE = template0;

\c tickets_utf8

CREATE TABLE appeals (
  id SERIAL PRIMARY KEY, 
  subject VARCHAR(255) NOT NULL, 
  text TEXT NOT NULL, 
  status VARCHAR(50) DEFAULT 'Новое',
  solution TEXT, 
  cancellation_reason TEXT, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, 
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO appeals (subject, text, status)
VALUES 
  ('Тестовое обращение 1', 'Описание тестового обращения 1', 'Новое'),
  ('Тестовое обращение 2', 'Описание тестового обращения 2', 'В работе'); 