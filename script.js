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

// ========== Инициализация приложения ==========
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const tasksRef = database.ref('tasks');

// ========== Состояние приложения ==========
const state = {
    currentTab: 'tasks',
    tasks: [],
    events: [],
    archived: [],
    currentEditIndex: null,
    currentDeleteIndex: null,
    selectedColor: "#e5e7eb",
    draggedItem: null,
    currentTaskWithSubtasks: null,
    currentEditType: null
};

// Текущий пользователь
const currentUser = {
    id: null,
    isAdmin: false,
    name: 'Гость'
};

// ========== DOM элементы ==========
const DOM = {
    taskInput: document.getElementById('task-input'),
    addBtn: document.getElementById('add-btn'),
    tasksList: document.getElementById('tasks'),
    eventsList: document.getElementById('events'),
    archiveList: document.getElementById('archive'),
    emptyStates: {
        tasks: document.getElementById('empty-tasks'),
        events: document.getElementById('empty-events'),
        archive: document.getElementById('empty-archive')
    },
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    editModal: document.getElementById('edit-modal'),
    editInput: document.getElementById('edit-input'),
    saveEditBtn: document.getElementById('save-edit'),
    archiveBtn: document.getElementById('archive-btn'),
    cancelEditBtn: document.getElementById('cancel-edit'),
    colorOptions: document.querySelectorAll('#edit-modal .color-option'),
    deleteModal: document.getElementById('delete-modal'),
    confirmDeleteBtn: document.getElementById('confirm-delete'),
    cancelDeleteBtn: document.getElementById('cancel-delete'),
    subtasksModal: document.getElementById('subtasks-modal'),
    subtasksTitle: document.getElementById('subtasks-title'),
    subtasksList: document.getElementById('subtasks-list'),
    subtaskInput: document.getElementById('subtask-input'),
    addSubtaskBtn: document.getElementById('add-subtask-btn'),
    closeSubtasksTopBtn: document.getElementById('close-subtasks-top'),
    closeSubtasksBtn: document.getElementById('close-subtasks-btn'),
    taskForm: document.querySelector('.task-form'),
    editAssignedTo: document.getElementById('edit-assigned-to')
};

// ========== Проверка прав пользователя ==========
async function checkUserPermissions(userId) {
    return new Promise((resolve) => {
        const userRef = database.ref(`users/${userId}`);
        userRef.once('value').then((snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                currentUser.id = userId;
                currentUser.isAdmin = userData.admin === true;
                currentUser.name = userData.name || 'Пользователь';
                resolve(true);
            } else {
                // Если пользователя нет в базе, добавляем как обычного
                userRef.set({
                    admin: true,
                    name: 'Новый пользователь'
                });
                currentUser.id = userId;
                currentUser.isAdmin = false;
                currentUser.name = 'Новый пользователь';
                resolve(true);
            }
        }).catch(() => resolve(false));
    });
}

// ========== Настройка UI по правам ==========
function setupUIForUserRole() {
    if (!currentUser.id) {
        // Гостевой режим (только просмотр)
        DOM.taskForm.style.display = 'none';
        document.querySelectorAll('.task-actions').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.7';
        });
        
        const notice = document.createElement('div');
        notice.className = 'view-mode-notice';
        notice.textContent = '🔒 Войдите через Telegram для доступа к полному функционалу';
        document.body.insertBefore(notice, document.body.firstChild);
        return;
    }

    if (!currentUser.isAdmin) {
        // Режим обычного пользователя
        DOM.taskForm.style.display = 'none';
        document.querySelectorAll('.task-actions').forEach(el => el.style.display = 'none');
        
        const notice = document.createElement('div');
        notice.className = 'view-mode-notice';
        notice.innerHTML = `🔒 Вы вошли как <strong>${currentUser.name}</strong> (режим просмотра)`;
        document.body.insertBefore(notice, document.body.firstChild);
    } else {
        // Режим администратора
        const notice = document.createElement('div');
        notice.className = 'view-mode-notice admin';
        notice.innerHTML = `👑 Вы вошли как <strong>${currentUser.name}</strong> (режим администратора)`;
        document.body.insertBefore(notice, document.body.firstChild);
    }
}

// ========== Инициализация Firebase ==========
function initializeDataStructure() {
    tasksRef.once('value').then((snapshot) => {
        if (!snapshot.exists()) {
            tasksRef.set({
                tasks: [],
                events: [],
                archived: [],
                users: {}
            });
        }
    });
}

// ========== Основные функции рендеринга ==========
// ========== Основные функции рендеринга ==========
function renderAll() {
    console.log('[Render] Обновление интерфейса', {
        tasks: state.tasks,
        events: state.events,
        archived: state.archived
    });
    
    renderTasks();
    renderEvents();
    renderArchive();
    updateEmptyStates();
}

function renderTasks() {
    console.log('[Render] Отрисовка задач:', state.tasks);
    DOM.tasksList.innerHTML = '';
    state.tasks.forEach((task, index) => {
        const element = createTaskElement(task, index, 'tasks');
        DOM.tasksList.appendChild(element);
    });
}



function renderEvents() {
    DOM.eventsList.innerHTML = '';
    state.events.forEach((event, index) => {
        DOM.eventsList.appendChild(createTaskElement(event, index, 'events'));
    });
}

function renderArchive() {
    DOM.archiveList.innerHTML = '';
    
    // Архив задач
    const archivedTasksHeader = document.createElement('h3');
    archivedTasksHeader.className = 'archive-header';
    archivedTasksHeader.textContent = 'Архив задач';
    DOM.archiveList.appendChild(archivedTasksHeader);
    
    state.archived
        .filter(item => item.originalType === 'tasks')
        .forEach((item, index) => {
            DOM.archiveList.appendChild(createArchiveItem(item, index));
        });
    
    // Архив мероприятий
    const archivedEventsHeader = document.createElement('h3');
    archivedEventsHeader.className = 'archive-header';
    archivedEventsHeader.textContent = 'Архив мероприятий';
    DOM.archiveList.appendChild(archivedEventsHeader);
    
    state.archived
        .filter(item => item.originalType === 'events')
        .forEach((item, index) => {
            DOM.archiveList.appendChild(createArchiveItem(item, index));
        });
}

// ========== Создание элементов DOM ==========
function createTaskElement(item, index, type) {
    const taskEl = document.createElement('li');
    taskEl.className = 'task' + (!currentUser.isAdmin ? ' view-mode' : '');
    taskEl.style.borderLeftColor = item.color || '#e5e7eb';
    
    if (currentUser.isAdmin) {
        taskEl.setAttribute('draggable', 'true');
        taskEl.dataset.index = index;
    }

    // Добавляем иконку и имя ответственного (если есть)
    const assignedHtml = item.assignedTo 
        ? `<div class="task-assigned-to">👤 ${item.assignedTo}</div>` 
        : '';

    taskEl.innerHTML = `
        <div class="task-content">${item.text}</div>
        ${assignedHtml}
        ${currentUser.isAdmin ? `
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
        ` : ''}
    `;
    
    // Обработчики событий
    const contentElement = taskEl.querySelector('.task-content');
    if (contentElement) {
        contentElement.addEventListener('click', (e) => {
            if (!e.target.closest('.task-actions') && type === 'tasks') {
                openSubtasksModal(index);
            }
        });
    }
    
    if (currentUser.isAdmin) {
        const editBtn = taskEl.querySelector('.edit-btn');
        const deleteBtn = taskEl.querySelector('.delete-btn');
        
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(index, type);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openDeleteModal(index, type);
            });
        }
        
        // Drag and Drop только для админов
        taskEl.addEventListener('dragstart', handleDragStart);
        taskEl.addEventListener('dragover', handleDragOver);
        taskEl.addEventListener('drop', handleDrop);
        taskEl.addEventListener('dragend', handleDragEnd);
    }
    
    return taskEl;
}

function createArchiveItem(item, index) {
    const archivedEl = document.createElement('li');
    archivedEl.className = 'task archived-item';
    archivedEl.style.borderLeftColor = item.color || '#e5e7eb';
    
    archivedEl.innerHTML = `
        <div class="task-content">${item.text}</div>
        ${currentUser.isAdmin ? `
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
        ` : ''}
    `;
    
    if (currentUser.isAdmin) {
        const restoreBtn = archivedEl.querySelector('.restore-btn');
        const deleteBtn = archivedEl.querySelector('.delete-btn');
        
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => {
                restoreFromArchive(index);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openDeleteModal(index, 'archived');
            });
        }
    }
    
    return archivedEl;
}

// ========== Функции работы с данными ==========
function addItem() {
    console.log('[Debug] addItem вызван');
    
    try {
        // Проверка прав доступа
        if (!currentUser.isAdmin) {
            throw new Error('Доступ запрещен: требуется роль администратора');
        }

        // Проверка ввода
        const text = DOM.taskInput.value.trim();
        if (!text) {
            throw new Error('Нельзя добавить пустую задачу');
        }

        console.log('[Debug] Пытаемся добавить задачу:', text);

        // Создаем объект задачи
        const newItem = {
            text: text,
            color: state.selectedColor,
            createdAt: Date.now(),
            subtasks: [],
            createdBy: currentUser.id
        };

        // Отправляем в Firebase
        const target = state.currentTab === 'tasks' ? 'tasks' : 'events';
        const newRef = database.ref(`tasks/${target}`).push();
        
        newRef.set(newItem)
            .then(() => {
                console.log('[Firebase] Задача успешно добавлена');
                DOM.taskInput.value = '';
            })
            .catch(error => {
                console.error('[Firebase] Ошибка:', error);
                alert('Ошибка сохранения: ' + error.message);
            });

    } catch (error) {
        console.error('[Error] addItem:', error);
        alert(error.message);
    }
}

function saveEdit() {
    if (!currentUser.isAdmin) return;
    
    const newText = DOM.editInput.value.trim();
    const assignedTo = DOM.editAssignedTo.value.trim();
    
    if (!newText || state.currentEditIndex === null) return;

    tasksRef.transaction((currentData) => {
        const item = currentData[state.currentEditType][state.currentEditIndex];
        item.text = newText;
        item.color = state.selectedColor;
        item.assignedTo = assignedTo;
        item.updatedBy = currentUser.id;
        item.updatedAt = Date.now();
        return currentData;
    }).then(() => {
        DOM.editModal.classList.remove('active');
    }).catch(console.error);
}

function moveToArchive() {
    if (!currentUser.isAdmin || state.currentEditIndex === null || !state.currentEditType) return;

    tasksRef.transaction((currentData) => {
        if (!currentData) currentData = { tasks: [], events: [], archived: [] };

        const itemToArchive = { 
            ...currentData[state.currentEditType][state.currentEditIndex],
            archivedAt: Date.now(),
            originalType: state.currentEditType,
            archivedBy: currentUser.id
        };

        currentData[state.currentEditType].splice(state.currentEditIndex, 1);
        currentData.archived = currentData.archived || [];
        currentData.archived.unshift(itemToArchive);

        return currentData;
    }).then(() => {
        DOM.editModal.classList.remove('active');
        state.currentEditIndex = null;
        state.currentEditType = null;
    }).catch(console.error);
}

function restoreFromArchive(index) {
    if (!currentUser.isAdmin) return;

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
    }).catch(console.error);
}

function deleteItem() {
    if (!currentUser.isAdmin || state.currentDeleteIndex === null) return;

    tasksRef.transaction((currentData) => {
        if (state.currentEditType === 'tasks') {
            currentData.tasks.splice(state.currentDeleteIndex, 1);
        } else if (state.currentEditType === 'events') {
            currentData.events.splice(state.currentDeleteIndex, 1);
        } else {
            currentData.archived.splice(state.currentDeleteIndex, 1);
        }
        return currentData;
    }).then(() => {
        DOM.deleteModal.classList.remove('active');
        state.currentDeleteIndex = null;
    }).catch(console.error);
}

// ========== Функции подзадач ==========
function openSubtasksModal(index) {
    if (index === null || index === undefined || !state.tasks[index]) {
        console.error('Invalid task index:', index);
        return;
    }
    
    state.currentTaskWithSubtasks = index;
    const task = state.tasks[index];
    DOM.subtasksTitle.textContent = task.text;
    DOM.subtasksList.innerHTML = '';
    DOM.subtaskInput.value = '';
    
    if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach((subtask, subIndex) => {
            addSubtaskToDOM(subtask, subIndex);
        });
    }
    
    // Настройка UI в зависимости от прав
    if (!currentUser.id) {
        DOM.subtasksForm.style.display = 'none';
    } else if (!currentUser.isAdmin) {
        DOM.subtaskInput.placeholder = 'Только админ может добавлять подзадачи';
        DOM.subtaskInput.disabled = true;
        DOM.addSubtaskBtn.disabled = true;
    }
    
    DOM.subtasksModal.classList.add('active');
    document.addEventListener('keydown', handleEscKey);
}

function addSubtaskToDOM(subtask, index) {
    const subtaskEl = document.createElement('li');
    subtaskEl.className = 'subtask-item';
    
    subtaskEl.innerHTML = `
        <input type="checkbox" class="subtask-checkbox" 
               ${subtask.completed ? 'checked' : ''}
               id="subtask-${index}"
               ${!currentUser.id ? 'disabled' : ''}>
        <label for="subtask-${index}" class="subtask-text ${subtask.completed ? 'completed' : ''}">
            ${subtask.text}
        </label>
        ${currentUser.isAdmin ? `
        <button class="btn-icon delete-subtask-btn" title="Удалить подзадачу">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 6h18"></path>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
        </button>
        ` : ''}
    `;
    
    const checkbox = subtaskEl.querySelector('.subtask-checkbox');
    if (checkbox) {
        checkbox.addEventListener('change', function() {
            const isChecked = this.checked;
            subtaskEl.querySelector('label').classList.toggle('completed', isChecked);
            
            tasksRef.transaction((currentData) => {
                if (currentData && currentData.tasks[state.currentTaskWithSubtasks]?.subtasks?.[index]) {
                    currentData.tasks[state.currentTaskWithSubtasks].subtasks[index].completed = isChecked;
                    currentData.tasks[state.currentTaskWithSubtasks].subtasks[index].completedBy = currentUser.id;
                    currentData.tasks[state.currentTaskWithSubtasks].subtasks[index].completedAt = Date.now();
                }
                return currentData;
            }).catch(error => {
                console.error('Error updating subtask:', error);
                checkbox.checked = !isChecked;
                subtaskEl.querySelector('label').classList.toggle('completed');
            });
        });
    }
    
    // Добавляем обработчик удаления подзадачи (только для админов)
    const deleteBtn = subtaskEl.querySelector('.delete-subtask-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            deleteSubtask(index);
        });
    }
    
    DOM.subtasksList.appendChild(subtaskEl);
}

function deleteSubtask(index) {
    if (!currentUser.isAdmin) return;

    tasksRef.transaction((currentData) => {
        if (currentData && currentData.tasks[state.currentTaskWithSubtasks]?.subtasks) {
            currentData.tasks[state.currentTaskWithSubtasks].subtasks.splice(index, 1);
        }
        return currentData;
    }).then(() => {
        const task = state.tasks[state.currentTaskWithSubtasks];
        DOM.subtasksList.innerHTML = '';
        if (task.subtasks && task.subtasks.length > 0) {
            task.subtasks.forEach((subtask, subIndex) => {
                addSubtaskToDOM(subtask, subIndex);
            });
        }
    }).catch(error => {
        console.error('Error deleting subtask:', error);
    });
}

function addSubtask() {
    if (!currentUser.id) return;
    if (!currentUser.isAdmin) {
        alert('Только администраторы могут добавлять подзадачи');
        return;
    }

    const text = DOM.subtaskInput.value.trim();
    if (!text || state.currentTaskWithSubtasks === null) return;

    const newSubtask = {
        text: text,
        completed: false,
        createdAt: Date.now(),
        createdBy: currentUser.id
    };

    // Оптимистичное обновление UI
    const newIndex = state.tasks[state.currentTaskWithSubtasks].subtasks?.length || 0;
    addSubtaskToDOM(newSubtask, newIndex);
    DOM.subtaskInput.value = '';
    DOM.subtaskInput.focus();

    // Обновление в Firebase
    tasksRef.transaction((currentData) => {
        if (!currentData) currentData = { tasks: [], events: [], archived: [] };
        
        if (!currentData.tasks[state.currentTaskWithSubtasks].subtasks) {
            currentData.tasks[state.currentTaskWithSubtasks].subtasks = [];
        }
        
        currentData.tasks[state.currentTaskWithSubtasks].subtasks.push(newSubtask);
        return currentData;
    }).catch((error) => {
        console.error('Error adding subtask:', error);
        DOM.subtasksList.lastChild.remove();
    });
}

function closeSubtasksModal() {
    DOM.subtasksModal.classList.remove('active');
    document.removeEventListener('keydown', handleEscKey);
    state.currentTaskWithSubtasks = null;
}

// ========== Drag and Drop ==========
function handleDragStart(e) {
    if (!currentUser.isAdmin) return;
    
    state.draggedItem = this;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => this.classList.add('dragging'), 0);
}

function handleDragOver(e) {
    if (!currentUser.isAdmin) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    if (!currentUser.isAdmin) return;
    
    e.preventDefault();
    if (state.draggedItem !== this) {
        const fromIndex = parseInt(state.draggedItem.dataset.index);
        const toIndex = parseInt(this.dataset.index);
        swapItems(fromIndex, toIndex);
    }
}

function handleDragEnd() {
    this.classList.remove('dragging');
}

function swapItems(fromIndex, toIndex) {
    if (!currentUser.isAdmin) return;

    tasksRef.transaction((currentData) => {
        if (state.currentTab === 'tasks') {
            const temp = currentData.tasks[fromIndex];
            currentData.tasks[fromIndex] = currentData.tasks[toIndex];
            currentData.tasks[toIndex] = temp;
        } else if (state.currentTab === 'events') {
            const temp = currentData.events[fromIndex];
            currentData.events[fromIndex] = currentData.events[toIndex];
            currentData.events[toIndex] = temp;
        }
        return currentData;
    }).catch(console.error);
}

// ========== Вспомогательные функции ==========
function updateEmptyStates() {
    const tasksEmpty = state.tasks.length === 0;
    const eventsEmpty = state.events.length === 0;
    const archiveEmpty = state.archived.length === 0;

    DOM.emptyStates.tasks.classList.toggle('active', tasksEmpty);
    DOM.emptyStates.events.classList.toggle('active', eventsEmpty);
    DOM.emptyStates.archive.classList.toggle('active', archiveEmpty);
    
    if (!tasksEmpty) DOM.emptyStates.tasks.style.display = 'none';
    if (!eventsEmpty) DOM.emptyStates.events.style.display = 'none';
}

function openEditModal(index, type) {
    if (!currentUser.isAdmin) return;
    
    state.currentEditIndex = index;
    state.currentEditType = type;
    const item = type === 'tasks' ? state.tasks[index] : 
                 type === 'events' ? state.events[index] : 
                 state.archived[index];
    
    DOM.editInput.value = item.text;
    DOM.editAssignedTo.value = item.assignedTo || '';
    state.selectedColor = item.color || '#e5e7eb';
    
    updateColorSelection();
    DOM.editModal.classList.add('active');
    DOM.editInput.focus();
}

function openDeleteModal(index, type) {
    if (!currentUser.isAdmin) return;
    
    state.currentDeleteIndex = index;
    state.currentEditType = type;
    DOM.deleteModal.classList.add('active');
}

function updateColorSelection() {
    DOM.colorOptions.forEach(option => {
        option.classList.toggle('selected', option.dataset.color === state.selectedColor);
    });
}

function handleEscKey(e) {
    if (e.key === 'Escape') {
        if (DOM.editModal.classList.contains('active')) {
            DOM.editModal.classList.remove('active');
        } else if (DOM.deleteModal.classList.contains('active')) {
            DOM.deleteModal.classList.remove('active');
        } else if (DOM.subtasksModal.classList.contains('active')) {
            closeSubtasksModal();
        }
    }
}

// ========== Инициализация событий ==========
function initEventListeners() {
    // Вкладки
    DOM.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!currentUser.id && btn.dataset.tab !== 'archive') return;
            
            DOM.tabBtns.forEach(b => b.classList.remove('active'));
            DOM.tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            state.currentTab = btn.dataset.tab;
            document.getElementById(`${state.currentTab}-tab`).classList.add('active');
            DOM.taskForm.style.display = (state.currentTab === 'archive' || !currentUser.isAdmin) ? 'none' : 'flex';
        });
    });
    
    // Добавление задач (только для админов)
    if (currentUser.isAdmin) {
        DOM.addBtn.addEventListener('click', addItem);
        DOM.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addItem();
        });
    }
    
    // Редактирование (только для админов)
    DOM.saveEditBtn.addEventListener('click', saveEdit);
    DOM.editInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveEdit();
    });
    DOM.cancelEditBtn.addEventListener('click', () => {
        DOM.editModal.classList.remove('active');
    });
    DOM.archiveBtn.addEventListener('click', moveToArchive);
    
    // Цвета
    DOM.colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            state.selectedColor = option.dataset.color;
            updateColorSelection();
        });
    });
    
    // Удаление (только для админов)
    DOM.confirmDeleteBtn.addEventListener('click', deleteItem);
    DOM.cancelDeleteBtn.addEventListener('click', () => {
        DOM.deleteModal.classList.remove('active');
    });
    
    // Подзадачи
    if (currentUser.id) {
        DOM.addSubtaskBtn.addEventListener('click', addSubtask);
        DOM.subtaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addSubtask();
        });
    }
    
    DOM.closeSubtasksTopBtn.addEventListener('click', closeSubtasksModal);
    DOM.closeSubtasksBtn.addEventListener('click', closeSubtasksModal);

    // Закрытие модалок
    window.addEventListener('click', (e) => {
        if (e.target === DOM.subtasksModal) closeSubtasksModal();
        if (e.target === DOM.editModal) DOM.editModal.classList.remove('active');
        if (e.target === DOM.deleteModal) DOM.deleteModal.classList.remove('active');
    });
    
    document.addEventListener('keydown', handleEscKey);
}

// ========== Обработчик изменений Firebase ==========
function initFirebaseListeners() {
    console.log('[Firebase] Инициализация слушателей');
    
    tasksRef.on('value', (snapshot) => {
        const data = snapshot.val() || {};
        console.log('[Firebase] Получены новые данные:', data);
        
        // Обновляем состояние
        state.tasks = data.tasks || [];
        state.events = data.events || [];
        state.archived = data.archived || [];
        
        // Форсируем обновление UI
        requestAnimationFrame(() => {
            renderAll();
            console.log('[UI] Интерфейс обновлен');
        });
    });
}

/// ========== Модифицированная функция init() ==========
function init() {
    initializeDataStructure();
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');

    if (userId) {
        checkUserPermissions(userId).then(() => {
            setupUIForUserRole();
            initFirebaseListeners(); // Добавляем слушателей после авторизации
        });
    } else {
        setupUIForUserRole();
        initFirebaseListeners(); // Слушатели для гостей
    }
    
    initEventListeners();
    console.log('[Init] Инициализация завершена');
}

// Запуск приложения после полной загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Init] DOM полностью загружен');
    init();
});
