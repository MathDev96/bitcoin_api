let lastData = null; // para comparar subida/queda
let chart = null;
let chartData = {
  labels: [],
  datasets: [{
    label: 'Preço Bitcoin (USD)',
    data: [],
    borderColor: '#f1c40f',
    backgroundColor: 'rgba(241, 196, 15, 0.2)',
    tension: 0.3
  }]
};

async function fetchBitcoin() {
  try {
    const response = await fetch('/bitcoin');
    const data = await response.json();

    if (data.error) {
      document.getElementById('usd').textContent = '$0,00';
      document.getElementById('brl').textContent = 'R$0,00';
      document.getElementById('eur').textContent = '€0,00';
      document.getElementById('error').textContent = 'Erro: ' + data.error;
      document.getElementById('updated').textContent = '';
      return;
    }

    document.getElementById('error').textContent = '';

    // Formata valores
    const usd = Number(data.usd);
    const brl = Number(data.brl);
    const eur = Number(data.eur);

    document.getElementById('usd').textContent = usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    document.getElementById('brl').textContent = brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('eur').textContent = eur.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

    document.getElementById('updated').textContent = 'Atualizado em: ' + data.updated_at;

    // Muda a cor se subiu/baixou
    if (lastData) {
      document.getElementById('usd').style.color = usd > lastData.usd ? 'lime' : usd < lastData.usd ? 'red' : 'white';
      document.getElementById('brl').style.color = brl > lastData.brl ? 'lime' : brl < lastData.brl ? 'red' : 'white';
      document.getElementById('eur').style.color = eur > lastData.eur ? 'lime' : eur < lastData.eur ? 'red' : 'white';
    }

    lastData = { usd, brl, eur };

    // Atualiza gráfico
    const now = new Date();
    const label = now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()).padStart(2,'0');

    chartData.labels.push(label);
    chartData.datasets[0].data.push(usd);

    if (chartData.labels.length > 20) { // últimos 20 pontos
      chartData.labels.shift();
      chartData.datasets[0].data.shift();
    }

    if (!chart) {
      const ctx = document.getElementById('btcChart').getContext('2d');
      chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: 'white' } }
          },
          scales: {
            x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
          }
        }
      });
    } else {
      chart.update();
    }

  } catch (err) {
    document.getElementById('error').textContent = 'Erro ao buscar dados';
    document.getElementById('updated').textContent = '';
  }
}

// Primeiro fetch
fetchBitcoin();

// Atualiza a cada 20 segundos
setInterval(fetchBitcoin, 20000);


async function fetchHistoryMonthly() {
  try {
    const response = await fetch('/bitcoin/history_monthly');
    const data = await response.json();
    if (data.error) return;

    const labels = Object.keys(data.monthly).map(m => {
      const [year, month] = m.split('-');
      return `${month}/${year}`;
    });

    const prices = Object.values(data.monthly);

    const ctx = document.getElementById('btcChart').getContext('2d');

    if (!chart) {
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Bitcoin (USD) - Mensal',
            data: prices,
            borderColor: '#f1c40f',
            backgroundColor: 'rgba(241,196,15,0.2)',
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: 'white' } } },
          scales: {
            x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
          }
        }
      });
    } else {
      chart.data.labels = labels;
      chart.data.datasets[0].data = prices;
      chart.update();
    }

  } catch (err) {
    console.error('Erro ao buscar histórico mensal:', err);
  }
}

// Evento do botão
document.getElementById('monthlyBtn').addEventListener('click', fetchHistoryMonthly);
