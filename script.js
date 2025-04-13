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
const dbRef = database.ref();

// Состояние приложения
const state = {
    currentTab: 'tasks',
    tasks: {}, // Теперь объект вместо массива
    events: {},
    archived: {},
    currentEditId: null,
    currentDeleteId: null,
    selectedColor: "#e5e7eb",
    draggedItem: null,
    currentTaskWithSubtasks: null,
    currentEditType: null,
    currentUser: null,
    userPermissions: {
        view: false,
        edit: false,
        delete: false,
        archive: false,
        manageSubtasks: false
    }
};

// DOM элементы
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

// Инициализация структуры данных
function initializeDataStructure() {
    dbRef.once('value').then((snapshot) => {
        if (!snapshot.exists()) {
            const initialData = {
                tasks: {},
                events: {},
                archived: {},
                users: {
                    "647523973": {
                        name: "Димка",
                        permissions: {
                            view: true,
                            edit: true,
                            delete: true,
                            archive: true,
                            manageSubtasks: true
                        }
                    }
                }
            };
            dbRef.set(initialData);
        }
    });
}

// Проверка прав пользователя
async function checkPermissions(userId) {
    try {
        const userRef = database.ref('users/' + userId);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();
        
        if (userData && userData.permissions) {
            state.currentUser = userId;
            state.userPermissions = userData.permissions;
        } else {
            state.userPermissions = {
                view: true,
                edit: false,
                delete: false,
                archive: false,
                manageSubtasks: false
            };
        }
        updateUI();
    } catch (error) {
        console.error("Ошибка проверки прав:", error);
        state.userPermissions = {
            view: true,
            edit: false,
            delete: false,
            archive: false,
            manageSubtasks: false
        };
        updateUI();
    }
}

// Обновление интерфейса
function updateUI() {
    const canEdit = state.userPermissions.edit;
    
    // Форма добавления
    DOM.taskForm.style.display = canEdit ? 'flex' : 'none';
    
    // Кнопки в задачах
    document.querySelectorAll('.edit-btn, .delete-btn').forEach(btn => {
        btn.style.display = canEdit ? 'flex' : 'none';
    });
    
    // Drag and drop
    document.querySelectorAll('.task').forEach(task => {
        task.draggable = canEdit;
    });
}

// Рендеринг
function renderAll() {
    renderTasks();
    renderEvents();
    renderArchive();
    updateEmptyStates();
}

function renderTasks() {
    DOM.tasksList.innerHTML = '';
    
    if (!state.tasks || Object.keys(state.tasks).length === 0) {
        DOM.emptyStates.tasks.classList.add('active');
        return;
    }
    
    DOM.emptyStates.tasks.classList.remove('active');
    
    Object.entries(state.tasks).forEach(([id, task]) => {
        if (task) {
            DOM.tasksList.appendChild(createTaskElement(task, id, 'tasks'));
        }
    });
}

function renderEvents() {
    DOM.eventsList.innerHTML = '';
    
    if (!state.events || Object.keys(state.events).length === 0) {
        DOM.emptyStates.events.classList.add('active');
        return;
    }
    
    DOM.emptyStates.events.classList.remove('active');
    
    Object.entries(state.events).forEach(([id, event]) => {
        if (event) {
            DOM.eventsList.appendChild(createTaskElement(event, id, 'events'));
        }
    });
}

function renderArchive() {
    DOM.archiveList.innerHTML = '';
    
    if (!state.archived || Object.keys(state.archived).length === 0) {
        DOM.emptyStates.archive.classList.add('active');
        return;
    }
    
    DOM.emptyStates.archive.classList.remove('active');
    
    // Архив задач
    const archivedTasksHeader = document.createElement('h3');
    archivedTasksHeader.className = 'archive-header';
    archivedTasksHeader.textContent = 'Архив задач';
    DOM.archiveList.appendChild(archivedTasksHeader);
    
    Object.entries(state.archived)
        .filter(([_, item]) => item.originalType === 'tasks')
        .forEach(([id, item]) => {
            DOM.archiveList.appendChild(createArchiveItem(item, id));
        });
    
    // Архив мероприятий
    const archivedEventsHeader = document.createElement('h3');
    archivedEventsHeader.className = 'archive-header';
    archivedEventsHeader.textContent = 'Архив мероприятий';
    DOM.archiveList.appendChild(archivedEventsHeader);
    
    Object.entries(state.archived)
        .filter(([_, item]) => item.originalType === 'events')
        .forEach(([id, item]) => {
            DOM.archiveList.appendChild(createArchiveItem(item, id));
        });
}

// Создание элементов
function createTaskElement(item, id, type) {
    const taskEl = document.createElement('li');
    taskEl.className = 'task';
    taskEl.style.borderLeftColor = item.color || '#e5e7eb';
    taskEl.dataset.id = id;
    taskEl.draggable = state.userPermissions.edit;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'task-content';
    contentDiv.textContent = item.text;
    taskEl.appendChild(contentDiv);

    if (item.assignedTo) {
        const assignedDiv = document.createElement('div');
        assignedDiv.className = 'task-assigned-to';
        assignedDiv.textContent = `→ ${item.assignedTo}`;
        taskEl.appendChild(assignedDiv);
    }

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';

    if (state.userPermissions.edit) {
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-icon edit-btn';
        editBtn.innerHTML = `<!-- SVG иконка -->`;
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(id, type);
        });
        actionsDiv.appendChild(editBtn);
    }

    if (state.userPermissions.delete) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon delete-btn';
        deleteBtn.innerHTML = `<!-- SVG иконка -->`;
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openDeleteModal(id, type);
        });
        actionsDiv.appendChild(deleteBtn);
    }

    taskEl.appendChild(actionsDiv);

    if (type === 'tasks') {
        contentDiv.addEventListener('click', () => {
            openSubtasksModal(id);
        });
    }

    return taskEl;
}

// Остальные функции (addItem, saveEdit, deleteItem и т.д.) адаптируются аналогично
// с заменой работы с массивами на работу с объектами

// Инициализация
function init() {
    initializeDataStructure();
    
    const urlParams = new URLSearchParams(window.location.search);
    const tgId = urlParams.get('tgid') || getTgIdFromInitData();
    
    // Загрузка данных
    dbRef.on('value', (snapshot) => {
        const data = snapshot.val() || {};
        state.tasks = data.tasks || {};
        state.events = data.events || {};
        state.archived = data.archived || {};
        
        if (tgId) checkPermissions(tgId);
        else {
            state.userPermissions.view = true;
            updateUI();
        }
        
        renderAll();
    });
    
    initEventListeners();
}

// Запуск
init();
