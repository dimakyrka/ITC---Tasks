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

// Состояния
let currentTab = 'tasks';
let tasks = [];
let events = [];
let archive = [];
let currentEditIndex = null;
let currentDeleteIndex = null;
let selectedColor = "#e5e7eb";
let draggedItem = null;
let currentTaskWithSubtasks = null;

// DOM элементы
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const tasksList = document.getElementById('tasks');
const eventsList = document.getElementById('events');
const archiveList = document.getElementById('archive-list');
const emptyTasks = document.getElementById('empty-tasks');
const emptyEvents = document.getElementById('empty-events');
const emptyArchive = document.getElementById('empty-archive');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const editModal = document.getElementById('edit-modal');
const editInput = document.getElementById('edit-input');
const saveEditBtn = document.getElementById('save-edit');
const archiveBtn = document.getElementById('archive-btn');
const cancelEditBtn = document.getElementById('cancel-edit');
const colorOptions = document.querySelectorAll('#edit-modal .color-option');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const subtasksModal = document.getElementById('subtasks-modal');
const subtasksTitle = document.getElementById('subtasks-title');
const subtasksList = document.getElementById('subtasks-list');
const subtaskInput = document.getElementById('subtask-input');
const addSubtaskBtn = document.getElementById('add-subtask-btn');
const closeSubtasksBtn = document.getElementById('close-subtasks');
const taskForm = document.getElementById('task-form');

// Инициализация
updateInputPlaceholder();
toggleInputField();

// Загрузка данных из Firebase
tasksRef.on('value', (snapshot) => {
    const data = snapshot.val() || { tasks: [], events: [], archive: [] };
    tasks = data.tasks || [];
    events = data.events || [];
    archive = data.archive || [];

    renderTasks();
    renderEvents();
    if (currentTab === 'archive') renderArchive();
    updateEmptyStates();
});

// Функция обновления плейсхолдера
function updateInputPlaceholder() {
    taskInput.placeholder = currentTab === 'tasks' 
        ? 'Добавьте новую задачу...' 
        : 'Добавьте новое мероприятие...';
}

// Функция скрытия поля ввода в архиве
function toggleInputField() {
    taskForm.style.display = currentTab === 'archive' ? 'none' : 'flex';
}

// Отрисовка задач
function renderTasks() {
    tasksList.innerHTML = '';
    
    tasks.forEach((task, index) => {
        const taskEl = createTaskElement(task, index, 'tasks');
        tasksList.appendChild(taskEl);
    });
    
    emptyTasks.style.display = tasks.length === 0 ? 'block' : 'none';
}

// Отрисовка мероприятий
function renderEvents() {
    eventsList.innerHTML = '';
    
    events.forEach((event, index) => {
        const eventEl = createTaskElement(event, index, 'events');
        eventsList.appendChild(eventEl);
    });
    
    emptyEvents.style.display = events.length === 0 ? 'block' : 'none';
}

// Создание элемента задачи/мероприятия
function createTaskElement(item, index, type) {
    const element = document.createElement('li');
    element.className = `task ${type}-item`;
    element.style.borderLeftColor = item.color || '#e5e7eb';
    element.setAttribute('draggable', 'true');
    element.dataset.index = index;
    
    element.innerHTML = `
        <div class="task-content">${item.text}</div>
        <div class="task-actions">
            <button class="btn-icon edit-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
            <button class="btn-icon delete-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    `;
    
    element.querySelector('.task-content').addEventListener('click', () => {
        if (type === 'tasks') openSubtasksModal(index);
    });
    
    element.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(index, type);
    });
    
    element.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteModal(index, type);
    });
    
    element.addEventListener('dragstart', handleDragStart);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);
    element.addEventListener('dragend', handleDragEnd);
    
    return element;
}

// Отрисовка архива
function renderArchive() {
    archiveList.innerHTML = '';
    
    archive.forEach((item, index) => {
        const itemEl = document.createElement('li');
        itemEl.className = `task archive-item ${item.type}-item`;
        itemEl.style.borderLeftColor = item.color || '#e5e7eb';
        itemEl.dataset.index = index;
        
        const icon = item.type === 'task' ? '📝' : '📅';
        itemEl.innerHTML = `
            <div class="task-content">${icon} ${item.text}</div>
            <div class="task-actions">
                <button class="btn-icon restore-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        `;
        
        itemEl.querySelector('.restore-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            restoreItem(index);
        });
        
        archiveList.appendChild(itemEl);
    });
    
    emptyArchive.style.display = archive.length === 0 ? 'block' : 'none';
}

// Архивация элемента
function archiveItem(index, type) {
    tasksRef.transaction((currentData) => {
        if (!currentData) currentData = { tasks: [], events: [], archive: [] };
        
        const itemToArchive = type === 'tasks' 
            ? { ...currentData.tasks[index], type: 'task' }
            : { ...currentData.events[index], type: 'event' };
        
        itemToArchive.archivedAt = Date.now();
        currentData.archive = currentData.archive || [];
        currentData.archive.unshift(itemToArchive);
        
        if (type === 'tasks') {
            currentData.tasks.splice(index, 1);
        } else {
            currentData.events.splice(index, 1);
        }
        
        return currentData;
    });
}

// Восстановление из архива
function restoreItem(index) {
    tasksRef.transaction((currentData) => {
        const itemToRestore = currentData.archive[index];
        const type = itemToRestore.type || 'task';
        
        if (type === 'task') {
            currentData.tasks = currentData.tasks || [];
            currentData.tasks.unshift(itemToRestore);
        } else {
            currentData.events = currentData.events || [];
            currentData.events.unshift(itemToRestore);
        }
        
        currentData.archive.splice(index, 1);
        return currentData;
    });
}

// Переключение вкладок
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        document.getElementById(`${currentTab}-tab`).classList.add('active');
        
        updateInputPlaceholder();
        toggleInputField();
    });
});

// Добавление элемента
addBtn.addEventListener('click', addItem);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addItem();
});

function addItem() {
    const text = taskInput.value.trim();
    if (text) {
        const newItem = {
            text: text,
            color: "#e5e7eb",
            createdAt: Date.now(),
            subtasks: []
        };
        
        tasksRef.transaction((currentData) => {
            currentData = currentData || {};
            if (currentTab === 'tasks') {
                currentData.tasks = currentData.tasks || [];
                currentData.tasks.unshift(newItem);
            } else {
                currentData.events = currentData.events || [];
                currentData.events.unshift(newItem);
            }
            return currentData;
        });
        
        taskInput.value = '';
    }
}

// Редактирование элемента
function openEditModal(index, type) {
    currentEditIndex = index;
    const item = type === 'tasks' ? tasks[index] : events[index];
    editInput.value = item.text;
    selectedColor = item.color || '#e5e7eb';
    
    archiveBtn.style.display = 'block';
    updateColorSelection();
    editModal.classList.add('active');
    editInput.focus();
    editModal.dataset.editType = type;
}

archiveBtn.addEventListener('click', () => {
    if (currentEditIndex !== null) {
        const type = editModal.dataset.editType;
        archiveItem(currentEditIndex, type);
        editModal.classList.remove('active');
    }
});

// Подзадачи
function openSubtasksModal(index) {
    currentTaskWithSubtasks = index;
    const task = tasks[index];
    subtasksTitle.textContent = task.text;
    subtasksList.innerHTML = '';
    
    if (task.subtasks?.length > 0) {
        task.subtasks.forEach((subtask, subIndex) => {
            addSubtaskToDOM(subtask, subIndex);
        });
    }
    
    subtasksModal.classList.add('active');
    subtaskInput.focus();
}

function addSubtaskToDOM(subtask, index) {
    const subtaskEl = document.createElement('li');
    subtaskEl.className = 'subtask-item';
    subtaskEl.innerHTML = `
        <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''} data-index="${index}">
        <span class="subtask-text ${subtask.completed ? 'completed' : ''}">${subtask.text}</span>
    `;
    
    subtaskEl.querySelector('.subtask-checkbox').addEventListener('change', (e) => {
        toggleSubtaskCompletion(e.target.dataset.index);
    });
    
    subtasksList.appendChild(subtaskEl);
}

function addSubtask() {
    const text = subtaskInput.value.trim();
    if (text && currentTaskWithSubtasks !== null) {
        const newSubtask = {
            text: text,
            completed: false
        };
        
        addSubtaskToDOM(newSubtask, tasks[currentTaskWithSubtasks].subtasks?.length || 0);
        subtaskInput.value = '';
        
        tasksRef.transaction((currentData) => {
            currentData.tasks[currentTaskWithSubtasks].subtasks = 
                currentData.tasks[currentTaskWithSubtasks].subtasks || [];
            currentData.tasks[currentTaskWithSubtasks].subtasks.push(newSubtask);
            return currentData;
        });
    }
}

// Drag and Drop
function handleDragStart(e) {
    draggedItem = this;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
        this.classList.add('dragging');
    }, 0);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    if (draggedItem !== this) {
        const fromIndex = parseInt(draggedItem.dataset.index);
        const toIndex = parseInt(this.dataset.index);
        swapItems(fromIndex, toIndex);
    }
}

function handleDragEnd() {
    this.classList.remove('dragging');
}

function swapItems(fromIndex, toIndex) {
    if (currentTab === 'tasks') {
        tasksRef.transaction((currentData) => {
            const temp = currentData.tasks[fromIndex];
            currentData.tasks[fromIndex] = currentData.tasks[toIndex];
            currentData.tasks[toIndex] = temp;
            return currentData;
        });
    } else if (currentTab === 'events') {
        tasksRef.transaction((currentData) => {
            const temp = currentData.events[fromIndex];
            currentData.events[fromIndex] = currentData.events[toIndex];
            currentData.events[toIndex] = temp;
            return currentData;
        });
    }
}

// Закрытие модалок
window.addEventListener('click', (e) => {
    if (e.target === editModal) editModal.classList.remove('active');
    if (e.target === deleteModal) deleteModal.classList.remove('active');
    if (e.target === subtasksModal) subtasksModal.classList.remove('active');
});

// Обновление пустых состояний
function updateEmptyStates() {
    emptyTasks.style.display = tasks.length === 0 ? 'block' : 'none';
    emptyEvents.style.display = events.length === 0 ? 'block' : 'none';
    emptyArchive.style.display = archive.length === 0 ? 'block' : 'none';
}
