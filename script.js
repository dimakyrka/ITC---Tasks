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
const emptyTasks = document.getElementById('empty-tasks');
const emptyEvents = document.getElementById('empty-events');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const editModal = document.getElementById('edit-modal');
const editInput = document.getElementById('edit-input');
const saveEditBtn = document.getElementById('save-edit');
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

// Загрузка данных из Firebase
tasksRef.on('value', (snapshot) => {
    const data = snapshot.val() || { tasks: [], events: [], archive: [] };
    tasks = data.tasks || [];
    events = data.events || [];
    archive = data.archive || [];

    renderTasks();
    renderEvents();
    if (currentTab === 'archive') {
        renderArchive();
    }
    updateEmptyStates();
});

// Отрисовка задач
function renderTasks() {
    tasksList.innerHTML = '';
    
    tasks.forEach((task, index) => {
        const taskEl = document.createElement('li');
        taskEl.className = 'task';
        taskEl.style.borderLeftColor = task.color || '#e5e7eb';
        taskEl.setAttribute('draggable', 'true');
        taskEl.dataset.index = index;
        
        taskEl.innerHTML = `
            <div class="task-content">${task.text}</div>
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
        
        // Обработчик клика по задаче
        taskEl.querySelector('.task-content').addEventListener('click', () => {
            openSubtasksModal(index);
        });
        
        // Обработчики для кнопок
        taskEl.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(index, 'tasks');
        });
        
        taskEl.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openDeleteModal(index, 'tasks');
        });
        
        // Drag and drop
        taskEl.addEventListener('dragstart', handleDragStart);
        taskEl.addEventListener('dragover', handleDragOver);
        taskEl.addEventListener('drop', handleDrop);
        taskEl.addEventListener('dragend', handleDragEnd);
        
        tasksList.appendChild(taskEl);
    });
    
    updateEmptyStates();
}

document.getElementById('archive-btn').addEventListener('click', () => {
    if (currentEditIndex !== null) {
        const type = editModal.dataset.editType;
        archiveItem(currentEditIndex, type);
        editModal.classList.remove('active');
    }
});

// Отрисовка мероприятий
function renderEvents() {
    eventsList.innerHTML = '';
    
    events.forEach((event, index) => {
        const eventEl = document.createElement('li');
        eventEl.className = 'task';
        eventEl.style.borderLeftColor = event.color || '#e5e7eb';
        eventEl.setAttribute('draggable', 'true');
        eventEl.dataset.index = index;
        
        eventEl.innerHTML = `
            <div class="task-content">${event.text}</div>
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
        
        // Обработчики для кнопок
        eventEl.querySelector('.edit-btn').addEventListener('click', () => {
            openEditModal(index, 'events');
        });
        
        eventEl.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openDeleteModal(index, 'events');
        });
        
        // Drag and drop
        eventEl.addEventListener('dragstart', handleDragStart);
        eventEl.addEventListener('dragover', handleDragOver);
        eventEl.addEventListener('drop', handleDrop);
        eventEl.addEventListener('dragend', handleDragEnd);
        
        eventsList.appendChild(eventEl);
    });
    
    updateEmptyStates();
}

// Обновление пустых состояний
function updateEmptyStates() {
    emptyTasks.classList.toggle('active', tasks.length === 0);
    emptyEvents.classList.toggle('active', events.length === 0);
}

// Добавим обработчик переключения вкладки архива
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.dataset.tab === 'archive') {
            renderArchive();
        }
    });
});

// Функция архивирования задачи
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


// Функция восстановления из архива
function restoreTask(index) {
    tasksRef.transaction((currentData) => {
        const taskToRestore = currentData.archive[index];
        
        // Возвращаем в задачи
        currentData.tasks = currentData.tasks || [];
        currentData.tasks.unshift(taskToRestore);
        
        // Удаляем из архива
        currentData.archive.splice(index, 1);
        
        return currentData;
    });
}

function renderArchive() {
    const archiveList = document.getElementById('archive-list');
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
            restoreItem(index, item.type);
        });
        
        archiveList.appendChild(itemEl);
    });
}

function restoreItem(index, type) {
    tasksRef.transaction((currentData) => {
        const itemToRestore = currentData.archive[index];
        
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

// Обновим обработчик завершения задачи
function toggleTaskCompletion(index) {
    tasksRef.transaction((currentData) => {
        const task = currentData.tasks[index];
        task.completed = !task.completed;
        
        if (task.completed) {
            // Автоматическое архивирование при завершении
            archiveTask(index);
        }
        
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
        
        const activeTab = document.getElementById(`${currentTab}-tab`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        if (currentTab === 'archive') {
            renderArchive();
        }
    });
});

// Добавление задачи/мероприятия
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
        
        if (currentTab === 'tasks') {
            tasksRef.transaction((currentData) => {
                currentData = currentData || {};
                currentData.tasks = currentData.tasks || [];
                currentData.tasks.unshift(newItem);
                return currentData;
            });
        } else {
            tasksRef.transaction((currentData) => {
                currentData = currentData || {};
                currentData.events = currentData.events || [];
                currentData.events.unshift(newItem);
                return currentData;
            });
        }
        
        taskInput.value = '';
    }
}

// Редактирование
function openEditModal(index, type) {
    currentEditIndex = index;
    const item = type === 'tasks' ? tasks[index] : events[index];
    editInput.value = item.text;
    selectedColor = item.color || '#e5e7eb';
    
    // Показываем/скрываем кнопку архива для мероприятий
    const archiveBtn = document.getElementById('archive-btn');
    archiveBtn.style.display = type === 'tasks' ? 'block' : 'block';
    
    updateColorSelection();
    editModal.classList.add('active');
    editInput.focus();
    editModal.dataset.editType = type;
}

function updateColorSelection() {
    colorOptions.forEach(option => {
        option.classList.toggle('selected', option.dataset.color === selectedColor);
    });
}

colorOptions.forEach(option => {
    option.addEventListener('click', () => {
        selectedColor = option.dataset.color;
        updateColorSelection();
    });
});

saveEditBtn.addEventListener('click', saveEdit);
editInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveEdit();
});

cancelEditBtn.addEventListener('click', () => {
    editModal.classList.remove('active');
});

function saveEdit() {
    const newText = editInput.value.trim();
    if (newText && currentEditIndex !== null) {
        const type = editModal.dataset.editType;
        
        tasksRef.transaction((currentData) => {
            if (type === 'tasks') {
                currentData.tasks[currentEditIndex].text = newText;
                currentData.tasks[currentEditIndex].color = selectedColor;
            } else {
                currentData.events[currentEditIndex].text = newText;
                currentData.events[currentEditIndex].color = selectedColor;
            }
            return currentData;
        });
        
        editModal.classList.remove('active');
    }
}

// Удаление
function openDeleteModal(index, type) {
    currentDeleteIndex = index;
    deleteModal.dataset.deleteType = type;
    deleteModal.classList.add('active');
}

confirmDeleteBtn.addEventListener('click', () => {
    if (currentDeleteIndex !== null) {
        const type = deleteModal.dataset.deleteType;
        
        tasksRef.transaction((currentData) => {
            if (type === 'tasks') {
                currentData.tasks.splice(currentDeleteIndex, 1);
            } else {
                currentData.events.splice(currentDeleteIndex, 1);
            }
            return currentData;
        });
        
        deleteModal.classList.remove('active');
        currentDeleteIndex = null;
    }
});

cancelDeleteBtn.addEventListener('click', () => {
    deleteModal.classList.remove('active');
    currentDeleteIndex = null;
});

// Подзадачи
function openSubtasksModal(index) {
    currentTaskWithSubtasks = index;
    const task = tasks[index];
    subtasksTitle.textContent = task.text;
    subtasksList.innerHTML = '';
    
    // Загружаем подзадачи
    if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach((subtask, subIndex) => {
            const subtaskEl = document.createElement('li');
            subtaskEl.className = 'subtask-item';
            subtaskEl.innerHTML = `
                <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''} data-index="${subIndex}">
                <span class="subtask-text ${subtask.completed ? 'completed' : ''}">${subtask.text}</span>
            `;
            
            // Обработчик изменения состояния подзадачи
            subtaskEl.querySelector('.subtask-checkbox').addEventListener('change', (e) => {
                toggleSubtaskCompletion(e.target.dataset.index);
            });
            
            subtasksList.appendChild(subtaskEl);
        });
    }
    
    subtasksModal.classList.add('active');
    subtaskInput.focus();
}

closeSubtasksBtn.addEventListener('click', () => {
    subtasksModal.classList.remove('active');
});

addSubtaskBtn.addEventListener('click', addSubtask);
subtaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSubtask();
});

function addSubtask() {
    const text = subtaskInput.value.trim();
    if (text && currentTaskWithSubtasks !== null) {
        const newSubtask = {
            text: text,
            completed: false
        };
        
        // Оптимистичное обновление интерфейса
        const subtaskEl = document.createElement('li');
        subtaskEl.className = 'subtask-item';
        subtaskEl.innerHTML = `
            <input type="checkbox" class="subtask-checkbox" data-index="${tasks[currentTaskWithSubtasks].subtasks?.length || 0}">
            <span class="subtask-text">${text}</span>
        `;
        subtasksList.appendChild(subtaskEl);
        
        subtaskInput.value = '';
        
        // Обновление в Firebase
        tasksRef.transaction((currentData) => {
            currentData.tasks[currentTaskWithSubtasks].subtasks = 
                currentData.tasks[currentTaskWithSubtasks].subtasks || [];
            currentData.tasks[currentTaskWithSubtasks].subtasks.push(newSubtask);
            return currentData;
        });
    }
}

function toggleSubtaskCompletion(subIndex) {
    if (currentTaskWithSubtasks !== null) {
        tasksRef.transaction((currentData) => {
            const subtask = currentData.tasks[currentTaskWithSubtasks].subtasks[subIndex];
            subtask.completed = !subtask.completed;
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
    } else {
        tasksRef.transaction((currentData) => {
            const temp = currentData.events[fromIndex];
            currentData.events[fromIndex] = currentData.events[toIndex];
            currentData.events[toIndex] = temp;
            return currentData;
        });
    }
}

// Закрытие модалок по клику вне области
window.addEventListener('click', (e) => {
    if (e.target === editModal) {
        editModal.classList.remove('active');
    }
    if (e.target === deleteModal) {
        deleteModal.classList.remove('active');
    }
    if (e.target === subtasksModal) {
        subtasksModal.classList.remove('active');
    }
});
