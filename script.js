// Firebase Config
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
const tasksRef = database.ref('tasks');

// Состояния
let currentTab = 'tasks';
let tasks = [];
let events = [];
let archived = [];
let currentEditIndex = null;
let currentDeleteIndex = null;
let selectedColor = "#e5e7eb";
let draggedItem = null;
let currentTaskWithSubtasks = null;
let currentEditType = null;

// DOM элементы
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const tasksList = document.getElementById('tasks');
const eventsList = document.getElementById('events');
const archiveList = document.getElementById('archive');
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
const closeSubtasksTopBtn = document.getElementById('close-subtasks-top');

// Инициализация структуры данных
const initializeDataStructure = () => {
    tasksRef.once('value').then((snapshot) => {
        if (!snapshot.exists()) {
            tasksRef.set({
                tasks: [],
                events: [],
                archived: []
            });
        }
    });
};
initializeDataStructure();

// Загрузка данных из Firebase
tasksRef.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    tasks = data.tasks || [];
    events = data.events || [];
    archived = data.archived || [];
    
    renderTasks();
    renderEvents();
    renderArchive();
    updateEmptyStates();
});

// Отрисовка задач
function renderTasks() {
    tasksList.innerHTML = '';
    
    tasks.forEach((task, index) => {
        const taskEl = createTaskElement(task, index, 'tasks');
        tasksList.appendChild(taskEl);
    });
    
    updateEmptyStates();
}

// Отрисовка мероприятий
function renderEvents() {
    eventsList.innerHTML = '';
    
    events.forEach((event, index) => {
        const eventEl = createTaskElement(event, index, 'events');
        eventsList.appendChild(eventEl);
    });
    
    updateEmptyStates();
}

// Отрисовка архива
function renderArchive() {
    archiveList.innerHTML = '';
    
    // Задачи в архиве
    const archivedTasksHeader = document.createElement('h3');
    archivedTasksHeader.className = 'archive-header';
    archivedTasksHeader.textContent = 'Архив задач';
    archiveList.appendChild(archivedTasksHeader);
    
    archived.filter(item => item.originalType === 'tasks').forEach((item, index) => {
        const archivedEl = createArchiveItem(item, index);
        archiveList.appendChild(archivedEl);
    });
    
    // Мероприятия в архиве
    const archivedEventsHeader = document.createElement('h3');
    archivedEventsHeader.className = 'archive-header';
    archivedEventsHeader.textContent = 'Архив мероприятий';
    archiveList.appendChild(archivedEventsHeader);
    
    archived.filter(item => item.originalType === 'events').forEach((item, index) => {
        const archivedEl = createArchiveItem(item, index);
        archiveList.appendChild(archivedEl);
    });
    
    updateEmptyStates();
}

// Создание элемента задачи/мероприятия
function createTaskElement(item, index, type) {
    const taskEl = document.createElement('li');
    taskEl.className = 'task';
    taskEl.style.borderLeftColor = item.color || '#e5e7eb';
    taskEl.setAttribute('draggable', 'true');
    taskEl.dataset.index = index;
    
    taskEl.innerHTML = `
        <div class="task-content">${item.text}</div>
        <div class="task-actions">
            <button class="btn-icon edit-btn" title="Редактировать">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
            <button class="btn-icon delete-btn" title="Удалить">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    `;
    
    // Обработчик клика по задаче (для подзадач)
    taskEl.querySelector('.task-content').addEventListener('click', (e) => {
        if (!e.target.closest('.task-actions') && type === 'tasks') {
            openSubtasksModal(index);
        }
    });
    
    // Обработчики кнопок
    taskEl.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(index, type);
    });
    
    taskEl.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteModal(index, type);
    });
    
    // Drag and drop
    taskEl.addEventListener('dragstart', handleDragStart);
    taskEl.addEventListener('dragover', handleDragOver);
    taskEl.addEventListener('drop', handleDrop);
    taskEl.addEventListener('dragend', handleDragEnd);
    
    return taskEl;
}

// Создание элемента архива
function createArchiveItem(item, index) {
    const archivedEl = document.createElement('li');
    archivedEl.className = 'task archived-item';
    archivedEl.style.borderLeftColor = item.color || '#e5e7eb';
    
    archivedEl.innerHTML = `
        <div class="task-content">${item.text}</div>
        <div class="task-actions">
            <button class="btn-icon restore-btn" title="Восстановить">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
            </button>
            <button class="btn-icon delete-btn" title="Удалить">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    `;
    
    archivedEl.querySelector('.restore-btn').addEventListener('click', () => {
        restoreFromArchive(index);
    });
    
    archivedEl.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteModal(index, 'archived');
    });
    
    return archivedEl;
}

// Обновление пустых состояний
function updateEmptyStates() {
    emptyTasks.classList.toggle('active', tasks.length === 0);
    emptyEvents.classList.toggle('active', events.length === 0);
    emptyArchive.classList.toggle('active', archived.length === 0);
}

// Переключение вкладок
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        document.getElementById(`${currentTab}-tab`).classList.add('active');
        
        // Скрываем форму ввода для архива
        document.querySelector('.task-form').style.display = 
            currentTab === 'archive' ? 'none' : 'flex';
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
        }).then(() => {
            taskInput.value = '';
        }).catch(error => {
            console.error('Error adding item:', error);
        });
    }
}

// Редактирование
function openEditModal(index, type) {
    currentEditIndex = index;
    currentEditType = type;
    const item = type === 'tasks' ? tasks[index] : 
                 type === 'events' ? events[index] : 
                 archived[index];
    editInput.value = item.text;
    selectedColor = item.color || '#e5e7eb';
    updateColorSelection();
    editModal.classList.add('active');
    editInput.focus();
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

archiveBtn.addEventListener('click', moveToArchive);

function saveEdit() {
    const newText = editInput.value.trim();
    if (newText && currentEditIndex !== null) {
        tasksRef.transaction((currentData) => {
            if (currentEditType === 'tasks') {
                currentData.tasks[currentEditIndex].text = newText;
                currentData.tasks[currentEditIndex].color = selectedColor;
            } else if (currentEditType === 'events') {
                currentData.events[currentEditIndex].text = newText;
                currentData.events[currentEditIndex].color = selectedColor;
            } else {
                currentData.archived[currentEditIndex].text = newText;
                currentData.archived[currentEditIndex].color = selectedColor;
            }
            return currentData;
        }).then(() => {
            editModal.classList.remove('active');
        }).catch(error => {
            console.error('Error saving edit:', error);
        });
    }
}

// Перемещение в архив
function moveToArchive() {
    if (currentEditIndex === null || !currentEditType) return;

    tasksRef.transaction((currentData) => {
        if (!currentData) {
            currentData = { tasks: [], events: [], archived: [] };
        }

        const itemToArchive = { 
            ...currentData[currentEditType][currentEditIndex],
            archivedAt: Date.now(),
            originalType: currentEditType
        };

        currentData[currentEditType].splice(currentEditIndex, 1);
        currentData.archived = currentData.archived || [];
        currentData.archived.unshift(itemToArchive);

        return currentData;
    }).then(() => {
        editModal.classList.remove('active');
        currentEditIndex = null;
        currentEditType = null;
    }).catch(error => {
        console.error("Archive error:", error);
    });
}

// Восстановление из архива
function restoreFromArchive(index) {
    tasksRef.transaction((currentData) => {
        if (!currentData?.archived || index >= currentData.archived.length) {
            return currentData;
        }

        const item = currentData.archived[index];
        const targetType = item.originalType || 'tasks';

        currentData[targetType] = currentData[targetType] || [];
        currentData[targetType].unshift(item);
        currentData.archived.splice(index, 1);

        return currentData;
    }).catch(error => {
        console.error("Restore error:", error);
    });
}

// Удаление
function openDeleteModal(index, type) {
    currentDeleteIndex = index;
    currentEditType = type;
    deleteModal.classList.add('active');
}

confirmDeleteBtn.addEventListener('click', () => {
    if (currentDeleteIndex !== null) {
        tasksRef.transaction((currentData) => {
            if (currentEditType === 'tasks') {
                currentData.tasks.splice(currentDeleteIndex, 1);
            } else if (currentEditType === 'events') {
                currentData.events.splice(currentDeleteIndex, 1);
            } else {
                currentData.archived.splice(currentDeleteIndex, 1);
            }
            return currentData;
        }).then(() => {
            deleteModal.classList.remove('active');
            currentDeleteIndex = null;
        }).catch(error => {
            console.error('Error deleting item:', error);
        });
    }
});

cancelDeleteBtn.addEventListener('click', () => {
    deleteModal.classList.remove('active');
    currentDeleteIndex = null;
});

// Подзадачи
function openSubtasksModal(index) {
    console.log('Opening subtasks for task index:', index);
    
    if (index === null || index === undefined || !tasks[index]) {
        console.error('Invalid task index:', index);
        return;
    }
    
    currentTaskWithSubtasks = index;
    const task = tasks[index];
    subtasksTitle.textContent = task.text;
    subtasksList.innerHTML = '';
    subtaskInput.value = '';
    
    if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach((subtask, subIndex) => {
            addSubtaskToDOM(subtask, subIndex);
        });
    }
    
    subtasksModal.classList.add('active');
    subtaskInput.focus();
    document.addEventListener('keydown', handleEscKey);
}

function addSubtaskToDOM(subtask, index) {
    const subtaskEl = document.createElement('li');
    subtaskEl.className = 'subtask-item';
    subtaskEl.innerHTML = `
        <input type="checkbox" class="subtask-checkbox" 
               ${subtask.completed ? 'checked' : ''}
               id="subtask-${index}">
        <label for="subtask-${index}" class="subtask-text ${subtask.completed ? 'completed' : ''}">
            ${subtask.text}
        </label>
    `;
    
    const checkbox = subtaskEl.querySelector('.subtask-checkbox');
    checkbox.addEventListener('change', function() {
        const isChecked = this.checked;
        
        // Оптимистичное обновление UI
        subtaskEl.querySelector('label').classList.toggle('completed', isChecked);
        
        // Обновление в Firebase
        tasksRef.transaction((currentData) => {
            if (currentData && currentData.tasks[currentTaskWithSubtasks]?.subtasks?.[index]) {
                currentData.tasks[currentTaskWithSubtasks].subtasks[index].completed = isChecked;
            }
            return currentData;
        }).catch(error => {
            console.error('Error updating subtask:', error);
            // Откатываем изменения при ошибке
            checkbox.checked = !isChecked;
            subtaskEl.querySelector('label').classList.toggle('completed');
        });
    });
    
    subtasksList.appendChild(subtaskEl);
}

function addSubtask() {
    const text = subtaskInput.value.trim();
    if (!text || currentTaskWithSubtasks === null) return;

    const newSubtask = {
        text: text,
        completed: false,
        createdAt: Date.now()
    };

    // Оптимистичное обновление UI
    const newIndex = tasks[currentTaskWithSubtasks].subtasks?.length || 0;
    addSubtaskToDOM(newSubtask, newIndex);
    subtaskInput.value = '';
    subtaskInput.focus();

    // Обновление в Firebase
    tasksRef.transaction((currentData) => {
        if (!currentData) {
            currentData = { tasks: [], events: [], archived: [] };
        }
        
        if (!currentData.tasks[currentTaskWithSubtasks].subtasks) {
            currentData.tasks[currentTaskWithSubtasks].subtasks = [];
        }
        
        currentData.tasks[currentTaskWithSubtasks].subtasks.push(newSubtask);
        return currentData;
    }).catch((error) => {
        console.error('Error adding subtask:', error);
        // Откатываем изменения в UI при ошибке
        subtasksList.lastChild.remove();
    });
}

// Обработчики событий подзадач
addSubtaskBtn.addEventListener('click', addSubtask);
subtaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSubtask();
});

closeSubtasksBtn.addEventListener('click', closeSubtasksModal);
closeSubtasksTopBtn.addEventListener('click', closeSubtasksModal);

function closeSubtasksModal() {
    subtasksModal.classList.remove('active');
    document.removeEventListener('keydown', handleEscKey);
    currentTaskWithSubtasks = null;
}

function handleEscKey(e) {
    if (e.key === 'Escape') {
        closeSubtasksModal();
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
    if (e.target === subtasksModal) {
        closeSubtasksModal();
    }
});  // ← Добавлены недостающие ) и ;

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (editModal.classList.contains('active')) {
            editModal.classList.remove('active');
        } else if (deleteModal.classList.contains('active')) {
            deleteModal.classList.remove('active');
        } else if (subtasksModal.classList.contains('active')) {
            closeSubtasksModal();
        }
    }
});

// Инициализация
document.querySelector('.task-form').style.display = 'flex';
