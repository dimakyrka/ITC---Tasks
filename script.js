// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDgo9-fdGZ44YCIVrA99y1JjPnETnpf6As",
  authDomain: "itc-tasks.firebaseapp.com",
  databaseURL: "https://itc-tasks-default-rtdb.firebaseio.com",
  projectId: "itc-tasks",
  storageBucket: "itc-tasks.appspot.com",
  messagingSenderId: "736776837496",
  appId: "1:736776837496:web:27341fe39226d1b8d0108d"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const dbRef = database.ref('/');

// Глобальные переменные
let currentEditIndex = null;
let currentDeleteIndex = null;
let selectedColor = "#e5e7eb";
let currentTab = 'events';

// DOM элементы
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const addEventBtn = document.getElementById('add-event-btn');
const addTaskBtn = document.getElementById('add-task-btn');
const eventInput = document.getElementById('event-input');
const taskInput = document.getElementById('task-input');
const eventsList = document.getElementById('events-list');
const tasksList = document.getElementById('tasks-list');

// Инициализация приложения
function initApp() {
  setupTabs();
  setupEventHandlers();
  setupTaskHandlers();
  loadData();
  setupColorPicker();
}

// Загрузка данных
function loadData() {
  dbRef.on('value', (snapshot) => {
    const data = snapshot.val() || { events: [], tasks: [] };
    console.log("Data loaded:", data); // Отладка
    
    if (data.events) {
      renderEvents(data.events);
    }
    
    if (data.tasks) {
      renderTasks(data.tasks);
    }
  });
}

// Рендер мероприятий
function renderEvents(events) {
  eventsList.innerHTML = '';
  
  if (!events || events.length === 0) {
    eventsList.innerHTML = '<p class="empty">Нет мероприятий</p>';
    return;
  }

  events.forEach((event, index) => {
    const eventEl = document.createElement('li');
    eventEl.className = 'task';
    eventEl.style.borderLeftColor = event.color || '#e5e7eb';
    eventEl.dataset.index = index;
    
    eventEl.innerHTML = `
      <div class="task-content">${event.text}</div>
      <div class="task-actions">
        <button class="btn-icon edit-btn">✏️</button>
        <button class="btn-icon delete-btn">🗑️</button>
      </div>
    `;
    
    eventsList.appendChild(eventEl);
  });
}

function renderTasks(tasks) {
  const tasksList = document.getElementById('tasks-list');
  tasksList.innerHTML = '';

  if (!tasks || tasks.length === 0) {
    tasksList.innerHTML = '<p class="empty">Нет задач</p>';
    return;
  }

  tasks.forEach((task, index) => {
    const taskEl = document.createElement('li');
    taskEl.className = 'task';
    taskEl.style.borderLeftColor = task.color || '#e5e7eb';
    taskEl.dataset.index = index;

    taskEl.innerHTML = `
      <div class="task-content">${task.text}</div>
      <div class="task-actions">
        <button class="btn-icon edit-btn">✏️</button>
        <button class="btn-icon delete-btn">🗑️</button>
      </div>
      <div class="subtasks-container" id="subtasks-${index}"></div>
    `;

    // Рендер подзадач
    const subtaskContainer = taskEl.querySelector(`#subtasks-${index}`);
    if (task.subtasks && task.subtasks.length > 0) {
      task.subtasks.forEach((subtask, subIndex) => {
        const subtaskEl = document.createElement('div');
        subtaskEl.className = 'subtask';
        subtaskEl.innerHTML = `
          <input type="checkbox" ${subtask.checked ? 'checked' : ''} 
            data-task-index="${index}" data-subtask-index="${subIndex}">
          <span>${subtask.text}</span>
        `;
        subtaskContainer.appendChild(subtaskEl);
      });
    }

    // Поле для новой подзадачи
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
    tasksList.appendChild(taskEl);
  });
}

// Добавление подзадачи
function addSubtask(taskIndex, text) {
  const subtaskRef = dbRef.child(`tasks/${taskIndex}/subtasks`);
  subtaskRef.transaction((subtasks) => {
    subtasks = subtasks || [];
    subtasks.push({ text, checked: false });
    return subtasks;
  });
}

// Инициализация вкладок
function setupTabs() {
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
      currentTab = btn.dataset.tab;
    });
  });
}

// Обработчики мероприятий
function setupEventHandlers() {
  addEventBtn.addEventListener('click', addEvent);
  eventInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addEvent();
  });
}

function addEvent() {
  const text = eventInput.value.trim();
  if (text) {
    dbRef.child('events').transaction((events) => {
      events = events || [];
      events.unshift({ 
        text, 
        color: "#e5e7eb",
        createdAt: Date.now() 
      });
      return events;
    });
    eventInput.value = '';
  }
}

// Обработчики задач
function setupTaskHandlers() {
  addTaskBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });
}

function addTask() {
  const text = taskInput.value.trim();
  if (text) {
    dbRef.child('tasks').transaction((tasks) => {
      tasks = tasks || [];
      tasks.unshift({ 
        text, 
        color: "#e5e7eb",
        subtasks: [],
        createdAt: Date.now()
      });
      return tasks;
    });
    taskInput.value = '';
  }
}

// Выбор цвета
function setupColorPicker() {
  document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
      selectedColor = option.dataset.color;
      document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.color === selectedColor);
      });
    });
  });
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);
