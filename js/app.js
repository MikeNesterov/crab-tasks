// Crab Tasks - App
const DATA_URL = 'data/tasks.json';

const DAYS_RU = ['воскресеньям', 'понедельникам', 'вторникам', 'средам', 'четвергам', 'пятницам', 'субботам'];

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

let currentProject = 'all';
let tasksData = null;

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

function groupByProject(data) {
  const projects = {};

  function addItems(items, status) {
    (items || []).forEach(item => {
      const proj = item.project || 'other';
      if (!projects[proj]) {
        projects[proj] = { tasks: [], crons: [] };
      }
      if (status === 'cron') {
        projects[proj].crons.push(item);
      } else {
        projects[proj].tasks.push({ ...item, status });
      }
    });
  }

  addItems(data.cronJobs, 'cron');
  addItems(data.todo, 'todo');
  addItems(data.inProgress, 'in-progress');
  addItems(data.done, 'done');

  // Sort tasks by priority within each project
  for (const proj of Object.values(projects)) {
    proj.tasks.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3));
  }

  return projects;
}

function createTaskRow(task) {
  const row = document.createElement('div');
  row.className = `task-row task-row--${task.status}`;

  const statusLabels = { 'todo': 'TODO', 'in-progress': 'In Progress', 'done': 'Done' };
  const statusIcons = { 'todo': '○', 'in-progress': '◐', 'done': '●' };

  row.innerHTML = `
    <span class="task-row__status-icon">${statusIcons[task.status]}</span>
    <span class="task-row__title">${task.title}</span>
    <span class="task-row__badges">
      <span class="priority priority-${task.priority}">${task.priority}</span>
      <span class="task-row__status-label task-row__status-label--${task.status}">${statusLabels[task.status]}</span>
      ${task.completed ? `<span class="card-completed">✓ ${task.completed}</span>` : ''}
    </span>
  `;

  return row;
}

function createCronRow(cron) {
  const row = document.createElement('div');
  row.className = 'task-row task-row--cron';

  const humanSchedule = parseCronToHuman(cron.schedule, cron.tz);

  row.innerHTML = `
    <span class="task-row__status-icon">⏱</span>
    <span class="task-row__title">${cron.name}</span>
    <span class="task-row__badges">
      <span class="cron-schedule" title="${cron.schedule.replace(/"/g, '&quot;')}">${humanSchedule}</span>
      <span class="cron-status ${cron.enabled ? 'cron-enabled' : 'cron-disabled'}">
        <span class="cron-status-dot"></span>
        ${cron.enabled ? 'Enabled' : 'Disabled'}
      </span>
    </span>
  `;

  return row;
}

function renderProjectView() {
  const container = document.getElementById('projects-container');
  container.innerHTML = '';
  container.classList.remove('loading');

  const projects = groupByProject(tasksData);
  const projectNames = Object.keys(projects).sort();

  const filteredNames = currentProject === 'all'
    ? projectNames
    : projectNames.filter(name => name === currentProject);

  if (filteredNames.length === 0) {
    container.innerHTML = '<div class="empty">No projects found</div>';
    return;
  }

  filteredNames.forEach(projectName => {
    const proj = projects[projectName];
    const section = document.createElement('section');
    section.className = `project-section project-section--${projectName}`;

    const totalTasks = proj.tasks.length;
    const doneTasks = proj.tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = proj.tasks.filter(t => t.status === 'in-progress').length;
    const todoTasks = proj.tasks.filter(t => t.status === 'todo').length;
    const cronCount = proj.crons.length;

    // Header
    const header = document.createElement('div');
    header.className = 'project-section__header';
    header.innerHTML = `
      <div class="project-section__title-row">
        <span class="project-badge project-${projectName}">${projectName}</span>
        <span class="project-section__title">${projectName}</span>
      </div>
      <div class="project-section__stats">
        ${todoTasks ? `<span class="project-stat project-stat--todo">${todoTasks} todo</span>` : ''}
        ${inProgressTasks ? `<span class="project-stat project-stat--progress">${inProgressTasks} in progress</span>` : ''}
        ${doneTasks ? `<span class="project-stat project-stat--done">${doneTasks} done</span>` : ''}
        ${cronCount ? `<span class="project-stat project-stat--cron">${cronCount} cron</span>` : ''}
      </div>
    `;
    section.appendChild(header);

    // Task list
    const taskList = document.createElement('div');
    taskList.className = 'project-section__tasks';

    proj.tasks.forEach(task => {
      taskList.appendChild(createTaskRow(task));
    });

    proj.crons.forEach(cron => {
      taskList.appendChild(createCronRow(cron));
    });

    if (proj.tasks.length === 0 && proj.crons.length === 0) {
      taskList.innerHTML = '<div class="empty">No items</div>';
    }

    section.appendChild(taskList);
    container.appendChild(section);
  });
}

function renderAll() {
  if (!tasksData) return;
  renderProjectView();
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

async function init() {
  tasksData = await loadTasks();

  if (!tasksData) {
    document.querySelector('.main').innerHTML = '<div class="error">Failed to load tasks</div>';
    return;
  }

  initFilter();
  renderAll();

  document.getElementById('last-updated').textContent = new Date().toLocaleString();
}

document.addEventListener('DOMContentLoaded', init);
