const taskInput = document.getElementById("new-task");
const addTaskButton = document.getElementById("add-task");
const taskList = document.getElementById("task-list");

// Для локального тестирования (Flask на порту 5000)
const API_BASE_URL = 'http://localhost:5000';

let tasks = [];

// Загружаем задачи при старте приложения
document.addEventListener('DOMContentLoaded', async () => {
    tasks = await loadTasks();
    renderTasks();
});

// Функция загрузки задач с сервера
async function loadTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-tasks`);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error("Ошибка загрузки задач:", error);
        // Показываем уведомление в интерфейсе
        alert("Не удалось загрузить задачи. Проверьте подключение.");
    }
    return [];
}

// Функция сохранения задач на сервер
async function saveTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/save-tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tasks)
        });
        
        if (!response.ok) {
            throw new Error("Ошибка сохранения");
        }
    } catch (error) {
        console.error("Ошибка сохранения задач:", error);
        alert("Не удалось сохранить задачи. Попробуйте снова.");
    }
}

// Отображение задач
function renderTasks() {
    taskList.innerHTML = "";
    tasks.forEach((task, index) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <span>${task}</span>
            <button class="edit-task" data-index="${index}">✏️</button>
            <button class="delete-task" data-index="${index}">🗑️</button>
        `;
        taskList.appendChild(listItem);
    });
}

// Добавление новой задачи
async function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText !== "") {
        tasks.push(taskText);
        taskInput.value = "";
        renderTasks();
        await saveTasks();
    }
}

// Обработчики событий
addTaskButton.addEventListener("click", addTask);

// Обработка нажатия Enter в поле ввода
taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        addTask();
    }
});

taskList.addEventListener("click", async (event) => {
    const target = event.target;
    const index = target.dataset.index;

    if (target.classList.contains("delete-task")) {
        if (confirm("Вы уверены, что хотите удалить эту задачу?")) {
            tasks.splice(index, 1);
            renderTasks();
            await saveTasks();
        }
    } else if (target.classList.contains("edit-task")) {
        const newText = prompt("Редактировать задачу:", tasks[index]);
        if (newText !== null && newText.trim() !== "") {
            tasks[index] = newText.trim();
            renderTasks();
            await saveTasks();
        }
    }
});

// Инициализация WebApp Telegram
Telegram.WebApp.ready();
Telegram.WebApp.expand();

// Опционально: отправка данных назад в бота при закрытии
window.addEventListener('beforeunload', () => {
    Telegram.WebApp.sendData(JSON.stringify(tasks));
});
