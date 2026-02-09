// Crab Finance - Dashboard
const DATA_URL = 'data/finance.json';
const FIRE_TARGET = 1250000;

let financeData = null;

async function loadFinance() {
  try {
    // Add cache-busting to avoid stale data
    const cacheBuster = `?t=${Date.now()}`;
    const res = await fetch(DATA_URL + cacheBuster);
    if (!res.ok) throw new Error('Failed to load finance data');
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

function formatMoney(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function createFinanceItem(item) {
  const div = document.createElement('div');
  const isBlocked = item.status === 'blocked';
  div.className = `finance-item ${isBlocked ? 'finance-item-blocked' : ''}`;
  
  const typeClass = `type-${item.type}`;
  const balance = item.balanceUSD || item.balance || item.value || 0;
  const currency = item.currency || 'USD';
  const showOriginal = item.balanceUSD && item.currency !== 'USD';
  
  // For stocks, show ticker and P&L
  let extraInfo = '';
  if (item.ticker) {
    const pnl = item.currentPrice && item.purchasePrice 
      ? ((item.currentPrice - item.purchasePrice) / item.purchasePrice * 100).toFixed(0)
      : null;
    const pnlClass = pnl > 0 ? 'pnl-positive' : 'pnl-negative';
    extraInfo = `
      <span class="stock-qty">${item.quantity} шт @ $${item.currentPrice}</span>
      ${pnl ? `<span class="stock-pnl ${pnlClass}">${pnl > 0 ? '+' : ''}${pnl}%</span>` : ''}
    `;
  }
  
  div.innerHTML = `
    <div class="finance-item-info">
      <div class="finance-item-name">${item.name}</div>
      <div class="finance-item-meta">
        <span class="finance-item-type ${typeClass}">${item.type}</span>
        ${isBlocked ? '<span class="status-blocked">🔒 blocked</span>' : ''}
        ${item.bank ? `<span class="item-bank">${item.bank}</span>` : ''}
        ${extraInfo}
      </div>
    </div>
    <div class="finance-item-balance">
      <div class="finance-item-amount">${formatMoney(balance)}</div>
      ${showOriginal ? `<div class="finance-item-currency">${item.balance.toLocaleString()} ${currency}</div>` : ''}
    </div>
  `;
  
  return div;
}

function renderList(containerId, items, emptyIcon, emptyText) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="finance-empty">
        <div class="finance-empty-icon">${emptyIcon}</div>
        <div>${emptyText}</div>
      </div>
    `;
    return 0;
  }
  
  items.forEach(item => {
    container.appendChild(createFinanceItem(item));
  });
  
  return items.length;
}

function updateStats(data) {
  const summary = data.summary || {};
  const total = summary.totalLiquidAssets || summary.totalAssets || 0;
  
  document.getElementById('stat-networth').textContent = formatMoney(total);
  document.getElementById('stat-cash').textContent = formatMoney(summary.totalCash || 0);
  document.getElementById('stat-investments').textContent = formatMoney(summary.totalInvestments || 0);
  document.getElementById('stat-deposits').textContent = formatMoney(summary.totalDeposits || 0);
}

function updateGoals(data) {
  const total = data.summary?.totalLiquidAssets || data.summary?.totalAssets || 0;
  const percent = Math.min(100, (total / FIRE_TARGET) * 100);
  const remaining = Math.max(0, FIRE_TARGET - total);
  
  document.getElementById('goal-fill').style.width = `${percent}%`;
  document.getElementById('goal-percent').textContent = `${percent.toFixed(1)}%`;
  document.getElementById('goal-current').textContent = formatMoney(total);
  document.getElementById('goal-remaining').textContent = formatMoney(remaining);
}

function renderAll() {
  if (!financeData) return;
  
  updateStats(financeData);
  updateGoals(financeData);
  
  const accountsCount = renderList(
    'accounts-list',
    financeData.accounts,
    '💵',
    'No accounts added yet'
  );
  document.getElementById('accounts-count').textContent = accountsCount;
  
  const investmentsCount = renderList(
    'investments-list',
    financeData.investments,
    '📈',
    'No investments yet'
  );
  document.getElementById('investments-count').textContent = investmentsCount;
  
  const depositsCount = renderList(
    'deposits-list',
    financeData.deposits,
    '🏦',
    'No deposits yet'
  );
  document.getElementById('deposits-count').textContent = depositsCount;
}

async function init() {
  financeData = await loadFinance();
  
  if (!financeData) {
    document.querySelector('.main').innerHTML = '<div class="error">Failed to load finance data</div>';
    return;
  }
  
  renderAll();
  
  document.getElementById('last-updated').textContent = financeData.lastUpdated || new Date().toLocaleDateString();
}

document.addEventListener('DOMContentLoaded', init);
