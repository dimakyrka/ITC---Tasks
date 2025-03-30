const taskInput = document.getElementById("new-task");
const addTaskButton = document.getElementById("add-task");
const taskList = document.getElementById("task-list");

let tasks = loadTasks() || []; // Загружаем задачи при старте

// Функция для загрузки задач с сервера
async function loadTasks() {
    try {
        const response = await fetch('https://your-server.com/get-tasks'); // Замените на ваш реальный URL
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error("Ошибка загрузки задач:", error);
    }
    return [];
}

// Функция для сохранения задач на сервер
async function saveTasks() {
    try {
        await fetch('https://your-server.com/save-tasks', { // Замените на ваш реальный URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tasks),
        });
    } catch (error) {
        console.error("Ошибка сохранения задач:", error);
    }
}

// Функция для отображения задач
function renderTasks() {
    taskList.innerHTML = "";
    tasks.forEach((task, index) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <span>${task}</span>
            <button class="edit-task" data-index="${index}">Редактировать</button>
            <button class="delete-task" data-index="${index}">Удалить</button>
        `;
        taskList.appendChild(listItem);
    });
}

// Функция для добавления задачи
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

taskList.addEventListener("click", async (event) => {
    const target = event.target;
    const index = target.dataset.index;

    if (target.classList.contains("delete-task")) {
        tasks.splice(index, 1);
        renderTasks();
        await saveTasks();
    } else if (target.classList.contains("edit-task")) {
        const newText = prompt("Редактировать задачу:", tasks[index]);
        if (newText !== null) {
            tasks[index] = newText;
            renderTasks();
            await saveTasks();
        }
    }
});

// Инициализация
renderTasks();
