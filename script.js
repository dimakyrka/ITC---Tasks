document.addEventListener('DOMContentLoaded', function() {
    const newTaskInput = document.getElementById('new-task-input');
    const addTaskButton = document.getElementById('add-task-button');
    const tasksList = document.getElementById('tasks-list');

    // URL вашего локального сервера Flask
    const API_BASE_URL = 'http://localhost:5000';

    // Загружаем задачи при старте
    loadTasks();

    addTaskButton.addEventListener('click', addTask);
    newTaskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });

    async function loadTasks() {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`);
            const data = await response.json();
            
            if (data.tasks) {
                renderTasks(data.tasks);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Не удалось загрузить задачи. Убедитесь, что сервер запущен.');
        }
    }

    function renderTasks(tasks) {
        tasksList.innerHTML = '';
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task';
            taskElement.innerHTML = `
                <div class="task-text">${task.text}</div>
                <div class="task-actions">
                    <button class="edit-button" data-id="${task.id}">✏️</button>
                    <button class="delete-button" data-id="${task.id}">🗑️</button>
                </div>
            `;
            tasksList.appendChild(taskElement);
        });

        // Обработчики для кнопок
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', editTask);
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', deleteTask);
        });
    }

    async function addTask() {
        const text = newTaskInput.value.trim();
        if (!text) return;

        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'add',
                    text: text
                })
            });
            
            const data = await response.json();
            if (data.success) {
                newTaskInput.value = '';
                loadTasks();
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Не удалось добавить задачу');
        }
    }

    async function editTask(e) {
        const taskId = e.target.getAttribute
