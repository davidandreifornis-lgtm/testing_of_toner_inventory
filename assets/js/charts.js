/**
 * Chart.js helpers for dashboard.
 */
const Charts = {
  deptChart: null,
  statusChart: null,

  destroy(chart) {
    if (chart) {
      try {
        chart.destroy();
      } catch (_) {}
    }
  },

  renderDept(labels, values) {
    const canvas = document.getElementById('chart-dept');
    const empty = document.getElementById('chart-dept-empty');
    if (!canvas) return;
    this.destroy(this.deptChart);
    if (!labels.length) {
      canvas.style.display = 'none';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    canvas.style.display = 'block';
    if (empty) empty.classList.add('hidden');
    this.deptChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Releases',
            data: values,
            backgroundColor: '#0f172a',
            borderRadius: 4,
            maxBarThickness: 32,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
        },
      },
    });
  },

  renderStatus(inCount, lowCount, outCount) {
    const canvas = document.getElementById('chart-status');
    const empty = document.getElementById('chart-status-empty');
    if (!canvas) return;
    this.destroy(this.statusChart);
    const total = inCount + lowCount + outCount;
    if (!total) {
      canvas.style.display = 'none';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    canvas.style.display = 'block';
    if (empty) empty.classList.add('hidden');
    this.statusChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['In stock', 'Low stock', 'Out of stock'],
        datasets: [
          {
            data: [inCount, lowCount, outCount],
            backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
        },
        cutout: '60%',
      },
    });
  },
};

window.Charts = Charts;
