// Arquivo JavaScript para simulação de colheita

// Variáveis globais
let simulationData = null;
let simulationChart = null;
let simulationInitialized = false;

// Inicializar a seção de simulação
function initSimulationSection() {
    console.log('Inicializando seção de simulação...');
    
    // Verificar se já foi inicializada
    if (simulationInitialized) return;
    
    // Definir data de plantio padrão (hoje)
    const today = new Date();
    const plantingDateInput = document.getElementById('plantingDate');
    if (plantingDateInput) {
        plantingDateInput.valueAsDate = today;
    }
    
    // Configurar eventos para botões
    const runSimulationBtn = document.getElementById('runSimulationBtn');
    if (runSimulationBtn) {
        runSimulationBtn.addEventListener('click', runSimulation);
    }
    
    const resetSimulationBtn = document.getElementById('resetSimulationBtn');
    if (resetSimulationBtn) {
        resetSimulationBtn.addEventListener('click', resetSimulation);
    }
    
    // Configurar eventos para campos de entrada
    const cropSelect = document.getElementById('cropSelect');
    if (cropSelect) {
        cropSelect.addEventListener('change', updateSimulationForm);
    }
    
    const soilSelect = document.getElementById('soilSelect');
    if (soilSelect) {
        soilSelect.addEventListener('change', updateSimulationForm);
    }
    
    // Marcar como inicializada
    simulationInitialized = true;
}

// Função para atualizar formulário de simulação
function updateSimulationForm() {
    const cropSelect = document.getElementById('cropSelect');
    const soilSelect = document.getElementById('soilSelect');
    
    if (!cropSelect || !soilSelect) return;
    
    const crop = cropSelect.value;
    const soil = soilSelect.value;
    
    // Atualizar recomendações com base na cultura e solo
    updateRecommendations(crop, soil);
}

// Função para atualizar recomendações
function updateRecommendations(crop, soil) {
    const recommendationsElement = document.getElementById('cropRecommendations');
    if (!recommendationsElement) return;
    
    let recommendations = '';
    
    // Recomendações para cada cultura
    switch (crop) {
        case 'soja':
            recommendations = 'A soja se adapta bem a solos com boa drenagem e pH entre 6,0 e 6,5. ';
            if (soil === 'argiloso') {
                recommendations += 'Em solos argilosos, monitore a umidade para evitar encharcamento.';
            } else if (soil === 'arenoso') {
                recommendations += 'Em solos arenosos, aumente a frequência de irrigação e considere adubação adicional.';
            } else {
                recommendations += 'Em solos mistos, mantenha adubação equilibrada e rotação de culturas.';
            }
            break;
            
        case 'milho':
            recommendations = 'O milho necessita de solos bem drenados e ricos em nutrientes. ';
            if (soil === 'argiloso') {
                recommendations += 'Em solos argilosos, prepare bem o terreno para evitar compactação.';
            } else if (soil === 'arenoso') {
                recommendations += 'Em solos arenosos, aumente a adubação nitrogenada e mantenha irrigação frequente.';
            } else {
                recommendations += 'Em solos mistos, mantenha adubação equilibrada com foco em nitrogênio.';
            }
            break;
            
        case 'cafe':
            recommendations = 'O café prefere solos profundos, bem drenados e ricos em matéria orgânica. ';
            if (soil === 'argiloso') {
                recommendations += 'Em solos argilosos, garanta boa drenagem e controle a acidez.';
            } else if (soil === 'arenoso') {
                recommendations += 'Em solos arenosos, aumente a adubação orgânica e mantenha cobertura vegetal.';
            } else {
                recommendations += 'Em solos mistos, mantenha adubação equilibrada e sombreamento adequado.';
            }
            break;
            
        case 'cana':
            recommendations = 'A cana-de-açúcar se adapta a diversos tipos de solo, mas prefere solos profundos. ';
            if (soil === 'argiloso') {
                recommendations += 'Em solos argilosos, prepare bem o terreno e monitore a drenagem.';
            } else if (soil === 'arenoso') {
                recommendations += 'Em solos arenosos, aumente a adubação e mantenha irrigação frequente.';
            } else {
                recommendations += 'Em solos mistos, mantenha adubação equilibrada e controle de ervas daninhas.';
            }
            break;
            
        case 'algodao':
            recommendations = 'O algodão prefere solos profundos e bem drenados. ';
            if (soil === 'argiloso') {
                recommendations += 'Em solos argilosos, prepare bem o terreno e monitore a umidade.';
            } else if (soil === 'arenoso') {
                recommendations += 'Em solos arenosos, aumente a adubação e mantenha irrigação controlada.';
            } else {
                recommendations += 'Em solos mistos, mantenha adubação equilibrada e rotação de culturas.';
            }
            break;
    }
    
    // Atualizar elemento
    recommendationsElement.innerHTML = recommendations;
}

// Função para executar simulação
function runSimulation() {
    console.log('Executando simulação...');
    
    // Verificar se há localização selecionada
    if (!window.currentLocation) {
        // Mostrar notificação
        if (typeof window.animateNotification === 'function') {
            window.animateNotification('Selecione uma localização no mapa antes de executar a simulação.', 'warning');
        }
        return;
    }
    
    // Obter valores do formulário
    const cropSelect = document.getElementById('cropSelect');
    const areaInput = document.getElementById('areaInput');
    const soilSelect = document.getElementById('soilSelect');
    const plantingDate = document.getElementById('plantingDate');
    const irrigationSelect = document.getElementById('irrigationSelect');
    
    if (!cropSelect || !areaInput || !soilSelect || !plantingDate || !irrigationSelect) {
        console.error('Elementos do formulário não encontrados');
        return;
    }
    
    const crop = cropSelect.value;
    const area = parseFloat(areaInput.value);
    const soil = soilSelect.value;
    const plantingDateValue = plantingDate.value;
    const irrigation = irrigationSelect.value;
    
    // Validar valores
    if (isNaN(area) || area <= 0) {
        // Mostrar notificação
        if (typeof window.animateNotification === 'function') {
            window.animateNotification('A área deve ser um número positivo.', 'error');
        }
        return;
    }
    
    // Mostrar carregamento
    const resultsContent = document.querySelector('.results-content');
    if (resultsContent) {
        resultsContent.innerHTML = `
            <div class="results-loading">
                <div class="data-loading-animation">
                    <div class="data-loading-dot"></div>
                    <div class="data-loading-dot"></div>
                    <div class="data-loading-dot"></div>
                </div>
                <p>Processando simulação...</p>
            </div>
        `;
    }
    
    // Executar simulação com dados climáticos
    runCropSimulation(window.currentLocation, crop, area, soil, plantingDateValue, irrigation);
}

// Função para executar simulação de cultivo
async function runCropSimulation(location, crop, area, soil, plantingDateValue, irrigation) {
    console.log('Executando simulação de cultivo:', {
        location,
        crop,
        area,
        soil,
        plantingDateValue,
        irrigation
    });
    
    try {
        // Obter dados climáticos
        const climateData = await getClimateData(location);
        
        // Calcular resultados da simulação
        const simulationResults = calculateSimulationResults(crop, area, soil, plantingDateValue, irrigation, climateData);
        
        // Armazenar dados da simulação
        simulationData = {
            crop,
            area,
            soil,
            plantingDate: plantingDateValue,
            irrigation,
            location,
            results: simulationResults
        };
        
        // Exibir resultados
        displaySimulationResults(simulationResults);
        
        // Salvar no histórico
        saveToHistory({
            type: 'simulation',
            date: new Date().toISOString(),
            crop: crop,
            area: area,
            soil: soil,
            location: location,
            irrigation: irrigation,
            yield: simulationResults.yieldEstimate,
            harvestDate: simulationResults.harvestDate.toISOString(),
            revenue: simulationResults.revenue
        });
        
        // Mostrar notificação
        if (typeof window.animateNotification === 'function') {
            window.animateNotification('Simulação concluída com sucesso!', 'success');
        }
    } catch (error) {
        console.error('Erro ao executar simulação:', error);
        
        // Mostrar erro
        const resultsContent = document.querySelector('.results-content');
        if (resultsContent) {
            resultsContent.innerHTML = `
                <div class="results-error">
                    <div class="material-icons" style="font-size: 48px; margin-bottom: 16px; color: var(--error-color);">error</div>
                    <p>Erro ao executar simulação: ${error.message}</p>
                    <button class="nasa-button" onclick="runSimulation()">Tentar Novamente</button>
                </div>
            `;
        }
        
        // Mostrar notificação
        if (typeof window.animateNotification === 'function') {
            window.animateNotification('Erro ao executar simulação. Tente novamente.', 'error');
        }
    }
}

// Função para obter dados climáticos
async function getClimateData(location) {
    // Verificar se temos dados da NASA
    if (typeof window.getNasaData === 'function') {
        try {
            return await window.getNasaData(location.lat, location.lng);
        } catch (error) {
            console.error('Erro ao obter dados da NASA:', error);
            // Continuar com dados simulados
        }
    }
    
    // Dados simulados
    return {
        temperature: 25 - Math.abs(location.lat) / 3 + (Math.random() * 10 - 5),
        precipitation: Math.random() * 50,
        radiation: 4 + Math.random() * 3,
        humidity: 50 + Math.random() * 30,
        windSpeed: 2 + Math.random() * 5
    };
}

// Função para calcular resultados da simulação
function calculateSimulationResults(crop, area, soil, plantingDateValue, irrigation, climateData) {
    // Parâmetros base para cada cultura
    const cropParams = {
        soja: { baseYield: 3.2, growthDays: 120, waterNeed: 450, price: 2000 },
        milho: { baseYield: 5.5, growthDays: 150, waterNeed: 550, price: 1000 },
        cafe: { baseYield: 1.8, growthDays: 240, waterNeed: 800, price: 10000 },
        cana: { baseYield: 80, growthDays: 365, waterNeed: 1500, price: 100 },
        algodao: { baseYield: 3.0, growthDays: 180, waterNeed: 700, price: 3000 }
    };
    
    // Fatores de ajuste para solo
    const soilFactors = {
        argiloso: { yieldFactor: 1.0, waterFactor: 0.9 },
        arenoso: { yieldFactor: 0.8, waterFactor: 1.2 },
        misto: { yieldFactor: 0.9, waterFactor: 1.0 }
    };
    
    // Fatores de ajuste para irrigação
    const irrigationFactors = {
        nenhum: { yieldFactor: 0.7, waterFactor: 0.0 },
        gotejamento: { yieldFactor: 1.2, waterFactor: 0.7 },
        aspersao: { yieldFactor: 1.1, waterFactor: 1.0 },
        inundacao: { yieldFactor: 0.9, waterFactor: 1.5 }
    };
    
    // Obter parâmetros da cultura
    const params = cropParams[crop];
    
    // Calcular fatores climáticos
    const tempFactor = calculateTemperatureFactor(crop, climateData.temperature);
    const rainFactor = calculateRainFactor(crop, climateData.precipitation);
    const radiationFactor = calculateRadiationFactor(crop, climateData.radiation);
    
    // Calcular produtividade
    const baseYieldPerHectare = params.baseYield;
    const yieldPerHectare = baseYieldPerHectare * 
        soilFactors[soil].yieldFactor * 
        irrigationFactors[irrigation].yieldFactor * 
        tempFactor * 
        rainFactor * 
        radiationFactor;
    
    const yieldEstimate = Math.round(area * yieldPerHectare * 10) / 10; // Arredondar para 1 casa decimal
    
    // Calcular data de colheita
    const plantingDate = new Date(plantingDateValue);
    const harvestDate = new Date(plantingDate);
    harvestDate.setDate(harvestDate.getDate() + params.growthDays);
    
    // Calcular necessidade de água
    const waterNeedBase = params.waterNeed; // mm por ciclo
    const waterNeed = Math.round(waterNeedBase * soilFactors[soil].waterFactor * irrigationFactors[irrigation].waterFactor);
    const totalWaterNeed = Math.round(waterNeed * area); // m³ total
    
    // Calcular receita estimada
    const revenue = Math.round(yieldEstimate * params.price);
    
    // Calcular custos estimados
    const seedCost = Math.round(area * getCropSeedCost(crop));
    const fertilizerCost = Math.round(area * getCropFertilizerCost(crop, soil));
    const irrigationCost = irrigation === 'nenhum' ? 0 : Math.round(totalWaterNeed * 0.5); // R$ 0,50 por m³
    const laborCost = Math.round(area * 500); // R$ 500 por hectare
    const totalCost = seedCost + fertilizerCost + irrigationCost + laborCost;
    
    // Calcular lucro estimado
    const profit = revenue - totalCost;
    
    // Calcular dados de crescimento para gráfico
    const growthData = calculateGrowthData(crop, params.growthDays, plantingDate, tempFactor, rainFactor, radiationFactor);
    
    return {
        yieldEstimate,
        yieldPerHectare,
        harvestDate,
        waterNeed,
        totalWaterNeed,
        revenue,
        costs: {
            seed: seedCost,
            fertilizer: fertilizerCost,
            irrigation: irrigationCost,
            labor: laborCost,
            total: totalCost
        },
        profit,
        growthData
    };
}

// Função para calcular fator de temperatura
function calculateTemperatureFactor(crop, temperature) {
    // Temperaturas ótimas para cada cultura
    const optimalTemps = {
        soja: { min: 20, max: 30 },
        milho: { min: 18, max: 32 },
        cafe: { min: 18, max: 26 },
        cana: { min: 22, max: 35 },
        algodao: { min: 20, max: 30 }
    };
    
    const optimal = optimalTemps[crop];
    
    if (temperature < optimal.min) {
        // Abaixo da temperatura mínima
        return 0.7 + (temperature / optimal.min) * 0.3;
    } else if (temperature > optimal.max) {
        // Acima da temperatura máxima
        return 1.0 - ((temperature - optimal.max) / 10) * 0.3;
    } else {
        // Na faixa ótima
        return 1.0;
    }
}

// Função para calcular fator de chuva
function calculateRainFactor(crop, precipitation) {
    // Precipitação ótima para cada cultura (mm/mês)
    const optimalRain = {
        soja: { min: 30, max: 150 },
        milho: { min: 40, max: 180 },
        cafe: { min: 50, max: 200 },
        cana: { min: 80, max: 250 },
        algodao: { min: 40, max: 150 }
    };
    
    const optimal = optimalRain[crop];
    
    if (precipitation < optimal.min) {
        // Abaixo da precipitação mínima
        return 0.6 + (precipitation / optimal.min) * 0.4;
    } else if (precipitation > optimal.max) {
        // Acima da precipitação máxima
        return 1.0 - ((precipitation - optimal.max) / 100) * 0.3;
    } else {
        // Na faixa ótima
        return 1.0;
    }
}

// Função para calcular fator de radiação
function calculateRadiationFactor(crop, radiation) {
    // Radiação ótima para cada cultura (kWh/m²/dia)
    const optimalRadiation = {
        soja: { min: 3, max: 7 },
        milho: { min: 4, max: 8 },
        cafe: { min: 2.5, max: 6 },
        cana: { min: 4, max: 8 },
        algodao: { min: 4, max: 7 }
    };
    
    const optimal = optimalRadiation[crop];
    
    if (radiation < optimal.min) {
        // Abaixo da radiação mínima
        return 0.7 + (radiation / optimal.min) * 0.3;
    } else if (radiation > optimal.max) {
        // Acima da radiação máxima
        return 1.0 - ((radiation - optimal.max) / 5) * 0.2;
    } else {
        // Na faixa ótima
        return 1.0;
    }
}

// Função para obter custo de sementes
function getCropSeedCost(crop) {
    // Custo de sementes por hectare
    const seedCosts = {
        soja: 300,
        milho: 400,
        cafe: 2000,
        cana: 1500,
        algodao: 600
    };
    
    return seedCosts[crop];
}

// Função para obter custo de fertilizantes
function getCropFertilizerCost(crop, soil) {
    // Custo base de fertilizantes por hectare
    const baseCosts = {
        soja: 800,
        milho: 1000,
        cafe: 1500,
        cana: 1200,
        algodao: 900
    };
    
    // Fatores de ajuste para solo
    const soilFactors = {
        argiloso: 0.9,
        arenoso: 1.3,
        misto: 1.0
    };
    
    return baseCosts[crop] * soilFactors[soil];
}

// Função para calcular dados de crescimento
function calculateGrowthData(crop, growthDays, plantingDate, tempFactor, rainFactor, radiationFactor) {
    const stages = [
        { name: 'Germinação', percent: 5 },
        { name: 'Desenvolvimento Vegetativo', percent: 30 },
        { name: 'Floração', percent: 20 },
        { name: 'Desenvolvimento dos Frutos', percent: 30 },
        { name: 'Maturação', percent: 15 }
    ];
    
    const growthData = [];
    let currentDate = new Date(plantingDate);
    let accumulatedDays = 0;
    let accumulatedPercent = 0;
    
    // Fator de crescimento combinado
    const growthFactor = (tempFactor + rainFactor + radiationFactor) / 3;
    
    stages.forEach(stage => {
        const stageDays = Math.round(growthDays * stage.percent / 100);
        accumulatedDays += stageDays;
        accumulatedPercent += stage.percent;
        
        const stageEndDate = new Date(plantingDate);
        stageEndDate.setDate(plantingDate.getDate() + accumulatedDays);
        
        growthData.push({
            stage: stage.name,
            days: stageDays,
            endDate: stageEndDate,
            percent: accumulatedPercent,
            healthFactor: Math.min(1, growthFactor * (0.8 + Math.random() * 0.4))
        });
    });
    
    return growthData;
}

// Função para exibir resultados da simulação
function displaySimulationResults(results) {
    const resultsContent = document.querySelector('.results-content');
    if (!resultsContent) return;
    
    // Formatar valores
    const formattedYield = results.yieldEstimate.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    const formattedYieldPerHectare = results.yieldPerHectare.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    const formattedHarvestDate = results.harvestDate.toLocaleDateString('pt-BR');
    const formattedRevenue = results.revenue.toLocaleString('pt-BR');
    const formattedProfit = results.profit.toLocaleString('pt-BR');
    const formattedWaterNeed = results.waterNeed.toLocaleString('pt-BR');
    const formattedTotalWaterNeed = results.totalWaterNeed.toLocaleString('pt-BR');
    
    // Criar HTML
    resultsContent.innerHTML = `
        <div class="results-grid">
            <div class="result-card">
                <div class="result-icon">🌾</div>
                <div class="result-title">Produtividade Estimada</div>
                <div class="result-value">${formattedYield} toneladas</div>
                <div class="result-info">${formattedYieldPerHectare} t/ha</div>
            </div>
            <div class="result-card">
                <div class="result-icon">📅</div>
                <div class="result-title">Data Estimada de Colheita</div>
                <div class="result-value">${formattedHarvestDate}</div>
                <div class="result-info">${getDaysBetween(new Date(simulationData.plantingDate), results.harvestDate)} dias após o plantio</div>
            </div>
            <div class="result-card">
                <div class="result-icon">💧</div>
                <div class="result-title">Necessidade de Água</div>
                <div class="result-value">${formattedTotalWaterNeed} m³</div>
                <div class="result-info">${formattedWaterNeed} mm/ciclo</div>
            </div>
            <div class="result-card">
                <div class="result-icon">💰</div>
                <div class="result-title">Receita Estimada</div>
                <div class="result-value">R$ ${formattedRevenue}</div>
                <div class="result-info">Lucro: R$ ${formattedProfit}</div>
            </div>
        </div>
        
        <div class="results-details">
            <h4>Detalhes da Simulação</h4>
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Cultura</div>
                    <div class="detail-value">${getCropName(simulationData.crop)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Área</div>
                    <div class="detail-value">${simulationData.area} hectares</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Solo</div>
                    <div class="detail-value">${getSoilName(simulationData.soil)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Data de Plantio</div>
                    <div class="detail-value">${new Date(simulationData.plantingDate).toLocaleDateString('pt-BR')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Irrigação</div>
                    <div class="detail-value">${getIrrigationName(simulationData.irrigation)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Localização</div>
                    <div class="detail-value">${simulationData.location.name || `${simulationData.location.lat.toFixed(4)}, ${simulationData.location.lng.toFixed(4)}`}</div>
                </div>
            </div>
        </div>
        
        <div class="results-chart">
            <h4>Ciclo de Crescimento</h4>
            <canvas id="growthChart"></canvas>
        </div>
        
        <div class="results-costs">
            <h4>Custos Estimados</h4>
            <div class="costs-grid">
                <div class="cost-item">
                    <div class="cost-label">Sementes</div>
                    <div class="cost-value">R$ ${results.costs.seed.toLocaleString('pt-BR')}</div>
                </div>
                <div class="cost-item">
                    <div class="cost-label">Fertilizantes</div>
                    <div class="cost-value">R$ ${results.costs.fertilizer.toLocaleString('pt-BR')}</div>
                </div>
                <div class="cost-item">
                    <div class="cost-label">Irrigação</div>
                    <div class="cost-value">R$ ${results.costs.irrigation.toLocaleString('pt-BR')}</div>
                </div>
                <div class="cost-item">
                    <div class="cost-label">Mão de Obra</div>
                    <div class="cost-value">R$ ${results.costs.labor.toLocaleString('pt-BR')}</div>
                </div>
                <div class="cost-item total">
                    <div class="cost-label">Total</div>
                    <div class="cost-value">R$ ${results.costs.total.toLocaleString('pt-BR')}</div>
                </div>
            </div>
        </div>
        
        <div class="results-actions">
            <button class="nasa-button" onclick="saveSimulation()">Salvar Simulação</button>
            <button class="nasa-button secondary" onclick="resetSimulation()">Nova Simulação</button>
        </div>
    `;
    
    // Criar gráfico de crescimento
    createGrowthChart(results.growthData);
}

// Função para criar gráfico de crescimento
function createGrowthChart(growthData) {
    const ctx = document.getElementById('growthChart');
    if (!ctx) return;
    
    // Destruir gráfico anterior se existir
    if (simulationChart) {
        simulationChart.destroy();
    }
    
    // Preparar dados para o gráfico
    const labels = growthData.map(stage => stage.stage);
    const percentData = growthData.map(stage => stage.percent);
    const healthData = growthData.map(stage => stage.healthFactor * 100);
    
    // Criar novo gráfico
    simulationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Crescimento (%)',
                    data: percentData,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Saúde da Planta (%)',
                    data: healthData,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Ciclo de Crescimento da Cultura'
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const stageIndex = context.dataIndex;
                            const stage = growthData[stageIndex];
                            return [
                                `Duração: ${stage.days} dias`,
                                `Término: ${stage.endDate.toLocaleDateString('pt-BR')}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Porcentagem (%)'
                    }
                }
            }
        }
    });
}

// Função para resetar simulação
function resetSimulation() {
    console.log('Resetando simulação...');
    
    // Limpar resultados
    const resultsContent = document.querySelector('.results-content');
    if (resultsContent) {
        resultsContent.innerHTML = '<div class="results-loading">Execute a simulação para ver os resultados</div>';
    }
    
    // Resetar formulário
    const cropSelect = document.getElementById('cropSelect');
    const areaInput = document.getElementById('areaInput');
    const soilSelect = document.getElementById('soilSelect');
    const plantingDate = document.getElementById('plantingDate');
    const irrigationSelect = document.getElementById('irrigationSelect');
    
    if (cropSelect) cropSelect.value = 'soja';
    if (areaInput) areaInput.value = '10';
    if (soilSelect) soilSelect.value = 'argiloso';
    if (plantingDate) plantingDate.valueAsDate = new Date();
    if (irrigationSelect) irrigationSelect.value = 'nenhum';
    
    // Atualizar recomendações
    updateRecomendations('soja', 'argiloso');
    
    // Limpar dados da simulação
    simulationData = null;
    
    // Destruir gráfico se existir
    if (simulationChart) {
        simulationChart.destroy();
        simulationChart = null;
    }
}

// Função para salvar simulação
function saveSimulation() {
    console.log('Salvando simulação...');
    
    // Verificar se há dados de simulação
    if (!simulationData) {
        if (typeof window.animateNotification === 'function') {
            window.animateNotification('Nenhuma simulação para salvar.', 'error');
        }
        return;
    }
    
    // Mostrar modal para confirmar salvamento
    if (typeof window.showModal === 'function') {
        window.showModal('Salvar Simulação', `
            <div class="save-simulation-modal">
                <p>Deseja salvar esta simulação com um nome personalizado?</p>
                <div class="form-group">
                    <label for="simulationName">Nome da Simulação:</label>
                    <input type="text" id="simulationName" class="nasa-input" value="Simulação de ${getCropName(simulationData.crop)} - ${new Date().toLocaleDateString('pt-BR')}">
                </div>
                <div class="form-group">
                    <label for="simulationNotes">Notas (opcional):</label>
                    <textarea id="simulationNotes" class="nasa-textarea" rows="3" placeholder="Adicione notas sobre esta simulação..."></textarea>
                </div>
                <div class="modal-actions">
                    <button id="confirmSaveSimulation" class="nasa-button">Salvar</button>
                    <button onclick="window.closeModal()" class="nasa-button secondary">Cancelar</button>
                </div>
            </div>
        `);
        
        // Configurar evento para confirmar salvamento
        document.getElementById('confirmSaveSimulation').addEventListener('click', function() {
            const name = document.getElementById('simulationName').value;
            const notes = document.getElementById('simulationNotes').value;
            
            // Adicionar nome e notas aos dados da simulação
            simulationData.name = name;
            simulationData.notes = notes;
            
            // Salvar no histórico
            saveToHistory({
                type: 'simulation',
                name: name,
                notes: notes,
                date: new Date().toISOString(),
                crop: simulationData.crop,
                area: simulationData.area,
                soil: simulationData.soil,
                location: simulationData.location,
                irrigation: simulationData.irrigation,
                plantingDate: simulationData.plantingDate,
                yield: simulationData.results.yieldEstimate,
                harvestDate: simulationData.results.harvestDate.toISOString(),
                revenue: simulationData.results.revenue,
                costs: simulationData.results.costs,
                profit: simulationData.results.profit
            });
            
            // Fechar modal
            window.closeModal();
            
            // Mostrar notificação
            if (typeof window.animateNotification === 'function') {
                window.animateNotification('Simulação salva com sucesso!', 'success');
            }
        });
    } else {
        // Fallback se a função de modal não estiver disponível
        saveToHistory({
            type: 'simulation',
            name: `Simulação de ${getCropName(simulationData.crop)} - ${new Date().toLocaleDateString('pt-BR')}`,
            date: new Date().toISOString(),
            crop: simulationData.crop,
            area: simulationData.area,
            soil: simulationData.soil,
            location: simulationData.location,
            irrigation: simulationData.irrigation,
            plantingDate: simulationData.plantingDate,
            yield: simulationData.results.yieldEstimate,
            harvestDate: simulationData.results.harvestDate.toISOString(),
            revenue: simulationData.results.revenue,
            costs: simulationData.results.costs,
            profit: simulationData.results.profit
        });
        
        // Mostrar notificação
        if (typeof window.animateNotification === 'function') {
            window.animateNotification('Simulação salva com sucesso!', 'success');
        }
    }
}

// Função para salvar no histórico
function saveToHistory(data) {
    console.log('Salvando no histórico:', data);
    
    try {
        // Obter histórico existente
        let history = JSON.parse(localStorage.getItem('agrodecision_history')) || [];
        
        // Adicionar novo item
        history.unshift(data);
        
        // Limitar a 50 itens
        if (history.length > 50) {
            history = history.slice(0, 50);
        }
        
        // Salvar
        localStorage.setItem('agrodecision_history', JSON.stringify(history));
    } catch (error) {
        console.error('Erro ao salvar no histórico:', error);
    }
}

// Função para obter nome da cultura
function getCropName(cropCode) {
    const cropNames = {
        soja: 'Soja',
        milho: 'Milho',
        cafe: 'Café',
        cana: 'Cana-de-açúcar',
        algodao: 'Algodão'
    };
    
    return cropNames[cropCode] || cropCode;
}

// Função para obter nome do solo
function getSoilName(soilCode) {
    const soilNames = {
        argiloso: 'Argiloso',
        arenoso: 'Arenoso',
        misto: 'Misto'
    };
    
    return soilNames[soilCode] || soilCode;
}

// Função para obter nome da irrigação
function getIrrigationName(irrigationCode) {
    const irrigationNames = {
        nenhum: 'Nenhuma',
        gotejamento: 'Gotejamento',
        aspersao: 'Aspersão',
        inundacao: 'Inundação'
    };
    
    return irrigationNames[irrigationCode] || irrigationCode;
}

// Função para calcular dias entre duas datas
function getDaysBetween(startDate, endDate) {
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Exportar funções para uso global
window.initSimulationSection = initSimulationSection;
window.runSimulation = runSimulation;
window.resetSimulation = resetSimulation;
window.saveSimulation = saveSimulation;
window.updateSimulationForm = updateSimulationForm;
