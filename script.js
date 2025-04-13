
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
    currentEditType: null,
    userPermissions: {
        view: false,
        edit: false,
        delete: false,
        archive: false,
        manageSubtasks: false
    },
    currentUserId: null
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
    taskForm: document.querySelector('.task-form')
};

// ========== Инициализация Firebase ==========
function initializeDataStructure() {
    tasksRef.once('value').then((snapshot) => {
        if (!snapshot.exists()) {
            tasksRef.set({
                tasks: [],
                events: [],
                archived: []
            });
        }
    });
}

// ========== Проверка прав доступа ==========
async function fetchUserPermissions() {
    const userId = localStorage.getItem('tg_user_id');
    if (!userId) {
        console.error('User ID not found');
        showAccessDenied();
        return null;
    }

    try {
        const snapshot = await database.ref('users/' + userId).once('value');
        if (snapshot.exists()) {
            console.log('User permissions:', snapshot.val()); // Логируем данные
            return snapshot.val().permissions;
        } else {
            console.warn('User permissions not found for ID:', userId);
            //showAccessDenied(); // Пока закомментируем, чтобы не вызывать ее дважды
            return { view: false, edit: false, delete: false, archive: false, manageSubtasks: false }; // Возвращаем дефолтные права
        }
    } catch (error) {
        console.error('Error fetching user permissions:', error);
        showAccessDenied();
        return null;
    }

function showAccessDenied() {
    document.body.innerHTML = `
        <div class="access-denied">
            <h2>Доступ запрещен</h2>
            <p>У вас нет прав для просмотра задач. Обратитесь к администратору.</p>
        </div>
    `;
}

function hasPermission(permission) {
    return state.userPermissions[permission] === true;
}

// ========== Основные функции рендеринга ==========
function renderAll() {
    renderTasks();
    renderEvents();
    renderArchive();
    updateEmptyStates();
}

function renderTasks() {
    DOM.tasksList.innerHTML = '';
    state.tasks.forEach((task, index) => {
        DOM.tasksList.appendChild(createTaskElement(task, index, 'tasks'));
    });

    // Скрыть кнопку добавления задач, если у пользователя нет прав на редактирование
    DOM.addBtn.style.display = hasPermission('edit') ? 'block' : 'none';
    DOM.taskForm.style.display = (state.currentTab !== 'archive' && state.userPermissions.edit) ? 'flex' : 'none';
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

// ========== Модифицированные функции с проверкой прав ==========
function createTaskElement(item, index, type) {
    const taskEl = document.createElement('li');
    taskEl.className = 'task';
    taskEl.style.borderLeftColor = item.color || '#e5e7eb';

    let actionsHTML = '';
    if (state.userPermissions.edit) {
        actionsHTML += `
            <button class="btn-icon edit-btn" title="Редактировать">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
        `;
    }
    if (state.userPermissions.delete) {
        actionsHTML += `
            <button class="btn-icon delete-btn" title="Удалить">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        `;
    }

    taskEl.innerHTML = `
        <div class="task-content">${item.text}</div>
        <div class="task-actions">${actionsHTML}</div>
    `;

    // Обработчики событий
    const contentEl = taskEl.querySelector('.task-content');
    if (type === 'tasks' && state.userPermissions.manageSubtasks) {
        contentEl.addEventListener('click', (e) => {
            if (!e.target.closest('.task-actions')) {
                openSubtasksModal(index);
            }
        });
    }

    const editBtn = taskEl.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(index, type);
        });
    }

    const deleteBtn = taskEl.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openDeleteModal(index, type);
        });
    }
    taskEl.setAttribute('draggable', state.userPermissions.edit);
    // Drag and Drop только для пользователей с правами edit
    if (state.userPermissions.edit) {
        taskEl.addEventListener('dragstart', handleDragStart);
        taskEl.addEventListener('dragover', handleDragOver);
        taskEl.addEventListener('drop', handleDrop);
        taskEl.addEventListener('dragend', handleDragEnd);
    } else {
        taskEl.setAttribute('draggable', 'false');
    }


    return taskEl;
}

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

// ========== Функции работы с данными ==========
function addItem() {
    if (!hasPermission('edit')) {
        alert("У вас нет прав на добавление задач");
        return;
    }

    const text = DOM.taskInput.value.trim();
    if (!text) return;

    const newItem = {
        text: text,
        color: "#e5e7eb",
        createdAt: Date.now(),
        subtasks: []
    };

    tasksRef.transaction((currentData) => {
        currentData = currentData || {};
        if (state.currentTab === 'tasks') {
            currentData.tasks = currentData.tasks || [];
            currentData.tasks.unshift(newItem);
        } else {
            currentData.events = currentData.events || [];
            currentData.events.unshift(newItem);
        }
        return currentData;
    }).then(() => {
        DOM.taskInput.value = '';
    }).catch(console.error);
}

function saveEdit() {
    if (!hasPermission('edit')) {
        alert("У вас нет прав на редактирование задач");
        DOM.editModal.classList.remove('active');
        return;
    }

    const newText = DOM.editInput.value.trim();
    if (!newText || state.currentEditIndex === null) return;

    tasksRef.transaction((currentData) => {
        if (state.currentEditType === 'tasks') {
            currentData.tasks[state.currentEditIndex].text = newText;
            currentData.tasks[state.currentEditIndex].color = state.selectedColor;
        } else if (state.currentEditType === 'events') {
            currentData.events[state.currentEditIndex].text = newText;
            currentData.events[state.currentEditIndex].color = state.selectedColor;
        } else {
            currentData.archived[state.currentEditIndex].text = newText;
            currentData.archived[state.currentEditIndex].color = state.selectedColor;
        }
        return currentData;
    }).then(() => {
        DOM.editModal.classList.remove('active');
    }).catch(console.error);
}

function moveToArchive() {
    if (!hasPermission('archive')) {
        alert("У вас нет прав на архивацию задач");
        DOM.editModal.classList.remove('active');
        return;
    }

    if (state.currentEditIndex === null || !state.currentEditType) return;

    tasksRef.transaction((currentData) => {
        if (!currentData) currentData = { tasks: [], events: [], archived: [] };

        const itemToArchive = {
            ...currentData[state.currentEditType][state.currentEditIndex],
            archivedAt: Date.now(),
            originalType: state.currentEditType
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
    if (!hasPermission('delete')) {
        alert("У вас нет прав на удаление задач");
        DOM.deleteModal.classList.remove('active');
        return;
    }

    if (state.currentDeleteIndex === null) return;

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
    if (!hasPermission('manageSubtasks')) {
        alert("У вас нет прав на управление подзадачами");
        return;
    }
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

    DOM.subtasksModal.classList.add('active');
    DOM.subtaskInput.focus();
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
        <button class="btn-icon delete-subtask-btn" title="Удалить подзадачу">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 6h18"></path>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
        </button>
    `;

    const checkbox = subtaskEl.querySelector('.subtask-checkbox');
    checkbox.addEventListener('change', function() {
        const isChecked = this.checked;
        subtaskEl.querySelector('label').classList.toggle('completed', isChecked);

        tasksRef.transaction((currentData) => {
            if (currentData && currentData.tasks[state.currentTaskWithSubtasks]?.subtasks?.[index]) {
                currentData.tasks[state.currentTaskWithSubtasks].subtasks[index].completed = isChecked;
            }
            return currentData;
        }).catch(error => {
            console.error('Error updating subtask:', error);
            checkbox.checked = !isChecked;
            subtaskEl.querySelector('label').classList.toggle('completed');
        });
    });

    // Добавляем обработчик удаления подзадачи
    const deleteBtn = subtaskEl.querySelector('.delete-subtask-btn');
    deleteBtn.addEventListener('click', () => {
        deleteSubtask(index);
    });

    DOM.subtasksList.appendChild(subtaskEl);
}

function deleteSubtask(index) {
    tasksRef.transaction((currentData) => {
        if (currentData && currentData.tasks[state.currentTaskWithSubtasks]?.subtasks) {
            currentData.tasks[state.currentTaskWithSubtasks].subtasks.splice(index, 1);
        }
        return currentData;
    }).then(() => {
        // После успешного удаления в Firebase, перерисовываем подзадачи
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
    if (!hasPermission('manageSubtasks')) {
        alert("У вас нет прав на управление подзадачами");
        return;
    }
    const text = DOM.subtaskInput.value.trim();
    if (!text || state.currentTaskWithSubtasks === null) return;

    const newSubtask = {
        text: text,
        completed: false,
        createdAt: Date.now()
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
    state.draggedItem = this;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => this.classList.add('dragging'), 0);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
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
    DOM.emptyStates.tasks.classList.toggle('active', state.tasks.length === 0);
    DOM.emptyStates.events.classList.toggle('active', state.events.length === 0);
    DOM.emptyStates.archive.classList.toggle('active', state.archived.length === 0);
}

function openEditModal(index, type) {
    if (!hasPermission('edit')) {
        alert("У вас нет прав на редактирование задач");
        return;
    }

    state.currentEditIndex = index;
    state.currentEditType = type;
    const item = type === 'tasks' ? state.tasks[index] :
        type === 'events' ? state.events[index] :
            state.archived[index];
    DOM.editInput.value = item.text;
    state.selectedColor = item.color || '#e5e7eb';
    updateColorSelection();
    DOM.editModal.classList.add('active');
    DOM.editInput.focus();
}

function openDeleteModal(index, type) {
    if (!hasPermission('delete')) {
        alert("У вас нет прав на удаление задач");
        return;
    }

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
            DOM.tabBtns.forEach(b => b.classList.remove('active'));
            DOM.tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            state.currentTab = btn.dataset.tab;
            document.getElementById(`${state.currentTab}-tab`).classList.add('active');
            DOM.taskForm.style.display = (state.currentTab !== 'archive' && state.userPermissions.edit) ? 'flex' : 'none';
        });
    });

    // Добавление задач
    DOM.addBtn.addEventListener('click', addItem);
    DOM.taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItem();
    });

    // Редактирование
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

    // Удаление
    DOM.confirmDeleteBtn.addEventListener('click', deleteItem);
    DOM.cancelDeleteBtn.addEventListener('click', () => {
        DOM.deleteModal.classList.remove('active');
    });

    // Подзадачи
    DOM.addSubtaskBtn.addEventListener('click', addSubtask);
    DOM.subtaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addSubtask();
    });
    DOM.closeSubtasksTopBtn.addEventListener('click', closeSubtasksModal);

    // Закрытие модалки подзадач
    DOM.closeSubtasksBtn.addEventListener('click', closeSubtasksModal);

    // Закрытие модалок
    window.addEventListener('click', (e) => {
        if (e.target === DOM.subtasksModal) closeSubtasksModal();
    });

    document.addEventListener('keydown', handleEscKey);
}

// ========== Инициализация приложения ==========
// ========== Инициализация приложения ==========
async function init() {
    initializeDataStructure();

    const permissions = await fetchUserPermissions();
    if (permissions) {
        state.userPermissions = permissions;
        initApp(); // Инициализируем остальную часть приложения только после получения прав
    } else {
        showAccessDenied(); // Покажем Access Denied, если прав нет и fetchUserPermissions вернул null
    }

}

function initApp() {
    // Загрузка данных из Firebase
    tasksRef.on('value', (snapshot) => {
        const data = snapshot.val() || {};
        state.tasks = data.tasks || [];
        state.events = data.events || [];
        state.archived = data.archived || [];
        renderAll();
    });

    // Показываем/скрываем форму добавления в зависимости от прав
    DOM.taskForm.style.display = (state.currentTab !== 'archive' && state.userPermissions.edit) ? 'flex' : 'none';

    initEventListeners();
}

// Запуск приложения
init();
