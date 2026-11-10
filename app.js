/**
 * TASKORBIT - TO-DO LIST WEB APP JAVASCRIPT
 * Pure Vanilla JavaScript (ES6+) with LocalStorage Persistence
 * Developed by Harish Raghavendra for CodeOrbit Tech Internship (Task 2)
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const todoForm = document.getElementById('todo-form');
  const taskInput = document.getElementById('task-input');
  const prioritySelect = document.getElementById('priority-select');
  const todoList = document.getElementById('todo-list');
  const emptyState = document.getElementById('empty-state');

  // Stats Elements
  const totalCountEl = document.getElementById('total-count');
  const pendingCountEl = document.getElementById('pending-count');
  const completedCountEl = document.getElementById('completed-count');
  const progressFillEl = document.getElementById('progress-fill');
  const progressTextEl = document.getElementById('progress-text');
  const tasksLeftEl = document.getElementById('tasks-left');

  // Search & Filters
  const searchInput = document.getElementById('search-input');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const clearCompletedBtn = document.getElementById('clear-completed-btn');

  // Edit Modal Elements
  const editModal = document.getElementById('edit-modal');
  const editForm = document.getElementById('edit-form');
  const editTaskInput = document.getElementById('edit-task-input');
  const editPrioritySelect = document.getElementById('edit-priority-select');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');

  // Toast Container
  const toastContainer = document.getElementById('toast-container');

  // --- State ---
  const STORAGE_KEY = 'codeorbit_taskorbit_tasks';
  let currentFilter = 'all';
  let searchQuery = '';
  let currentlyEditingId = null;

  // Starter demo tasks if localStorage is empty
  const defaultTasks = [
    {
      id: 'task-1',
      text: 'Complete CodeOrbit Tech Full Stack Internship tasks',
      priority: 'high',
      completed: true,
      createdAt: Date.now() - 3600000 * 5
    },
    {
      id: 'task-2',
      text: 'Build & review Personal Portfolio Website',
      priority: 'high',
      completed: true,
      createdAt: Date.now() - 3600000 * 3
    },
    {
      id: 'task-3',
      text: 'Test Simple REST API endpoints with Postman',
      priority: 'medium',
      completed: false,
      createdAt: Date.now() - 3600000 * 1
    }
  ];

  let tasks = loadTasks();

  // --- Functions ---

  function loadTasks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading tasks from localStorage', e);
    }
    // Return defaults and save them
    saveTasks(defaultTasks);
    return defaultTasks;
  }

  function saveTasks(tasksToSave) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
    } catch (e) {
      console.error('Error saving tasks to localStorage', e);
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'danger') iconClass = 'fa-trash-can';

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 250);
    }, 2400);
  }

  function escapeHtml(string) {
    const div = document.createElement('div');
    div.textContent = string;
    return div.innerHTML;
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    totalCountEl.textContent = total;
    pendingCountEl.textContent = pending;
    completedCountEl.textContent = completed;
    progressFillEl.style.width = `${percent}%`;
    progressTextEl.textContent = `${percent}% Done`;
    tasksLeftEl.textContent = `${pending} ${pending === 1 ? 'task' : 'tasks'} remaining`;
  }

  function renderTasks() {
    updateStats();

    // Filter tasks
    const filtered = tasks.filter(task => {
      // Status filter
      if (currentFilter === 'active' && task.completed) return false;
      if (currentFilter === 'completed' && !task.completed) return false;

      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return task.text.toLowerCase().includes(query);
      }

      return true;
    });

    todoList.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.classList.add('visible');
    } else {
      emptyState.classList.remove('visible');

      filtered.forEach(task => {
        const li = document.createElement('li');
        li.className = `todo-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', task.id);

        li.innerHTML = `
          <div class="todo-main">
            <div class="custom-checkbox" role="checkbox" aria-checked="${task.completed}" title="Mark task as ${task.completed ? 'pending' : 'completed'}">
              <i class="fa-solid fa-check"></i>
            </div>
            <div class="task-info">
              <span class="task-text">${escapeHtml(task.text)}</span>
              <div class="task-meta">
                <span class="priority-tag priority-${task.priority}">${task.priority}</span>
                <span class="task-time">${formatDate(task.createdAt)}</span>
              </div>
            </div>
          </div>
          <div class="todo-actions">
            <button class="action-btn edit-btn" title="Edit Task" aria-label="Edit Task">
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
            <button class="action-btn delete-btn" title="Delete Task" aria-label="Delete Task">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        `;

        // Event: Toggle complete
        const checkbox = li.querySelector('.custom-checkbox');
        checkbox.addEventListener('click', () => toggleTask(task.id));

        // Event: Edit task
        const editBtn = li.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => openEditModal(task.id));

        // Event: Delete task
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        todoList.appendChild(li);
      });
    }
  }

  // Add Task
  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    const newTask = {
      id: 'task-' + Date.now(),
      text: text,
      priority: prioritySelect.value,
      completed: false,
      createdAt: Date.now()
    };

    tasks.unshift(newTask);
    saveTasks(tasks);
    renderTasks();

    taskInput.value = '';
    taskInput.focus();
    showToast('Task added successfully!', 'success');
  });

  // Toggle Task Completion
  function toggleTask(id) {
    tasks = tasks.map(task => {
      if (task.id === id) {
        const nextState = !task.completed;
        showToast(nextState ? 'Task completed! Great job! 🎉' : 'Task marked as pending', 'info');
        return { ...task, completed: nextState };
      }
      return task;
    });

    saveTasks(tasks);
    renderTasks();
  }

  // Delete Task
  function deleteTask(id) {
    const taskToDelete = tasks.find(t => t.id === id);
    tasks = tasks.filter(task => task.id !== id);
    saveTasks(tasks);
    renderTasks();
    showToast(`Deleted: "${taskToDelete ? taskToDelete.text.substring(0, 25) + '...' : 'Task'}"`, 'danger');
  }

  // Open Edit Modal
  function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    currentlyEditingId = id;
    editTaskInput.value = task.text;
    editPrioritySelect.value = task.priority;
    editModal.classList.remove('hidden');
    editTaskInput.focus();
  }

  // Close Edit Modal
  function closeEditModal() {
    editModal.classList.add('hidden');
    currentlyEditingId = null;
  }

  closeModalBtn.addEventListener('click', closeEditModal);
  cancelEditBtn.addEventListener('click', closeEditModal);
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
  });

  // Save Edited Task
  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentlyEditingId) return;

    const newText = editTaskInput.value.trim();
    if (!newText) return;

    tasks = tasks.map(task => {
      if (task.id === currentlyEditingId) {
        return {
          ...task,
          text: newText,
          priority: editPrioritySelect.value
        };
      }
      return task;
    });

    saveTasks(tasks);
    renderTasks();
    closeEditModal();
    showToast('Task updated successfully!', 'success');
  });

  // Search Filter
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTasks();
  });

  // Status Filter Tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-filter');
      renderTasks();
    });
  });

  // Clear Completed Tasks
  clearCompletedBtn.addEventListener('click', () => {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      showToast('No completed tasks to clear', 'info');
      return;
    }

    if (confirm(`Are you sure you want to clear ${completedCount} completed task(s)?`)) {
      tasks = tasks.filter(t => !t.completed);
      saveTasks(tasks);
      renderTasks();
      showToast(`Cleared ${completedCount} completed tasks`, 'danger');
    }
  });

  // Initial Render
  renderTasks();
});
