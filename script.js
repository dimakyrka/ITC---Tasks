const API_URL = 'http://localhost:5000'; // Для разработки

// Проверка соединения с сервером
async function checkServer() {
    try {
        const response = await fetch(`${API_URL}/test`);
        if (!response.ok) throw new Error("Сервер не отвечает");
        const data = await response.json();
        console.log("Тест сервера:", data.message);
        return true;
    } catch (error) {
        console.error("Ошибка соединения:", error);
        alert("Сервер не доступен. Попробуйте позже.");
        return false;
    }
}

// Основные функции
async function loadTasks() {
    const response = await fetch(`${API_URL}/get-tasks`);
    if (!response.ok) throw new Error("Ошибка загрузки");
    const data = await response.json();
    return data.tasks || [];
}

async function saveTasks(tasks) {
    const response = await fetch(`${API_URL}/save-tasks`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({tasks})
    });
    if (!response.ok) throw new Error("Ошибка сохранения");
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    if (await checkServer()) {
        try {
            tasks = await loadTasks();
            renderTasks();
        } catch (error) {
            alert(error.message);
        }
    }
});

// ... остальные функции (renderTasks, addTask и обработчики) без изменений
