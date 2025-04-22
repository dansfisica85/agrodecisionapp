// Gerenciamento de notícias regionais
let newsCache = {};
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos em milissegundos

// Carregar tela de notícias
function loadNews(forceRefresh = false) {
  const content = document.getElementById('content');
  
  // Mostrar tela de carregamento
  content.innerHTML = `
    <div class="news-container animate__animated animate__fadeIn">
      <div class="news-header">
        <h2>Notícias Regionais</h2>
        <p id="regionTitle">Carregando notícias...</p>
      </div>
      
      <div class="news-grid" id="newsGrid">
        <div class="loading-spinner">
          <div class="loader"></div>
          <p>Buscando notícias...</p>
        </div>
      </div>
    </div>
  `;
  
  // Atualizar título da região
  const regionTitle = document.getElementById('regionTitle');
  if (selectedRegion) {
    regionTitle.textContent = `Notícias da região: ${selectedRegion}`;
  } else {
    regionTitle.textContent = 'Selecione uma região no mapa para ver notícias específicas';
  }
  
  // Verificar se precisamos buscar novas notícias
  const currentTime = Date.now();
  const regionKey = selectedRegion || 'brasil';
  const needsFetch = forceRefresh || 
                    !newsCache[regionKey] || 
                    (currentTime - lastFetchTime > CACHE_DURATION);
  
  if (needsFetch) {
    // Buscar notícias da API
    fetchNews(regionKey);
  } else {
    // Usar cache
    displayNews(newsCache[regionKey]);
  }
}

// Buscar notícias da API
async function fetchNews(region) {
  const newsGrid = document.getElementById('newsGrid');
  
  try {
    // Termos de busca baseados na região
    const searchTerms = getSearchTermsByRegion(region);
    
    // Usar NewsAPI para buscar notícias
    // Nota: Em um ambiente de produção, isso seria feito através de um backend
    // para proteger a chave da API
    const apiKey = '4a90f0f2d4f3485d9a9e9a7c8c79f8c0'; // Chave de exemplo, substituir por uma real
    const url = `https://newsapi.org/v2/everything?q=${searchTerms}&language=pt&sortBy=publishedAt&apiKey=${apiKey}`;
    
    // Simular resposta da API para desenvolvimento
    // Em produção, isso seria substituído por um fetch real
    const newsData = await simulateNewsApiResponse(region);
    
    // Armazenar no cache
    newsCache[region] = newsData;
    lastFetchTime = Date.now();
    
    // Exibir notícias
    displayNews(newsData);
    
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    
    // Exibir mensagem de erro
    newsGrid.innerHTML = `
      <div class="error-message">
        <div class="error-icon">❌</div>
        <p>Não foi possível carregar as notícias. Tente novamente mais tarde.</p>
        <button class="modern-button" onclick="loadNews(true)">
          <span class="button-text">Tentar Novamente</span>
          <div class="button-icon">🔄</div>
        </button>
      </div>
    `;
  }
}

// Exibir notícias na interface
function displayNews(newsData) {
  const newsGrid = document.getElementById('newsGrid');
  
  if (!newsData || newsData.articles.length === 0) {
    // Sem notícias
    newsGrid.innerHTML = `
      <div class="empty-news">
        <div class="empty-icon">📰</div>
        <p>Nenhuma notícia encontrada para esta região.</p>
      </div>
    `;
    return;
  }
  
  // Criar cards de notícias
  const newsCards = newsData.articles.map(article => {
    // Formatar data
    const publishedDate = new Date(article.publishedAt);
    const formattedDate = publishedDate.toLocaleDateString('pt-BR');
    
    // Criar card
    return `
      <div class="news-card animate__animated animate__fadeIn">
        ${article.urlToImage ? 
          `<img src="${article.urlToImage}" alt="${article.title}" class="news-image">` : 
          `<div class="news-image-placeholder">
            <span class="material-icons">image</span>
          </div>`
        }
        <div class="news-content">
          <div class="news-source">
            <span>${article.source.name || 'Fonte desconhecida'}</span>
            <span class="news-date">${formattedDate}</span>
          </div>
          <h3 class="news-title">${article.title}</h3>
          <p class="news-description">${article.description || 'Sem descrição disponível'}</p>
          <a href="${article.url}" class="news-link" target="_blank" rel="noopener noreferrer">Ler mais</a>
        </div>
      </div>
    `;
  }).join('');
  
  // Atualizar grid de notícias
  newsGrid.innerHTML = newsCards;
  
  // Adicionar evento para salvar notícias offline
  const newsLinks = document.querySelectorAll('.news-link');
  newsLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Se estiver offline, prevenir navegação e mostrar mensagem
      if (!navigator.onLine) {
        e.preventDefault();
        alert('Você está offline. Esta notícia não está disponível no momento.');
      }
      
      // Salvar URL no histórico de leitura
      saveToReadingHistory(link.href, link.closest('.news-card').querySelector('.news-title').textContent);
    });
  });
}

// Obter termos de busca baseados na região
function getSearchTermsByRegion(region) {
  const searchTerms = {
    'Centro-Oeste': 'agricultura+centro+oeste+brasil+soja+milho',
    'Sul': 'agricultura+sul+brasil+trigo+arroz',
    'Sudeste': 'agricultura+sudeste+brasil+café+laranja',
    'Nordeste': 'agricultura+nordeste+brasil+frutas+cacau',
    'Norte': 'agricultura+norte+brasil+amazônia+mandioca',
    'MATOPIBA': 'agricultura+matopiba+brasil+fronteira+agrícola',
    'brasil': 'agricultura+brasil+produção+rural'
  };
  
  return searchTerms[region] || searchTerms['brasil'];
}

// Salvar URL no histórico de leitura
function saveToReadingHistory(url, title) {
  // Obter histórico existente
  let readingHistory = JSON.parse(localStorage.getItem('readingHistory') || '[]');
  
  // Adicionar novo item
  readingHistory.unshift({
    url,
    title,
    timestamp: Date.now()
  });
  
  // Limitar a 50 itens
  if (readingHistory.length > 50) {
    readingHistory = readingHistory.slice(0, 50);
  }
  
  // Salvar no localStorage
  localStorage.setItem('readingHistory', JSON.stringify(readingHistory));
}

// Simular resposta da API de notícias para desenvolvimento
// Em produção, isso seria substituído por uma chamada real à API
async function simulateNewsApiResponse(region) {
  // Simular atraso de rede
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Notícias simuladas por região
  const newsData = {
    'Centro-Oeste': {
      status: 'ok',
      totalResults: 5,
      articles: [
        {
          source: { id: 'globo', name: 'G1' },
          author: 'Redação G1',
          title: 'Produção de soja no Centro-Oeste deve crescer 5% na próxima safra',
          description: 'Estimativas apontam para uma colheita recorde na região, impulsionada por condições climáticas favoráveis e avanços tecnológicos.',
          url: 'https://example.com/news1',
          urlToImage: 'https://via.placeholder.com/400x200?text=Soja+Centro-Oeste',
          publishedAt: '2025-04-20T10:30:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'canal-rural', name: 'Canal Rural' },
          author: 'Equipe Canal Rural',
          title: 'Mato Grosso lidera uso de tecnologias de precisão na agricultura',
          description: 'Estado se destaca na adoção de drones, sensores e sistemas de irrigação inteligente para aumentar produtividade.',
          url: 'https://example.com/news2',
          urlToImage: 'https://via.placeholder.com/400x200?text=Tecnologia+Agrícola',
          publishedAt: '2025-04-19T14:15:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'embrapa', name: 'Embrapa' },
          author: 'Comunicação Embrapa',
          title: 'Novo sistema de rotação de culturas aumenta produtividade no Cerrado',
          description: 'Pesquisa da Embrapa comprova benefícios da integração lavoura-pecuária-floresta para recuperação de solos degradados.',
          url: 'https://example.com/news3',
          urlToImage: 'https://via.placeholder.com/400x200?text=Rotação+Culturas',
          publishedAt: '2025-04-18T09:45:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'agronegocio', name: 'Portal do Agronegócio' },
          author: 'Redação',
          title: 'Goiás amplia área de plantio de milho safrinha em 12%',
          description: 'Crescimento é impulsionado por bons preços e condições climáticas favoráveis para o cultivo do cereal.',
          url: 'https://example.com/news4',
          urlToImage: 'https://via.placeholder.com/400x200?text=Milho+Goiás',
          publishedAt: '2025-04-17T16:20:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'agrolink', name: 'Agrolink' },
          author: 'Equipe Agrolink',
          title: 'Produtores do Centro-Oeste investem em energia solar para reduzir custos',
          description: 'Fazendas da região estão instalando painéis solares para diminuir gastos com energia elétrica e tornar a produção mais sustentável.',
          url: 'https://example.com/news5',
          urlToImage: 'https://via.placeholder.com/400x200?text=Energia+Solar+Fazendas',
          publishedAt: '2025-04-16T11:10:00Z',
          content: 'Conteúdo completo da notícia...'
        }
      ]
    },
    'Sul': {
      status: 'ok',
      totalResults: 5,
      articles: [
        {
          source: { id: 'gazeta-do-povo', name: 'Gazeta do Povo' },
          author: 'Redação',
          title: 'Paraná deve ter safra recorde de trigo em 2025',
          description: 'Estado consolida posição como maior produtor nacional do cereal, com estimativa de colheita 15% superior à do ano anterior.',
          url: 'https://example.com/news6',
          urlToImage: 'https://via.placeholder.com/400x200?text=Trigo+Paraná',
          publishedAt: '2025-04-20T08:40:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'zero-hora', name: 'Zero Hora' },
          author: 'Equipe ZH',
          title: 'Rio Grande do Sul amplia área de arroz orgânico',
          description: 'Produtores gaúchos apostam na produção sem agrotóxicos para atender mercado crescente de alimentos orgânicos.',
          url: 'https://example.com/news7',
          urlToImage: 'https://via.placeholder.com/400x200?text=Arroz+Orgânico+RS',
          publishedAt: '2025-04-19T13:25:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'epagri', name: 'Epagri' },
          author: 'Comunicação Epagri',
          title: 'Santa Catarina desenvolve nova variedade de maçã resistente a pragas',
          description: 'Pesquisadores catarinenses criam cultivar que reduz necessidade de defensivos e se adapta melhor às mudanças climáticas.',
          url: 'https://example.com/news8',
          urlToImage: 'https://via.placeholder.com/400x200?text=Maçã+SC',
          publishedAt: '2025-04-18T15:50:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'canal-rural', name: 'Canal Rural' },
          author: 'Equipe Canal Rural',
          title: 'Produtores do Sul adotam sistema de plantio direto para conservação do solo',
          description: 'Técnica reduz erosão e melhora qualidade do solo, garantindo sustentabilidade da produção agrícola na região.',
          url: 'https://example.com/news9',
          urlToImage: 'https://via.placeholder.com/400x200?text=Plantio+Direto',
          publishedAt: '2025-04-17T10:15:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'embrapa', name: 'Embrapa' },
          author: 'Comunicação Embrapa',
          title: 'Integração lavoura-pecuária ganha força no Paraná',
          description: 'Sistema que combina produção de grãos e criação de gado na mesma área aumenta rentabilidade das propriedades.',
          url: 'https://example.com/news10',
          urlToImage: 'https://via.placeholder.com/400x200?text=Integração+Lavoura+Pecuária',
          publishedAt: '2025-04-16T09:30:00Z',
          content: 'Conteúdo completo da notícia...'
        }
      ]
    },
    'Sudeste': {
      status: 'ok',
      totalResults: 5,
      articles: [
        {
          source: { id: 'globo-rural', name: 'Globo Rural' },
          author: 'Redação',
          title: 'Cafeicultores de Minas Gerais investem em variedades especiais',
          description: 'Produtores apostam em cafés gourmet e certificações de origem para agregar valor à produção e conquistar mercados internacionais.',
          url: 'https://example.com/news11',
          urlToImage: 'https://via.placeholder.com/400x200?text=Café+Especial+MG',
          publishedAt: '2025-04-20T11:20:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'estado', name: 'O Estado de S. Paulo' },
          author: 'Equipe Estadão',
          title: 'São Paulo amplia produção de cana-de-açúcar para etanol de segunda geração',
          description: 'Estado investe em tecnologia para produzir biocombustível a partir de resíduos da cana, aumentando eficiência energética.',
          url: 'https://example.com/news12',
          urlToImage: 'https://via.placeholder.com/400x200?text=Etanol+2G',
          publishedAt: '2025-04-19T14:45:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'folha', name: 'Folha de S.Paulo' },
          author: 'Redação Folha',
          title: 'Produtores de laranja do interior paulista enfrentam nova praga',
          description: 'Citricultores buscam soluções para combater inseto que ameaça produção de suco, principal produto de exportação do setor.',
          url: 'https://example.com/news13',
          urlToImage: 'https://via.placeholder.com/400x200?text=Laranja+SP',
          publishedAt: '2025-04-18T09:10:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'canal-rural', name: 'Canal Rural' },
          author: 'Equipe Canal Rural',
          title: 'Espírito Santo se destaca na produção de café conilon',
          description: 'Estado é referência nacional no cultivo da variedade, utilizada principalmente na produção de café solúvel e blends.',
          url: 'https://example.com/news14',
          urlToImage: 'https://via.placeholder.com/400x200?text=Café+Conilon+ES',
          publishedAt: '2025-04-17T16:30:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'embrapa', name: 'Embrapa' },
          author: 'Comunicação Embrapa',
          title: 'Produtores do Sudeste adotam técnicas de agricultura de precisão',
          description: 'Uso de GPS, drones e sensores permite aplicação localizada de insumos, reduzindo custos e impacto ambiental.',
          url: 'https://example.com/news15',
          urlToImage: 'https://via.placeholder.com/400x200?text=Agricultura+Precisão',
          publishedAt: '2025-04-16T10:50:00Z',
          content: 'Conteúdo completo da notícia...'
        }
      ]
    },
    'Nordeste': {
      status: 'ok',
      totalResults: 5,
      articles: [
        {
          source: { id: 'globo', name: 'G1' },
          author: 'Redação G1',
          title: 'Bahia se consolida como maior produtor de frutas do Nordeste',
          description: 'Estado lidera produção de manga, mamão e banana na região, com foco em exportação para mercados europeus e asiáticos.',
          url: 'https://example.com/news16',
          urlToImage: 'https://via.placeholder.com/400x200?text=Frutas+Bahia',
          publishedAt: '2025-04-20T09:15:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'diario-do-nordeste', name: 'Diário do Nordeste' },
          author: 'Redação',
          title: 'Ceará investe em dessalinização para irrigação agrícola',
          description: 'Projeto piloto utiliza energia solar para dessalinizar água do mar e viabilizar produção de hortaliças em regiões semiáridas.',
          url: 'https://example.com/news17',
          urlToImage: 'https://via.placeholder.com/400x200?text=Dessalinização+CE',
          publishedAt: '2025-04-19T11:40:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'canal-rural', name: 'Canal Rural' },
          author: 'Equipe Canal Rural',
          title: 'Produção de cacau no sul da Bahia retoma crescimento',
          description: 'Região tradicional na cultura do cacau supera crise da vassoura-de-bruxa e aposta em variedades resistentes e chocolate premium.',
          url: 'https://example.com/news18',
          urlToImage: 'https://via.placeholder.com/400x200?text=Cacau+Bahia',
          publishedAt: '2025-04-18T14:25:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'embrapa', name: 'Embrapa' },
          author: 'Comunicação Embrapa',
          title: 'Agricultores do semiárido adotam técnicas de convivência com a seca',
          description: 'Cisternas, barragens subterrâneas e cultivos adaptados garantem produção mesmo em períodos de estiagem prolongada.',
          url: 'https://example.com/news19',
          urlToImage: 'https://via.placeholder.com/400x200?text=Convivência+Seca',
          publishedAt: '2025-04-17T10:30:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'folha', name: 'Folha de S.Paulo' },
          author: 'Redação Folha',
          title: 'Vale do São Francisco bate recorde na exportação de uvas',
          description: 'Região entre Pernambuco e Bahia se destaca na produção de uvas de mesa e vinhos, com duas safras anuais.',
          url: 'https://example.com/news20',
          urlToImage: 'https://via.placeholder.com/400x200?text=Uvas+São+Francisco',
          publishedAt: '2025-04-16T13:20:00Z',
          content: 'Conteúdo completo da notícia...'
        }
      ]
    },
    'Norte': {
      status: 'ok',
      totalResults: 5,
      articles: [
        {
          source: { id: 'globo', name: 'G1' },
          author: 'Redação G1',
          title: 'Produção de açaí no Pará cresce 20% e bate recorde',
          description: 'Estado é responsável por 95% da produção nacional do fruto, que ganha cada vez mais mercados internacionais.',
          url: 'https://example.com/news21',
          urlToImage: 'https://via.placeholder.com/400x200?text=Açaí+Pará',
          publishedAt: '2025-04-20T10:45:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'embrapa', name: 'Embrapa' },
          author: 'Comunicação Embrapa',
          title: 'Sistemas agroflorestais ganham espaço na Amazônia',
          description: 'Modelo que combina árvores nativas com culturas agrícolas preserva floresta e gera renda para produtores locais.',
          url: 'https://example.com/news22',
          urlToImage: 'https://via.placeholder.com/400x200?text=Agrofloresta+Amazônia',
          publishedAt: '2025-04-19T09:30:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'canal-rural', name: 'Canal Rural' },
          author: 'Equipe Canal Rural',
          title: 'Rondônia se destaca na produção de café robusta',
          description: 'Estado é o segundo maior produtor nacional da variedade, com foco em qualidade e sustentabilidade.',
          url: 'https://example.com/news23',
          urlToImage: 'https://via.placeholder.com/400x200?text=Café+Rondônia',
          publishedAt: '2025-04-18T15:10:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'folha', name: 'Folha de S.Paulo' },
          author: 'Redação Folha',
          title: 'Mandioca gera renda para pequenos produtores do Amazonas',
          description: 'Cultivo tradicional da região é base para produção de farinha e outros derivados, garantindo segurança alimentar e comercialização.',
          url: 'https://example.com/news24',
          urlToImage: 'https://via.placeholder.com/400x200?text=Mandioca+Amazonas',
          publishedAt: '2025-04-17T11:55:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'globo-rural', name: 'Globo Rural' },
          author: 'Redação',
          title: 'Castanha-do-pará tem safra recorde com manejo sustentável',
          description: 'Extrativistas da Amazônia aumentam produção sem danos à floresta, fortalecendo economia local e preservação ambiental.',
          url: 'https://example.com/news25',
          urlToImage: 'https://via.placeholder.com/400x200?text=Castanha+Pará',
          publishedAt: '2025-04-16T14:40:00Z',
          content: 'Conteúdo completo da notícia...'
        }
      ]
    },
    'MATOPIBA': {
      status: 'ok',
      totalResults: 5,
      articles: [
        {
          source: { id: 'globo-rural', name: 'Globo Rural' },
          author: 'Redação',
          title: 'MATOPIBA se consolida como nova fronteira agrícola do Brasil',
          description: 'Região que abrange Maranhão, Tocantins, Piauí e Bahia já responde por 15% da produção nacional de grãos.',
          url: 'https://example.com/news26',
          urlToImage: 'https://via.placeholder.com/400x200?text=MATOPIBA+Fronteira',
          publishedAt: '2025-04-20T09:50:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'estado', name: 'O Estado de S. Paulo' },
          author: 'Equipe Estadão',
          title: 'Tocantins amplia área irrigada para produção de arroz',
          description: 'Estado investe em infraestrutura hídrica para expandir cultivo do cereal e garantir duas safras anuais.',
          url: 'https://example.com/news27',
          urlToImage: 'https://via.placeholder.com/400x200?text=Arroz+Tocantins',
          publishedAt: '2025-04-19T13:15:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'canal-rural', name: 'Canal Rural' },
          author: 'Equipe Canal Rural',
          title: 'Oeste da Bahia bate recorde na produção de algodão',
          description: 'Região se destaca pela alta produtividade e qualidade da fibra, conquistando mercados internacionais exigentes.',
          url: 'https://example.com/news28',
          urlToImage: 'https://via.placeholder.com/400x200?text=Algodão+Bahia',
          publishedAt: '2025-04-18T10:20:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'embrapa', name: 'Embrapa' },
          author: 'Comunicação Embrapa',
          title: 'Piauí desenvolve variedades de soja adaptadas ao Cerrado',
          description: 'Pesquisas buscam cultivares mais resistentes ao calor e com ciclo mais curto para as condições específicas da região.',
          url: 'https://example.com/news29',
          urlToImage: 'https://via.placeholder.com/400x200?text=Soja+Piauí',
          publishedAt: '2025-04-17T15:35:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'folha', name: 'Folha de S.Paulo' },
          author: 'Redação Folha',
          title: 'Sul do Maranhão atrai investimentos em armazenagem de grãos',
          description: 'Região recebe novos silos e estruturas logísticas para dar suporte ao crescimento da produção agrícola.',
          url: 'https://example.com/news30',
          urlToImage: 'https://via.placeholder.com/400x200?text=Armazenagem+Maranhão',
          publishedAt: '2025-04-16T11:25:00Z',
          content: 'Conteúdo completo da notícia...'
        }
      ]
    },
    'brasil': {
      status: 'ok',
      totalResults: 5,
      articles: [
        {
          source: { id: 'globo', name: 'G1' },
          author: 'Redação G1',
          title: 'Brasil deve bater recorde na produção de grãos em 2025',
          description: 'Estimativa aponta para colheita de 310 milhões de toneladas, impulsionada por soja, milho e algodão.',
          url: 'https://example.com/news31',
          urlToImage: 'https://via.placeholder.com/400x200?text=Safra+Brasil',
          publishedAt: '2025-04-20T08:30:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'estado', name: 'O Estado de S. Paulo' },
          author: 'Equipe Estadão',
          title: 'Exportações do agronegócio brasileiro crescem 12% no primeiro trimestre',
          description: 'Soja, carnes e produtos florestais lideram vendas externas, com China como principal destino.',
          url: 'https://example.com/news32',
          urlToImage: 'https://via.placeholder.com/400x200?text=Exportações+Agro',
          publishedAt: '2025-04-19T10:45:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'embrapa', name: 'Embrapa' },
          author: 'Comunicação Embrapa',
          title: 'Agricultura de baixo carbono avança no Brasil',
          description: 'Práticas sustentáveis como plantio direto e integração lavoura-pecuária-floresta ganham espaço entre produtores.',
          url: 'https://example.com/news33',
          urlToImage: 'https://via.placeholder.com/400x200?text=Agricultura+Baixo+Carbono',
          publishedAt: '2025-04-18T14:20:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'canal-rural', name: 'Canal Rural' },
          author: 'Equipe Canal Rural',
          title: 'Pequenos produtores aumentam participação no mercado de orgânicos',
          description: 'Agricultura familiar responde por 70% da produção orgânica nacional, com destaque para hortaliças e frutas.',
          url: 'https://example.com/news34',
          urlToImage: 'https://via.placeholder.com/400x200?text=Orgânicos+Brasil',
          publishedAt: '2025-04-17T09:15:00Z',
          content: 'Conteúdo completo da notícia...'
        },
        {
          source: { id: 'folha', name: 'Folha de S.Paulo' },
          author: 'Redação Folha',
          title: 'Brasil investe em tecnologia para monitoramento climático na agricultura',
          description: 'Sistema integra dados de satélites e estações meteorológicas para prever condições e orientar produtores rurais.',
          url: 'https://example.com/news35',
          urlToImage: 'https://via.placeholder.com/400x200?text=Monitoramento+Clima',
          publishedAt: '2025-04-16T12:50:00Z',
          content: 'Conteúdo completo da notícia...'
        }
      ]
    }
  };
  
  // Retornar dados da região solicitada ou do Brasil como padrão
  return newsData[region] || newsData['brasil'];
}

// Expor funções globalmente
window.loadNews = loadNews;
