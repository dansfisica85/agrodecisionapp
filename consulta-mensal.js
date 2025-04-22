// Arquivo JavaScript para consulta mensal

// Variáveis globais
let consultaChart = null;
let consultaData = null;
let currentYear = new Date().getFullYear();
let currentParameter = 'temperature';

// Inicializar a seção de consulta mensal
function initConsultaSection() {
    console.log('Inicializando seção de consulta mensal...');
    
    // Verificar se há localização selecionada
    if (!window.currentLocation) {
        const consultaContainer = document.querySelector('#consultaMensalContainer');
        if (consultaContainer) {
            consultaContainer.innerHTML = '<div class="consulta-loading">Selecione uma localização no mapa para ver os dados mensais</div>';
        }
        return;
    }
    
    // Carregar dados
    loadConsultaMensal(window.currentLocation);
}

// Função para carregar dados mensais
function loadConsultaMensal(location) {
    console.log('Carregando dados mensais para:', location);
    
    const consultaContainer = document.querySelector('#consultaMensalContainer');
    if (!consultaContainer) {
        console.error('Container de consulta mensal não encontrado');
        return;
    }
    
    // Mostrar carregamento
    consultaContainer.innerHTML = '<div class="consulta-loading"><div class="data-loading-animation"><div class="data-loading-dot"></div><div class="data-loading-dot"></div><div class="data-loading-dot"></div></div><p>Carregando dados mensais...</p></div>';
    
    // Verificar se está offline
    if (!navigator.onLine) {
        // Tentar obter dados do cache
        const cachedData = localStorage.getItem(`monthly_data_${location.lat.toFixed(2)}_${location.lng.toFixed(2)}`);
        if (cachedData) {
            const monthlyData = JSON.parse(cachedData);
            renderConsultaMensal(consultaContainer, location, monthlyData);
            return;
        }
        
        // Mostrar mensagem offline
        consultaContainer.innerHTML = `
            <div class="consulta-error">
                <div class="material-icons consulta-error-icon">cloud_off</div>
                <p class="consulta-error-text">Você está offline e não há dados em cache para esta localização.</p>
                <button class="consulta-error-button" onclick="loadConsultaMensal(window.currentLocation)">Tentar Novamente</button>
            </div>
        `;
        return;
    }
    
    // Obter dados da NASA
    fetchMonthlyData(location)
        .then(monthlyData => {
            // Salvar no cache
            localStorage.setItem(`monthly_data_${location.lat.toFixed(2)}_${location.lng.toFixed(2)}`, JSON.stringify(monthlyData));
            
            // Renderizar dados
            renderConsultaMensal(consultaContainer, location, monthlyData);
        })
        .catch(error => {
            console.error('Erro ao obter dados mensais:', error);
            
            // Mostrar erro
            consultaContainer.innerHTML = `
                <div class="consulta-error">
                    <div class="material-icons consulta-error-icon">error</div>
                    <p class="consulta-error-text">Erro ao carregar dados mensais. Tente novamente mais tarde.</p>
                    <button class="consulta-error-button" onclick="loadConsultaMensal(window.currentLocation)">Tentar Novamente</button>
                </div>
            `;
            
            // Mostrar notificação
            if (typeof window.animateNotification === 'function') {
                window.animateNotification('Erro ao carregar dados mensais. Verifique sua conexão.', 'error');
            }
        });
}

// Função para buscar dados mensais
async function fetchMonthlyData(location) {
    console.log('Buscando dados mensais para:', location);
    
    try {
        // Construir URL da API
        const apiUrl = `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN,RH2M,WS2M&community=RE&longitude=${location.lng}&latitude=${location.lat}&start=2020&end=2023&format=JSON`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Processar dados
        return processMonthlyData(data);
    } catch (error) {
        console.error('Erro ao obter dados mensais da NASA:', error);
        
        // Usar dados simulados como fallback
        return getMockMonthlyData(location);
    }
}

// Função para processar dados mensais
function processMonthlyData(data) {
    // Verificar se os dados são válidos
    if (!data || !data.properties || !data.properties.parameter) {
        throw new Error('Dados mensais inválidos');
    }
    
    const parameters = data.properties.parameter;
    const years = Object.keys(parameters.T2M).map(key => key.substring(0, 4)).filter((value, index, self) => self.indexOf(value) === index);
    
    // Meses
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Processar dados por ano e mês
    const processedData = {
        years: years,
        months: months,
        parameters: {
            temperature: {
                name: 'Temperatura',
                unit: '°C',
                data: {}
            },
            precipitation: {
                name: 'Precipitação',
                unit: 'mm',
                data: {}
            },
            radiation: {
                name: 'Radiação Solar',
                unit: 'kWh/m²',
                data: {}
            },
            humidity: {
                name: 'Umidade Relativa',
                unit: '%',
                data: {}
            },
            windSpeed: {
                name: 'Velocidade do Vento',
                unit: 'm/s',
                data: {}
            }
        }
    };
    
    // Processar cada ano
    years.forEach(year => {
        // Inicializar arrays para cada parâmetro
        processedData.parameters.temperature.data[year] = Array(12).fill(null);
        processedData.parameters.precipitation.data[year] = Array(12).fill(null);
        processedData.parameters.radiation.data[year] = Array(12).fill(null);
        processedData.parameters.humidity.data[year] = Array(12).fill(null);
        processedData.parameters.windSpeed.data[year] = Array(12).fill(null);
        
        // Processar cada mês
        for (let month = 1; month <= 12; month++) {
            const monthStr = month.toString().padStart(2, '0');
            const dateKey = `${year}${monthStr}`;
            
            if (parameters.T2M && parameters.T2M[dateKey] !== undefined) {
                // Temperatura (converter de Kelvin para Celsius)
                processedData.parameters.temperature.data[year][month - 1] = parameters.T2M[dateKey] - 273.15;
                
                // Precipitação
                processedData.parameters.precipitation.data[year][month - 1] = parameters.PRECTOTCORR[dateKey];
                
                // Radiação Solar
                processedData.parameters.radiation.data[year][month - 1] = parameters.ALLSKY_SFC_SW_DWN[dateKey];
                
                // Umidade Relativa
                processedData.parameters.humidity.data[year][month - 1] = parameters.RH2M[dateKey];
                
                // Velocidade do Vento
                processedData.parameters.windSpeed.data[year][month - 1] = parameters.WS2M[dateKey];
            }
        }
    });
    
    return processedData;
}

// Função para obter dados mensais simulados
function getMockMonthlyData(location) {
    console.log('Usando dados mensais simulados para:', location);
    
    // Anos
    const years = ['2020', '2021', '2022', '2023'];
    
    // Meses
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Dados simulados
    const mockData = {
        years: years,
        months: months,
        parameters: {
            temperature: {
                name: 'Temperatura',
                unit: '°C',
                data: {}
            },
            precipitation: {
                name: 'Precipitação',
                unit: 'mm',
                data: {}
            },
            radiation: {
                name: 'Radiação Solar',
                unit: 'kWh/m²',
                data: {}
            },
            humidity: {
                name: 'Umidade Relativa',
                unit: '%',
                data: {}
            },
            windSpeed: {
                name: 'Velocidade do Vento',
                unit: 'm/s',
                data: {}
            }
        }
    };
    
    // Gerar dados simulados para cada ano
    years.forEach(year => {
        // Temperatura base baseada na latitude
        const baseTemp = 25 - Math.abs(location.lat) / 3;
        
        // Inicializar arrays para cada parâmetro
        mockData.parameters.temperature.data[year] = [];
        mockData.parameters.precipitation.data[year] = [];
        mockData.parameters.radiation.data[year] = [];
        mockData.parameters.humidity.data[year] = [];
        mockData.parameters.windSpeed.data[year] = [];
        
        // Gerar dados para cada mês
        for (let month = 0; month < 12; month++) {
            // Temperatura: varia com a estação (hemisfério sul)
            const seasonOffset = location.lat > 0 ? 
                Math.cos((month + 6) * Math.PI / 6) * 10 : // Hemisfério norte
                Math.cos(month * Math.PI / 6) * 10;        // Hemisfério sul
            
            const temp = baseTemp + seasonOffset + (Math.random() * 4 - 2);
            mockData.parameters.temperature.data[year].push(Math.round(temp * 10) / 10);
            
            // Precipitação: varia com a estação
            const rainBase = location.lat > 0 ?
                50 + 150 * Math.sin((month + 6) * Math.PI / 6) : // Hemisfério norte
                50 + 150 * Math.sin(month * Math.PI / 6);        // Hemisfério sul
            
            const rain = Math.max(0, rainBase + (Math.random() * 50 - 25));
            mockData.parameters.precipitation.data[year].push(Math.round(rain * 10) / 10);
            
            // Radiação: inversamente proporcional à precipitação
            const radiation = 3 + (1 - rain / 200) * 5 + (Math.random() * 2 - 1);
            mockData.parameters.radiation.data[year].push(Math.round(radiation * 100) / 100);
            
            // Umidade: correlacionada com precipitação
            const humidity = 40 + (rain / 200) * 50 + (Math.random() * 20 - 10);
            mockData.parameters.humidity.data[year].push(Math.round(humidity));
            
            // Velocidade do vento: aleatória
            const wind = 2 + Math.random() * 5;
            mockData.parameters.windSpeed.data[year].push(Math.round(wind * 10) / 10);
        }
    });
    
    return mockData;
}

// Função para renderizar dados mensais
function renderConsultaMensal(container, location, monthlyData) {
    console.log('Renderizando dados mensais:', monthlyData);
    
    // Armazenar dados para uso posterior
    consultaData = monthlyData;
    
    // Criar HTML
    let html = `
        <div class="consulta-header">
            <h3>Dados Mensais para ${location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}</h3>
            <p>Fonte: NASA POWER Project</p>
        </div>
        
        <div class="consulta-filters">
            <select id="yearSelect" class="nasa-select">
    `;
    
    // Adicionar opções de ano
    monthlyData.years.forEach(year => {
        html += `<option value="${year}" ${year === currentYear.toString() ? 'selected' : ''}>${year}</option>`;
    });
    
    html += `
            </select>
            
            <select id="parameterSelect" class="nasa-select">
                <option value="temperature" ${currentParameter === 'temperature' ? 'selected' : ''}>Temperatura</option>
                <option value="precipitation" ${currentParameter === 'precipitation' ? 'selected' : ''}>Precipitação</option>
                <option value="radiation" ${currentParameter === 'radiation' ? 'selected' : ''}>Radiação Solar</option>
                <option value="humidity" ${currentParameter === 'humidity' ? 'selected' : ''}>Umidade</option>
                <option value="windSpeed" ${currentParameter === 'windSpeed' ? 'selected' : ''}>Velocidade do Vento</option>
            </select>
            
            <button id="updateConsultaBtn" class="nasa-button">Atualizar</button>
        </div>
        
        <div class="consulta-charts">
            <div class="chart-container chart-animation">
                <canvas id="consultaChart"></canvas>
            </div>
        </div>
        
        <div class="consulta-table">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Mês</th>
    `;
    
    // Adicionar cabeçalhos de ano
    monthlyData.years.forEach(year => {
        html += `<th>${year}</th>`;
    });
    
    html += `
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Adicionar linhas para cada mês
    monthlyData.months.forEach((month, index) => {
        html += `
            <tr>
                <td>${month}</td>
        `;
        
        // Adicionar valores para cada ano
        monthlyData.years.forEach(year => {
            const value = monthlyData.parameters[currentParameter].data[year][index];
            const formattedValue = value !== null ? value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '-';
            html += `<td>${formattedValue}</td>`;
        });
        
        html += `
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <div class="consulta-actions">
            <button id="exportConsultaBtn" class="nasa-button">Exportar Dados</button>
            <button id="compareYearsBtn" class="nasa-button secondary">Comparar Anos</button>
        </div>
    `;
    
    // Definir HTML no container
    container.innerHTML = html;
    
    // Configurar eventos
    document.getElementById('updateConsultaBtn').addEventListener('click', updateConsultaChart);
    document.getElementById('exportConsultaBtn').addEventListener('click', exportConsultaData);
    document.getElementById('compareYearsBtn').addEventListener('click', compareYears);
    
    // Criar gráfico
    createConsultaChart();
}

// Função para criar gráfico de consulta
function createConsultaChart() {
    const ctx = document.getElementById('consultaChart');
    if (!ctx || !consultaData) return;
    
    // Destruir gráfico anterior se existir
    if (consultaChart) {
        consultaChart.destroy();
    }
    
    // Obter ano selecionado
    const yearSelect = document.getElementById('yearSelect');
    const selectedYear = yearSelect ? yearSelect.value : currentYear.toString();
    
    // Obter parâmetro selecionado
    const parameterSelect = document.getElementById('parameterSelect');
    const selectedParameter = parameterSelect ? parameterSelect.value : currentParameter;
    
    // Obter dados para o gráfico
    const chartData = consultaData.parameters[selectedParameter].data[selectedYear];
    const parameterInfo = consultaData.parameters[selectedParameter];
    
    // Definir cores com base no parâmetro
    let borderColor, backgroundColor;
    switch (selectedParameter) {
        case 'temperature':
            borderColor = '#FF9800';
            backgroundColor = 'rgba(255, 152, 0, 0.1)';
            break;
        case 'precipitation':
            borderColor = '#2196F3';
            backgroundColor = 'rgba(33, 150, 243, 0.1)';
            break;
        case 'radiation':
            borderColor = '#FFC107';
            backgroundColor = 'rgba(255, 193, 7, 0.1)';
            break;
        case 'humidity':
            borderColor = '#4CAF50';
            backgroundColor = 'rgba(76, 175, 80, 0.1)';
            break;
        case 'windSpeed':
            borderColor = '#9C27B0';
            backgroundColor = 'rgba(156, 39, 176, 0.1)';
            break;
        default:
            borderColor = '#2196F3';
            backgroundColor = 'rgba(33, 150, 243, 0.1)';
    }
    
    // Criar gráfico
    consultaChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: consultaData.months,
            datasets: [{
                label: `${parameterInfo.name} (${parameterInfo.unit})`,
                data: chartData,
                borderColor: borderColor,
                backgroundColor: backgroundColor,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `${parameterInfo.name} Mensal - ${selectedYear}`
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: selectedParameter === 'precipitation',
                    title: {
                        display: true,
                        text: parameterInfo.unit
                    }
                }
            }
        }
    });
}

// Função para atualizar gráfico de consulta
function updateConsultaChart() {
    // Obter valores selecionados
    const yearSelect = document.getElementById('yearSelect');
    const parameterSelect = document.getElementById('parameterSelect');
    
    if (!yearSelect || !parameterSelect) return;
    
    // Atualizar variáveis globais
    currentYear = yearSelect.value;
    currentParameter = parameterSelect.value;
    
    // Atualizar gráfico
    createConsultaChart();
    
    // Atualizar tabela
    updateConsultaTable();
}

// Função para atualizar tabela de consulta
function updateConsultaTable() {
    if (!consultaData) return;
    
    const tableBody = document.querySelector('.consulta-table tbody');
    if (!tableBody) return;
    
    // Limpar tabela
    tableBody.innerHTML = '';
    
    // Adicionar linhas para cada mês
    consultaData.months.forEach((month, index) => {
        const row = document.createElement('tr');
        
        // Adicionar célula de mês
        const monthCell = document.createElement('td');
        monthCell.textContent = month;
        row.appendChild(monthCell);
        
        // Adicionar valores para cada ano
        consultaData.years.forEach(year => {
            const cell = document.createElement('td');
            const value = consultaData.parameters[currentParameter].data[year][index];
            cell.textContent = value !== null ? value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '-';
            row.appendChild(cell);
        });
        
        tableBody.appendChild(row);
    });
}

// Função para exportar dados de consulta
function exportConsultaData() {
    if (!consultaData) {
        if (typeof window.animateNotification === 'function') {
            window.animateNotification('Nenhum dado para exportar.', 'error');
        }
        return;
    }
    
    // Obter parâmetro selecionado
    const parameterSelect = document.getElementById('parameterSelect');
    const selectedParameter = parameterSelect ? parameterSelect.value : currentParameter;
    const parameterInfo = consultaData.parameters[selectedParameter];
    
    // Criar conteúdo CSV
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Adicionar cabeçalho
    csvContent += `Mês,${consultaData.years.join(',')}\n`;
    
    // Adicionar dados
    consultaData.months.forEach((month, index) => {
        let row = `${month}`;
        
        consultaData.years.forEach(year => {
            const value = consultaData.parameters[selectedParameter].data[year][index];
            row += `,${value !== null ? value : ''}`;
        });
        
        csvContent += row + '\n';
    });
    
    // Criar link para download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${parameterInfo.name}_Mensal.csv`);
    document.body.appendChild(link);
    
    // Simular clique
    link.click();
    
    // Remover link
    document.body.removeChild(link);
    
    // Mostrar notificação
    if (typeof window.animateNotification === 'function') {
        window.animateNotification('Dados exportados com sucesso!', 'success');
    }
}

// Função para comparar anos
function compareYears() {
    if (!consultaData) {
        if (typeof window.animateNotification === 'function') {
            window.animateNotification('Nenhum dado para comparar.', 'error');
        }
        return;
    }
    
    // Obter parâmetro selecionado
    const parameterSelect = document.getElementById('parameterSelect');
    const selectedParameter = parameterSelect ? parameterSelect.value : currentParameter;
    const parameterInfo = consultaData.parameters[selectedParameter];
    
    // Destruir gráfico anterior se existir
    if (consultaChart) {
        consultaChart.destroy();
    }
    
    // Criar datasets para cada ano
    const datasets = [];
    const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#3F51B5'];
    
    consultaData.years.forEach((year, index) => {
        datasets.push({
            label: `${year}`,
            data: consultaData.parameters[selectedParameter].data[year],
            borderColor: colors[index % colors.length],
            backgroundColor: 'transparent',
            tension: 0.3,
            fill: false
        });
    });
    
    // Criar gráfico
    const ctx = document.getElementById('consultaChart');
    if (!ctx) return;
    
    consultaChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: consultaData.months,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Comparação Anual - ${parameterInfo.name}`
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${parameterInfo.unit}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: selectedParameter === 'precipitation',
                    title: {
                        display: true,
                        text: parameterInfo.unit
                    }
                }
            }
        }
    });
    
    // Mostrar notificação
    if (typeof window.animateNotification === 'function') {
        window.animateNotification('Comparação de anos gerada!', 'info');
    }
}

// Exportar funções para uso global
window.initConsultaSection = initConsultaSection;
window.loadConsultaMensal = loadConsultaMensal;
window.updateConsultaChart = updateConsultaChart;
window.exportConsultaData = exportConsultaData;
window.compareYears = compareYears;
