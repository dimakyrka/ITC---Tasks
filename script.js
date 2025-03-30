document.addEventListener('DOMContentLoaded', function() {
    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app-screen');
    const passwordInput = document.getElementById('password-input');
    const authButton = document.getElementById('auth-button');
    const newTaskInput = document.getElementById('new-task-input');
    const addTaskButton = document.getElementById('add-task-button');
    const tasksList = document.getElementById('tasks-list');

    // Проверяем авторизацию при загрузке
    checkAuth();

    authButton.addEventListener('click', authenticate);
    addTaskButton.addEventListener('click', addTask);

    function checkAuth() {
        // Проверяем куки или localStorage для авторизации
        const authToken = document.cookie.split('; ').find(row => row.startsWith('auth_token='));
        if (authToken) {
            authScreen.classList.add('hidden');
            appScreen.classList.remove('hidden');
            loadTasks();
        }
    }

    function authenticate() {
        const password = passwordInput.value;
        if (!password) return;

        fetch('/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                authScreen.classList.add('hidden');
                appScreen.classList.remove('hidden');
                loadTasks();
            } else {
                alert('Неверный пароль');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ошибка авторизации');
        });
    }

    function loadTasks() {
        fetch('/tasks')
        .then(response => {
            if (response.status === 401) {
                // Не авторизован - показываем экран авторизации
                authScreen.classList.remove('hidden');
                appScreen.classList.add('hidden');
                return;
            }
            return response.json();
        })
        .then(data => {
            if (data && data.tasks) {
                renderTasks(data.tasks);
            }
        })
        .catch(error => console.error('Error:', error));
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

        // Добавляем обработчики для кнопок редактирования и удаления
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', editTask);
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', deleteTask);
        });
    }

    function addTask() {
        const text = newTaskInput.value.trim();
        if (!text) return;

        fetch('/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'add',
                text: text
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                newTaskInput.value = '';
                loadTasks();
            }
        })
        .catch(error => console.error('Error:', error));
    }

    function editTask(e) {
        const taskId = e.target.getAttribute('data-id');
        const taskElement = e.target.closest('.task');
        const taskText = taskElement.querySelector('.task-text').textContent;

        const newText = prompt('Редактировать задачу:', taskText);
        if (newText !== null && newText.trim() !== '') {
            fetch('/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update',
                    id: taskId,
                    text: newText.trim()
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadTasks();
                }
            })
            .catch(error => console.error('Error:', error));
        }
    }

    function deleteTask(e) {
        const taskId = e.target.getAttribute('data-id');
        if (confirm('Удалить эту задачу?')) {
            fetch('/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    id: taskId
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadTasks();
                }
            })
            .catch(error => console.error('Error:', error));
        }
    }
});
