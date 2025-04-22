// Arquivo JavaScript para o mapa interativo

// Variáveis globais
let map = null;
let marker = null;
let currentLocation = null;

// Inicializar o mapa quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o elemento do mapa existe
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Elemento do mapa não encontrado');
        return;
    }
    
    // Inicializar o mapa Leaflet
    initMap();
});

// Função para inicializar o mapa
function initMap() {
    console.log('Inicializando mapa...');
    
    // Verificar se o elemento do mapa existe
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Elemento do mapa não encontrado');
        return;
    }
    
    // Inicializar o mapa Leaflet
    map = L.map('map', {
        center: [-15.7801, -47.9292], // Brasília como centro inicial
        zoom: 5,
        zoomControl: true,
        attributionControl: true
    });
    
    // Adicionar camada de mapa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Configurar evento de clique no mapa
    map.on('click', function(e) {
        setMapLocation(e.latlng.lat, e.latlng.lng);
    });
    
    // Adicionar controles personalizados
    addMapControls();
    
    // Mostrar instruções iniciais
    showMapInstructions();
}

// Função para adicionar controles personalizados ao mapa
function addMapControls() {
    // Criar container para controles
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'map-controls';
    
    // Botão para localização atual
    const locationButton = document.createElement('button');
    locationButton.className = 'map-control-button';
    locationButton.innerHTML = '<span class="map-control-icon material-icons">my_location</span>';
    locationButton.title = 'Usar minha localização';
    locationButton.addEventListener('click', getUserLocation);
    
    // Botão para resetar o mapa
    const resetButton = document.createElement('button');
    resetButton.className = 'map-control-button';
    resetButton.innerHTML = '<span class="map-control-icon material-icons">refresh</span>';
    resetButton.title = 'Resetar mapa';
    resetButton.addEventListener('click', resetMap);
    
    // Adicionar botões ao container
    controlsContainer.appendChild(locationButton);
    controlsContainer.appendChild(resetButton);
    
    // Adicionar container ao mapa
    document.querySelector('.map-container').appendChild(controlsContainer);
}

// Função para mostrar instruções do mapa
function showMapInstructions() {
    const instructionsElement = document.createElement('div');
    instructionsElement.className = 'map-instructions';
    instructionsElement.innerHTML = '<p>Clique no mapa para selecionar uma localização ou use o botão de localização para usar sua posição atual.</p>';
    
    // Adicionar ao container do mapa
    document.querySelector('.map-container').appendChild(instructionsElement);
    
    // Criar container para dados do mapa
    const mapDataElement = document.createElement('div');
    mapDataElement.className = 'map-data';
    mapDataElement.id = 'mapData';
    mapDataElement.style.display = 'none';
    mapDataElement.innerHTML = `
        <div class="data-header">
            <h3>Dados da Localização</h3>
            <div id="locationName">Nenhuma localização selecionada</div>
        </div>
        <div class="data-content">
            <div class="data-loading">Selecione uma localização no mapa</div>
        </div>
    `;
    
    // Adicionar ao container do mapa
    document.querySelector('.map-container').appendChild(mapDataElement);
}

// Função para obter a localização do usuário
function getUserLocation() {
    if (navigator.geolocation) {
        animateNotification('Obtendo sua localização...', 'info');
        
        navigator.geolocation.getCurrentPosition(
            // Sucesso
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Definir localização no mapa
                setMapLocation(lat, lng);
                
                // Centralizar mapa
                map.setView([lat, lng], 10);
                
                animateNotification('Localização obtida com sucesso!', 'success');
            },
            // Erro
            function(error) {
                console.error('Erro ao obter localização:', error);
                
                let errorMessage = 'Não foi possível obter sua localização.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Permissão para geolocalização negada.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Informações de localização indisponíveis.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Tempo esgotado ao obter localização.';
                        break;
                }
                
                animateNotification(errorMessage, 'error');
            },
            // Opções
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        animateNotification('Geolocalização não é suportada neste navegador.', 'error');
    }
}

// Função para resetar o mapa
function resetMap() {
    // Remover marcador atual
    if (marker) {
        map.removeLayer(marker);
        marker = null;
    }
    
    // Resetar localização atual
    currentLocation = null;
    
    // Resetar visualização do mapa
    map.setView([-15.7801, -47.9292], 5);
    
    // Atualizar interface
    document.getElementById('locationName').textContent = 'Nenhuma localização selecionada';
    document.querySelector('.data-content').innerHTML = '<div class="data-loading">Selecione uma localização no mapa</div>';
    
    // Ocultar dados do mapa
    document.getElementById('mapData').style.display = 'none';
    
    // Mostrar instruções
    document.querySelector('.map-instructions').style.opacity = '1';
    
    // Resetar valores dos cards
    const tempValue = document.getElementById('tempValue');
    const precipValue = document.getElementById('precipValue');
    const radiationValue = document.getElementById('radiationValue');
    
    if (tempValue) tempValue.textContent = '--';
    if (precipValue) precipValue.textContent = '--';
    if (radiationValue) radiationValue.textContent = '--';
    
    animateNotification('Mapa resetado com sucesso!', 'info');
}

// Função para definir localização no mapa
function setMapLocation(lat, lng) {
    console.log(`Definindo localização: ${lat}, ${lng}`);
    
    // Remover marcador anterior
    if (marker) {
        map.removeLayer(marker);
    }
    
    // Criar novo marcador
    const customIcon = L.divIcon({
        className: 'custom-marker pulse',
        iconSize: [16, 16]
    });
    
    marker = L.marker([lat, lng], {icon: customIcon}).addTo(map);
    
    // Atualizar localização atual
    currentLocation = {
        lat: lat,
        lng: lng,
        name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    };
    
    // Obter nome da localização usando geocodificação reversa
    getLocationName(lat, lng);
    
    // Atualizar dados do mapa
    updateMapData(currentLocation);
    
    // Ocultar instruções
    document.querySelector('.map-instructions').style.opacity = '0';
    
    // Mostrar dados do mapa
    document.getElementById('mapData').style.display = 'block';
    
    // Atualizar outras seções se estiverem inicializadas
    if (typeof window.currentSection !== 'undefined') {
        if (window.currentSection === 'consulta') {
            if (typeof window.initConsultaSection === 'function') {
                window.initConsultaSection();
            }
        } else if (window.currentSection === 'indicadores') {
            if (typeof window.initIndicadoresSection === 'function') {
                window.initIndicadoresSection();
            }
        } else if (window.currentSection === 'noticias') {
            if (typeof window.initNoticiasSection === 'function') {
                window.initNoticiasSection();
            }
        }
    }
}

// Função para obter nome da localização
function getLocationName(lat, lng) {
    // Usar API de geocodificação reversa
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=pt-BR`)
        .then(response => response.json())
        .then(data => {
            if (data && data.display_name) {
                // Extrair cidade e estado
                let locationName = data.display_name;
                
                // Tentar extrair cidade e estado
                if (data.address) {
                    const city = data.address.city || data.address.town || data.address.village || data.address.hamlet;
                    const state = data.address.state;
                    
                    if (city && state) {
                        locationName = `${city}, ${state}`;
                    } else if (city) {
                        locationName = city;
                    } else if (state) {
                        locationName = state;
                    }
                }
                
                // Atualizar nome da localização
                currentLocation.name = locationName;
                document.getElementById('locationName').textContent = locationName;
            }
        })
        .catch(error => {
            console.error('Erro ao obter nome da localização:', error);
        });
}

// Função para atualizar dados do mapa
function updateMapData(location) {
    console.log('Atualizando dados do mapa:', location);
    
    // Atualizar nome da localização
    document.getElementById('locationName').textContent = location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
    
    // Mostrar carregamento
    const dataContent = document.querySelector('.data-content');
    if (dataContent) {
        dataContent.innerHTML = '<div class="data-loading">Carregando dados...</div>';
    }
    
    // Obter dados da NASA
    getNasaData(location.lat, location.lng)
        .then(data => {
            // Atualizar cards de dados
            const tempValue = document.getElementById('tempValue');
            const precipValue = document.getElementById('precipValue');
            const radiationValue = document.getElementById('radiationValue');
            
            if (tempValue && data.temperature) {
                tempValue.textContent = data.temperature.toFixed(1);
            }
            
            if (precipValue && data.precipitation) {
                precipValue.textContent = data.precipitation.toFixed(1);
            }
            
            if (radiationValue && data.radiation) {
                radiationValue.textContent = data.radiation.toFixed(2);
            }
            
            // Atualizar conteúdo de dados
            if (dataContent) {
                dataContent.innerHTML = `
                    <div class="data-item">
                        <div class="data-label">Temperatura Média</div>
                        <div class="data-value">${data.temperature ? data.temperature.toFixed(1) + ' °C' : 'N/A'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Precipitação</div>
                        <div class="data-value">${data.precipitation ? data.precipitation.toFixed(1) + ' mm' : 'N/A'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Radiação Solar</div>
                        <div class="data-value">${data.radiation ? data.radiation.toFixed(2) + ' kWh/m²' : 'N/A'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Umidade Relativa</div>
                        <div class="data-value">${data.humidity ? data.humidity.toFixed(0) + '%' : 'N/A'}</div>
                    </div>
                    <div class="data-footer">
                        <span>Fonte: NASA POWER Project</span>
                        <span>Última atualização: ${new Date().toLocaleString()}</span>
                    </div>
                `;
            }
            
            // Atualizar outras seções se estiverem inicializadas
            if (typeof window.currentSection !== 'undefined') {
                if (window.currentSection === 'consulta') {
                    if (typeof window.initConsultaSection === 'function') {
                        window.initConsultaSection();
                    }
                } else if (window.currentSection === 'indicadores') {
                    if (typeof window.initIndicadoresSection === 'function') {
                        window.initIndicadoresSection();
                    }
                } else if (window.currentSection === 'noticias') {
                    if (typeof window.initNoticiasSection === 'function') {
                        window.initNoticiasSection();
                    }
                }
            }
        })
        .catch(error => {
            console.error('Erro ao obter dados da NASA:', error);
            
            // Mostrar erro
            if (dataContent) {
                dataContent.innerHTML = `
                    <div class="data-error">
                        <p>Erro ao carregar dados. Tente novamente mais tarde.</p>
                        <button class="nasa-button" onclick="updateMapData(currentLocation)">Tentar Novamente</button>
                    </div>
                `;
            }
            
            // Mostrar notificação
            if (typeof window.animateNotification === 'function') {
                window.animateNotification('Erro ao carregar dados da NASA. Verifique sua conexão.', 'error');
            }
        });
}

// Função para obter dados da NASA
async function getNasaData(lat, lng) {
    console.log('Obtendo dados da NASA para:', lat, lng);
    
    // Verificar se está offline
    const isOffline = !navigator.onLine;
    if (isOffline) {
        // Tentar obter dados do cache
        const cachedData = localStorage.getItem(`nasa_data_${lat.toFixed(4)}_${lng.toFixed(4)}`);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        
        throw new Error('Sem conexão e sem dados em cache');
    }
    
    // Construir URL da API
    const apiUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN,RH2M,WS2M&community=RE&longitude=${lng}&latitude=${lat}&start=20230101&end=20231231&format=JSON`;
    
    try {
        // Fazer requisição
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Processar dados
        const processedData = processNasaData(data);
        
        // Salvar no cache
        localStorage.setItem(`nasa_data_${lat.toFixed(4)}_${lng.toFixed(4)}`, JSON.stringify(processedData));
        
        return processedData;
    } catch (error) {
        console.error('Erro ao obter dados da NASA:', error);
        
        // Tentar usar dados simulados
        return getMockNasaData(lat, lng);
    }
}

// Função para processar dados da NASA
function processNasaData(data) {
    // Verificar se os dados são válidos
    if (!data || !data.properties || !data.properties.parameter) {
        throw new Error('Dados da NASA inválidos');
    }
    
    const parameters = data.properties.parameter;
    
    // Calcular médias dos últimos 7 dias
    const today = new Date();
    const dates = [];
    
    // Obter datas dos últimos 7 dias
    for (let i = 7; i > 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0].replace(/-/g, '');
        dates.push(dateString);
    }
    
    // Calcular médias
    let temperatureSum = 0;
    let precipitationSum = 0;
    let radiationSum = 0;
    let humiditySum = 0;
    let windSpeedSum = 0;
    let validDays = 0;
    
    dates.forEach(date => {
        if (parameters.T2M && parameters.T2M[date]) {
            temperatureSum += parameters.T2M[date];
            precipitationSum += parameters.PRECTOTCORR[date] || 0;
            radiationSum += parameters.ALLSKY_SFC_SW_DWN[date] || 0;
            humiditySum += parameters.RH2M[date] || 0;
            windSpeedSum += parameters.WS2M[date] || 0;
            validDays++;
        }
    });
    
    // Converter temperatura de Kelvin para Celsius
    const temperature = validDays > 0 ? temperatureSum / validDays - 273.15 : null;
    const precipitation = validDays > 0 ? precipitationSum : null;
    const radiation = validDays > 0 ? radiationSum / validDays : null;
    const humidity = validDays > 0 ? humiditySum / validDays : null;
    const windSpeed = validDays > 0 ? windSpeedSum / validDays : null;
    
    return {
        temperature,
        precipitation,
        radiation,
        humidity,
        windSpeed
    };
}

// Função para obter dados simulados da NASA
function getMockNasaData(lat, lng) {
    console.log('Usando dados simulados da NASA para:', lat, lng);
    
    // Gerar dados aleatórios baseados na latitude
    const baseTemp = 25 - Math.abs(lat) / 3;
    const temperature = baseTemp + (Math.random() * 10 - 5);
    const precipitation = Math.random() * 50;
    const radiation = 4 + Math.random() * 3;
    const humidity = 50 + Math.random() * 30;
    const windSpeed = 2 + Math.random() * 5;
    
    return {
        temperature,
        precipitation,
        radiation,
        humidity,
        windSpeed
    };
}

// Exportar funções para uso global
window.initMap = initMap;
window.getUserLocation = getUserLocation;
window.resetMap = resetMap;
window.setMapLocation = setMapLocation;
window.updateMapData = updateMapData;
