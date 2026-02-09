// Crab Tasks - App
const DATA_URL = 'data/tasks.json';

async function loadTasks() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error('Failed to load tasks');
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

function createCard(task, type) {
  const card = document.createElement('div');
  card.className = `card ${type === 'done' ? 'card-done' : ''}`;
  
  if (type === 'cron') {
    card.innerHTML = `
      <div class="card-title">${task.name}</div>
      <div class="card-meta">
        <span class="cron-schedule">${task.schedule}</span>
        <span class="cron-status ${task.enabled ? 'cron-enabled' : 'cron-disabled'}">
          <span class="cron-status-dot"></span>
          ${task.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    `;
  } else {
    const priorityClass = `priority-${task.priority}`;
    card.innerHTML = `
      <div class="card-title">${task.title}</div>
      <div class="card-meta">
        <span class="priority ${priorityClass}">${task.priority}</span>
        <span class="card-date">${task.created}</span>
        ${task.completed ? `<span class="card-completed">✓ ${task.completed}</span>` : ''}
      </div>
    `;
  }
  
  return card;
}

function renderSection(container, items, type, emoji, title) {
  if (!items || items.length === 0) {
    container.innerHTML = '<div class="empty">No items</div>';
    return;
  }
  
  const grid = document.createElement('div');
  grid.className = 'cards-grid';
  
  items.forEach(item => {
    grid.appendChild(createCard(item, type));
  });
  
  container.appendChild(grid);
  
  // Update count
  const section = container.closest('.section');
  const countEl = section.querySelector('.section-count');
  if (countEl) countEl.textContent = items.length;
}

function updateStats(data) {
  document.getElementById('stat-cron').textContent = data.cronJobs?.length || 0;
  document.getElementById('stat-todo').textContent = data.todo?.length || 0;
  document.getElementById('stat-progress').textContent = data.inProgress?.length || 0;
  document.getElementById('stat-done').textContent = data.done?.length || 0;
}

async function init() {
  const data = await loadTasks();
  
  if (!data) {
    document.querySelector('.main').innerHTML = '<div class="error">Failed to load tasks</div>';
    return;
  }
  
  updateStats(data);
  
  renderSection(document.getElementById('cron-list'), data.cronJobs, 'cron', '📋', 'Cron Jobs');
  renderSection(document.getElementById('todo-list'), data.todo, 'task', '✅', 'TODO');
  renderSection(document.getElementById('progress-list'), data.inProgress, 'task', '🔄', 'In Progress');
  renderSection(document.getElementById('done-list'), data.done, 'done', '✔️', 'Done');
  
  // Update timestamp
  document.getElementById('last-updated').textContent = new Date().toLocaleString();
}

document.addEventListener('DOMContentLoaded', init);
