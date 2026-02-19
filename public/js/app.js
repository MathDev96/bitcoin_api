let chart = null;
let currentMode = "realtime";

function chartOptions() {
  return {
    responsive: true,
    plugins: {
      legend: { labels: { color: 'white' } }
    },
    scales: {
      x: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      y: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      }
    }
  };
}

function createChart(labels, data, labelText) {
  const ctx = document.getElementById('btcChart').getContext('2d');

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: labelText,
        data: data,
        borderColor: '#f1c40f',
        backgroundColor: 'rgba(241,196,15,0.2)',
        borderWidth: 3,
        pointRadius: 2,
        tension: 0.4,
        fill: true
      }]
    },
    options: chartOptions()
  });
}

// ===============================
// TEMPO REAL
// ===============================
let realtimeLabels = [];
let realtimeData = [];

async function fetchBitcoin() {
  try {
    const response = await fetch('/bitcoin');
    const data = await response.json();
    if (data.error) return;

    const usd = Number(data.usd);
    const brl = Number(data.brl);
    const eur = Number(data.eur);

    document.getElementById('usd').textContent =
      usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    document.getElementById('brl').textContent =
      brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    document.getElementById('eur').textContent =
      eur.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

    document.getElementById('updated').textContent =
      'Atualizado em: ' + data.updated_at;

    if (currentMode === "realtime") {
      const now = new Date().toLocaleTimeString();

      realtimeLabels.push(now);
      realtimeData.push(usd);

      if (realtimeLabels.length > 20) {
        realtimeLabels.shift();
        realtimeData.shift();
      }

      createChart(realtimeLabels, realtimeData, 'Bitcoin (USD) - Tempo Real');
    }

  } catch (err) {
    console.error("Erro tempo real:", err);
  }
}

// ===============================
// HISTÓRICO DINÂMICO
// ===============================
async function fetchHistory(days) {
  try {
    currentMode = "history";

    const response = await fetch(`/bitcoin/history_monthly?days=${days}`);
    const data = await response.json();
    if (data.error) return;

    createChart(
      data.labels,
      data.prices,
      `Bitcoin (USD) - Últimos ${days} dias`
    );

  } catch (err) {
    console.error("Erro histórico:", err);
  }
}

// ===============================
// EVENTOS
// ===============================
document.addEventListener("DOMContentLoaded", () => {

  fetchBitcoin();
  setInterval(fetchBitcoin, 20000);

  document.querySelectorAll('.chart-filters button')
    .forEach(button => {
      button.addEventListener('click', () => {
        const days = button.getAttribute('data-days');
        fetchHistory(days);
      });
    });

});
