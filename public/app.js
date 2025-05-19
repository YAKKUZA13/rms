document.addEventListener('DOMContentLoaded', () => {
    // Элементы интерфейса
    const createTicketForm = document.getElementById('createTicketForm');
    const manageTicketForm = document.getElementById('manageTicketForm');
    const cancelAllForm = document.getElementById('cancelAllForm');
    const ticketsList = document.getElementById('ticketsList');
    const notification = document.getElementById('notification');
    const actionSelect = document.getElementById('action');
    const solutionGroup = document.getElementById('solutionGroup');
    const cancellationGroup = document.getElementById('cancellationGroup');
    const dateFilter = document.getElementById('dateFilter');
    const applyDateFilter = document.getElementById('applyDateFilter');
    const clearFilters = document.getElementById('clearFilters');

    const API_URL = '/api';

    function showNotification(message, isSuccess = true) {
        notification.textContent = message;
        notification.className = isSuccess ? 'notification success' : 'notification error';
        
        setTimeout(() => {
            notification.className = 'notification';
        }, 3000);
    }

    function fixEncoding(text) {
        if (!text) return '';
        
        const replacements = {
            "РќРѕРІРѕРµ": "Новое",
            "Р' СЂР°Р±РѕС‚Рµ": "В работе",
            "Р—Р°РІРµСЂС€РµРЅРѕ": "Завершено",
            "РћС‚РјРµРЅРµРЅРѕ": "Отменено",
            "╨Э╨╛╨▓╨╛╨╡": "Новое",
            "╨Т ╤А╨░╨▒╨╛╤В╨╡": "В работе",
            "╨Ч╨░╨▓╨╡╤А╤И╨╡╨╜╨╛": "Завершено",
            "╨Ю╤В╨╝╨╡╨╜╨╡╨╜╨╛": "Отменено",
            "ютюх": "Новое"
        };
        
        for (const [encoded, decoded] of Object.entries(replacements)) {
            if (text.includes(encoded)) {
                return text.replace(new RegExp(encoded, 'g'), decoded);
            }
        }
        
        return text;
    }

    function getStatusText(status) {
        const fixedStatus = fixEncoding(status);
        
        if (fixedStatus === status) {
            if (status.includes('ют')) return 'Новое';
            if (status.includes('раб')) return 'В работе';
            if (status.includes('верш')) return 'Завершено';
            if (status.includes('тме')) return 'Отменено';
            return 'Новое'; // По умолчанию
        }
        
        return fixedStatus;
    }

    function loadTickets(date = null) {
        ticketsList.innerHTML = '<div class="loading">Загрузка...</div>';
        
        let url = `${API_URL}/tickets`;
        if (date) {
            url += `?date=${date}`;
        }
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при загрузке обращений');
                }
                return response.json();
            })
            .then(tickets => {
                if (tickets.length === 0) {
                    ticketsList.innerHTML = '<div class="loading">Нет обращений</div>';
                    return;
                }
                
                ticketsList.innerHTML = '';
                tickets.forEach(ticket => {
                    const status = getStatusText(ticket.status);
                    const statusClass = getStatusClass(status);
                    
                    const ticketElement = document.createElement('div');
                    ticketElement.className = 'ticket-item';
                    
                    const formattedDate = new Date(ticket.created_at).toLocaleString('ru-RU');
                    
                    const subject = fixEncoding(ticket.subject);
                    const text = fixEncoding(ticket.text);
                    const solution = ticket.solution ? fixEncoding(ticket.solution) : '';
                    const cancellation_reason = ticket.cancellation_reason ? fixEncoding(ticket.cancellation_reason) : '';
                    
                    ticketElement.innerHTML = `
                        <div class="ticket-header">
                            <span class="ticket-id">ID: ${ticket.id}</span>
                            <span class="status ${statusClass}">${status}</span>
                        </div>
                        <h3>${subject}</h3>
                        <p>${text}</p>
                        <p><small>Создано: ${formattedDate}</small></p>
                        ${solution ? `<div class="solution"><strong>Решение:</strong> ${solution}</div>` : ''}
                        ${cancellation_reason ? `<div class="cancellation"><strong>Причина отмены:</strong> ${cancellation_reason}</div>` : ''}
                    `;
                    
                    ticketsList.appendChild(ticketElement);
                });
            })
            .catch(error => {
                console.error('Ошибка:', error);
                ticketsList.innerHTML = `<div class="loading">Ошибка загрузки: ${error.message}</div>`;
                showNotification(error.message, false);
            });
    }

    function getStatusClass(status) {
        switch (status) {
            case 'Новое': return 'status-new';
            case 'В работе': return 'status-in-progress';
            case 'Завершено': return 'status-completed';
            case 'Отменено': return 'status-canceled';
            default: return '';
        }
    }

    createTicketForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const subject = document.getElementById('subject').value;
        const content = document.getElementById('content').value;
        
        fetch(`${API_URL}/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                subject, 
                text: content 
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при создании обращения');
            }
            return response.json();
        })
        .then(data => {
            showNotification('Обращение успешно создано!');
            createTicketForm.reset();
            loadTickets(); 
        })
        .catch(error => {
            console.error('Ошибка:', error);
            showNotification(error.message, false);
        });
    });

    manageTicketForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const ticketId = document.getElementById('ticketId').value;
        const action = actionSelect.value;
        
        let url = `${API_URL}/tickets/${ticketId}/${action}`;
        let body = {};
        
        if (action === 'complete') {
            const solution = document.getElementById('solution').value;
            if (!solution) {
                showNotification('Необходимо указать решение проблемы', false);
                return;
            }
            body.solution = solution;
        } else if (action === 'cancel') {
            const reason = document.getElementById('cancellation_reason').value;
            if (!reason) {
                showNotification('Необходимо указать причину отмены', false);
                return;
            }
            body.cancellation_reason = reason;
        }
        
        fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    data.message = fixEncoding(data.message);
                    throw new Error(data.message || 'Ошибка при обработке обращения');
                });
            }
            return response.json();
        })
        .then(data => {
            let actionText = '';
            switch (action) {
                case 'take': actionText = 'взято в работу'; break;
                case 'complete': actionText = 'завершено'; break;
                case 'cancel': actionText = 'отменено'; break;
            }
            
            showNotification(`Обращение успешно ${actionText}!`);
            manageTicketForm.reset();
            loadTickets(); 
        })
        .catch(error => {
            console.error('Ошибка:', error);
            showNotification(error.message, false);
        });
    });

    cancelAllForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const reason = document.getElementById('cancelAllReason').value;
        
        if (!confirm('Вы уверены, что хотите отменить все обращения в работе?')) {
            return;
        }
        
        fetch(`${API_URL}/tickets/cancel-all-in-progress`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cancellation_reason: reason })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при отмене обращений');
            }
            return response.json();
        })
        .then(data => {
            showNotification(`${fixEncoding(data.message)}`);
            cancelAllForm.reset();
            loadTickets(); 
        })
        .catch(error => {
            console.error('Ошибка:', error);
            showNotification(error.message, false);
        });
    });

    actionSelect.addEventListener('change', () => {
        const action = actionSelect.value;
        
        solutionGroup.style.display = action === 'complete' ? 'block' : 'none';
        cancellationGroup.style.display = action === 'cancel' ? 'block' : 'none';
    });

    applyDateFilter.addEventListener('click', () => {
        const date = dateFilter.value;
        if (date) {
            loadTickets(date);
        }
    });

    clearFilters.addEventListener('click', () => {
        dateFilter.value = '';
        loadTickets();
    });

    loadTickets();
}); 