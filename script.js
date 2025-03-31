// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDgo9-fdGZ44YCIVrA99y1JjPnETnpf6As",
    authDomain: "itc-tasks.firebaseapp.com",
    databaseURL: "https://itc-tasks-default-rtdb.firebaseio.com",
    projectId: "itc-tasks",
    storageBucket: "itc-tasks.firebasestorage.app",
    messagingSenderId: "736776837496",
    appId: "1:736776837496:web:27341fe39226d1b8d0108d"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const tasksRef = database.ref('tasks');

function initDatabaseStructure() {
  tasksRef.once('value').then((snapshot) => {
    if (!snapshot.exists()) {
      tasksRef.set({
        events: [],
        tasks: [],
        subtasks: {}
      });
    }
  });
}

// Вызов после инициализации Firebase
initDatabaseStructure();

// Состояния
let currentTab = 'events';
let tasks = [];
let events = [];
let subtasks = {}; // Хранение подзадач в формате { taskId: [subtask1, subtask2] }

// DOM элементы
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Переключение вкладок
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        currentTab = btn.dataset.tab;
    });
});

// Загрузка данных из Firebase
tasksRef.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    events = data.events || [];
    tasks = data.tasks || [];
    subtasks = data.subtasks || {};
    
    renderEvents();
    renderTasks();
});

// Рендер мероприятий (аналог старых задач)
function renderEvents() {
    const list = document.getElementById('events-list');
    list.innerHTML = '';
    
    events.forEach((event, index) => {
        const eventEl = document.createElement('li');
        eventEl.className = 'task';
        eventEl.style.borderLeftColor = event.color || '#e5e7eb';
        eventEl.innerHTML = `
            <div class="task-content">${event.text}</div>
            <div class="task-actions">
                <button class="btn-icon edit-btn">✏️</button>
                <button class="btn-icon delete-btn">🗑️</button>
            </div>
        `;
        list.appendChild(eventEl);
    });
}

// Рендер задач с подзадачами
function renderTasks() {
    const list = document.getElementById('tasks-list');
    list.innerHTML = '';
    
    tasks.forEach((task, index) => {
        const taskEl = document.createElement('li');
        taskEl.className = 'task';
        taskEl.style.borderLeftColor = task.color || '#e5e7eb';
        taskEl.innerHTML = `
            <div class="task-content">${task.text}</div>
            <div class="task-actions">
                <button class="btn-icon edit-btn">✏️</button>
                <button class="btn-icon delete-btn">🗑️</button>
            </div>
            <div class="subtasks-container" id="subtasks-${index}"></div>
        `;
        list.appendChild(taskEl);
        
        // Отображение подзадач
        const subtaskContainer = document.getElementById(`subtasks-${index}`);
        if (subtasks[index]) {
            subtasks[index].forEach((subtask, subIndex) => {
                const subtaskEl = document.createElement('div');
                subtaskEl.className = 'subtask';
                subtaskEl.innerHTML = `
                    <input type="checkbox" ${subtask.checked ? 'checked' : ''}>
                    <span>${subtask.text}</span>
                `;
                subtaskContainer.appendChild(subtaskEl);
            });
        }
        
        // Добавление новой подзадачи
        const subtaskInput = document.createElement('input');
        subtaskInput.type = 'text';
        subtaskInput.className = 'subtask-input';
        subtaskInput.placeholder = 'Добавить подзадачу...';
        subtaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && subtaskInput.value.trim()) {
                addSubtask(index, subtaskInput.value.trim());
                subtaskInput.value = '';
            }
        });
        subtaskContainer.appendChild(subtaskInput);
    });
}

// Добавление подзадачи
function addSubtask(taskIndex, text) {
    if (!subtasks[taskIndex]) subtasks[taskIndex] = [];
    
    subtasks[taskIndex].push({
        text: text,
        checked: false
    });
    
    // Сохранение в Firebase
    tasksRef.update({ subtasks: subtasks });
}
