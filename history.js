// Gerenciamento de histórico
let historyManager = {
  // Obter simulações salvas
  getSimulations: function() {
    return JSON.parse(localStorage.getItem('simulations') || '[]');
  },
  
  // Limpar histórico
  clearHistory: function() {
    localStorage.removeItem('simulations');
    return [];
  }
};

// Carregar tela de histórico
function loadHistory() {
  const content = document.getElementById('content');
  
  content.innerHTML = `
    <div class="history-container animate__animated animate__fadeIn">
      <div class="history-card">
        <h2>Histórico de Simulações</h2>
        
        <div class="history-grid" id="historyGrid">
          <!-- History items will be loaded here -->
          <div class="loading-spinner">
            <div class="loader"></div>
            <p>Carregando histórico...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Simular carregamento
  setTimeout(() => {
    try {
      const simulations = historyManager.getSimulations();
      const historyGrid = document.getElementById('historyGrid');
      
      if (simulations.length === 0) {
        historyGrid.innerHTML = `
          <div class="empty-history">
            <div class="empty-icon">📝</div>
            <p>Nenhuma simulação encontrada</p>
            <button class="modern-button" onclick="showScreen('simulation')">
              <span class="button-text">Criar Simulação</span>
              <div class="button-icon">🌱</div>
            </button>
          </div>
        `;
        return;
      }

      historyGrid.innerHTML = simulations.map(sim => `
        <div class="history-item animate__animated animate__fadeIn">
          <div class="history-content">
            <div class="history-header">
              <div class="crop-icon">${getCropEmoji(sim.crop)}</div>
              <div class="history-date">
                ${new Date(sim.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
            </div>
            
            <div class="simulation-details">
              <div class="detail-row">
                <span class="detail-label">Cultura:</span>
                <span class="detail-value">${sim.crop}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Área:</span>
                <span class="detail-value">${sim.area} hectares</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Irrigação:</span>
                <span class="detail-value">${sim.irrigation}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Solo:</span>
                <span class="detail-value">${sim.soil}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Data Plantio:</span>
                <span class="detail-value">${sim.plantingDate}</span>
              </div>
            </div>

            <div class="results-summary">
              <div class="result-item">
                <div class="result-icon">📊</div>
                <div class="result-info">
                  <span class="result-label">Produtividade</span>
                  <span class="result-value">${sim.results.yield}</span>
                </div>
              </div>
              <div class="result-item">
                <div class="result-icon">💧</div>
                <div class="result-info">
                  <span class="result-label">Água</span>
                  <span class="result-value">${sim.results.water}</span>
                </div>
              </div>
              <div class="result-item">
                <div class="result-icon">📅</div>
                <div class="result-info">
                  <span class="result-label">Colheita</span>
                  <span class="result-value">${sim.results.harvestDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `).join('');

    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      const historyGrid = document.getElementById('historyGrid');
      historyGrid.innerHTML = `
        <div class="error-message">
          <div class="error-icon">❌</div>
          <p>Erro ao carregar histórico</p>
        </div>
      `;
    }
  }, 500);
}

// Helper function to get crop emoji
function getCropEmoji(crop) {
  const cropEmojis = {
    'Soja': '🌱',
    'Milho': '🌽',
    'Trigo': '🌾',
    'Algodão': '🌿',
    'Café': '☕',
    'Arroz': '🍚',
    'Cana de Açúcar': '🎋',
    'Feijão': '🫘',
    'Mandioca': '🥔',
    'Batata': '🥔',
    'Tomate': '🍅',
    'Cebola': '🧅',
    'Cenoura': '🥕',
    'Alface': '🥬',
    'Repolho': '🥬',
    'Amendoim': '🥜',
    'Girassol': '🌻',
    'Uva': '🍇',
    'Laranja': '🍊',
    'Limão': '🍋',
    'Maçã': '🍎',
    'Manga': '🥭',
    'Banana': '🍌'
  };

  return cropEmojis[crop] || '🌱';
}

// Expor funções globalmente
window.loadHistory = loadHistory;
window.historyManager = historyManager;
