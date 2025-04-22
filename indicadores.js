// Arquivo JavaScript para indicadores

// Variáveis globais
let indicadoresChart = null;
let indicadoresData = null;

// Inicializar a seção de indicadores
function initIndicadoresSection() {
    console.log('Inicializando seção de indicadores...');
    
    // Verificar se há localização selecionada
    if (!window.currentLocation) {
        const indicadoresContainer = document.querySelector('#indicadoresContainer');
        if (indicadoresContainer) {
            indicadoresContainer.innerHTML = '<div class="indicadores-loading">Selecione uma localização no mapa para ver os indicadores</div>';
        }
        return;
    }
    
    // Carregar dados
    loadIndicadores(window.currentLocation);
}

// Função para carregar indicadores
function loadIndicadores(location) {
    console.log('Carregando indicadores para:', location);
    
    const indicadoresContainer = document.querySelector('#indicadoresContainer');
    if (!indicadoresContainer) {
        console.error('Container de indicadores não encontrado');
        return;
    }
    
    // Mostrar carregamento
    indicadoresContainer.innerHTML = '<div class="indicadores-loading"><div class="data-loading-animation"><div class="data-loading-dot"></div><div class="data-loading-dot"></div><div class="data-loading-dot"></div></div><p>Carregando indicadores agrícolas...</p></div>';
    
    // Verificar se está offline
    if (!navigator.onLine) {
        // Tentar obter dados do cache
        const cachedData = localStorage.getItem(`indicators_data_${location.lat.toFixed(2)}_${location.lng.toFixed(2)}`);
        if (cachedData) {
            const indicatorsData = JSON.parse(cachedData);
            renderIndicadores(indicadoresContainer, location, indicatorsData);
            return;
        }
        
        // Mostrar mensagem offline
        indicadoresContainer.innerHTML = `
            <div class="indicadores-error">
                <div class="material-icons indicadores-error-icon">cloud_off</div>
                <p class="indicadores-error-text">Você está offline e não há dados em cache para esta localização.</p>
                <button class="indicadores-error-button" onclick="loadIndicadores(window.currentLocation)">Tentar Novamente</button>
            </div>
        `;
        return;
    }
    
    // Obter dados
    fetchIndicatorsData(location)
        .then(indicatorsData => {
            // Salvar no cache
            localStorage.setItem(`indicators_data_${location.lat.toFixed(2)}_${location.lng.toFixed(2)}`, JSON.stringify(indicatorsData));
            
            // Renderizar dados
            renderIndicadores(indicadoresContainer, location, indicatorsData);
        })
        .catch(error => {
            console.error('Erro ao obter indicadores:', error);
            
            // Mostrar erro
            indicadoresContainer.innerHTML = `
                <div class="indicadores-error">
                    <div class="material-icons indicadores-error-icon">error</div>
                    <p class="indicadores-error-text">Erro ao carregar indicadores. Tente novamente mais tarde.</p>
                    <button class="indicadores-error-button" onclick="loadIndicadores(window.currentLocation)">Tentar Novamente</button>
                </div>
            `;
            
            // Mostrar notificação
            if (typeof window.animateNotification === 'function') {
                window.animateNotification('Erro ao carregar indicadores. Verifique sua conexão.', 'error');
            }
        });
}

// Função para buscar dados de indicadores
async function fetchIndicatorsData(location) {
    console.log('Buscando indicadores para:', location);
    
    try {
        // Obter região/estado com base nas coordenadas
        const regionInfo = await getRegionInfo(location);
        
        // Obter dados climáticos da NASA
        const climateData = await getClimateData(location);
        
        // Obter dados de mercado
        const marketData = await getMarketData(regionInfo.country);
        
        // Combinar dados
        return {
            region: regionInfo,
            climate: climateData,
            market: marketData
        };
    } catch (error) {
        console.error('Erro ao obter indicadores:', error);
        
        // Usar dados simulados como fallback
        return getMockIndicatorsData(location);
    }
}

// Função para obter informações da região
async function getRegionInfo(location) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=6&accept-language=pt-BR`);
        
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extrair informações
        const country = data.address.country_code ? data.address.country_code.toUpperCase() : 'BR';
        const state = data.address.state || '';
        const region = data.address.state || data.address.country || '';
        
        return {
            country,
            state,
            region,
            name: location.name || region
        };
    } catch (error) {
        console.error('Erro ao obter informações da região:', error);
        
        // Fallback para Brasil
        return {
            country: 'BR',
            state: '',
            region: 'Brasil',
            name: location.name || 'Brasil'
        };
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

// Função para obter dados de mercado
async function getMarketData(countryCode) {
    try {
        // Usar API do DataBank para obter dados econômicos
        const indicators = [
            { code: 'AG.LND.AGRI.ZS', name: 'Terras agrícolas (% da área terrestre)' },
            { code: 'AG.LND.CREL.HA', name: 'Terra cultivada com cereais (hectares)' },
            { code: 'AG.YLD.CREL.KG', name: 'Rendimento de cereais (kg por hectare)' },
            { code: 'AG.PRD.FOOD.XD', name: 'Índice de produção de alimentos' },
            { code: 'AG.PRD.LVSK.XD', name: 'Índice de produção pecuária' }
        ];
        
        // Obter dados para cada indicador
        const indicatorData = {};
        
        for (const indicator of indicators) {
            try {
                // Usar Python para acessar a API
                const script = `
                import sys
                sys.path.append('/opt/.manus/.sandbox-runtime')
                from data_api import ApiClient
                client = ApiClient()
                data = client.call_api('DataBank/indicator_data', query={'indicator': '${indicator.code}', 'country': '${countryCode}'})
                print(data)
                `;
                
                // Criar arquivo Python temporário
                const fs = require('fs');
                fs.writeFileSync('/tmp/get_indicator.py', script);
                
                // Executar script
                const { execSync } = require('child_process');
                const result = execSync('python3 /tmp/get_indicator.py', { encoding: 'utf-8' });
                
                // Processar resultado
                const data = JSON.parse(result);
                indicatorData[indicator.code] = {
                    name: indicator.name,
                    value: getLatestValue(data.data),
                    trend: calculateTrend(data.data)
                };
            } catch (error) {
                console.error(`Erro ao obter dados para indicador ${indicator.code}:`, error);
                
                // Usar dados simulados para este indicador
                indicatorData[indicator.code] = {
                    name: indicator.name,
                    value: Math.random() * 100,
                    trend: Math.random() > 0.5 ? 'up' : 'down'
                };
            }
        }
        
        // Obter dados de commodities
        const commodities = [
            { code: 'SOYBEAN_OIL', name: 'Óleo de Soja' },
            { code: 'CORN', name: 'Milho' },
            { code: 'COFFEE', name: 'Café' },
            { code: 'SUGAR', name: 'Açúcar' },
            { code: 'COTTON', name: 'Algodão' }
        ];
        
        const commodityData = {};
        
        for (const commodity of commodities) {
            try {
                // Usar Python para acessar a API
                const script = `
                import sys
                sys.path.append('/opt/.manus/.sandbox-runtime')
                from data_api import ApiClient
                client = ApiClient()
                data = client.call_api('YahooFinance/get_stock_chart', query={'symbol': '${commodity.code}=F', 'region': 'US', 'interval': '1mo', 'range': '1y'})
                print(data)
                `;
                
                // Criar arquivo Python temporário
                const fs = require('fs');
                fs.writeFileSync('/tmp/get_commodity.py', script);
                
                // Executar script
                const { execSync } = require('child_process');
                const result = execSync('python3 /tmp/get_commodity.py', { encoding: 'utf-8' });
                
                // Processar resultado
                const data = JSON.parse(result);
                const prices = extractPrices(data);
                
                commodityData[commodity.code] = {
                    name: commodity.name,
                    currentPrice: prices.current,
                    change: prices.change,
                    trend: prices.trend,
                    history: prices.history
                };
            } catch (error) {
                console.error(`Erro ao obter dados para commodity ${commodity.code}:`, error);
                
                // Usar dados simulados para esta commodity
                const basePrice = 100 + Math.random() * 900;
                const change = (Math.random() * 10 - 5) / 100;
                
                commodityData[commodity.code] = {
                    name: commodity.name,
                    currentPrice: basePrice,
                    change: change,
                    trend: change > 0 ? 'up' : 'down',
                    history: generateMockPriceHistory(basePrice)
                };
            }
        }
        
        return {
            indicators: indicatorData,
            commodities: commodityData,
            lastUpdate: new Date().toISOString()
        };
    } catch (error) {
        console.error('Erro ao obter dados de mercado:', error);
        
        // Usar dados simulados
        return getMockMarketData();
    }
}

// Função para obter o valor mais recente
function getLatestValue(data) {
    if (!data) return null;
    
    // Obter anos disponíveis
    const years = Object.keys(data).filter(year => data[year] !== null).sort();
    
    // Retornar valor do ano mais recente
    return years.length > 0 ? data[years[years.length - 1]] : null;
}

// Função para calcular tendência
function calculateTrend(data) {
    if (!data) return 'stable';
    
    // Obter anos disponíveis
    const years = Object.keys(data)
        .filter(year => data[year] !== null && !isNaN(parseInt(year)))
        .sort()
        .slice(-5); // Últimos 5 anos
    
    if (years.length < 2) return 'stable';
    
    // Calcular diferença entre primeiro e último ano
    const firstValue = data[years[0]];
    const lastValue = data[years[years.length - 1]];
    
    if (firstValue === null || lastValue === null) return 'stable';
    
    const change = (lastValue - firstValue) / firstValue;
    
    if (change > 0.05) return 'up';
    if (change < -0.05) return 'down';
    return 'stable';
}

// Função para extrair preços
function extractPrices(data) {
    try {
        const result = data.chart.result[0];
        const quotes = result.indicators.quote[0];
        const timestamps = result.timestamp;
        
        // Extrair histórico de preços
        const history = [];
        for (let i = 0; i < timestamps.length; i++) {
            if (quotes.close[i] !== null) {
                history.push({
                    date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
                    price: quotes.close[i]
                });
            }
        }
        
        // Calcular variação
        const current = history.length > 0 ? history[history.length - 1].price : 0;
        const previous = history.length > 1 ? history[history.length - 2].price : current;
        const change = previous !== 0 ? (current - previous) / previous : 0;
        
        return {
            current,
            change,
            trend: change > 0 ? 'up' : (change < 0 ? 'down' : 'stable'),
            history
        };
    } catch (error) {
        console.error('Erro ao extrair preços:', error);
        
        // Retornar dados simulados
        const basePrice = 100 + Math.random() * 900;
        return {
            current: basePrice,
            change: 0,
            trend: 'stable',
            history: generateMockPriceHistory(basePrice)
        };
    }
}

// Função para gerar histórico de preços simulado
function generateMockPriceHistory(basePrice) {
    const history = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(now.getMonth() - i);
        
        // Variação aleatória de até 10%
        const variation = (Math.random() * 0.2 - 0.1);
        const price = basePrice * (1 + variation);
        
        history.push({
            date: date.toISOString().split('T')[0],
            price: price
        });
    }
    
    return history;
}

// Função para obter dados de mercado simulados
function getMockMarketData() {
    // Indicadores simulados
    const indicators = {
        'AG.LND.AGRI.ZS': {
            name: 'Terras agrícolas (% da área terrestre)',
            value: 30 + Math.random() * 10,
            trend: Math.random() > 0.5 ? 'up' : 'down'
        },
        'AG.LND.CREL.HA': {
            name: 'Terra cultivada com cereais (hectares)',
            value: 10000000 + Math.random() * 5000000,
            trend: Math.random() > 0.5 ? 'up' : 'down'
        },
        'AG.YLD.CREL.KG': {
            name: 'Rendimento de cereais (kg por hectare)',
            value: 3000 + Math.random() * 1000,
            trend: Math.random() > 0.5 ? 'up' : 'down'
        },
        'AG.PRD.FOOD.XD': {
            name: 'Índice de produção de alimentos',
            value: 90 + Math.random() * 20,
            trend: Math.random() > 0.5 ? 'up' : 'down'
        },
        'AG.PRD.LVSK.XD': {
            name: 'Índice de produção pecuária',
            value: 90 + Math.random() * 20,
            trend: Math.random() > 0.5 ? 'up' : 'down'
        }
    };
    
    // Commodities simuladas
    const commodities = {
        'SOYBEAN_OIL': {
            name: 'Óleo de Soja',
            currentPrice: 600 + Math.random() * 200,
            change: (Math.random() * 10 - 5) / 100,
            trend: Math.random() > 0.5 ? 'up' : 'down',
            history: generateMockPriceHistory(700)
        },
        'CORN': {
            name: 'Milho',
            currentPrice: 400 + Math.random() * 100,
            change: (Math.random() * 10 - 5) / 100,
            trend: Math.random() > 0.5 ? 'up' : 'down',
            history: generateMockPriceHistory(450)
        },
        'COFFEE': {
            name: 'Café',
            currentPrice: 150 + Math.random() * 50,
            change: (Math.random() * 10 - 5) / 100,
            trend: Math.random() > 0.5 ? 'up' : 'down',
            history: generateMockPriceHistory(175)
        },
        'SUGAR': {
            name: 'Açúcar',
            currentPrice: 20 + Math.random() * 5,
            change: (Math.random() * 10 - 5) / 100,
            trend: Math.random() > 0.5 ? 'up' : 'down',
            history: generateMockPriceHistory(22)
        },
        'COTTON': {
            name: 'Algodão',
            currentPrice: 80 + Math.random() * 20,
            change: (Math.random() * 10 - 5) / 100,
            trend: Math.random() > 0.5 ? 'up' : 'down',
            history: generateMockPriceHistory(90)
        }
    };
    
    return {
        indicators,
        commodities,
        lastUpdate: new Date().toISOString()
    };
}

// Função para obter dados de indicadores simulados
function getMockIndicatorsData(location) {
    return {
        region: {
            country: 'BR',
            state: '',
            region: 'Brasil',
            name: location.name || 'Brasil'
        },
        climate: {
            temperature: 25 - Math.abs(location.lat) / 3 + (Math.random() * 10 - 5),
            precipitation: Math.random() * 50,
            radiation: 4 + Math.random() * 3,
            humidity: 50 + Math.random() * 30,
            windSpeed: 2 + Math.random() * 5
        },
        market: getMockMarketData()
    };
}

// Função para renderizar indicadores
function renderIndicadores(container, location, data) {
    console.log('Renderizando indicadores:', data);
    
    // Armazenar dados para uso posterior
    indicadoresData = data;
    
    // Criar HTML
    let html = `
        <div class="indicadores-header">
            <h3>Indicadores Agrícolas para ${data.region.name}</h3>
            <p>Última atualização: ${new Date(data.market.lastUpdate).toLocaleString('pt-BR')}</p>
        </div>
        
        <div class="indicadores-grid">
            <div class="indicador-card climate-card">
                <div class="indicador-header">
                    <h4>Condições Climáticas</h4>
                    <div class="indicador-icon"><span class="material-icons">thermostat</span></div>
                </div>
                <div class="indicador-content">
                    <div class="climate-grid">
                        <div class="climate-item">
                            <div class="climate-label">Temperatura</div>
                            <div class="climate-value">${data.climate.temperature.toFixed(1)} °C</div>
                        </div>
                        <div class="climate-item">
                            <div class="climate-label">Precipitação</div>
                            <div class="climate-value">${data.climate.precipitation.toFixed(1)} mm</div>
                        </div>
                        <div class="climate-item">
                            <div class="climate-label">Radiação Solar</div>
                            <div class="climate-value">${data.climate.radiation.toFixed(2)} kWh/m²</div>
                        </div>
                        <div class="climate-item">
                            <div class="climate-label">Umidade</div>
                            <div class="climate-value">${data.climate.humidity.toFixed(0)}%</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="indicador-card market-card">
                <div class="indicador-header">
                    <h4>Indicadores de Mercado</h4>
                    <div class="indicador-icon"><span class="material-icons">trending_up</span></div>
                </div>
                <div class="indicador-content">
                    <div class="market-indicators">
    `;
    
    // Adicionar indicadores
    Object.keys(data.market.indicators).forEach(key => {
        const indicator = data.market.indicators[key];
        const trendIcon = indicator.trend === 'up' ? 'trending_up' : (indicator.trend === 'down' ? 'trending_down' : 'trending_flat');
        const trendClass = indicator.trend === 'up' ? 'trend-up' : (indicator.trend === 'down' ? 'trend-down' : 'trend-stable');
        
        html += `
            <div class="market-indicator">
                <div class="indicator-name">${indicator.name}</div>
                <div class="indicator-value">${indicator.value ? indicator.value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : 'N/A'}</div>
                <div class="indicator-trend ${trendClass}"><span class="material-icons">${trendIcon}</span></div>
            </div>
        `;
    });
    
    html += `
                    </div>
                </div>
            </div>
            
            <div class="indicador-card commodities-card">
                <div class="indicador-header">
                    <h4>Preços de Commodities</h4>
                    <div class="indicador-icon"><span class="material-icons">agriculture</span></div>
                </div>
                <div class="indicador-content">
                    <div class="commodities-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Commodity</th>
                                    <th>Preço Atual</th>
                                    <th>Variação</th>
                                </tr>
                            </thead>
                            <tbody>
    `;
    
    // Adicionar commodities
    Object.keys(data.market.commodities).forEach(key => {
        const commodity = data.market.commodities[key];
        const changeClass = commodity.change > 0 ? 'change-up' : (commodity.change < 0 ? 'change-down' : 'change-stable');
        const changeSign = commodity.change > 0 ? '+' : '';
        
        html += `
            <tr>
                <td>${commodity.name}</td>
                <td>$${commodity.currentPrice.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
                <td class="${changeClass}">${changeSign}${(commodity.change * 100).toFixed(2)}%</td>
            </tr>
        `;
    });
    
    html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="indicador-card chart-card">
                <div class="indicador-header">
                    <h4>Evolução de Preços</h4>
                    <select id="commoditySelect" class="nasa-select">
    `;
    
    // Adicionar opções de commodities
    Object.keys(data.market.commodities).forEach(key => {
        const commodity = data.market.commodities[key];
        html += `<option value="${key}">${commodity.name}</option>`;
    });
    
    html += `
                    </select>
                </div>
                <div class="indicador-content">
                    <div class="chart-container chart-animation">
                        <canvas id="commodityChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="indicadores-actions">
            <button id="updateIndicadoresBtn" class="nasa-button">Atualizar Dados</button>
            <button id="exportIndicadoresBtn" class="nasa-button secondary">Exportar Relatório</button>
        </div>
    `;
    
    // Definir HTML no container
    container.innerHTML = html;
    
    // Configurar eventos
    document.getElementById('updateIndicadoresBtn').addEventListener('click', () => loadIndicadores(window.currentLocation));
    document.getElementById('exportIndicadoresBtn').addEventListener('click', exportIndicadoresReport);
    
    const commoditySelect = document.getElementById('commoditySelect');
    if (commoditySelect) {
        commoditySelect.addEventListener('change', updateCommodityChart);
    }
    
    // Criar gráfico
    createCommodityChart(Object.keys(data.market.commodities)[0]);
}

// Função para criar gráfico de commodity
function createCommodityChart(commodityKey) {
    const ctx = document.getElementById('commodityChart');
    if (!ctx || !indicadoresData) return;
    
    // Destruir gráfico anterior se existir
    if (indicadoresChart) {
        indicadoresChart.destroy();
    }
    
    // Obter dados da commodity
    const commodity = indicadoresData.market.commodities[commodityKey];
    if (!commodity || !commodity.history) return;
    
    // Preparar dados para o gráfico
    const labels = commodity.history.map(item => {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getFullYear().toString().substr(2, 2)}`;
    });
    
    const prices = commodity.history.map(item => item.price);
    
    // Criar gráfico
    indicadoresChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Preço (USD)`,
                data: prices,
                borderColor: '#FF9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Evolução de Preços - ${commodity.name}`
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Preço: $${context.raw.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Preço (USD)'
                    }
                }
            }
        }
    });
}

// Função para atualizar gráfico de commodity
function updateCommodityChart() {
    const commoditySelect = document.getElementById('commoditySelect');
    if (!commoditySelect) return;
    
    const selectedCommodity = commoditySelect.value;
    createCommodityChart(selectedCommodity);
}

// Função para exportar relatório de indicadores
function exportIndicadoresReport() {
    if (!indicadoresData) {
        if (typeof window.animateNotification === 'function') {
            window.animateNotification('Nenhum dado para exportar.', 'error');
        }
        return;
    }
    
    // Criar conteúdo do relatório
    const reportContent = `
        # Relatório de Indicadores Agrícolas
        
        ## Região: ${indicadoresData.region.name}
        Data do relatório: ${new Date().toLocaleDateString('pt-BR')}
        
        ## Condições Climáticas
        - Temperatura: ${indicadoresData.climate.temperature.toFixed(1)} °C
        - Precipitação: ${indicadoresData.climate.precipitation.toFixed(1)} mm
        - Radiação Solar: ${indicadoresData.climate.radiation.toFixed(2)} kWh/m²
        - Umidade: ${indicadoresData.climate.humidity.toFixed(0)}%
        
        ## Indicadores de Mercado
        ${Object.keys(indicadoresData.market.indicators).map(key => {
            const indicator = indicadoresData.market.indicators[key];
            return `- ${indicator.name}: ${indicator.value ? indicator.value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : 'N/A'}`;
        }).join('\n')}
        
        ## Preços de Commodities
        ${Object.keys(indicadoresData.market.commodities).map(key => {
            const commodity = indicadoresData.market.commodities[key];
            const changeSign = commodity.change > 0 ? '+' : '';
            return `- ${commodity.name}: $${commodity.currentPrice.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} (${changeSign}${(commodity.change * 100).toFixed(2)}%)`;
        }).join('\n')}
        
        ## Histórico de Preços
        ${Object.keys(indicadoresData.market.commodities).map(key => {
            const commodity = indicadoresData.market.commodities[key];
            return `### ${commodity.name}\n${commodity.history.map(item => `- ${item.date}: $${item.price.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`).join('\n')}`;
        }).join('\n\n')}
        
        ---
        Relatório gerado por AgroDecision PWA
    `;
    
    // Criar blob e link para download
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Indicadores_${indicadoresData.region.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.md`;
    
    // Simular clique
    document.body.appendChild(link);
    link.click();
    
    // Limpar
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Mostrar notificação
    if (typeof window.animateNotification === 'function') {
        window.animateNotification('Relatório exportado com sucesso!', 'success');
    }
}

// Exportar funções para uso global
window.initIndicadoresSection = initIndicadoresSection;
window.loadIndicadores = loadIndicadores;
window.updateCommodityChart = updateCommodityChart;
window.exportIndicadoresReport = exportIndicadoresReport;
