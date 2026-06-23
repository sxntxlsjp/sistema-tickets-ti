function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function barChart(title, data = [], labelKey = 'label', valueKey = 'total') {
  if (!data.length) {
    return `
      <div class="chart-card">
        <h3>${escapeHtml(title)}</h3>
        <p class="empty-chart">Sin datos disponibles</p>
      </div>
    `;
  }

  const maxValue = Math.max(...data.map(item => Number(item[valueKey]) || 0), 1);

  const rows = data.map(item => {
    const label = escapeHtml(item[labelKey] || 'Sin definir');
    const value = Number(item[valueKey]) || 0;
    const width = Math.round((value / maxValue) * 100);

    return `
      <div class="bar-row">
        <div class="bar-label">${label}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${width}%"></div>
        </div>
        <div class="bar-value">${value}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="chart-card">
      <h3>${escapeHtml(title)}</h3>
      <div class="bar-chart">
        ${rows}
      </div>
    </div>
  `;
}

function donutChart(title, data = [], labelKey = 'label', valueKey = 'total') {
  if (!data.length) {
    return `
      <div class="chart-card">
        <h3>${escapeHtml(title)}</h3>
        <p class="empty-chart">Sin datos disponibles</p>
      </div>
    `;
  }

  const total = data.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0);

  if (!total) {
    return `
      <div class="chart-card">
        <h3>${escapeHtml(title)}</h3>
        <p class="empty-chart">Sin datos disponibles</p>
      </div>
    `;
  }

  let cumulative = 0;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  const colors = ['#1d4ed8', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'];

  const circles = data.map((item, index) => {
    const value = Number(item[valueKey]) || 0;
    const percent = value / total;
    const dash = percent * circumference;
    const offset = circumference - cumulative * circumference;
    cumulative += percent;

    return `
      <circle
        r="${radius}"
        cx="90"
        cy="90"
        fill="transparent"
        stroke="${colors[index % colors.length]}"
        stroke-width="28"
        stroke-dasharray="${dash} ${circumference - dash}"
        stroke-dashoffset="${offset}"
        transform="rotate(-90 90 90)"
      />
    `;
  }).join('');

  const legend = data.map((item, index) => {
    const label = escapeHtml(item[labelKey] || 'Sin definir');
    const value = Number(item[valueKey]) || 0;
    const percent = ((value / total) * 100).toFixed(1);

    return `
      <div class="legend-item">
        <span class="legend-color" style="background:${colors[index % colors.length]}"></span>
        <span>${label}</span>
        <strong>${value} (${percent}%)</strong>
      </div>
    `;
  }).join('');

  return `
    <div class="chart-card">
      <h3>${escapeHtml(title)}</h3>
      <div class="donut-wrapper">
        <svg width="180" height="180" viewBox="0 0 180 180">
          ${circles}
          <circle r="42" cx="90" cy="90" fill="white"></circle>
          <text x="90" y="85" text-anchor="middle" class="donut-total">${total}</text>
          <text x="90" y="105" text-anchor="middle" class="donut-subtitle">tickets</text>
        </svg>
        <div class="legend">
          ${legend}
        </div>
      </div>
    </div>
  `;
}

module.exports = {
  barChart,
  donutChart
};