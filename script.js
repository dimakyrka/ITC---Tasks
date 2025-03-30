document.addEventListener('DOMContentLoaded', function() {
    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app-screen');
    const passwordInput = document.getElementById('password-input');
    const authButton = document.getElementById('auth-button');
    const newTaskInput = document.getElementById('new-task-input');
    const addTaskButton = document.getElementById('add-task-button');
    const tasksList = document.getElementById('tasks-list');

    // Конфигурация
    const PASSWORD = "123"; // Пароль для доступа (измените на свой)
    const AUTH_KEY = "task_manager_auth";
    const TASKS_KEY = "task_manager_tasks";

    // Проверяем авторизацию при загрузке
    checkAuth();

    authButton.addEventListener('click', authenticate);
    addTaskButton.addEventListener('click', addTask);
    newTaskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });

    function checkAuth() {
        const isAuthenticated = localStorage.getItem(AUTH_KEY) === PASSWORD;
        if (isAuthenticated) {
            authScreen.classList.add('hidden');
            appScreen.classList.remove('hidden');
            loadTasks();
        }
    }

    function authenticate() {
        const password = passwordInput.value;
        if (password === PASSWORD) {
            localStorage.setItem(AUTH_KEY, password);
            authScreen.classList.add('hidden');
            appScreen.classList.remove('hidden');
            loadTasks();
        } else {
            alert('Неверный пароль');
        }
    }

    function loadTasks() {
        const tasksData = localStorage.getItem(TASKS_KEY);
        const tasks = tasksData ? JSON.parse(tasksData) : [];
        renderTasks(tasks);
    }

    function saveTasks(tasks) {
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
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

        const tasksData = localStorage.getItem(TASKS_KEY);
        const tasks = tasksData ? JSON.parse(tasksData) : [];
        
        const taskId = Date.now().toString();
        tasks.push({ id: taskId, text: text });
        
        saveTasks(tasks);
        newTaskInput.value = '';
        renderTasks(tasks);
    }

    function editTask(e) {
        const taskId = e.target.getAttribute('data-id');
        const tasks = JSON.parse(localStorage.getItem(TASKS_KEY) || [];
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) return;

        const newText = prompt('Редактировать задачу:', task.text);
        if (newText !== null && newText.trim() !== '') {
            task.text = newText.trim();
            saveTasks(tasks);
            renderTasks(tasks);
        }
    }

    function deleteTask(e) {
        const taskId = e.target.getAttribute('data-id');
        if (confirm('Удалить эту задачу?')) {
            const tasks = JSON.parse(localStorage.getItem(TASKS_KEY)) || [];
            const filteredTasks = tasks.filter(task => task.id !== taskId);
            saveTasks(filteredTasks);
            renderTasks(filteredTasks);
        }
    }
});
