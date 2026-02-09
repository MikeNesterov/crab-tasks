// Crab Tasks - App
const DATA_URL = 'data/tasks.json';

const DAYS_RU = ['воскресеньям', 'понедельникам', 'вторникам', 'средам', 'четвергам', 'пятницам', 'субботам'];

function parseCronToHuman(cronExpr, tz) {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) return cronExpr;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const tzSuffix = tz && tz !== 'UTC' ? ` (${tz})` : '';

  function padTime(h, m) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // Every N minutes: */N * * * *
  if (minute.startsWith('*/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const n = parseInt(minute.slice(2), 10);
    if (n === 1) return `Каждую минуту${tzSuffix}`;
    return `Каждые ${n} мин.${tzSuffix}`;
  }

  // Every N hours: 0 */N * * *
  if (hour.startsWith('*/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const n = parseInt(hour.slice(2), 10);
    if (n === 1) return `Каждый час${tzSuffix}`;
    return `Каждые ${n} ч.${tzSuffix}`;
  }

  // Specific minute and hour
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour)) {
    const time = padTime(parseInt(hour, 10), parseInt(minute, 10));

    // Specific day of week: 0 10 * * 1
    if (dayOfMonth === '*' && month === '*' && /^\d+$/.test(dayOfWeek)) {
      const dow = parseInt(dayOfWeek, 10);
      return `По ${DAYS_RU[dow]} в ${time}${tzSuffix}`;
    }

    // Specific day of month: 0 10 1 * *
    if (/^\d+$/.test(dayOfMonth) && month === '*' && dayOfWeek === '*') {
      return `${parseInt(dayOfMonth, 10)}-го числа каждого месяца в ${time}${tzSuffix}`;
    }

    // Daily: 0 10 * * *
    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return `Ежедневно в ${time}${tzSuffix}`;
    }
  }

  return cronExpr;
}

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
    const humanSchedule = parseCronToHuman(task.schedule, task.tz);
    card.innerHTML = `
      <div class="card-title">${task.name}</div>
      <div class="card-meta">
        <span class="cron-schedule" title="${task.schedule}">${humanSchedule}</span>
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
  container.innerHTML = '';
  container.classList.remove('loading');

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
