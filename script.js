const taskInput = document.getElementById("new-task");
const addTaskButton = document.getElementById("add-task");
const taskList = document.getElementById("task-list");

// URL для локальной разработки
const API_URL = 'http://localhost:5000';

let tasks = [];

// Инициализация
async function init() {
    try {
        tasks = await loadTasks();
        renderTasks();
    } catch (error) {
        alert("Ошибка загрузки задач: " + error.message);
    }
}

// Загрузка задач
async function loadTasks() {
    const response = await fetch(`${API_URL}/get-tasks`);
    if (!response.ok) throw new Error("Сервер не отвечает");
    return await response.json();
}

// Сохранение задач
async function saveTasks() {
    const response = await fetch(`${API_URL}/save-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tasks)
    });
    if (!response.ok) throw new Error("Ошибка сохранения");
}

// Отображение задач
function renderTasks() {
    taskList.innerHTML = tasks.map((task, index) => `
        <li>
            <span>${task}</span>
            <button class="edit" data-index="${index}">✏️</button>
            <button class="delete" data-index="${index}">🗑️</button>
        </li>
    `).join('');
}

// Добавление задачи
async function addTask() {
    const text = taskInput.value.trim();
    if (text) {
        tasks.push(text);
        taskInput.value = "";
        await saveTasks();
        renderTasks();
    }
}

// Обработчики событий
addTaskButton.addEventListener("click", addTask);
taskInput.addEventListener("keypress", e => e.key === "Enter" && addTask());

taskList.addEventListener("click", async (e) => {
    const index = e.target.dataset.index;
    if (e.target.classList.contains("delete")) {
        if (confirm("Удалить задачу?")) {
            tasks.splice(index, 1);
            await saveTasks();
            renderTasks();
        }
    } else if (e.target.classList.contains("edit")) {
        const newText = prompt("Редактировать:", tasks[index]);
        if (newText && newText.trim()) {
            tasks[index] = newText.trim();
            await saveTasks();
            renderTasks();
        }
    }
});

// Инициализация приложения
Telegram.WebApp.ready();
Telegram.WebApp.expand
