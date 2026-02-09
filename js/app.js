// Crab Tasks - App
const DATA_URL = 'data/tasks.json';

const DAYS_RU = ['воскресеньям', 'понедельникам', 'вторникам', 'средам', 'четвергам', 'пятницам', 'субботам'];

let currentProject = 'all';
let tasksData = null;
let showHidden = false;

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
    const m = parseInt(minute, 10);
    if (/^\d+$/.test(minute) && m !== 0) {
      return `Каждые ${n} ч. в :${String(m).padStart(2, '0')}${tzSuffix}`;
    }
    return `Каждые ${n} ч.${tzSuffix}`;
  }

  // Specific minute and hour
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour)) {
    const time = padTime(parseInt(hour, 10), parseInt(minute, 10));

    // Specific day of week: 0 10 * * 1
    if (dayOfMonth === '*' && month === '*' && /^\d+$/.test(dayOfWeek)) {
      const dow = parseInt(dayOfWeek, 10);
      if (dow < 0 || dow > 6) return cronExpr;
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

function filterByProject(items) {
  if (currentProject === 'all') return items;
  return items.filter(item => item.project === currentProject);
}

function createCard(task, type) {
  const card = document.createElement('div');
  card.className = `card ${type === 'done' ? 'card-done' : ''}`;

  const projectBadge = task.project
    ? `<span class="project-badge project-${task.project}">${task.project}</span>`
    : '';

  if (type === 'cron') {
    if (task.hidden) card.classList.add('card-hidden');
    const humanSchedule = parseCronToHuman(task.schedule, task.tz);
    const visibilityBtn = task.hidden
      ? `<button class="visibility-btn unhide-btn" data-id="${task.id}" title="Unhide">👁️</button>`
      : `<button class="visibility-btn hide-btn" data-id="${task.id}" title="Hide">👁️‍🗨️</button>`;
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${task.name}</div>
        ${visibilityBtn}
      </div>
      <div class="card-meta">
        <span class="cron-schedule" title="${task.schedule.replace(/"/g, '&quot;')}">${humanSchedule}</span>
        <span class="cron-status ${task.enabled ? 'cron-enabled' : 'cron-disabled'}">
          <span class="cron-status-dot"></span>
          ${task.enabled ? 'Enabled' : 'Disabled'}
        </span>
        ${projectBadge}
      </div>
    `;
  } else {
    const priorityClass = `priority-${task.priority}`;
    card.innerHTML = `
      <div class="card-title">${task.title}</div>
      <div class="card-meta">
        <span class="priority ${priorityClass}">${task.priority}</span>
        ${projectBadge}
        <span class="card-date">${task.created}</span>
        ${task.completed ? `<span class="card-completed">✓ ${task.completed}</span>` : ''}
      </div>
    `;
  }

  return card;
}

function filterCronVisibility(items) {
  if (showHidden) return items;
  return items.filter(item => !item.hidden);
}

function toggleCronHidden(id) {
  if (!tasksData) return;
  const job = tasksData.cronJobs.find(j => j.id === id);
  if (job) {
    job.hidden = !job.hidden;
    renderAll();
  }
}

function renderSection(container, items, type, emoji, title) {
  container.innerHTML = '';
  container.classList.remove('loading');

  const displayItems = type === 'cron' ? filterCronVisibility(items) : items;

  if (!displayItems || displayItems.length === 0) {
    container.innerHTML = '<div class="empty">No items</div>';
    const section = container.closest('.section');
    const countEl = section.querySelector('.section-count');
    if (countEl) countEl.textContent = 0;
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'cards-grid';

  displayItems.forEach(item => {
    grid.appendChild(createCard(item, type));
  });

  container.appendChild(grid);

  if (type === 'cron') {
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.visibility-btn');
      if (btn) toggleCronHidden(btn.dataset.id);
    });
  }

  const section = container.closest('.section');
  const countEl = section.querySelector('.section-count');
  if (countEl) countEl.textContent = displayItems.length;
}

function updateStats(data) {
  const allCron = filterByProject(data.cronJobs || []);
  const visibleCron = allCron.filter(j => !j.hidden);
  document.getElementById('stat-cron').textContent = `${visibleCron.length} / ${allCron.length}`;
  document.getElementById('stat-todo').textContent = filterByProject(data.todo || []).length;
  document.getElementById('stat-progress').textContent = filterByProject(data.inProgress || []).length;
  document.getElementById('stat-done').textContent = filterByProject(data.done || []).length;
}

function renderAll() {
  if (!tasksData) return;

  updateStats(tasksData);

  renderSection(document.getElementById('cron-list'), filterByProject(tasksData.cronJobs || []), 'cron', '📋', 'Cron Jobs');
  renderSection(document.getElementById('todo-list'), filterByProject(tasksData.todo || []), 'task', '✅', 'TODO');
  renderSection(document.getElementById('progress-list'), filterByProject(tasksData.inProgress || []), 'task', '🔄', 'In Progress');
  renderSection(document.getElementById('done-list'), filterByProject(tasksData.done || []), 'done', '✔️', 'Done');
}

function initFilter() {
  const filterContainer = document.getElementById('project-filter');
  filterContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    filterContainer.querySelector('.filter-btn.active').classList.remove('active');
    btn.classList.add('active');

    currentProject = btn.dataset.project;
    renderAll();
  });
}

function initHiddenToggle() {
  const checkbox = document.getElementById('show-hidden-checkbox');
  checkbox.addEventListener('change', () => {
    showHidden = checkbox.checked;
    renderAll();
  });
}

async function init() {
  tasksData = await loadTasks();

  if (!tasksData) {
    document.querySelector('.main').innerHTML = '<div class="error">Failed to load tasks</div>';
    return;
  }

  initFilter();
  initHiddenToggle();
  renderAll();

  document.getElementById('last-updated').textContent = new Date().toLocaleString();
}

document.addEventListener('DOMContentLoaded', init);
