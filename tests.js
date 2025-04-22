// Arquivo JavaScript para testes de compatibilidade entre navegadores

// Variáveis globais
let testResults = {};
let browserInfo = {};

// Inicializar testes
function initTests() {
    console.log('Inicializando testes de compatibilidade...');
    
    // Obter informações do navegador
    detectBrowser();
    
    // Executar testes
    runCompatibilityTests();
}

// Função para detectar navegador
function detectBrowser() {
    const userAgent = navigator.userAgent;
    let browserName = "Desconhecido";
    let browserVersion = "Desconhecido";
    let osName = "Desconhecido";
    
    // Detectar sistema operacional
    if (userAgent.indexOf("Windows") !== -1) osName = "Windows";
    else if (userAgent.indexOf("Mac") !== -1) osName = "MacOS";
    else if (userAgent.indexOf("Linux") !== -1) osName = "Linux";
    else if (userAgent.indexOf("Android") !== -1) osName = "Android";
    else if (userAgent.indexOf("iOS") !== -1 || userAgent.indexOf("iPhone") !== -1 || userAgent.indexOf("iPad") !== -1) osName = "iOS";
    
    // Detectar navegador
    if (userAgent.indexOf("Firefox") !== -1) {
        browserName = "Firefox";
        browserVersion = userAgent.match(/Firefox\/([0-9.]+)/)[1];
    } else if (userAgent.indexOf("Chrome") !== -1 && userAgent.indexOf("Edg") === -1 && userAgent.indexOf("OPR") === -1) {
        browserName = "Chrome";
        browserVersion = userAgent.match(/Chrome\/([0-9.]+)/)[1];
    } else if (userAgent.indexOf("Safari") !== -1 && userAgent.indexOf("Chrome") === -1) {
        browserName = "Safari";
        browserVersion = userAgent.match(/Version\/([0-9.]+)/)[1];
    } else if (userAgent.indexOf("Edg") !== -1) {
        browserName = "Edge";
        browserVersion = userAgent.match(/Edg\/([0-9.]+)/)[1];
    } else if (userAgent.indexOf("OPR") !== -1) {
        browserName = "Opera";
        browserVersion = userAgent.match(/OPR\/([0-9.]+)/)[1];
    }
    
    // Armazenar informações
    browserInfo = {
        name: browserName,
        version: browserVersion,
        os: osName,
        userAgent: userAgent,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        touchScreen: 'ontouchstart' in window,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        pixelRatio: window.devicePixelRatio || 1
    };
    
    console.log('Informações do navegador:', browserInfo);
}

// Função para executar testes de compatibilidade
function runCompatibilityTests() {
    console.log('Executando testes de compatibilidade...');
    
    // Inicializar resultados
    testResults = {
        features: {},
        apis: {},
        rendering: {},
        performance: {}
    };
    
    // Testar recursos
    testFeatures();
    
    // Testar APIs
    testAPIs();
    
    // Testar renderização
    testRendering();
    
    // Testar performance
    testPerformance();
    
    // Exibir resultados
    displayTestResults();
}

// Função para testar recursos
function testFeatures() {
    console.log('Testando recursos...');
    
    // Testar Service Worker
    testResults.features.serviceWorker = 'serviceWorker' in navigator;
    
    // Testar IndexedDB
    testResults.features.indexedDB = 'indexedDB' in window;
    
    // Testar Cache API
    testResults.features.cacheAPI = 'caches' in window;
    
    // Testar Web Storage
    testResults.features.localStorage = 'localStorage' in window;
    testResults.features.sessionStorage = 'sessionStorage' in window;
    
    // Testar Geolocation API
    testResults.features.geolocation = 'geolocation' in navigator;
    
    // Testar Fetch API
    testResults.features.fetch = 'fetch' in window;
    
    // Testar Promise
    testResults.features.promise = 'Promise' in window;
    
    // Testar Async/Await
    try {
        eval('async function test() {}');
        testResults.features.asyncAwait = true;
    } catch (e) {
        testResults.features.asyncAwait = false;
    }
    
    // Testar ES6 Features
    try {
        eval('const test = () => {}');
        testResults.features.arrowFunctions = true;
    } catch (e) {
        testResults.features.arrowFunctions = false;
    }
    
    try {
        eval('const [a, b] = [1, 2]');
        testResults.features.destructuring = true;
    } catch (e) {
        testResults.features.destructuring = false;
    }
    
    // Testar CSS Grid
    testResults.features.cssGrid = CSS.supports('display', 'grid');
    
    // Testar CSS Flexbox
    testResults.features.cssFlexbox = CSS.supports('display', 'flex');
    
    // Testar CSS Variables
    testResults.features.cssVariables = CSS.supports('--test', '0');
    
    console.log('Resultados de recursos:', testResults.features);
}

// Função para testar APIs
function testAPIs() {
    console.log('Testando APIs...');
    
    // Testar Canvas API
    testResults.apis.canvas = !!document.createElement('canvas').getContext;
    
    // Testar WebGL
    try {
        const canvas = document.createElement('canvas');
        testResults.apis.webgl = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
        testResults.apis.webgl = false;
    }
    
    // Testar Web Audio API
    testResults.apis.webAudio = 'AudioContext' in window || 'webkitAudioContext' in window;
    
    // Testar Notification API
    testResults.apis.notifications = 'Notification' in window;
    
    // Testar Vibration API
    testResults.apis.vibration = 'vibrate' in navigator;
    
    // Testar Battery API
    testResults.apis.battery = 'getBattery' in navigator;
    
    // Testar Web Share API
    testResults.apis.webShare = 'share' in navigator;
    
    // Testar Payment Request API
    testResults.apis.paymentRequest = 'PaymentRequest' in window;
    
    // Testar Intersection Observer
    testResults.apis.intersectionObserver = 'IntersectionObserver' in window;
    
    // Testar Resize Observer
    testResults.apis.resizeObserver = 'ResizeObserver' in window;
    
    console.log('Resultados de APIs:', testResults.apis);
}

// Função para testar renderização
function testRendering() {
    console.log('Testando renderização...');
    
    // Testar suporte a SVG
    testResults.rendering.svg = document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1');
    
    // Testar suporte a WebP
    const webpImage = new Image();
    webpImage.onload = function() {
        testResults.rendering.webp = true;
        updateRenderingResults();
    };
    webpImage.onerror = function() {
        testResults.rendering.webp = false;
        updateRenderingResults();
    };
    webpImage.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    
    // Testar suporte a AVIF
    const avifImage = new Image();
    avifImage.onload = function() {
        testResults.rendering.avif = true;
        updateRenderingResults();
    };
    avifImage.onerror = function() {
        testResults.rendering.avif = false;
        updateRenderingResults();
    };
    avifImage.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    
    // Testar suporte a animações CSS
    testResults.rendering.cssAnimations = CSS.supports('animation', 'name 1s');
    
    // Testar suporte a transformações CSS
    testResults.rendering.cssTransforms = CSS.supports('transform', 'translateX(0)');
    
    // Testar suporte a transições CSS
    testResults.rendering.cssTransitions = CSS.supports('transition', 'all 1s');
    
    // Testar suporte a filtros CSS
    testResults.rendering.cssFilters = CSS.supports('filter', 'blur(1px)');
    
    // Testar suporte a máscaras CSS
    testResults.rendering.cssMasks = CSS.supports('mask-image', 'none');
    
    // Testar suporte a clipping paths CSS
    testResults.rendering.cssClipPath = CSS.supports('clip-path', 'circle(50%)');
    
    console.log('Resultados de renderização (parciais):', testResults.rendering);
}

// Função para atualizar resultados de renderização
function updateRenderingResults() {
    console.log('Resultados de renderização (atualizados):', testResults.rendering);
    
    // Atualizar exibição se todos os testes de imagem estiverem concluídos
    if ('webp' in testResults.rendering && 'avif' in testResults.rendering) {
        displayTestResults();
    }
}

// Função para testar performance
function testPerformance() {
    console.log('Testando performance...');
    
    // Testar tempo de inicialização
    testResults.performance.initTime = window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart;
    
    // Testar tempo de renderização
    testResults.performance.renderTime = window.performance.timing.domComplete - window.performance.timing.domLoading;
    
    // Testar operações DOM
    const domStartTime = performance.now();
    const testDiv = document.createElement('div');
    for (let i = 0; i < 1000; i++) {
        const element = document.createElement('span');
        element.textContent = `Item ${i}`;
        testDiv.appendChild(element);
    }
    document.body.appendChild(testDiv);
    document.body.removeChild(testDiv);
    const domEndTime = performance.now();
    testResults.performance.domOperations = domEndTime - domStartTime;
    
    // Testar operações de array
    const arrayStartTime = performance.now();
    const testArray = [];
    for (let i = 0; i < 100000; i++) {
        testArray.push(i);
    }
    testArray.sort((a, b) => b - a);
    testArray.filter(item => item % 2 === 0);
    testArray.map(item => item * 2);
    const arrayEndTime = performance.now();
    testResults.performance.arrayOperations = arrayEndTime - arrayStartTime;
    
    // Testar operações de string
    const stringStartTime = performance.now();
    let testString = '';
    for (let i = 0; i < 10000; i++) {
        testString += `Item ${i} `;
    }
    testString.split(' ');
    testString.replace(/Item/g, 'Element');
    const stringEndTime = performance.now();
    testResults.performance.stringOperations = stringEndTime - stringStartTime;
    
    console.log('Resultados de performance:', testResults.performance);
}

// Função para exibir resultados dos testes
function displayTestResults() {
    console.log('Exibindo resultados dos testes...');
    
    const testContainer = document.getElementById('testResults');
    if (!testContainer) return;
    
    // Criar HTML para resultados
    let html = `
        <div class="test-header">
            <h3>Resultados de Compatibilidade</h3>
            <p>Navegador: ${browserInfo.name} ${browserInfo.version} (${browserInfo.os})</p>
        </div>
        
        <div class="test-summary">
            <div class="test-score">
                <div class="score-circle ${getOverallScoreClass(calculateOverallScore())}">
                    <span>${calculateOverallScore()}%</span>
                </div>
                <div class="score-label">Compatibilidade Geral</div>
            </div>
            
            <div class="test-categories">
                <div class="test-category">
                    <div class="category-name">Recursos</div>
                    <div class="category-score ${getCategoryScoreClass(calculateCategoryScore('features'))}">${calculateCategoryScore('features')}%</div>
                </div>
                <div class="test-category">
                    <div class="category-name">APIs</div>
                    <div class="category-score ${getCategoryScoreClass(calculateCategoryScore('apis'))}">${calculateCategoryScore('apis')}%</div>
                </div>
                <div class="test-category">
                    <div class="category-name">Renderização</div>
                    <div class="category-score ${getCategoryScoreClass(calculateCategoryScore('rendering'))}">${calculateCategoryScore('rendering')}%</div>
                </div>
                <div class="test-category">
                    <div class="category-name">Performance</div>
                    <div class="category-score ${getPerformanceScoreClass(calculatePerformanceScore())}">${calculatePerformanceScore()}</div>
                </div>
            </div>
        </div>
        
        <div class="test-details">
            <div class="test-section">
                <h4>Recursos</h4>
                <div class="test-grid">
    `;
    
    // Adicionar resultados de recursos
    for (const [feature, supported] of Object.entries(testResults.features)) {
        html += `
            <div class="test-item">
                <div class="test-name">${formatFeatureName(feature)}</div>
                <div class="test-result ${supported ? 'supported' : 'not-supported'}">
                    <span class="material-icons">${supported ? 'check_circle' : 'cancel'}</span>
                </div>
            </div>
        `;
    }
    
    html += `
                </div>
            </div>
            
            <div class="test-section">
                <h4>APIs</h4>
                <div class="test-grid">
    `;
    
    // Adicionar resultados de APIs
    for (const [api, supported] of Object.entries(testResults.apis)) {
        html += `
            <div class="test-item">
                <div class="test-name">${formatApiName(api)}</div>
                <div class="test-result ${supported ? 'supported' : 'not-supported'}">
                    <span class="material-icons">${supported ? 'check_circle' : 'cancel'}</span>
                </div>
            </div>
        `;
    }
    
    html += `
                </div>
            </div>
            
            <div class="test-section">
                <h4>Renderização</h4>
                <div class="test-grid">
    `;
    
    // Adicionar resultados de renderização
    for (const [feature, supported] of Object.entries(testResults.rendering)) {
        html += `
            <div class="test-item">
                <div class="test-name">${formatRenderingName(feature)}</div>
                <div class="test-result ${supported ? 'supported' : 'not-supported'}">
                    <span class="material-icons">${supported ? 'check_circle' : 'cancel'}</span>
                </div>
            </div>
        `;
    }
    
    html += `
                </div>
            </div>
            
            <div class="test-section">
                <h4>Performance</h4>
                <div class="test-grid">
    `;
    
    // Adicionar resultados de performance
    for (const [metric, value] of Object.entries(testResults.performance)) {
        let rating = '';
        let ratingClass = '';
        
        if (metric === 'initTime') {
            if (value < 1000) {
                rating = 'Excelente';
                ratingClass = 'excellent';
            } else if (value < 2000) {
                rating = 'Bom';
                ratingClass = 'good';
            } else if (value < 3000) {
                rating = 'Regular';
                ratingClass = 'average';
            } else {
                rating = 'Lento';
                ratingClass = 'poor';
            }
        } else if (metric === 'renderTime') {
            if (value < 500) {
                rating = 'Excelente';
                ratingClass = 'excellent';
            } else if (value < 1000) {
                rating = 'Bom';
                ratingClass = 'good';
            } else if (value < 2000) {
                rating = 'Regular';
                ratingClass = 'average';
            } else {
                rating = 'Lento';
                ratingClass = 'poor';
            }
        } else if (metric === 'domOperations') {
            if (value < 50) {
                rating = 'Excelente';
                ratingClass = 'excellent';
            } else if (value < 100) {
                rating = 'Bom';
                ratingClass = 'good';
            } else if (value < 200) {
                rating = 'Regular';
                ratingClass = 'average';
            } else {
                rating = 'Lento';
                ratingClass = 'poor';
            }
        } else {
            if (value < 100) {
                rating = 'Excelente';
                ratingClass = 'excellent';
            } else if (value < 200) {
                rating = 'Bom';
                ratingClass = 'good';
            } else if (value < 300) {
                rating = 'Regular';
                ratingClass = 'average';
            } else {
                rating = 'Lento';
                ratingClass = 'poor';
            }
        }
        
        html += `
            <div class="test-item">
                <div class="test-name">${formatPerformanceName(metric)}</div>
                <div class="test-value">${value.toFixed(2)} ms</div>
                <div class="test-rating ${ratingClass}">${rating}</div>
            </div>
        `;
    }
    
    html += `
                </div>
            </div>
        </div>
        
        <div class="test-actions">
            <button id="runTestsAgainBtn" class="nasa-button">Executar Testes Novamente</button>
            <button id="exportTestResultsBtn" class="nasa-button secondary">Exportar Resultados</button>
        </div>
    `;
    
    // Definir HTML no container
    testContainer.innerHTML = html;
    
    // Configurar eventos
    document.getElementById('runTestsAgainBtn').addEventListener('click', runCompatibilityTests);
    document.getElementById('exportTestResultsBtn').addEventListener('click', exportTestResults);
}

// Função para calcular pontuação geral
function calculateOverallScore() {
    const featuresScore = calculateCategoryScore('features');
    const apisScore = calculateCategoryScore('apis');
    const renderingScore = calculateCategoryScore('rendering');
    
    // Média ponderada
    const overallScore = (featuresScore * 0.4) + (apisScore * 0.3) + (renderingScore * 0.3);
    
    return Math.round(overallScore);
}

// Função para calcular pontuação de categoria
function calculateCategoryScore(category) {
    if (!testResults[category] || Object.keys(testResults[category]).length === 0) {
        return 0;
    }
    
    let supportedCount = 0;
    let totalCount = 0;
    
    for (const supported of Object.values(testResults[category])) {
        if (typeof supported === 'boolean') {
            totalCount++;
            if (supported) {
                supportedCount++;
            }
        }
    }
    
    return totalCount > 0 ? Math.round((supportedCount / totalCount) * 100) : 0;
}

// Função para calcular pontuação de performance
function calculatePerformanceScore() {
    if (!testResults.performance || Object.keys(testResults.performance).length === 0) {
        return 'N/A';
    }
    
    // Pontuação baseada em tempo de inicialização e renderização
    const initScore = testResults.performance.initTime < 1000 ? 3 : (testResults.performance.initTime < 2000 ? 2 : 1);
    const renderScore = testResults.performance.renderTime < 500 ? 3 : (testResults.performance.renderTime < 1000 ? 2 : 1);
    const domScore = testResults.performance.domOperations < 50 ? 3 : (testResults.performance.domOperations < 100 ? 2 : 1);
    const arrayScore = testResults.performance.arrayOperations < 100 ? 3 : (testResults.performance.arrayOperations < 200 ? 2 : 1);
    const stringScore = testResults.performance.stringOperations < 100 ? 3 : (testResults.performance.stringOperations < 200 ? 2 : 1);
    
    // Média ponderada
    const totalScore = (initScore * 0.3) + (renderScore * 0.3) + (domScore * 0.2) + (arrayScore * 0.1) + (stringScore * 0.1);
    
    // Converter para A, B, C, D
    if (totalScore >= 2.7) return 'A';
    if (totalScore >= 2.0) return 'B';
    if (totalScore >= 1.3) return 'C';
    return 'D';
}

// Função para obter classe de pontuação geral
function getOverallScoreClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'average';
    return 'poor';
}

// Função para obter classe de pontuação de categoria
function getCategoryScoreClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'average';
    return 'poor';
}

// Função para obter classe de pontuação de performance
function getPerformanceScoreClass(score) {
    if (score === 'A') return 'excellent';
    if (score === 'B') return 'good';
    if (score === 'C') return 'average';
    return 'poor';
}

// Função para formatar nome de recurso
function formatFeatureName(feature) {
    switch (feature) {
        case 'serviceWorker': return 'Service Worker';
        case 'indexedDB': return 'IndexedDB';
        case 'cacheAPI': return 'Cache API';
        case 'localStorage': return 'Local Storage';
        case 'sessionStorage': return 'Session Storage';
        case 'geolocation': return 'Geolocation API';
        case 'fetch': return 'Fetch API';
        case 'promise': return 'Promise';
        case 'asyncAwait': return 'Async/Await';
        case 'arrowFunctions': return 'Arrow Functions';
        case 'destructuring': return 'Destructuring';
        case 'cssGrid': return 'CSS Grid';
        case 'cssFlexbox': return 'CSS Flexbox';
        case 'cssVariables': return 'CSS Variables';
        default: return feature;
    }
}

// Função para formatar nome de API
function formatApiName(api) {
    switch (api) {
        case 'canvas': return 'Canvas API';
        case 'webgl': return 'WebGL';
        case 'webAudio': return 'Web Audio API';
        case 'notifications': return 'Notification API';
        case 'vibration': return 'Vibration API';
        case 'battery': return 'Battery API';
        case 'webShare': return 'Web Share API';
        case 'paymentRequest': return 'Payment Request API';
        case 'intersectionObserver': return 'Intersection Observer';
        case 'resizeObserver': return 'Resize Observer';
        default: return api;
    }
}

// Função para formatar nome de renderização
function formatRenderingName(feature) {
    switch (feature) {
        case 'svg': return 'SVG';
        case 'webp': return 'WebP';
        case 'avif': return 'AVIF';
        case 'cssAnimations': return 'CSS Animations';
        case 'cssTransforms': return 'CSS Transforms';
        case 'cssTransitions': return 'CSS Transitions';
        case 'cssFilters': return 'CSS Filters';
        case 'cssMasks': return 'CSS Masks';
        case 'cssClipPath': return 'CSS Clip Path';
        default: return feature;
    }
}

// Função para formatar nome de performance
function formatPerformanceName(metric) {
    switch (metric) {
        case 'initTime': return 'Tempo de Inicialização';
        case 'renderTime': return 'Tempo de Renderização';
        case 'domOperations': return 'Operações DOM';
        case 'arrayOperations': return 'Operações de Array';
        case 'stringOperations': return 'Operações de String';
        default: return metric;
    }
}

// Função para exportar resultados dos testes
function exportTestResults() {
    console.log('Exportando resultados dos testes...');
    
    // Criar conteúdo do relatório
    const reportContent = `
        # Relatório de Compatibilidade do Navegador
        
        ## Informações do Navegador
        - Navegador: ${browserInfo.name} ${browserInfo.version}
        - Sistema Operacional: ${browserInfo.os}
        - Idioma: ${browserInfo.language}
        - Cookies Habilitados: ${browserInfo.cookiesEnabled ? 'Sim' : 'Não'}
        - Online: ${browserInfo.onLine ? 'Sim' : 'Não'}
        - Tela Sensível ao Toque: ${browserInfo.touchScreen ? 'Sim' : 'Não'}
        - Resolução de Tela: ${browserInfo.screenWidth}x${browserInfo.screenHeight}
        - Pixel Ratio: ${browserInfo.pixelRatio}
        - User Agent: ${browserInfo.userAgent}
        
        ## Pontuação Geral: ${calculateOverallScore()}%
        
        ## Recursos (${calculateCategoryScore('features')}%)
        ${Object.entries(testResults.features).map(([feature, supported]) => 
            `- ${formatFeatureName(feature)}: ${supported ? 'Suportado' : 'Não Suportado'}`
        ).join('\n')}
        
        ## APIs (${calculateCategoryScore('apis')}%)
        ${Object.entries(testResults.apis).map(([api, supported]) => 
            `- ${formatApiName(api)}: ${supported ? 'Suportado' : 'Não Suportado'}`
        ).join('\n')}
        
        ## Renderização (${calculateCategoryScore('rendering')}%)
        ${Object.entries(testResults.rendering).map(([feature, supported]) => 
            `- ${formatRenderingName(feature)}: ${supported ? 'Suportado' : 'Não Suportado'}`
        ).join('\n')}
        
        ## Performance (${calculatePerformanceScore()})
        ${Object.entries(testResults.performance).map(([metric, value]) => 
            `- ${formatPerformanceName(metric)}: ${value.toFixed(2)} ms`
        ).join('\n')}
        
        ---
        Relatório gerado por AgroDecision PWA em ${new Date().toLocaleString('pt-BR')}
    `;
    
    // Criar blob e link para download
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Compatibilidade_${browserInfo.name}_${browserInfo.version}.md`;
    
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
window.initTests = initTests;
window.runCompatibilityTests = runCompatibilityTests;
window.exportTestResults = exportTestResults;
