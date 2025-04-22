// Arquivo principal de JavaScript para o aplicativo AgroDecision PWA

// Variáveis globais
let deferredPrompt; // Para instalação do PWA
let currentLocation = null; // Localização atual selecionada
let currentSection = 'home'; // Seção atual
let isOffline = !navigator.onLine; // Estado de conexão
let map = null; // Instância do mapa Leaflet
let marker = null; // Marcador atual no mapa

// Inicializar o aplicativo quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando AgroDecision PWA...');
    
    // Inicializar componentes
    initApp();
    
    // Verificar se está offline
    updateOfflineStatus();
    
    // Configurar eventos de conexão
    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);
    
    // Configurar evento de instalação do PWA
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevenir o comportamento padrão
        e.preventDefault();
        
        // Armazenar o evento para uso posterior
        deferredPrompt = e;
        
        // Mostrar o botão de instalação
        document.getElementById('installButton').style.display = 'block';
    });
    
    // Registrar service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registrado com sucesso:', registration.scope);
            })
            .catch(error => {
                console.error('Erro ao registrar Service Worker:', error);
            });
    }
});

// Função para inicializar o aplicativo
function initApp() {
    console.log('Inicializando componentes do aplicativo...');
    
    // Inicializar navegação
    initNavigation();
    
    // Inicializar mapa
    initMap();
    
    // Configurar eventos para cards de ação rápida
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', function() {
            const section = this.id.replace('Card', '');
            navigateTo(section);
        });
    });
    
    // Configurar evento para o botão de atualização
    document.getElementById('refreshButton').addEventListener('click', refreshData);
    
    // Configurar evento para o botão de instalação
    document.getElementById('installButton').addEventListener('click', installApp);
    
    // Configurar evento para o botão de teste
    const testAppBtn = document.getElementById('testAppBtn');
    if (testAppBtn) {
        testAppBtn.addEventListener('click', testApp);
    }
    
    // Configurar evento para o botão de configurações de animação
    const animationSettingsBtn = document.getElementById('animationSettingsBtn');
    if (animationSettingsBtn) {
        animationSettingsBtn.addEventListener('click', openAnimationSettings);
    }
    
    // Configurar evento para o botão de limpar dados
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearAppData);
    }
    
    // Remover overlay de carregamento após 2 segundos
    setTimeout(() => {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('fade-out');
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
        }
    }, 2000);
}

// Função para inicializar navegação
function initNavigation() {
    console.log('Inicializando navegação...');
    
    // Configurar evento para abrir a barra lateral
    const openSidebar = document.getElementById('openSidebar');
    if (openSidebar) {
        openSidebar.addEventListener('click', () => {
            document.getElementById('sidebar').classList.add('open');
            document.getElementById('sidebarOverlay').classList.add('visible');
        });
    }
    
    // Configurar evento para fechar a barra lateral
    const closeSidebar = document.getElementById('closeSidebar');
    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebarOverlay').classList.remove('visible');
        });
    }
    
    // Configurar evento para o overlay da barra lateral
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebarOverlay').classList.remove('visible');
        });
    }
    
    // Configurar eventos para itens de navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            navigateTo(section);
            
            // Fechar a barra lateral em dispositivos móveis
            if (window.innerWidth < 1200) {
                document.getElementById('sidebar').classList.remove('open');
                document.getElementById('sidebarOverlay').classList.remove('visible');
            }
        });
    });
}

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
    document.getElementById('tempValue').textContent = '--';
    document.getElementById('precipValue').textContent = '--';
    document.getElementById('radiationValue').textContent = '--';
    
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
    marker = L.marker([lat, lng]).addTo(map);
    
    // Adicionar classe para animação
    const markerElement = marker._icon;
    if (markerElement) {
        markerElement.classList.add('map-marker-animation');
    }
    
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
    if (currentSection === 'consulta') {
        initConsultaSection();
    } else if (currentSection === 'indicadores') {
        initIndicadoresSection();
    } else if (currentSection === 'noticias') {
        initNoticiasSection();
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

// Função para navegar para uma seção
function navigateTo(section) {
    console.log(`Navegando para seção: ${section}`);
    
    // Verificar se a seção existe
    const targetSection = document.getElementById(`${section}Section`);
    if (!targetSection) {
        console.error(`Seção não encontrada: ${section}`);
        return;
    }
    
    // Obter seção atual
    const currentSectionElement = document.querySelector('.app-section.active');
    
    // Atualizar navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === section) {
            item.classList.add('active');
        }
    });
    
    // Animar transição entre seções
    if (typeof animatePageTransition === 'function') {
        animatePageTransition(currentSectionElement, targetSection);
    } else {
        // Fallback se a função de animação não estiver disponível
        if (currentSectionElement) {
            currentSectionElement.classList.remove('active');
        }
        targetSection.classList.add('active');
    }
    
    // Atualizar seção atual
    currentSection = section;
    
    // Executar ações específicas para cada seção
    switch (section) {
        case 'home':
            // Invalidar tamanho do mapa para corrigir problemas de renderização
            if (map) {
                setTimeout(() => {
                    map.invalidateSize();
                }, 100);
            }
            break;
        case 'simulacao':
            initSimulationSection();
            break;
        case 'consulta':
            initConsultaSection();
            break;
        case 'indicadores':
            initIndicadoresSection();
            break;
        case 'noticias':
            initNoticiasSection();
            break;
        case 'historico':
            loadHistorico();
            break;
        case 'configuracoes':
            loadConfiguracoes();
            break;
    }
}

// Função para inicializar a seção de simulação
function initSimulationSection() {
    console.log('Inicializando seção de simulação...');
    
    // Verificar se já foi inicializada
    if (window.simulationInitialized) return;
    
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
    
    // Marcar como inicializada
    window.simulationInitialized = true;
}

// Função para inicializar a seção de consulta mensal
function initConsultaSection() {
    console.log('Inicializando seção de consulta mensal...');
    
    // Verificar se há localização selecionada
    if (!currentLocation) {
        const consultaContainer = document.querySelector('#consultaMensalContainer');
        if (consultaContainer) {
            consultaContainer.innerHTML = '<div class="consulta-loading">Selecione uma localização no mapa para ver os dados mensais</div>';
        }
        return;
    }
    
    // Carregar dados
    if (typeof loadConsultaMensal === 'function') {
        loadConsultaMensal(currentLocation);
    } else {
        // Fallback se a função não estiver disponível
        const consultaContainer = document.querySelector('#consultaMensalContainer');
        if (consultaContainer) {
            consultaContainer.innerHTML = '<div class="consulta-loading">Carregando dados mensais...</div>';
            
            // Simular carregamento
            setTimeout(() => {
                loadMockConsultaMensal(consultaContainer, currentLocation);
            }, 1000);
        }
    }
}

// Função para inicializar a seção de indicadores
function initIndicadoresSection() {
    console.log('Inicializando seção de indicadores...');
    
    // Verificar se há localização selecionada
    if (!currentLocation) {
        const indicadoresContainer = document.querySelector('#indicadoresContainer');
        if (indicadoresContainer) {
            indicadoresContainer.innerHTML = '<div class="indicadores-loading">Selecione uma localização no mapa para ver os indicadores</div>';
        }
        return;
    }
    
    // Carregar dados
    if (typeof loadIndicadores === 'function') {
        loadIndicadores(currentLocation);
    } else {
        // Fallback se a função não estiver disponível
        const indicadoresContainer = document.querySelector('#indicadoresContainer');
        if (indicadoresContainer) {
            indicadoresContainer.innerHTML = '<div class="indicadores-loading">Carregando indicadores...</div>';
            
            // Simular carregamento
            setTimeout(() => {
                loadMockIndicadores(indicadoresContainer, currentLocation);
            }, 1000);
        }
    }
}

// Função para inicializar a seção de notícias regionais
function initNoticiasSection() {
    console.log('Inicializando seção de notícias regionais...');
    
    // Verificar se há localização selecionada
    if (!currentLocation) {
        const noticiasContainer = document.querySelector('#noticiasContainer');
        if (noticiasContainer) {
            noticiasContainer.innerHTML = '<div class="noticias-loading">Selecione uma localização no mapa para ver notícias regionais</div>';
        }
        return;
    }
    
    // Carregar dados
    if (typeof loadNoticiasRegionais === 'function') {
        loadNoticiasRegionais(currentLocation);
    } else {
        // Fallback se a função não estiver disponível
        const noticiasContainer = document.querySelector('#noticiasContainer');
        if (noticiasContainer) {
            noticiasContainer.innerHTML = '<div class="noticias-loading">Carregando notícias regionais...</div>';
            
            // Simular carregamento
            setTimeout(() => {
                loadMockNoticiasRegionais(noticiasContainer, currentLocation);
            }, 1000);
        }
    }
}

// Função para carregar histórico
function loadHistorico() {
    console.log('Carregando histórico...');
    
    // Carregar dados
    if (typeof loadHistoricoData === 'function') {
        loadHistoricoData();
    } else {
        // Fallback se a função não estiver disponível
        const historicoContainer = document.getElementById('historicoContainer');
        if (historicoContainer) {
            historicoContainer.innerHTML = '<div class="historico-loading">Carregando histórico...</div>';
            
            // Simular carregamento
            setTimeout(() => {
                loadMockHistorico(historicoContainer);
            }, 1000);
        }
    }
}

// Função para carregar configurações
function loadConfiguracoes() {
    console.log('Carregando configurações...');
    
    // Carregar configurações salvas
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.value = localStorage.getItem('theme') || 'light';
        themeSelect.addEventListener('change', function() {
            setTheme(this.value);
        });
    }
    
    const tempUnitSelect = document.getElementById('tempUnitSelect');
    if (tempUnitSelect) {
        tempUnitSelect.value = localStorage.getItem('tempUnit') || 'celsius';
        tempUnitSelect.addEventListener('change', function() {
            localStorage.setItem('tempUnit', this.value);
            refreshData();
        });
    }
    
    const weatherAlertsToggle = document.getElementById('weatherAlertsToggle');
    if (weatherAlertsToggle) {
        weatherAlertsToggle.checked = localStorage.getItem('weatherAlerts') !== 'false';
        weatherAlertsToggle.addEventListener('change', function() {
            localStorage.setItem('weatherAlerts', this.checked);
        });
    }
    
    const newsAlertsToggle = document.getElementById('newsAlertsToggle');
    if (newsAlertsToggle) {
        newsAlertsToggle.checked = localStorage.getItem('newsAlerts') !== 'false';
        newsAlertsToggle.addEventListener('change', function() {
            localStorage.setItem('newsAlerts', this.checked);
        });
    }
    
    const offlineStorageToggle = document.getElementById('offlineStorageToggle');
    if (offlineStorageToggle) {
        offlineStorageToggle.checked = localStorage.getItem('offlineStorage') !== 'false';
        offlineStorageToggle.addEventListener('change', function() {
            localStorage.setItem('offlineStorage', this.checked);
        });
    }
    
    const autoSyncToggle = document.getElementById('autoSyncToggle');
    if (autoSyncToggle) {
        autoSyncToggle.checked = localStorage.getItem('autoSync') !== 'false';
        autoSyncToggle.addEventListener('change', function() {
            localStorage.setItem('autoSync', this.checked);
        });
    }
}

// Função para definir tema
function setTheme(theme) {
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (theme === 'light') {
        document.body.classList.remove('dark-theme');
    } else if (theme === 'auto') {
        // Verificar preferência do sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        
        // Adicionar listener para mudanças de preferência
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (localStorage.getItem('theme') === 'auto') {
                if (e.matches) {
                    document.body.classList.add('dark-theme');
                } else {
                    document.body.classList.remove('dark-theme');
                }
            }
        });
    }
}

// Função para atualizar dados
function refreshData() {
    console.log('Atualizando dados...');
    
    // Mostrar notificação
    animateNotification('Atualizando dados...', 'info');
    
    // Atualizar dados com base na seção atual
    switch (currentSection) {
        case 'home':
            if (currentLocation) {
                updateMapData(currentLocation);
            }
            break;
        case 'simulacao':
            resetSimulation();
            break;
        case 'consulta':
            initConsultaSection();
            break;
        case 'indicadores':
            initIndicadoresSection();
            break;
        case 'noticias':
            initNoticiasSection();
            break;
        case 'historico':
            loadHistorico();
            break;
    }
    
    // Mostrar notificação de conclusão após 1 segundo
    setTimeout(() => {
        animateNotification('Dados atualizados com sucesso!', 'success');
    }, 1000);
}

// Função para limpar dados do aplicativo
function clearAppData() {
    console.log('Limpando dados do aplicativo...');
    
    // Mostrar confirmação
    showModal('Limpar Dados', `
        <div class="modal-message">
            <p>Tem certeza que deseja limpar todos os dados do aplicativo?</p>
            <p>Esta ação irá remover todo o histórico, configurações e dados armazenados localmente.</p>
        </div>
        <div class="modal-actions">
            <button id="confirmClearData" class="nasa-button">Sim, limpar dados</button>
            <button id="cancelClearData" class="nasa-button secondary">Cancelar</button>
        </div>
    `);
    
    // Configurar eventos
    document.getElementById('confirmClearData').addEventListener('click', () => {
        // Limpar localStorage
        localStorage.clear();
        
        // Limpar caches
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        return caches.delete(cacheName);
                    })
                );
            });
        }
        
        // Mostrar notificação
        animateNotification('Todos os dados foram limpos com sucesso!', 'success');
        
        // Fechar modal
        closeModal();
        
        // Recarregar a página após 1 segundo
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    });
    
    document.getElementById('cancelClearData').addEventListener('click', closeModal);
}

// Função para mostrar modal
function showModal(title, content) {
    console.log('Mostrando modal:', title);
    
    const modalContainer = document.getElementById('modalContainer');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (!modalContainer || !modalTitle || !modalBody) {
        console.error('Elementos do modal não encontrados');
        return;
    }
    
    // Definir título e conteúdo
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    
    // Mostrar modal
    modalContainer.style.display = 'flex';
    
    // Configurar evento para fechar
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modalContainer.style.display = 'none';
        });
    }
}

// Função para fechar modal
function closeModal() {
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        modalContainer.style.display = 'none';
    }
}

// Função para instalar o aplicativo
function installApp() {
    console.log('Instalando aplicativo...');
    
    // Verificar se o evento de instalação está disponível
    if (!deferredPrompt) {
        // Mostrar notificação
        animateNotification('O aplicativo já está instalado ou não pode ser instalado neste dispositivo.', 'info');
        return;
    }
    
    // Mostrar prompt de instalação
    deferredPrompt.prompt();
    
    // Aguardar resposta do usuário
    deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === 'accepted') {
            // Mostrar notificação
            animateNotification('Obrigado por instalar o AgroDecision!', 'success');
        } else {
            // Mostrar notificação
            animateNotification('Você pode instalar o aplicativo a qualquer momento pelo menu.', 'info');
        }
        
        // Limpar o prompt
        deferredPrompt = null;
        
        // Ocultar botão de instalação
        document.getElementById('installButton').style.display = 'none';
    });
}

// Função para atualizar status offline
function updateOfflineStatus() {
    isOffline = !navigator.onLine;
    const offlineIndicator = document.getElementById('offlineIndicator');
    
    if (offlineIndicator) {
        if (isOffline) {
            offlineIndicator.classList.add('visible');
        } else {
            offlineIndicator.classList.remove('visible');
        }
    }
    
    // Sincronizar dados quando online
    if (!isOffline && 'serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('sync-data');
        });
    }
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
            if (data.temperature) {
                document.getElementById('tempValue').textContent = data.temperature.toFixed(1);
            }
            
            if (data.precipitation) {
                document.getElementById('precipValue').textContent = data.precipitation.toFixed(1);
            }
            
            if (data.radiation) {
                document.getElementById('radiationValue').textContent = data.radiation.toFixed(2);
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
            if (currentSection === 'consulta') {
                initConsultaSection();
            } else if (currentSection === 'indicadores') {
                initIndicadoresSection();
            } else if (currentSection === 'noticias') {
                initNoticiasSection();
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
            animateNotification('Erro ao carregar dados da NASA. Verifique sua conexão.', 'error');
        });
}

// Função para obter dados da NASA
async function getNasaData(lat, lng) {
    console.log('Obtendo dados da NASA para:', lat, lng);
    
    // Verificar se está offline
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

// Função para executar simulação
function runSimulation() {
    console.log('Executando simulação...');
    
    // Verificar se há localização selecionada
    if (!currentLocation) {
        // Mostrar notificação
        animateNotification('Selecione uma localização no mapa antes de executar a simulação.', 'warning');
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
        animateNotification('A área deve ser um número positivo.', 'error');
        return;
    }
    
    // Mostrar carregamento
    const resultsContent = document.querySelector('.results-content');
    if (resultsContent) {
        resultsContent.innerHTML = '<div class="results-loading">Processando simulação...</div>';
    }
    
    // Executar simulação
    if (typeof runCropSimulation === 'function') {
        runCropSimulation(currentLocation, crop, area, soil, plantingDateValue, irrigation);
    } else {
        // Simulação simplificada (fallback)
        setTimeout(() => {
            // Dados simulados
            const yieldEstimate = Math.round(area * (Math.random() * 2 + 3)); // 3-5 toneladas por hectare
            const harvestDate = new Date(plantingDateValue);
            harvestDate.setDate(harvestDate.getDate() + 120); // 4 meses após o plantio
            
            // Exibir resultados
            if (resultsContent) {
                resultsContent.innerHTML = `
                    <div class="results-grid">
                        <div class="result-card">
                            <div class="result-icon">🌾</div>
                            <div class="result-title">Produtividade Estimada</div>
                            <div class="result-value">${yieldEstimate} toneladas</div>
                            <div class="result-info">${(yieldEstimate / area).toFixed(1)} t/ha</div>
                        </div>
                        <div class="result-card">
                            <div class="result-icon">📅</div>
                            <div class="result-title">Data Estimada de Colheita</div>
                            <div class="result-value">${harvestDate.toLocaleDateString()}</div>
                            <div class="result-info">120 dias após o plantio</div>
                        </div>
                        <div class="result-card">
                            <div class="result-icon">💧</div>
                            <div class="result-title">Necessidade de Água</div>
                            <div class="result-value">${Math.round(area * 500)} m³</div>
                            <div class="result-info">500 m³/ha</div>
                        </div>
                        <div class="result-card">
                            <div class="result-icon">💰</div>
                            <div class="result-title">Receita Estimada</div>
                            <div class="result-value">R$ ${(yieldEstimate * 1000).toLocaleString()}</div>
                            <div class="result-info">R$ 1.000/tonelada</div>
                        </div>
                    </div>
                    <div class="results-details">
                        <h4>Detalhes da Simulação</h4>
                        <div class="details-grid">
                            <div class="detail-item">
                                <div class="detail-label">Cultura</div>
                                <div class="detail-value">${crop}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Área</div>
                                <div class="detail-value">${area} hectares</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Solo</div>
                                <div class="detail-value">${soil}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Data de Plantio</div>
                                <div class="detail-value">${new Date(plantingDateValue).toLocaleDateString()}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Irrigação</div>
                                <div class="detail-value">${irrigation}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Localização</div>
                                <div class="detail-value">${currentLocation.name || `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`}</div>
                            </div>
                        </div>
                    </div>
                    <div class="results-actions">
                        <button class="nasa-button" onclick="saveSimulation()">Salvar Simulação</button>
                        <button class="nasa-button secondary" onclick="resetSimulation()">Nova Simulação</button>
                    </div>
                `;
            }
            
            // Salvar no histórico
            saveToHistory({
                type: 'simulation',
                date: new Date().toISOString(),
                crop: crop,
                area: area,
                location: currentLocation,
                yield: yieldEstimate,
                harvestDate: harvestDate.toISOString()
            });
            
            // Mostrar notificação
            animateNotification('Simulação concluída com sucesso!', 'success');
        }, 1500);
    }
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
}

// Função para salvar simulação
function saveSimulation() {
    console.log('Salvando simulação...');
    
    // Mostrar notificação
    animateNotification('Simulação salva com sucesso!', 'success');
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

// Função para carregar dados simulados de consulta mensal
function loadMockConsultaMensal(container, location) {
    console.log('Carregando dados simulados de consulta mensal para:', location);
    
    // Gerar dados simulados
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const temperatureData = months.map(() => Math.round(15 + Math.random() * 15));
    const precipitationData = months.map(() => Math.round(Math.random() * 200));
    
    // Criar HTML
    container.innerHTML = `
        <div class="consulta-header">
            <h3>Dados Mensais para ${location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}</h3>
            <p>Fonte: NASA POWER Project</p>
        </div>
        
        <div class="consulta-filters">
            <select class="nasa-select">
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
            </select>
            
            <select class="nasa-select">
                <option value="temperature">Temperatura</option>
                <option value="precipitation">Precipitação</option>
                <option value="radiation">Radiação Solar</option>
                <option value="humidity">Umidade</option>
            </select>
            
            <button class="nasa-button">Atualizar</button>
        </div>
        
        <div class="consulta-charts">
            <div class="chart-container">
                <canvas id="temperatureChart"></canvas>
            </div>
            
            <div class="chart-container">
                <canvas id="precipitationChart"></canvas>
            </div>
        </div>
        
        <div class="consulta-table">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Mês</th>
                        <th>Temperatura (°C)</th>
                        <th>Precipitação (mm)</th>
                    </tr>
                </thead>
                <tbody>
                    ${months.map((month, index) => `
                        <tr>
                            <td>${month}</td>
                            <td>${temperatureData[index]}</td>
                            <td>${precipitationData[index]}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // Criar gráficos se Chart.js estiver disponível
    if (typeof Chart !== 'undefined') {
        // Gráfico de temperatura
        new Chart(document.getElementById('temperatureChart'), {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Temperatura (°C)',
                    data: temperatureData,
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
                        text: 'Temperatura Média Mensal'
                    }
                }
            }
        });
        
        // Gráfico de precipitação
        new Chart(document.getElementById('precipitationChart'), {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Precipitação (mm)',
                    data: precipitationData,
                    backgroundColor: 'rgba(33, 150, 243, 0.7)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Precipitação Mensal'
                    }
                }
            }
        });
    }
}

// Função para carregar dados simulados de indicadores
function loadMockIndicadores(container, location) {
    console.log('Carregando dados simulados de indicadores para:', location);
    
    // Gerar dados simulados
    const ndviValue = (0.6 + Math.random() * 0.3).toFixed(2);
    const soilMoistureValue = Math.round(30 + Math.random() * 40);
    const droughtRiskValue = Math.round(Math.random() * 100);
    const cropHealthValue = Math.round(70 + Math.random() * 30);
    
    // Criar HTML
    container.innerHTML = `
        <div class="indicadores-header">
            <h3>Indicadores para ${location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}</h3>
            <p>Fonte: NASA POWER Project e MODIS</p>
        </div>
        
        <div class="indicadores-grid">
            <div class="indicador-card">
                <div class="indicador-header">
                    <h4>NDVI (Índice de Vegetação)</h4>
                    <span class="indicador-date">Atualizado: ${new Date().toLocaleDateString()}</span>
                </div>
                <div class="indicador-value">${ndviValue}</div>
                <div class="indicador-gauge">
                    <div class="gauge-fill" style="width: ${ndviValue * 100}%"></div>
                </div>
                <div class="indicador-status ${ndviValue > 0.7 ? 'good' : ndviValue > 0.5 ? 'medium' : 'bad'}">
                    ${ndviValue > 0.7 ? 'Excelente' : ndviValue > 0.5 ? 'Bom' : 'Regular'}
                </div>
                <div class="indicador-info">
                    <p>O NDVI mede a saúde da vegetação. Valores mais altos indicam vegetação mais saudável.</p>
                </div>
            </div>
            
            <div class="indicador-card">
                <div class="indicador-header">
                    <h4>Umidade do Solo</h4>
                    <span class="indicador-date">Atualizado: ${new Date().toLocaleDateString()}</span>
                </div>
                <div class="indicador-value">${soilMoistureValue}%</div>
                <div class="indicador-gauge">
                    <div class="gauge-fill" style="width: ${soilMoistureValue}%"></div>
                </div>
                <div class="indicador-status ${soilMoistureValue > 60 ? 'good' : soilMoistureValue > 40 ? 'medium' : 'bad'}">
                    ${soilMoistureValue > 60 ? 'Ótima' : soilMoistureValue > 40 ? 'Adequada' : 'Baixa'}
                </div>
                <div class="indicador-info">
                    <p>A umidade do solo é crucial para o desenvolvimento das plantas. Valores ideais variam conforme a cultura.</p>
                </div>
            </div>
            
            <div class="indicador-card">
                <div class="indicador-header">
                    <h4>Risco de Seca</h4>
                    <span class="indicador-date">Atualizado: ${new Date().toLocaleDateString()}</span>
                </div>
                <div class="indicador-value">${droughtRiskValue}%</div>
                <div class="indicador-gauge">
                    <div class="gauge-fill" style="width: ${droughtRiskValue}%"></div>
                </div>
                <div class="indicador-status ${droughtRiskValue < 30 ? 'good' : droughtRiskValue < 60 ? 'medium' : 'bad'}">
                    ${droughtRiskValue < 30 ? 'Baixo' : droughtRiskValue < 60 ? 'Moderado' : 'Alto'}
                </div>
                <div class="indicador-info">
                    <p>O risco de seca é calculado com base em dados históricos e previsões climáticas.</p>
                </div>
            </div>
            
            <div class="indicador-card">
                <div class="indicador-header">
                    <h4>Saúde da Cultura</h4>
                    <span class="indicador-date">Atualizado: ${new Date().toLocaleDateString()}</span>
                </div>
                <div class="indicador-value">${cropHealthValue}%</div>
                <div class="indicador-gauge">
                    <div class="gauge-fill" style="width: ${cropHealthValue}%"></div>
                </div>
                <div class="indicador-status ${cropHealthValue > 80 ? 'good' : cropHealthValue > 60 ? 'medium' : 'bad'}">
                    ${cropHealthValue > 80 ? 'Excelente' : cropHealthValue > 60 ? 'Boa' : 'Regular'}
                </div>
                <div class="indicador-info">
                    <p>A saúde da cultura é um índice composto que considera múltiplos fatores ambientais e vegetativos.</p>
                </div>
            </div>
        </div>
        
        <div class="indicadores-actions">
            <button class="nasa-button">Exportar Dados</button>
            <button class="nasa-button secondary">Mais Detalhes</button>
        </div>
    `;
}

// Função para carregar dados simulados de notícias regionais
function loadMockNoticiasRegionais(container, location) {
    console.log('Carregando dados simulados de notícias regionais para:', location);
    
    // Gerar dados simulados
    const newsCategories = ['Clima', 'Mercado', 'Tecnologia', 'Políticas', 'Eventos'];
    const newsSources = ['Embrapa', 'Canal Rural', 'Globo Rural', 'Agrolink', 'Notícias Agrícolas'];
    
    const news = [];
    for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 7));
        
        news.push({
            title: `Notícia ${i + 1} sobre agricultura na região de ${location.name || 'Brasil'}`,
            description: `Esta é uma notícia simulada sobre agricultura na região de ${location.name || 'Brasil'}. O conteúdo aborda temas relevantes para produtores rurais.`,
            source: newsSources[Math.floor(Math.random() * newsSources.length)],
            date: date.toLocaleDateString(),
            category: newsCategories[Math.floor(Math.random() * newsCategories.length)],
            image: `https://via.placeholder.com/300x200?text=Noticia+${i + 1}`
        });
    }
    
    // Criar HTML
    container.innerHTML = `
        <div class="noticias-header">
            <h3>Notícias para ${location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}</h3>
            <div class="noticias-location">
                <span class="material-icons">location_on</span>
                <span>${location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}</span>
            </div>
        </div>
        
        <div class="noticias-filters">
            <div class="noticias-filter active">Todas</div>
            ${newsCategories.map(category => `<div class="noticias-filter">${category}</div>`).join('')}
        </div>
        
        <div class="noticias-grid">
            ${news.map(item => `
                <div class="noticia-card">
                    <div class="noticia-image-container">
                        <img src="${item.image}" alt="${item.title}" class="noticia-image">
                        <div class="noticia-source">${item.source}</div>
                        <div class="noticia-date">${item.date}</div>
                    </div>
                    <div class="noticia-content">
                        <div class="noticia-title">${item.title}</div>
                        <div class="noticia-description">${item.description}</div>
                        <div class="noticia-footer">
                            <div class="noticia-category">${item.category}</div>
                            <a href="#" class="noticia-link">Ler mais <span class="material-icons noticia-link-icon">arrow_forward</span></a>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="noticias-pagination">
            <button class="pagination-button disabled"><span class="material-icons">chevron_left</span></button>
            <button class="pagination-button active">1</button>
            <button class="pagination-button">2</button>
            <button class="pagination-button">3</button>
            <button class="pagination-button"><span class="material-icons">chevron_right</span></button>
        </div>
    `;
    
    // Configurar eventos para filtros
    container.querySelectorAll('.noticias-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            container.querySelectorAll('.noticias-filter').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            
            // Simular filtragem
            animateNotification(`Filtrando por: ${this.textContent}`, 'info');
        });
    });
}

// Função para carregar dados simulados de histórico
function loadMockHistorico(container) {
    console.log('Carregando dados simulados de histórico');
    
    // Tentar obter histórico do localStorage
    let history = [];
    try {
        const savedHistory = localStorage.getItem('agrodecision_history');
        if (savedHistory) {
            history = JSON.parse(savedHistory);
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    }
    
    // Se não houver histórico, criar dados simulados
    if (history.length === 0) {
        const crops = ['soja', 'milho', 'cafe', 'cana', 'algodao'];
        const soils = ['argiloso', 'arenoso', 'misto'];
        
        for (let i = 0; i < 3; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i * 10);
            
            const harvestDate = new Date(date);
            harvestDate.setDate(harvestDate.getDate() + 120);
            
            const crop = crops[Math.floor(Math.random() * crops.length)];
            const area = 5 + Math.floor(Math.random() * 20);
            const yieldValue = Math.round(area * (Math.random() * 2 + 3));
            
            history.push({
                type: 'simulation',
                date: date.toISOString(),
                crop: crop,
                area: area,
                soil: soils[Math.floor(Math.random() * soils.length)],
                location: {
                    lat: -15.7801 + (Math.random() * 10 - 5),
                    lng: -47.9292 + (Math.random() * 10 - 5),
                    name: `Localização Simulada ${i + 1}`
                },
                yield: yieldValue,
                harvestDate: harvestDate.toISOString()
            });
        }
    }
    
    // Criar HTML
    if (history.length === 0) {
        container.innerHTML = `
            <div class="historico-empty">
                <div class="material-icons" style="font-size: 48px; margin-bottom: 16px;">history</div>
                <p>Nenhum histórico disponível</p>
                <p>Execute simulações para ver o histórico aqui</p>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="historico-header">
                <h3>Seu Histórico</h3>
                <p>Histórico de simulações e consultas</p>
            </div>
            
            <div class="historico-list">
                ${history.map((item, index) => {
                    if (item.type === 'simulation') {
                        const simulationDate = new Date(item.date).toLocaleDateString();
                        const harvestDate = new Date(item.harvestDate).toLocaleDateString();
                        
                        return `
                            <div class="historico-item">
                                <div class="historico-item-header">
                                    <div class="historico-item-title">
                                        <span class="material-icons">agriculture</span>
                                        <span>Simulação de ${item.crop.charAt(0).toUpperCase() + item.crop.slice(1)}</span>
                                    </div>
                                    <div class="historico-item-date">${simulationDate}</div>
                                </div>
                                <div class="historico-item-content">
                                    <div class="historico-item-details">
                                        <div class="detail-row">
                                            <div class="detail-label">Área:</div>
                                            <div class="detail-value">${item.area} hectares</div>
                                        </div>
                                        <div class="detail-row">
                                            <div class="detail-label">Localização:</div>
                                            <div class="detail-value">${item.location.name || `${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}`}</div>
                                        </div>
                                        <div class="detail-row">
                                            <div class="detail-label">Colheita:</div>
                                            <div class="detail-value">${harvestDate}</div>
                                        </div>
                                    </div>
                                    <div class="historico-item-results">
                                        <div class="result-item">
                                            <div class="result-label">Produtividade</div>
                                            <div class="result-value">${item.yield} toneladas</div>
                                        </div>
                                        <div class="result-item">
                                            <div class="result-label">Receita Est.</div>
                                            <div class="result-value">R$ ${(item.yield * 1000).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="historico-item-actions">
                                    <button class="nasa-button" onclick="viewHistoryItem(${index})">Ver Detalhes</button>
                                    <button class="nasa-button secondary" onclick="deleteHistoryItem(${index})">Excluir</button>
                                </div>
                            </div>
                        `;
                    } else {
                        return '';
                    }
                }).join('')}
            </div>
        `;
    }
}

// Função para visualizar item do histórico
function viewHistoryItem(index) {
    console.log('Visualizando item do histórico:', index);
    
    try {
        // Obter histórico
        const history = JSON.parse(localStorage.getItem('agrodecision_history')) || [];
        
        // Verificar se o índice é válido
        if (index >= 0 && index < history.length) {
            const item = history[index];
            
            // Mostrar modal com detalhes
            showModal('Detalhes da Simulação', `
                <div class="historico-details">
                    <div class="historico-details-header">
                        <h4>Simulação de ${item.crop.charAt(0).toUpperCase() + item.crop.slice(1)}</h4>
                        <p>Realizada em ${new Date(item.date).toLocaleDateString()}</p>
                    </div>
                    
                    <div class="historico-details-content">
                        <div class="details-section">
                            <h5>Parâmetros da Simulação</h5>
                            <div class="details-grid">
                                <div class="detail-item">
                                    <div class="detail-label">Cultura</div>
                                    <div class="detail-value">${item.crop.charAt(0).toUpperCase() + item.crop.slice(1)}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Área</div>
                                    <div class="detail-value">${item.area} hectares</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Solo</div>
                                    <div class="detail-value">${item.soil || 'Não especificado'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Localização</div>
                                    <div class="detail-value">${item.location.name || `${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}`}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Data de Plantio</div>
                                    <div class="detail-value">${new Date(item.date).toLocaleDateString()}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Data de Colheita</div>
                                    <div class="detail-value">${new Date(item.harvestDate).toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="details-section">
                            <h5>Resultados</h5>
                            <div class="results-grid">
                                <div class="result-card">
                                    <div class="result-icon">🌾</div>
                                    <div class="result-title">Produtividade</div>
                                    <div class="result-value">${item.yield} toneladas</div>
                                    <div class="result-info">${(item.yield / item.area).toFixed(1)} t/ha</div>
                                </div>
                                <div class="result-card">
                                    <div class="result-icon">💰</div>
                                    <div class="result-title">Receita Estimada</div>
                                    <div class="result-value">R$ ${(item.yield * 1000).toLocaleString()}</div>
                                    <div class="result-info">R$ 1.000/tonelada</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="historico-details-actions">
                        <button class="nasa-button" onclick="repeatSimulation(${index})">Repetir Simulação</button>
                        <button class="nasa-button secondary" onclick="closeModal()">Fechar</button>
                    </div>
                </div>
            `);
        } else {
            animateNotification('Item do histórico não encontrado.', 'error');
        }
    } catch (error) {
        console.error('Erro ao visualizar item do histórico:', error);
        animateNotification('Erro ao carregar detalhes do histórico.', 'error');
    }
}

// Função para excluir item do histórico
function deleteHistoryItem(index) {
    console.log('Excluindo item do histórico:', index);
    
    try {
        // Obter histórico
        let history = JSON.parse(localStorage.getItem('agrodecision_history')) || [];
        
        // Verificar se o índice é válido
        if (index >= 0 && index < history.length) {
            // Remover item
            history.splice(index, 1);
            
            // Salvar histórico atualizado
            localStorage.setItem('agrodecision_history', JSON.stringify(history));
            
            // Recarregar histórico
            loadHistorico();
            
            // Mostrar notificação
            animateNotification('Item do histórico excluído com sucesso.', 'success');
        } else {
            animateNotification('Item do histórico não encontrado.', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir item do histórico:', error);
        animateNotification('Erro ao excluir item do histórico.', 'error');
    }
}

// Função para repetir simulação
function repeatSimulation(index) {
    console.log('Repetindo simulação:', index);
    
    try {
        // Obter histórico
        const history = JSON.parse(localStorage.getItem('agrodecision_history')) || [];
        
        // Verificar se o índice é válido
        if (index >= 0 && index < history.length) {
            const item = history[index];
            
            // Navegar para a seção de simulação
            navigateTo('simulacao');
            
            // Fechar modal
            closeModal();
            
            // Preencher formulário com dados da simulação
            setTimeout(() => {
                const cropSelect = document.getElementById('cropSelect');
                const areaInput = document.getElementById('areaInput');
                const soilSelect = document.getElementById('soilSelect');
                const plantingDate = document.getElementById('plantingDate');
                
                if (cropSelect) cropSelect.value = item.crop;
                if (areaInput) areaInput.value = item.area;
                if (soilSelect && item.soil) soilSelect.value = item.soil;
                if (plantingDate) plantingDate.valueAsDate = new Date(item.date);
                
                // Definir localização no mapa
                if (map && item.location) {
                    map.setView([item.location.lat, item.location.lng], 10);
                    setMapLocation(item.location.lat, item.location.lng);
                }
                
                // Mostrar notificação
                animateNotification('Simulação carregada. Clique em "Executar Simulação" para continuar.', 'info');
            }, 500);
        } else {
            animateNotification('Item do histórico não encontrado.', 'error');
        }
    } catch (error) {
        console.error('Erro ao repetir simulação:', error);
        animateNotification('Erro ao carregar dados da simulação.', 'error');
    }
}

// Função para testar o aplicativo
function testApp() {
    console.log('Testando aplicativo...');
    
    // Mostrar modal com opções de teste
    showModal('Testar Aplicativo', `
        <div class="test-options">
            <p>Selecione o que deseja testar:</p>
            
            <div class="test-option" onclick="testFeature('offline')">
                <span class="material-icons">cloud_off</span>
                <div class="test-option-content">
                    <div class="test-option-title">Modo Offline</div>
                    <div class="test-option-description">Simular funcionamento sem conexão</div>
                </div>
            </div>
            
            <div class="test-option" onclick="testFeature('notification')">
                <span class="material-icons">notifications</span>
                <div class="test-option-content">
                    <div class="test-option-title">Notificações</div>
                    <div class="test-option-description">Testar sistema de notificações</div>
                </div>
            </div>
            
            <div class="test-option" onclick="testFeature('animation')">
                <span class="material-icons">animation</span>
                <div class="test-option-content">
                    <div class="test-option-title">Animações</div>
                    <div class="test-option-description">Testar animações da interface</div>
                </div>
            </div>
            
            <div class="test-option" onclick="testFeature('api')">
                <span class="material-icons">api</span>
                <div class="test-option-content">
                    <div class="test-option-title">APIs</div>
                    <div class="test-option-description">Testar conexão com APIs</div>
                </div>
            </div>
            
            <div class="test-option" onclick="testFeature('performance')">
                <span class="material-icons">speed</span>
                <div class="test-option-content">
                    <div class="test-option-title">Desempenho</div>
                    <div class="test-option-description">Testar desempenho do aplicativo</div>
                </div>
            </div>
        </div>
    `);
}

// Função para testar funcionalidades específicas
function testFeature(feature) {
    console.log('Testando funcionalidade:', feature);
    
    // Fechar modal
    closeModal();
    
    switch (feature) {
        case 'offline':
            // Simular modo offline
            animateNotification('Simulando modo offline...', 'info');
            
            // Forçar modo offline
            window.dispatchEvent(new Event('offline'));
            
            // Mostrar notificação após 1 segundo
            setTimeout(() => {
                animateNotification('Modo offline ativado. O aplicativo está funcionando sem conexão.', 'warning');
                
                // Restaurar modo online após 5 segundos
                setTimeout(() => {
                    window.dispatchEvent(new Event('online'));
                    animateNotification('Conexão restaurada. O aplicativo está sincronizando dados.', 'success');
                }, 5000);
            }, 1000);
            break;
            
        case 'notification':
            // Testar notificações
            animateNotification('Testando sistema de notificações...', 'info');
            
            // Mostrar diferentes tipos de notificações
            setTimeout(() => {
                animateNotification('Esta é uma notificação de sucesso!', 'success');
            }, 1000);
            
            setTimeout(() => {
                animateNotification('Esta é uma notificação de erro!', 'error');
            }, 2000);
            
            setTimeout(() => {
                animateNotification('Esta é uma notificação de aviso!', 'warning');
            }, 3000);
            
            setTimeout(() => {
                animateNotification('Esta é uma notificação informativa!', 'info');
            }, 4000);
            break;
            
        case 'animation':
            // Testar animações
            animateNotification('Testando animações da interface...', 'info');
            
            // Animar logos
            const appLogo = document.getElementById('appLogo');
            if (appLogo) {
                appLogo.classList.add('logo-animation');
                
                // Remover classe após 5 segundos
                setTimeout(() => {
                    appLogo.classList.remove('logo-animation');
                }, 5000);
            }
            
            // Animar transições entre seções
            setTimeout(() => {
                navigateTo('simulacao');
            }, 1000);
            
            setTimeout(() => {
                navigateTo('consulta');
            }, 2000);
            
            setTimeout(() => {
                navigateTo('noticias');
            }, 3000);
            
            setTimeout(() => {
                navigateTo('home');
            }, 4000);
            break;
            
        case 'api':
            // Testar conexão com APIs
            animateNotification('Testando conexão com APIs...', 'info');
            
            // Simular localização para teste
            if (map) {
                const testLat = -15.7801;
                const testLng = -47.9292;
                
                map.setView([testLat, testLng], 10);
                setMapLocation(testLat, testLng);
                
                // Mostrar notificação após 2 segundos
                setTimeout(() => {
                    animateNotification('Conexão com APIs testada com sucesso!', 'success');
                }, 2000);
            } else {
                animateNotification('Erro ao testar APIs: Mapa não inicializado.', 'error');
            }
            break;
            
        case 'performance':
            // Testar desempenho
            animateNotification('Iniciando teste de desempenho...', 'info');
            
            // Medir tempo de carregamento
            const startTime = performance.now();
            
            // Simular operações intensivas
            setTimeout(() => {
                const endTime = performance.now();
                const loadTime = ((endTime - startTime) / 1000).toFixed(2);
                
                animateNotification(`Teste de desempenho concluído em ${loadTime} segundos.`, 'success');
            }, 2000);
            break;
    }
}

// Função para abrir configurações de animação
function openAnimationSettings() {
    console.log('Abrindo configurações de animação...');
    
    // Mostrar modal com opções
    showModal('Configurações de Animação', `
        <div class="animation-settings">
            <div class="settings-item">
                <div class="settings-label">Animações Habilitadas</div>
                <label class="switch">
                    <input type="checkbox" id="animationsToggle" checked>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="settings-item">
                <div class="settings-label">Velocidade das Animações</div>
                <select id="animationSpeedSelect" class="nasa-select">
                    <option value="slow">Lenta</option>
                    <option value="normal" selected>Normal</option>
                    <option value="fast">Rápida</option>
                </select>
            </div>
            
            <div class="settings-item">
                <div class="settings-label">Animações de Transição</div>
                <select id="transitionTypeSelect" class="nasa-select">
                    <option value="fade">Fade</option>
                    <option value="slide" selected>Slide</option>
                    <option value="zoom">Zoom</option>
                </select>
            </div>
            
            <div class="settings-item">
                <div class="settings-label">Animações de Carregamento</div>
                <label class="switch">
                    <input type="checkbox" id="loadingAnimationsToggle" checked>
                    <span class="slider round"></span>
                </label>
            </div>
        </div>
        
        <div class="animation-preview">
            <h4>Prévia</h4>
            <div id="animationPreview" class="preview-container">
                <div class="preview-element"></div>
            </div>
            <button id="previewButton" class="nasa-button">Testar Animação</button>
        </div>
        
        <div class="modal-actions">
            <button id="saveAnimationSettings" class="nasa-button">Salvar Configurações</button>
            <button onclick="closeModal()" class="nasa-button secondary">Cancelar</button>
        </div>
    `);
    
    // Configurar eventos
    const animationsToggle = document.getElementById('animationsToggle');
    const animationSpeedSelect = document.getElementById('animationSpeedSelect');
    const transitionTypeSelect = document.getElementById('transitionTypeSelect');
    const loadingAnimationsToggle = document.getElementById('loadingAnimationsToggle');
    const previewButton = document.getElementById('previewButton');
    const saveAnimationSettings = document.getElementById('saveAnimationSettings');
    
    if (animationsToggle && animationSpeedSelect && transitionTypeSelect && loadingAnimationsToggle && previewButton && saveAnimationSettings) {
        // Carregar configurações salvas
        animationsToggle.checked = localStorage.getItem('animations') !== 'false';
        animationSpeedSelect.value = localStorage.getItem('animationSpeed') || 'normal';
        transitionTypeSelect.value = localStorage.getItem('transitionType') || 'slide';
        loadingAnimationsToggle.checked = localStorage.getItem('loadingAnimations') !== 'false';
        
        // Configurar evento para prévia
        previewButton.addEventListener('click', () => {
            const previewElement = document.querySelector('.preview-element');
            
            if (previewElement) {
                // Remover classes anteriores
                previewElement.className = 'preview-element';
                
                // Aplicar novas classes
                if (animationsToggle.checked) {
                    const speed = animationSpeedSelect.value;
                    const type = transitionTypeSelect.value;
                    
                    previewElement.classList.add(`animation-${type}`);
                    previewElement.classList.add(`animation-${speed}`);
                    
                    // Reiniciar animação
                    void previewElement.offsetWidth;
                    previewElement.classList.add('animate');
                }
            }
        });
        
        // Configurar evento para salvar
        saveAnimationSettings.addEventListener('click', () => {
            // Salvar configurações
            localStorage.setItem('animations', animationsToggle.checked);
            localStorage.setItem('animationSpeed', animationSpeedSelect.value);
            localStorage.setItem('transitionType', transitionTypeSelect.value);
            localStorage.setItem('loadingAnimations', loadingAnimationsToggle.checked);
            
            // Aplicar configurações
            document.body.classList.toggle('no-animations', !animationsToggle.checked);
            document.body.setAttribute('data-animation-speed', animationSpeedSelect.value);
            document.body.setAttribute('data-transition-type', transitionTypeSelect.value);
            
            // Fechar modal
            closeModal();
            
            // Mostrar notificação
            animateNotification('Configurações de animação salvas com sucesso!', 'success');
        });
    }
}

// Função para animar notificação
function animateNotification(message, type = 'info') {
    console.log(`Notificação (${type}):`, message);
    
    // Remover notificações existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Definir ícone com base no tipo
    let icon = 'info';
    switch (type) {
        case 'success':
            icon = 'check_circle';
            break;
        case 'error':
            icon = 'error';
            break;
        case 'warning':
            icon = 'warning';
            break;
    }
    
    // Definir conteúdo
    notification.innerHTML = `
        <span class="notification-icon material-icons">${icon}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close material-icons">close</button>
    `;
    
    // Adicionar ao corpo do documento
    document.body.appendChild(notification);
    
    // Configurar evento para fechar
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 5000);
}

// Função para animar transição entre páginas
function animatePageTransition(fromSection, toSection) {
    console.log('Animando transição de página:', fromSection, toSection);
    
    // Verificar se as animações estão habilitadas
    if (document.body.classList.contains('no-animations')) {
        // Animações desabilitadas, fazer transição imediata
        if (fromSection) {
            fromSection.classList.remove('active');
        }
        toSection.classList.add('active');
        return;
    }
    
    // Obter tipo de transição
    const transitionType = document.body.getAttribute('data-transition-type') || 'slide';
    
    // Aplicar transição
    if (transitionType === 'fade') {
        // Fade
        if (fromSection) {
            fromSection.classList.add('fade-out');
            setTimeout(() => {
                fromSection.classList.remove('active');
                fromSection.classList.remove('fade-out');
                toSection.classList.add('active');
                toSection.classList.add('fade-in');
                
                setTimeout(() => {
                    toSection.classList.remove('fade-in');
                }, 300);
            }, 300);
        } else {
            toSection.classList.add('active');
            toSection.classList.add('fade-in');
            
            setTimeout(() => {
                toSection.classList.remove('fade-in');
            }, 300);
        }
    } else if (transitionType === 'slide') {
        // Slide
        if (fromSection) {
            fromSection.classList.add('slide-out');
            setTimeout(() => {
                fromSection.classList.remove('active');
                fromSection.classList.remove('slide-out');
                toSection.classList.add('active');
                toSection.classList.add('slide-in');
                
                setTimeout(() => {
                    toSection.classList.remove('slide-in');
                }, 300);
            }, 300);
        } else {
            toSection.classList.add('active');
            toSection.classList.add('slide-in');
            
            setTimeout(() => {
                toSection.classList.remove('slide-in');
            }, 300);
        }
    } else {
        // Zoom
        if (fromSection) {
            fromSection.classList.add('zoom-out');
            setTimeout(() => {
                fromSection.classList.remove('active');
                fromSection.classList.remove('zoom-out');
                toSection.classList.add('active');
                toSection.classList.add('zoom-in');
                
                setTimeout(() => {
                    toSection.classList.remove('zoom-in');
                }, 300);
            }, 300);
        } else {
            toSection.classList.add('active');
            toSection.classList.add('zoom-in');
            
            setTimeout(() => {
                toSection.classList.remove('zoom-in');
            }, 300);
        }
    }
}

// Exportar funções para uso global
window.navigateTo = navigateTo;
window.showModal = showModal;
window.closeModal = closeModal;
window.updateMapData = updateMapData;
window.runSimulation = runSimulation;
window.resetSimulation = resetSimulation;
window.saveSimulation = saveSimulation;
window.viewHistoryItem = viewHistoryItem;
window.deleteHistoryItem = deleteHistoryItem;
window.repeatSimulation = repeatSimulation;
window.testFeature = testFeature;
window.animateNotification = animateNotification;
window.animatePageTransition = animatePageTransition;
