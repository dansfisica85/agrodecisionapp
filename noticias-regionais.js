// Arquivo JavaScript para integração com APIs de notícias regionais

// Variáveis globais
let currentNewsPage = 1;
let newsPerPage = 6;
let currentNewsCategory = 'all';
let newsCache = {};

// Inicializar a seção de notícias
function initNoticiasSection() {
    console.log('Inicializando seção de notícias regionais...');
    
    // Verificar se há localização selecionada
    if (!window.currentLocation) {
        const noticiasContainer = document.querySelector('#noticiasContainer');
        if (noticiasContainer) {
            noticiasContainer.innerHTML = '<div class="noticias-loading">Selecione uma localização no mapa para ver notícias regionais</div>';
        }
        return;
    }
    
    // Carregar notícias
    loadNoticiasRegionais(window.currentLocation);
}

// Função para carregar notícias regionais
function loadNoticiasRegionais(location) {
    console.log('Carregando notícias regionais para:', location);
    
    const noticiasContainer = document.querySelector('#noticiasContainer');
    if (!noticiasContainer) {
        console.error('Container de notícias não encontrado');
        return;
    }
    
    // Mostrar carregamento
    noticiasContainer.innerHTML = '<div class="noticias-loading"><div class="data-loading-animation"><div class="data-loading-dot"></div><div class="data-loading-dot"></div><div class="data-loading-dot"></div></div><p>Carregando notícias regionais...</p></div>';
    
    // Verificar se está offline
    if (!navigator.onLine) {
        // Tentar obter notícias do cache
        const cachedNews = localStorage.getItem(`news_data_${location.lat.toFixed(2)}_${location.lng.toFixed(2)}`);
        if (cachedNews) {
            const newsData = JSON.parse(cachedNews);
            renderNoticiasRegionais(noticiasContainer, location, newsData);
            return;
        }
        
        // Mostrar mensagem offline
        noticiasContainer.innerHTML = `
            <div class="noticias-error">
                <div class="material-icons noticias-error-icon">cloud_off</div>
                <p class="noticias-error-text">Você está offline e não há dados em cache para esta localização.</p>
                <button class="noticias-error-button" onclick="loadNoticiasRegionais(window.currentLocation)">Tentar Novamente</button>
            </div>
        `;
        return;
    }
    
    // Obter notícias da API
    fetchNewsForLocation(location)
        .then(newsData => {
            // Salvar no cache
            localStorage.setItem(`news_data_${location.lat.toFixed(2)}_${location.lng.toFixed(2)}`, JSON.stringify(newsData));
            
            // Renderizar notícias
            renderNoticiasRegionais(noticiasContainer, location, newsData);
        })
        .catch(error => {
            console.error('Erro ao obter notícias:', error);
            
            // Mostrar erro
            noticiasContainer.innerHTML = `
                <div class="noticias-error">
                    <div class="material-icons noticias-error-icon">error</div>
                    <p class="noticias-error-text">Erro ao carregar notícias. Tente novamente mais tarde.</p>
                    <button class="noticias-error-button" onclick="loadNoticiasRegionais(window.currentLocation)">Tentar Novamente</button>
                </div>
            `;
            
            // Mostrar notificação
            if (typeof window.animateNotification === 'function') {
                window.animateNotification('Erro ao carregar notícias regionais. Verifique sua conexão.', 'error');
            }
        });
}

// Função para buscar notícias para uma localização
async function fetchNewsForLocation(location) {
    // Verificar se já temos no cache em memória
    const cacheKey = `${location.lat.toFixed(2)}_${location.lng.toFixed(2)}`;
    if (newsCache[cacheKey]) {
        return newsCache[cacheKey];
    }
    
    // Obter nome da localização para busca
    let searchTerm = location.name;
    
    // Se o nome contém vírgula, pegar apenas a primeira parte (cidade)
    if (searchTerm && searchTerm.includes(',')) {
        searchTerm = searchTerm.split(',')[0].trim();
    }
    
    // Se não temos nome, usar coordenadas para buscar estado/região
    if (!searchTerm || searchTerm.includes('.')) {
        // Tentar obter estado/região com base nas coordenadas
        try {
            const regionName = await getRegionFromCoordinates(location.lat, location.lng);
            if (regionName) {
                searchTerm = regionName;
            } else {
                // Fallback para "Brasil" se não conseguir determinar a região
                searchTerm = "Brasil";
            }
        } catch (error) {
            console.error('Erro ao obter região:', error);
            searchTerm = "Brasil";
        }
    }
    
    // Tentar usar API de notícias
    try {
        // Usar API do Gnews (versão gratuita)
        const apiKey = 'f40c31f3a2e5dbedbfd2f5b73f4c6ef0'; // Chave de exemplo, deve ser substituída por uma chave válida
        const apiUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(searchTerm + " agricultura")}&lang=pt&country=br&max=10&apikey=${apiKey}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Processar dados
        const newsData = processNewsData(data, searchTerm);
        
        // Salvar no cache em memória
        newsCache[cacheKey] = newsData;
        
        return newsData;
    } catch (error) {
        console.error('Erro ao obter notícias da API:', error);
        
        // Usar dados simulados como fallback
        return getMockNewsData(searchTerm);
    }
}

// Função para obter região a partir de coordenadas
async function getRegionFromCoordinates(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=6&accept-language=pt-BR`);
        
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Tentar obter estado
        if (data.address && data.address.state) {
            return data.address.state;
        }
        
        // Tentar obter país
        if (data.address && data.address.country) {
            return data.address.country;
        }
        
        return null;
    } catch (error) {
        console.error('Erro ao obter região:', error);
        return null;
    }
}

// Função para processar dados de notícias
function processNewsData(data, searchTerm) {
    // Verificar se os dados são válidos
    if (!data || !data.articles || !Array.isArray(data.articles)) {
        throw new Error('Dados de notícias inválidos');
    }
    
    // Extrair categorias
    const categories = ['Agricultura', 'Clima', 'Mercado', 'Tecnologia', 'Sustentabilidade'];
    
    // Processar artigos
    const articles = data.articles.map(article => {
        // Determinar categoria com base no título e descrição
        let category = 'Geral';
        const content = (article.title + ' ' + article.description).toLowerCase();
        
        if (content.includes('clima') || content.includes('chuva') || content.includes('temperatura') || content.includes('seca')) {
            category = 'Clima';
        } else if (content.includes('preço') || content.includes('mercado') || content.includes('exportação') || content.includes('comércio')) {
            category = 'Mercado';
        } else if (content.includes('tecnologia') || content.includes('digital') || content.includes('inovação') || content.includes('app')) {
            category = 'Tecnologia';
        } else if (content.includes('sustentável') || content.includes('orgânico') || content.includes('meio ambiente') || content.includes('carbono')) {
            category = 'Sustentabilidade';
        } else {
            category = 'Agricultura';
        }
        
        // Extrair fonte
        const source = article.source ? article.source.name : 'Fonte Desconhecida';
        
        // Formatar data
        const publishedDate = new Date(article.publishedAt);
        const formattedDate = publishedDate.toLocaleDateString('pt-BR');
        
        return {
            title: article.title,
            description: article.description || 'Sem descrição disponível',
            source: source,
            date: formattedDate,
            category: category,
            url: article.url,
            image: article.image || 'https://via.placeholder.com/300x200?text=Sem+Imagem'
        };
    });
    
    return {
        searchTerm: searchTerm,
        categories: categories,
        articles: articles
    };
}

// Função para obter dados simulados de notícias
function getMockNewsData(searchTerm) {
    console.log('Usando dados simulados de notícias para:', searchTerm);
    
    // Categorias
    const categories = ['Agricultura', 'Clima', 'Mercado', 'Tecnologia', 'Sustentabilidade'];
    
    // Fontes
    const sources = ['Globo Rural', 'Canal Rural', 'Embrapa', 'Agrolink', 'Notícias Agrícolas'];
    
    // Gerar artigos simulados
    const articles = [];
    for (let i = 0; i < 10; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const source = sources[Math.floor(Math.random() * sources.length)];
        
        // Gerar data aleatória nos últimos 30 dias
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        const formattedDate = date.toLocaleDateString('pt-BR');
        
        // Gerar título baseado na categoria e região
        let title = '';
        switch (category) {
            case 'Agricultura':
                title = `Produtores de ${searchTerm} investem em novas técnicas de plantio`;
                break;
            case 'Clima':
                title = `Previsão de chuvas acima da média beneficia agricultores de ${searchTerm}`;
                break;
            case 'Mercado':
                title = `Preços de commodities impactam produtores rurais de ${searchTerm}`;
                break;
            case 'Tecnologia':
                title = `Novas tecnologias aumentam produtividade agrícola em ${searchTerm}`;
                break;
            case 'Sustentabilidade':
                title = `Agricultura sustentável ganha espaço entre produtores de ${searchTerm}`;
                break;
        }
        
        articles.push({
            title: title,
            description: `Esta é uma notícia simulada sobre ${category.toLowerCase()} na região de ${searchTerm}. O conteúdo aborda temas relevantes para produtores rurais locais.`,
            source: source,
            date: formattedDate,
            category: category,
            url: '#',
            image: `https://via.placeholder.com/300x200?text=${category}`
        });
    }
    
    return {
        searchTerm: searchTerm,
        categories: categories,
        articles: articles
    };
}

// Função para renderizar notícias regionais
function renderNoticiasRegionais(container, location, newsData) {
    console.log('Renderizando notícias regionais:', newsData);
    
    // Verificar se há notícias
    if (!newsData || !newsData.articles || newsData.articles.length === 0) {
        container.innerHTML = `
            <div class="noticias-empty">
                <div class="material-icons noticias-empty-icon">article</div>
                <p class="noticias-empty-text">Nenhuma notícia encontrada para esta região.</p>
                <button class="noticias-empty-button" onclick="loadNoticiasRegionais(window.currentLocation)">Tentar Novamente</button>
            </div>
        `;
        return;
    }
    
    // Criar HTML
    let html = `
        <div class="noticias-header">
            <h3>Notícias para ${location.name || newsData.searchTerm || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}</h3>
            <div class="noticias-location">
                <span class="material-icons">location_on</span>
                <span>${location.name || newsData.searchTerm || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}</span>
            </div>
        </div>
        
        <div class="noticias-filters">
            <div class="noticias-filter ${currentNewsCategory === 'all' ? 'active' : ''}" data-category="all">Todas</div>
    `;
    
    // Adicionar categorias
    if (newsData.categories && newsData.categories.length > 0) {
        newsData.categories.forEach(category => {
            html += `<div class="noticias-filter ${currentNewsCategory === category ? 'active' : ''}" data-category="${category}">${category}</div>`;
        });
    }
    
    html += `</div>`;
    
    // Filtrar notícias pela categoria atual
    let filteredArticles = newsData.articles;
    if (currentNewsCategory !== 'all') {
        filteredArticles = newsData.articles.filter(article => article.category === currentNewsCategory);
    }
    
    // Calcular paginação
    const totalPages = Math.ceil(filteredArticles.length / newsPerPage);
    const startIndex = (currentNewsPage - 1) * newsPerPage;
    const endIndex = Math.min(startIndex + newsPerPage, filteredArticles.length);
    const currentArticles = filteredArticles.slice(startIndex, endIndex);
    
    // Adicionar grid de notícias
    html += `<div class="noticias-grid list-animation">`;
    
    // Adicionar cards de notícias
    currentArticles.forEach(article => {
        html += `
            <div class="noticia-card card-hover">
                <div class="noticia-image-container">
                    <img src="${article.image}" alt="${article.title}" class="noticia-image">
                    <div class="noticia-source">${article.source}</div>
                    <div class="noticia-date">${article.date}</div>
                </div>
                <div class="noticia-content">
                    <div class="noticia-title">${article.title}</div>
                    <div class="noticia-description">${article.description}</div>
                    <div class="noticia-footer">
                        <div class="noticia-category">${article.category}</div>
                        <a href="${article.url}" target="_blank" class="noticia-link">Ler mais <span class="material-icons noticia-link-icon">arrow_forward</span></a>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    
    // Adicionar paginação se necessário
    if (totalPages > 1) {
        html += `
            <div class="noticias-pagination">
                <button class="pagination-button ${currentNewsPage === 1 ? 'disabled' : ''}" ${currentNewsPage === 1 ? 'disabled' : ''} data-page="prev"><span class="material-icons">chevron_left</span></button>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="pagination-button ${currentNewsPage === i ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        
        html += `
                <button class="pagination-button ${currentNewsPage === totalPages ? 'disabled' : ''}" ${currentNewsPage === totalPages ? 'disabled' : ''} data-page="next"><span class="material-icons">chevron_right</span></button>
            </div>
        `;
    }
    
    // Definir HTML no container
    container.innerHTML = html;
    
    // Configurar eventos para filtros
    container.querySelectorAll('.noticias-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            currentNewsCategory = category;
            currentNewsPage = 1; // Resetar para primeira página
            renderNoticiasRegionais(container, location, newsData);
        });
    });
    
    // Configurar eventos para paginação
    container.querySelectorAll('.pagination-button').forEach(button => {
        button.addEventListener('click', function() {
            if (this.disabled) return;
            
            const page = this.getAttribute('data-page');
            
            if (page === 'prev') {
                currentNewsPage--;
            } else if (page === 'next') {
                currentNewsPage++;
            } else {
                currentNewsPage = parseInt(page);
            }
            
            renderNoticiasRegionais(container, location, newsData);
            
            // Rolar para o topo da seção
            container.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// Exportar funções para uso global
window.initNoticiasSection = initNoticiasSection;
window.loadNoticiasRegionais = loadNoticiasRegionais;
