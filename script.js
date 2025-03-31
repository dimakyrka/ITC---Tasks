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
let tasks = [];
let currentEditIndex = null;
let currentDeleteIndex = null;
let selectedColor = "#e5e7eb";
let draggedItem = null;

// DOM элементы
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const tasksList = document.getElementById('tasks');
const emptyState = document.getElementById('empty-state');
const editModal = document.getElementById('edit-modal');
const editInput = document.getElementById('edit-input');
const saveEditBtn = document.getElementById('save-edit');
const cancelEditBtn = document.getElementById('cancel-edit');
const colorOptions = document.querySelectorAll('#edit-modal .color-option');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');

// Загрузка задач из Firebase
tasksRef.on('value', (snapshot) => {
    tasks = snapshot.val() || [];
    renderTasks();
    updateEmptyState();
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
            <div class="task-content">${task.text || task}</div>
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
        
        tasksList.appendChild(taskEl);
    });
    
    // Навешиваем обработчики событий
    document.querySelectorAll('.task').forEach(task => {
        task.addEventListener('dragstart', handleDragStart);
        task.addEventListener('dragover', handleDragOver);
        task.addEventListener('drop', handleDrop);
        task.addEventListener('dragend', handleDragEnd);
        
        task.querySelector('.edit-btn').addEventListener('click', () => {
            openEditModal(parseInt(task.dataset.index));
        });
        
        task.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openDeleteModal(parseInt(task.dataset.index));
        });
    });
}

// Обновление пустого состояния
function updateEmptyState() {
    emptyState.style.display = tasks.length === 0 ? 'block' : 'none';
}

// Добавление задачи
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

function addTask() {
    const text = taskInput.value.trim();
    if (text) {
        tasksRef.transaction((currentTasks) => {
            currentTasks = currentTasks || [];
            currentTasks.unshift({
                text: text,
                color: "#e5e7eb",
                createdAt: Date.now()
            });
            return currentTasks;
        });
        taskInput.value = '';
    }
}

// Редактирование задачи
function openEditModal(index) {
    currentEditIndex = index;
    const task = tasks[index];
    editInput.value = task.text || task;
    selectedColor = task.color || '#e5e7eb';
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

saveEditBtn.addEventListener('click', saveTaskEdit);
editInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveTaskEdit();
});

cancelEditBtn.addEventListener('click', () => {
    editModal.classList.remove('active');
});

function saveTaskEdit() {
    const newText = editInput.value.trim();
    if (newText && currentEditIndex !== null) {
        tasksRef.transaction((currentTasks) => {
            if (typeof currentTasks[currentEditIndex] === 'object') {
                currentTasks[currentEditIndex].text = newText;
                currentTasks[currentEditIndex].color = selectedColor;
            } else {
                currentTasks[currentEditIndex] = {
                    text: newText,
                    color: selectedColor,
                    createdAt: Date.now()
                };
            }
            return currentTasks;
        });
        editModal.classList.remove('active');
    }
}

// Удаление задачи
function openDeleteModal(index) {
    currentDeleteIndex = index;
    deleteModal.classList.add('active');
}

confirmDeleteBtn.addEventListener('click', () => {
    if (currentDeleteIndex !== null) {
        tasksRef.transaction((currentTasks) => {
            currentTasks.splice(currentDeleteIndex, 1);
            return currentTasks;
        });
        deleteModal.classList.remove('active');
        currentDeleteIndex = null;
    }
});

cancelDeleteBtn.addEventListener('click', () => {
    deleteModal.classList.remove('active');
    currentDeleteIndex = null;
});

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
        swapTasks(fromIndex, toIndex);
    }
}

function handleDragEnd() {
    this.classList.remove('dragging');
}

function swapTasks(fromIndex, toIndex) {
    tasksRef.transaction((currentTasks) => {
        const temp = currentTasks[fromIndex];
        currentTasks[fromIndex] = currentTasks[toIndex];
        currentTasks[toIndex] = temp;
        return currentTasks;
    });
}

// Закрытие модалок по клику вне области
window.addEventListener('click', (e) => {
    if (e.target === editModal) {
        editModal.classList.remove('active');
    }
    if (e.target === deleteModal) {
        deleteModal.classList.remove('active');
    }
});
