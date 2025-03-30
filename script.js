const taskInput = document.getElementById("new-task");
const addTaskButton = document.getElementById("add-task");
const taskList = document.getElementById("task-list");

let tasks = []; // Здесь будут храниться задачи (пока в памяти браузера)

// Функция для отображения задач
function renderTasks() {
    taskList.innerHTML = ""; // Очищаем список
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
function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText !== "") {
        tasks.push(taskText);
        taskInput.value = "";
        renderTasks();
        // TODO:  Здесь нужно будет отправлять задачи на сервер (bot.py)
    }
}

// Обработчики событий
addTaskButton.addEventListener("click", addTask);

taskList.addEventListener("click", (event) => {
    const target = event.target;
    const index = target.dataset.index;

    if (target.classList.contains("delete-task")) {
        tasks.splice(index, 1);
        renderTasks();
        // TODO:  Здесь нужно будет отправлять задачи на сервер (bot.py)
    } else if (target.classList.contains("edit-task")) {
        const newText = prompt("Редактировать задачу:", tasks[index]);
        if (newText !== null) {
            tasks[index] = newText;
            renderTasks();
            // TODO:  Здесь нужно будет отправлять задачи на сервер (bot.py)
        }
    }
});

// Инициализация (при загрузке страницы)
renderTasks();
