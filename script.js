// Конфигурация Firebase (замените на свои данные!)
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
let currentTaskId = null;

// DOM элементы
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const addEventBtn = document.getElementById('add-event-btn');
const addTaskBtn = document.getElementById('add-task-btn');
const editModal = document.getElementById('edit-modal');
const deleteModal = document.getElementById('delete-modal');
const editInput = document.getElementById('edit-input');
const saveEditBtn = document.getElementById('save-edit');
const cancelEditBtn = document.getElementById('cancel-edit');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const colorOptions = document.querySelectorAll('.color-option');

// Инициализация структуры базы данных
function initDatabase() {
  dbRef.once('value').then(snapshot => {
    if (!snapshot.exists()) {
      dbRef.set({
        events: [],
        tasks: []
      });
    }
  });
}

// Переключение вкладок
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

// Загрузка данных из Firebase
function loadData() {
  dbRef.on('value', snapshot => {
    const data = snapshot.val() || { events: [], tasks: [] };
    renderEvents(data.events);
    renderTasks(data.tasks);
  });
}

// Рендер мероприятий
function renderEvents(events) {
  const list = document.getElementById('events-list');
  list.innerHTML = '';
  
  events.forEach((event, index) => {
    const eventEl = createListItem(event, index, 'events');
    list.appendChild(eventEl);
  });
}

// Рендер задач с подзадачами
function renderTasks(tasks) {
  const list = document.getElementById('tasks-list');
  list.innerHTML = '';
  
  tasks.forEach((task, index) => {
    const taskEl = createListItem(task, index, 'tasks');
    
    // Контейнер для подзадач
    const subtaskContainer = document.createElement('div');
    subtaskContainer.className = 'subtasks-container';
    
    // Рендер подзадач
    if (task.subtasks) {
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
    taskEl.appendChild(subtaskContainer);
    list.appendChild(taskEl);
  });
}

// Создание элемента списка (общее для мероприятий и задач)
function createListItem(item, index, type) {
  const el = document.createElement('li');
  el.className = 'task';
  el.style.borderLeftColor = item.color || '#e5e7eb';
  el.dataset.index = index;
  
  el.innerHTML = `
    <div class="task-content">${item.text}</div>
    <div class="task-actions">
      <button class="btn-icon edit-btn">✏️</button>
      <button class="btn-icon delete-btn">🗑️</button>
    </div>
  `;
  
  // Обработчики для кнопок
  el.querySelector('.edit-btn').addEventListener('click', () => openEditModal(index, type));
  el.querySelector('.delete-btn').addEventListener('click', () => openDeleteModal(index, type));
  
  return el;
}

// Добавление мероприятия
function setupEventHandlers() {
  addEventBtn.addEventListener('click', () => {
    const text = document.getElementById('event-input').value.trim();
    if (text) {
      dbRef.child('events').transaction(events => {
        events = events || [];
        events.unshift({ 
          text, 
          color: "#e5e7eb",
          createdAt: Date.now() 
        });
        return events;
      });
      document.getElementById('event-input').value = '';
    }
  });
}

// Добавление задачи
function setupTaskHandlers() {
  addTaskBtn.addEventListener('click', () => {
    const text = document.getElementById('task-input').value.trim();
    if (text) {
      dbRef.child('tasks').transaction(tasks => {
        tasks = tasks || [];
        tasks.unshift({ 
          text, 
          color: "#e5e7eb",
          subtasks: [],
          createdAt: Date.now()
        });
        return tasks;
      });
      document.getElementById('task-input').value = '';
    }
  });
}

// Добавление подзадачи
function addSubtask(taskIndex, text) {
  const subtaskRef = dbRef.child(`tasks/${taskIndex}/subtasks`);
  subtaskRef.transaction(subtasks => {
    subtasks = subtasks || [];
    subtasks.push({ 
      text, 
      checked: false 
    });
    return subtasks;
  });
}

// Редактирование элемента
function openEditModal(index, type) {
  currentEditIndex = index;
  currentTab = type;
  
  dbRef.child(`${type}/${index}`).once('value').then(snapshot => {
    const item = snapshot.val();
    editInput.value = item.text;
    selectedColor = item.color || '#e5e7eb';
    updateColorSelection();
    editModal.classList.add('active');
  });
}

// Обновление выбранного цвета
function updateColorSelection() {
  colorOptions.forEach(option => {
    option.classList.toggle('selected', option.dataset.color === selectedColor);
  });
}

// Сохранение изменений
function setupEditModal() {
  saveEditBtn.addEventListener('click', () => {
    const newText = editInput.value.trim();
    if (newText) {
      dbRef.child(`${currentTab}/${currentEditIndex}`).update({
        text: newText,
        color: selectedColor
      });
      editModal.classList.remove('active');
    }
  });
}

// Удаление элемента
function openDeleteModal(index, type) {
  currentDeleteIndex = index;
  currentTab = type;
  deleteModal.classList.add('active');
}

function setupDeleteModal() {
  confirmDeleteBtn.addEventListener('click', () => {
    dbRef.child(currentTab).transaction(items => {
      items.splice(currentDeleteIndex, 1);
      return items;
    });
    deleteModal.classList.remove('active');
  });
}

// Выбор цвета
function setupColorPicker() {
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      selectedColor = option.dataset.color;
      updateColorSelection();
    });
  });
}

// Закрытие модалок
function setupModalClosers() {
  cancelEditBtn.addEventListener('click', () => editModal.classList.remove('active'));
  cancelDeleteBtn.addEventListener('click', () => deleteModal.classList.remove('active'));
  
  window.addEventListener('click', (e) => {
    if (e.target === editModal) editModal.classList.remove('active');
    if (e.target === deleteModal) deleteModal.classList.remove('active');
  });
}

// Инициализация приложения
function initApp() {
  initDatabase();
  setupTabs();
  loadData();
  setupEventHandlers();
  setupTaskHandlers();
  setupEditModal();
  setupDeleteModal();
  setupColorPicker();
  setupModalClosers();
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);
