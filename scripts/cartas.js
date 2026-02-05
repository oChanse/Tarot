
function iniciarSistemaCartas() {
    const tarotGrid = document.getElementById('tarotGrid');
    const cardSearch = document.getElementById('cardSearch');
    const clearSearch = document.getElementById('clearSearch');
    const filterButtonsContainer = document.getElementById('filterButtons');
    const searchResults = document.getElementById('searchResults');
    const totalCardsElement = document.getElementById('totalCards');
    const filteredCardsElement = document.getElementById('filteredCards');
    
    const cardDetailsModal = document.getElementById('cardDetailsModal');
    const modalClose = document.getElementById('modalClose');
    const toggleOrientationBtn = document.getElementById('toggleOrientationBtn');
    const prevCardBtn = document.getElementById('prevCard');
    const nextCardBtn = document.getElementById('nextCard');
    const meaningTabs = document.querySelectorAll('.meaning-tab');
    
    let allCards = [];
    let filteredCards = [];
    let groups = new Set();
    let currentFilter = 'all';
    let searchTerm = '';
    let currentCardIndex = 0;
    let currentCard = null;
    
    let cardTags = {};
    let allTags = new Set();
    let cardElements = {};
    let cardPlanets = {};
    let cardSigns = {};
    let cardNumbers = {};
    let cardKeywords = {};
    
    let viewMode = 'grid';
    let sortOrder = 'default';
    let isStudyMode = false;
    let isComparisonOpen = false;
    let isConnectionsOpen = false;
    
    
    let studyProgress = JSON.parse(localStorage.getItem('tarot-study-progress')) || {};
    let cardComparison = JSON.parse(localStorage.getItem('tarot-comparison')) || [];
    let cardHistory = JSON.parse(localStorage.getItem('tarot-view-history')) || [];
    let userNotes = JSON.parse(localStorage.getItem('tarot-user-notes')) || {};
    let favoriteCards = JSON.parse(localStorage.getItem('tarot-favorites')) || [];
    
    init();
    
    async function init() {
        try {
            await loadCards();
            analyzeCardContent();
            setupEventListeners();
            renderFilterButtons();
            renderCards();
            updateStats();
            loadUserPreferences();
        } catch (error) {
            showError('Erro ao inicializar a biblioteca de cartas', error);
        }
    }
    
    function loadUserPreferences() {
        
        const savedViewMode = localStorage.getItem('tarot-view-mode');
        if (savedViewMode) viewMode = savedViewMode;
        
        const savedSortOrder = localStorage.getItem('tarot-sort-order');
        if (savedSortOrder) sortOrder = savedSortOrder;
        
        const savedStudyMode = localStorage.getItem('tarot-study-mode');
        if (savedStudyMode) isStudyMode = savedStudyMode === 'true';
        
        updateViewModeUI();
        updateStudyModeUI();
    }
    
    function saveUserPreferences() {
        localStorage.setItem('tarot-view-mode', viewMode);
        localStorage.setItem('tarot-sort-order', sortOrder);
        localStorage.setItem('tarot-study-mode', isStudyMode);
    }
    
    async function loadCards() {
        try {
            const response = await fetch('files/cards.json');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            allCards = await response.json();
            
            if (!Array.isArray(allCards) || allCards.length === 0) {
                throw new Error('Arquivo JSON não contém um array de cartas válido');
            }
            
            allCards.forEach(card => {
                if (card.group) {
                    groups.add(card.group);
                }
                
                cardElements[card.id] = extractElement(card);
                cardPlanets[card.id] = extractPlanet(card);
                cardSigns[card.id] = extractZodiacSign(card);
                cardNumbers[card.id] = extractCardNumber(card);
                cardKeywords[card.id] = extractKeywords(card);
            });
            
            filteredCards = [...allCards];
            
        } catch (error) {
            console.error('Erro ao carregar cartas:', error);
            throw error;
        }
    }
    
    function analyzeCardContent() {
        allCards.forEach(card => {
            const text = `${card.meaning} ${card.reversed} ${card.keywords || ''}`.toLowerCase();
            const tags = new Set();
            
            const elements = ['fogo', 'água', 'ar', 'terra', 'fire', 'water', 'air', 'earth'];
            const planets = ['sol', 'lua', 'mercúrio', 'vênus', 'marte', 'júpiter', 'saturno', 'urano', 'netuno', 'plutão'];
            const signs = ['áries', 'touro', 'gêmeos', 'câncer', 'leão', 'virgem', 'libra', 'escorpião', 'sagitário', 'capricórnio', 'aquário', 'peixes'];
            const archetypes = ['mãe', 'pai', 'criança', 'herói', 'sombra', 'anima', 'animus', 'velho sábio', 'grande mãe'];
            const themes = ['amor', 'dinheiro', 'trabalho', 'saúde', 'espiritualidade', 'transformação', 'crescimento', 'desafio'];
            
            elements.forEach(el => {
                if (text.includes(el)) tags.add(el);
            });
            
            planets.forEach(planet => {
                if (text.includes(planet)) tags.add(planet);
            });
            
            signs.forEach(sign => {
                if (text.includes(sign)) tags.add(sign);
            });
            
            archetypes.forEach(arch => {
                if (text.includes(arch)) tags.add(arch);
            });
            
            themes.forEach(theme => {
                if (text.includes(theme)) tags.add(theme);
            });
            
            cardTags[card.id] = Array.from(tags);
            tags.forEach(tag => allTags.add(tag));
        });
    }
    
    function extractElement(card) {
        const text = card.meaning.toLowerCase();
        if (text.includes('fogo') || text.includes('fire') || card.group === 'suit-wands') return 'Fogo';
        if (text.includes('água') || text.includes('water') || card.group === 'suit-cups') return 'Água';
        if (text.includes('ar') || text.includes('air') || card.group === 'suit-swords') return 'Ar';
        if (text.includes('terra') || text.includes('earth') || card.group === 'suit-pentacles') return 'Terra';
        return 'Espírito';
    }
    
    function extractPlanet(card) {
        const planets = {
            'sol': ['sol', 'sun'],
            'lua': ['lua', 'moon'],
            'mercúrio': ['mercúrio', 'mercury'],
            'vênus': ['vênus', 'venus'],
            'marte': ['marte', 'mars'],
            'júpiter': ['júpiter', 'jupiter'],
            'saturno': ['saturno', 'saturn'],
            'urano': ['urano', 'uranus'],
            'netuno': ['netuno', 'neptune'],
            'plutão': ['plutão', 'pluto']
        };
        
        const text = card.meaning.toLowerCase();
        for (const [planet, keywords] of Object.entries(planets)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return planet.charAt(0).toUpperCase() + planet.slice(1);
            }
        }
        
        return null;
    }
    
    function extractZodiacSign(card) {
        const signs = {
            'áries': ['áries', 'aries'],
            'touro': ['touro', 'taurus'],
            'gêmeos': ['gêmeos', 'gemini'],
            'câncer': ['câncer', 'cancer'],
            'leão': ['leão', 'leo'],
            'virgem': ['virgem', 'virgo'],
            'libra': ['libra'],
            'escorpião': ['escorpião', 'scorpio'],
            'sagitário': ['sagitário', 'sagittarius'],
            'capricórnio': ['capricórnio', 'capricorn'],
            'aquário': ['aquário', 'aquarius'],
            'peixes': ['peixes', 'pisces']
        };
        
        const text = card.meaning.toLowerCase();
        for (const [sign, keywords] of Object.entries(signs)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return sign.charAt(0).toUpperCase() + sign.slice(1);
            }
        }
        
        return null;
    }
    
    function extractCardNumber(card) {
        const match = card.name.match(/\d+/);
        return match ? parseInt(match[0]) : null;
    }
    
    function extractKeywords(card) {
        const text = `${card.meaning} ${card.reversed} ${card.keywords || ''}`.toLowerCase();
        const commonWords = new Set(['o', 'a', 'os', 'as', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'que', 'com', 'sem', 'é', 'são', 'como', 'mas', 'ou', 'e', 'se', 'não', 'uma', 'um']);
        
        const words = text.split(/[\s,.!?;:]+/).filter(word => 
            word.length > 3 && !commonWords.has(word)
        );
        
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });
        
        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);
    }
    
    function setupEventListeners() {
        if (cardSearch) {
            cardSearch.addEventListener('input', function(e) {
                searchTerm = e.target.value.toLowerCase().trim();
                
                if (clearSearch) {
                    clearSearch.classList.toggle('visible', searchTerm.length > 0);
                }
                
                applyFilters();
            });
        }
        
        if (clearSearch) {
            clearSearch.addEventListener('click', function() {
                if (cardSearch) cardSearch.value = '';
                searchTerm = '';
                clearSearch.classList.remove('visible');
                applyFilters();
                if (cardSearch) cardSearch.focus();
            });
        }
        
        if (modalClose) {
            modalClose.addEventListener('click', closeModal);
        }

        if (cardDetailsModal) {
            cardDetailsModal.addEventListener('click', function(e) {
                if (e.target === cardDetailsModal) {
                    closeModal();
                }
            });
        }
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (cardDetailsModal && cardDetailsModal.style.display === 'flex') {
                    closeModal();
                }
                if (isComparisonOpen) {
                    closeComparisonModal();
                }
                if (isConnectionsOpen) {
                    closeConnectionsModal();
                }
            }
            
            if (e.key === 'ArrowLeft' && cardDetailsModal && cardDetailsModal.style.display === 'flex') {
                showPreviousCard();
            }
            
            if (e.key === 'ArrowRight' && cardDetailsModal && cardDetailsModal.style.display === 'flex') {
                showNextCard();
            }
            
            if (e.key === 'r' || e.key === 'R') {
                if (cardDetailsModal && cardDetailsModal.style.display === 'flex') {
                    toggleCardOrientation();
                }
            }
        });
        
        if (toggleOrientationBtn) {
            toggleOrientationBtn.addEventListener('click', toggleCardOrientation);
        }
        
        if (prevCardBtn) {
            prevCardBtn.addEventListener('click', showPreviousCard);
        }

        if (nextCardBtn) {
            nextCardBtn.addEventListener('click', showNextCard);
        }
        
        if (meaningTabs) {
            meaningTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    const meaningType = this.getAttribute('data-meaning');
                    showMeaningTab(meaningType);
                });
            });
        }
        
        
        document.addEventListener('click', function(e) {
            const tagsPanel = document.querySelector('.tags-floating-panel');
            const advancedPanel = document.querySelector('.advanced-floating-panel');
            
            if (tagsPanel && !tagsPanel.contains(e.target) && !e.target.closest('.tags-toggle')) {
                tagsPanel.classList.remove('active');
            }
            
            if (advancedPanel && !advancedPanel.contains(e.target) && !e.target.closest('.advanced-toggle')) {
                advancedPanel.classList.remove('active');
            }
        });
    }
    
    function renderFilterButtons() {
        if (!filterButtonsContainer) return;

        const allButton = filterButtonsContainer.querySelector('[data-filter="all"]');
        filterButtonsContainer.innerHTML = '';
        if (allButton) filterButtonsContainer.appendChild(allButton);
        
        Array.from(groups).sort().forEach(group => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.dataset.filter = group;
            button.textContent = formatGroupName(group);
            filterButtonsContainer.appendChild(button);
        });
        
        if (Array.from(allTags).length > 0) {
            const tagsButton = document.createElement('button');
            tagsButton.className = 'filter-btn tags-toggle';
            tagsButton.innerHTML = '<i class="fas fa-tags"></i> Tags';
            tagsButton.addEventListener('click', toggleTagsPanel);
            filterButtonsContainer.appendChild(tagsButton);
        }
        
        const advancedButton = document.createElement('button');
        advancedButton.className = 'filter-btn advanced-toggle';
        advancedButton.innerHTML = '<i class="fas fa-sliders-h"></i> Avançado';
        advancedButton.addEventListener('click', toggleAdvancedPanel);
        filterButtonsContainer.appendChild(advancedButton);
        
        document.querySelectorAll('.filter-btn:not(.tags-toggle):not(.advanced-toggle)').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn:not(.tags-toggle):not(.advanced-toggle)').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                applyFilters();
            });
        });
    }
    
    function toggleTagsPanel() {
        const existingPanel = document.querySelector('.tags-floating-panel');
        const advancedPanel = document.querySelector('.advanced-floating-panel');
        
        if (advancedPanel) {
            advancedPanel.classList.remove('active');
        }
        
        if (existingPanel) {
            existingPanel.classList.toggle('active');
            return;
        }
        
        const panel = document.createElement('div');
        panel.className = 'tags-floating-panel';
        panel.innerHTML = `
            <div class="floating-panel-header">
                <h4><i class="fas fa-tags"></i> Tags das Cartas</h4>
                <button class="close-floating-panel"><i class="fas fa-times"></i></button>
            </div>
            <div class="floating-panel-content">
                <div class="tags-search">
                    <input type="text" class="tags-search-input" placeholder="Buscar tags...">
                </div>
                <div class="tags-container scrollable">
                    ${Array.from(allTags).sort().map(tag => `
                        <span class="card-tag filter-tag" data-tag="${tag}">${tag}</span>
                    `).join('')}
                </div>
                <div class="floating-panel-footer">
                    <button class="clear-tags-filter">Limpar Filtro de Tags</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        panel.querySelector('.close-floating-panel').addEventListener('click', () => {
            panel.classList.remove('active');
        });
        
        panel.querySelectorAll('.filter-tag').forEach(tag => {
            tag.addEventListener('click', function() {
                filterByTag(this.dataset.tag);
                panel.classList.remove('active');
            });
        });
        
        panel.querySelector('.clear-tags-filter').addEventListener('click', function() {
            clearTagFilter();
            panel.classList.remove('active');
        });
        
        const tagsSearchInput = panel.querySelector('.tags-search-input');
        if (tagsSearchInput) {
            tagsSearchInput.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase();
                panel.querySelectorAll('.filter-tag').forEach(tag => {
                    const tagText = tag.dataset.tag.toLowerCase();
                    tag.style.display = tagText.includes(searchTerm) ? 'inline-block' : 'none';
                });
            });
        }
        
        
        positionFloatingPanel(panel);
        panel.classList.add('active');
    }
    
    function toggleAdvancedPanel() {
        const existingPanel = document.querySelector('.advanced-floating-panel');
        const tagsPanel = document.querySelector('.tags-floating-panel');
        
        if (tagsPanel) {
            tagsPanel.classList.remove('active');
        }
        
        if (existingPanel) {
            existingPanel.classList.toggle('active');
            return;
        }
        
        const panel = document.createElement('div');
        panel.className = 'advanced-floating-panel';
        panel.innerHTML = `
            <div class="floating-panel-header">
                <h4><i class="fas fa-sliders-h"></i> Filtros Avançados</h4>
                <button class="close-floating-panel"><i class="fas fa-times"></i></button>
            </div>
            <div class="floating-panel-content scrollable">
                <div class="advanced-section">
                    <h5><i class="fas fa-filter"></i> Filtros por Elemento</h5>
                    <div class="filter-options">
                        <button class="filter-option ${searchTerm === 'fogo' ? 'active' : ''}" data-element="fogo">
                            <span class="element-icon fogo"><i class="fas fa-fire"></i></span>
                            Fogo
                        </button>
                        <button class="filter-option ${searchTerm === 'água' ? 'active' : ''}" data-element="água">
                            <span class="element-icon água"><i class="fas fa-tint"></i></span>
                            Água
                        </button>
                        <button class="filter-option ${searchTerm === 'ar' ? 'active' : ''}" data-element="ar">
                            <span class="element-icon ar"><i class="fas fa-wind"></i></span>
                            Ar
                        </button>
                        <button class="filter-option ${searchTerm === 'terra' ? 'active' : ''}" data-element="terra">
                            <span class="element-icon terra"><i class="fas fa-mountain"></i></span>
                            Terra
                        </button>
                    </div>
                </div>
                
                <div class="advanced-section">
                    <h5><i class="fas fa-sort"></i> Ordenar por</h5>
                    <div class="sort-options">
                        <button class="sort-option ${sortOrder === 'default' ? 'active' : ''}" data-sort="default">
                            <i class="fas fa-sync"></i> Padrão
                        </button>
                        <button class="sort-option ${sortOrder === 'name' ? 'active' : ''}" data-sort="name">
                            <i class="fas fa-sort-alpha-down"></i> Nome A-Z
                        </button>
                        <button class="sort-option ${sortOrder === 'number' ? 'active' : ''}" data-sort="number">
                            <i class="fas fa-sort-numeric-down"></i> Número
                        </button>
                        <button class="sort-option ${sortOrder === 'element' ? 'active' : ''}" data-sort="element">
                            <i class="fas fa-fire"></i> Elemento
                        </button>
                        <button class="sort-option ${sortOrder === 'studied' ? 'active' : ''}" data-sort="studied">
                            <i class="fas fa-graduation-cap"></i> Estudadas
                        </button>
                    </div>
                </div>
                
                <div class="advanced-section">
                    <h5><i class="fas fa-eye"></i> Visualização</h5>
                    <div class="view-options">
                        <button class="toggle-view-mode ${viewMode === 'grid' ? 'active' : ''}" data-view="grid">
                            <i class="fas fa-th"></i> Grade
                        </button>
                        <button class="toggle-view-mode ${viewMode === 'list' ? 'active' : ''}" data-view="list">
                            <i class="fas fa-list"></i> Lista
                        </button>
                        <button class="toggle-view-mode ${viewMode === 'compact' ? 'active' : ''}" data-view="compact">
                            <i class="fas fa-grip-vertical"></i> Compacta
                        </button>
                    </div>
                </div>
                
                <div class="advanced-section">
                    <h5><i class="fas fa-graduation-cap"></i> Modo de Estudo</h5>
                    <div class="study-controls">
                        <button class="toggle-study-mode ${isStudyMode ? 'active' : ''}">
                            <i class="fas fa-graduation-cap"></i> 
                            ${isStudyMode ? 'Desativar Modo Estudo' : 'Ativar Modo Estudo'}
                        </button>
                        <div class="study-progress">
                            <div class="progress-info">
                                <span>Progresso: ${Object.keys(studyProgress).length}/${allCards.length}</span>
                                <span>${calculateStudyProgress()}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${calculateStudyProgress()}%"></div>
                            </div>
                        </div>
                        <button class="clear-study-progress">
                            <i class="fas fa-trash"></i> Limpar Progresso
                        </button>
                    </div>
                </div>
                
                <div class="advanced-section">
                    <h5><i class="fas fa-star"></i> Favoritos</h5>
                    <div class="favorites-controls">
                        <button class="show-favorites">
                            <i class="fas fa-star"></i> Ver Favoritos (${favoriteCards.length})
                        </button>
                        <button class="clear-favorites">
                            <i class="fas fa-trash"></i> Limpar Favoritos
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        panel.querySelector('.close-floating-panel').addEventListener('click', () => {
            panel.classList.remove('active');
        });
        
        panel.querySelectorAll('.filter-option').forEach(btn => {
            btn.addEventListener('click', function() {
                const element = this.dataset.element;
                filterByElement(element);
                panel.classList.remove('active');
            });
        });
        
        panel.querySelectorAll('.sort-option').forEach(btn => {
            btn.addEventListener('click', function() {
                setSortOrder(this.dataset.sort);
                panel.classList.remove('active');
            });
        });
        
        panel.querySelectorAll('.toggle-view-mode').forEach(btn => {
            btn.addEventListener('click', function() {
                toggleViewMode(this.dataset.view);
            });
        });
        
        panel.querySelector('.toggle-study-mode').addEventListener('click', function() {
            toggleStudyMode();
        });
        
        panel.querySelector('.clear-study-progress').addEventListener('click', function() {
            if (confirm('Tem certeza que deseja limpar todo o progresso de estudo?')) {
                clearStudyProgress();
                panel.classList.remove('active');
            }
        });
        
        panel.querySelector('.show-favorites').addEventListener('click', function() {
            showFavorites();
            panel.classList.remove('active');
        });
        
        panel.querySelector('.clear-favorites').addEventListener('click', function() {
            if (confirm('Tem certeza que deseja limpar todos os favoritos?')) {
                clearFavorites();
            }
        });
        
        
        positionFloatingPanel(panel);
        panel.classList.add('active');
    }
    
    function positionFloatingPanel(panel) {
        const controlsRect = document.querySelector('.cartas-controls').getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        panel.style.top = `${controlsRect.bottom + scrollTop + 10}px`;
        panel.style.left = `${controlsRect.left}px`;
        panel.style.width = `${controlsRect.width}px`;
    }
    
    function filterByTag(tag) {
        searchTerm = tag;
        if (cardSearch) cardSearch.value = tag;
        if (clearSearch) clearSearch.classList.add('visible');
        currentFilter = 'all';
        document.querySelectorAll('.filter-btn:not(.tags-toggle):not(.advanced-toggle)').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === 'all') btn.classList.add('active');
        });
        applyFilters();
    }
    
    function filterByElement(element) {
        searchTerm = element;
        if (cardSearch) cardSearch.value = element;
        if (clearSearch) clearSearch.classList.add('visible');
        currentFilter = 'all';
        document.querySelectorAll('.filter-btn:not(.tags-toggle):not(.advanced-toggle)').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === 'all') btn.classList.add('active');
        });
        applyFilters();
    }
    
    function clearTagFilter() {
        searchTerm = '';
        if (cardSearch) cardSearch.value = '';
        if (clearSearch) clearSearch.classList.remove('visible');
        applyFilters();
    }
    
    function toggleStudyMode() {
        isStudyMode = !isStudyMode;
        saveUserPreferences();
        renderCards();
        updateStudyModeUI();
        showNotification(isStudyMode ? 'Modo estudo ativado' : 'Modo estudo desativado');
    }
    
    function clearStudyProgress() {
        studyProgress = {};
        localStorage.removeItem('tarot-study-progress');
        renderCards();
        updateStats();
        showNotification('Progresso de estudo limpo');
    }
    
    function toggleViewMode(mode) {
        viewMode = mode;
        saveUserPreferences();
        renderCards();
        updateViewModeUI();
    }
    
    function setSortOrder(order) {
        sortOrder = order;
        saveUserPreferences();
        applyFilters();
    }
    
    function showFavorites() {
        if (favoriteCards.length === 0) {
            searchTerm = '';
            currentFilter = 'all';
            showNotification('Você não tem cartas favoritas ainda');
            return;
        }
        
        filteredCards = allCards.filter(card => favoriteCards.includes(card.id));
        searchTerm = '';
        currentFilter = 'favorites';
        
        document.querySelectorAll('.filter-btn:not(.tags-toggle):not(.advanced-toggle)').forEach(btn => {
            btn.classList.remove('active');
        });
        
        renderCards();
        updateStats();
        showNotification(`Mostrando ${favoriteCards.length} favoritos`);
    }
    
    function clearFavorites() {
        favoriteCards = [];
        localStorage.removeItem('tarot-favorites');
        updateStats();
        showNotification('Favoritos limpos');
    }
    
    function toggleFavorite(cardId) {
        const index = favoriteCards.indexOf(cardId);
        if (index === -1) {
            favoriteCards.push(cardId);
            showNotification('Carta adicionada aos favoritos');
        } else {
            favoriteCards.splice(index, 1);
            showNotification('Carta removida dos favoritos');
        }
        localStorage.setItem('tarot-favorites', JSON.stringify(favoriteCards));
        renderCards();
    }
    
    function applyFilters() {
        filteredCards = allCards.filter(card => {
            if (currentFilter !== 'all' && card.group !== currentFilter) {
                if (currentFilter !== 'favorites') return false;
            }
            
            if (currentFilter === 'favorites') {
                return favoriteCards.includes(card.id);
            }
            
            if (searchTerm) {
                const inName = card.name.toLowerCase().includes(searchTerm);
                const inMeaning = card.meaning.toLowerCase().includes(searchTerm);
                const inReversed = card.reversed.toLowerCase().includes(searchTerm);
                const inGroup = card.group.toLowerCase().includes(searchTerm);
                const inTags = cardTags[card.id]?.some(tag => tag.includes(searchTerm));
                const inKeywords = cardKeywords[card.id]?.some(keyword => keyword.includes(searchTerm));
                const inElement = cardElements[card.id]?.toLowerCase().includes(searchTerm);
                const inPlanet = cardPlanets[card.id]?.toLowerCase().includes(searchTerm);
                const inSign = cardSigns[card.id]?.toLowerCase().includes(searchTerm);
                
                return inName || inMeaning || inReversed || inGroup || inTags || inKeywords || inElement || inPlanet || inSign;
            }
            
            return true;
        });
        
        sortCards();
        renderCards();
        updateStats();
    }
    
    function sortCards() {
        switch(sortOrder) {
            case 'name':
                filteredCards.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'number':
                filteredCards.sort((a, b) => {
                    const numA = extractCardNumber(a) || 1000;
                    const numB = extractCardNumber(b) || 1000;
                    return numA - numB;
                });
                break;
            case 'element':
                filteredCards.sort((a, b) => {
                    const elementA = cardElements[a.id] || 'Z';
                    const elementB = cardElements[b.id] || 'Z';
                    return elementA.localeCompare(elementB);
                });
                break;
            case 'studied':
                filteredCards.sort((a, b) => {
                    const studiedA = studyProgress[a.id] ? 1 : 0;
                    const studiedB = studyProgress[b.id] ? 1 : 0;
                    return studiedB - studiedA;
                });
                break;
            default:
                filteredCards.sort((a, b) => {
                    const groupOrder = ['major-arcana', 'suit-wands', 'suit-cups', 'suit-swords', 'suit-pentacles'];
                    const aIndex = groupOrder.indexOf(a.group);
                    const bIndex = groupOrder.indexOf(b.group);
                    if (aIndex !== bIndex) return aIndex - bIndex;
                    return (extractCardNumber(a) || 0) - (extractCardNumber(b) || 0);
                });
        }
    }
    
    function calculateStudyProgress() {
        const studied = Object.keys(studyProgress).length;
        return Math.round((studied / allCards.length) * 100);
    }
    
    function markCardAsStudied(cardId) {
        if (studyProgress[cardId]) {
            delete studyProgress[cardId];
            showNotification('Carta marcada como não estudada');
        } else {
            studyProgress[cardId] = {
                date: new Date().toISOString(),
                timesStudied: 1
            };
            showNotification('Carta marcada como estudada');
        }
        localStorage.setItem('tarot-study-progress', JSON.stringify(studyProgress));
        
        
        cardHistory.unshift({
            cardId: cardId,
            action: studyProgress[cardId] ? 'studied' : 'unstudied',
            timestamp: new Date().toISOString()
        });
        
        
        if (cardHistory.length > 50) {
            cardHistory.pop();
        }
        
        localStorage.setItem('tarot-view-history', JSON.stringify(cardHistory));
        
        renderCards();
        updateStats();
    }
    
    function addToComparison(cardId) {
        if (!cardComparison.includes(cardId)) {
            cardComparison.push(cardId);
            if (cardComparison.length > 4) {
                cardComparison.shift();
                showNotification('Comparação limitada a 4 cartas. A carta mais antiga foi removida.');
            }
            localStorage.setItem('tarot-comparison', JSON.stringify(cardComparison));
            showComparisonNotification();
        }
    }
    
    function showComparisonNotification() {
        const existingNotification = document.querySelector('.comparison-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        if (cardComparison.length > 1) {
            const notification = document.createElement('div');
            notification.className = 'comparison-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-balance-scale"></i>
                    <span>${cardComparison.length} cartas na comparação</span>
                    <button class="show-comparison">Ver Comparação</button>
                    <button class="clear-comparison"><i class="fas fa-times"></i></button>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
            
            notification.querySelector('.show-comparison').addEventListener('click', showComparisonModal);
            notification.querySelector('.clear-comparison').addEventListener('click', () => {
                cardComparison = [];
                localStorage.removeItem('tarot-comparison');
                notification.remove();
            });
            
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.remove();
                        }
                    }, 300);
                }
            }, 5000);
        }
    }
    
    function showComparisonModal() {
        isComparisonOpen = true;
        const comparison = JSON.parse(localStorage.getItem('tarot-comparison')) || [];
        if (comparison.length < 2) return;
        
        const modal = document.createElement('div');
        modal.className = 'comparison-modal active';
        modal.innerHTML = `
            <div class="comparison-modal-overlay"></div>
            <div class="comparison-modal-content">
                <div class="comparison-modal-header">
                    <h3><i class="fas fa-balance-scale"></i> Comparação de Cartas</h3>
                    <button class="comparison-modal-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="comparison-grid">
                    ${comparison.map(cardId => {
                        const card = allCards.find(c => c.id == cardId);
                        if (!card) return '';
                        return `
                            <div class="comparison-card">
                                <div class="comparison-card-header">
                                    <h4>${card.name}</h4>
                                    <span class="comparison-card-group">${formatGroupName(card.group)}</span>
                                </div>
                                <div class="comparison-card-image">
                                    <img src="images/${card.img}" alt="${card.name}">
                                </div>
                                <div class="comparison-card-details">
                                    <div class="detail-row">
                                        <span class="detail-label">Elemento:</span>
                                        <span class="detail-value ${cardElements[card.id]?.toLowerCase()}">${cardElements[card.id] || 'N/A'}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-label">Planeta:</span>
                                        <span class="detail-value">${cardPlanets[card.id] || 'N/A'}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-label">Signo:</span>
                                        <span class="detail-value">${cardSigns[card.id] || 'N/A'}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-label">Significado:</span>
                                        <div class="detail-meaning">${truncateText(card.meaning, 100)}</div>
                                    </div>
                                </div>
                                <button class="remove-from-comparison" data-card-id="${card.id}">
                                    <i class="fas fa-times"></i> Remover
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="comparison-modal-actions">
                    <button class="btn btn-primary clear-all-comparison">
                        <i class="fas fa-trash"></i> Limpar Comparação
                    </button>
                    <button class="btn btn-outline close-comparison">
                        <i class="fas fa-times"></i> Fechar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.comparison-modal-close').addEventListener('click', closeComparisonModal);
        modal.querySelector('.close-comparison').addEventListener('click', closeComparisonModal);
        modal.querySelector('.comparison-modal-overlay').addEventListener('click', closeComparisonModal);
        
        modal.querySelector('.clear-all-comparison').addEventListener('click', () => {
            cardComparison = [];
            localStorage.removeItem('tarot-comparison');
            closeComparisonModal();
            document.querySelector('.comparison-notification')?.remove();
        });
        
        modal.querySelectorAll('.remove-from-comparison').forEach(btn => {
            btn.addEventListener('click', function() {
                const cardId = this.dataset.cardId;
                cardComparison = cardComparison.filter(id => id != cardId);
                localStorage.setItem('tarot-comparison', JSON.stringify(cardComparison));
                showComparisonModal();
                showComparisonNotification();
            });
        });
        
        document.body.style.overflow = 'hidden';
    }
    
    function closeComparisonModal() {
        const modal = document.querySelector('.comparison-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                isComparisonOpen = false;
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }
    
    function showCardConnections(cardId) {
        isConnectionsOpen = true;
        const card = allCards.find(c => c.id == cardId);
        if (!card) return;
        
        const similarCards = findSimilarCards(card);
        const elementalCards = findElementalCards(card);
        const thematicCards = findThematicCards(card);
        
        const modal = document.createElement('div');
        modal.className = 'connections-modal active';
        modal.innerHTML = `
            <div class="connections-modal-overlay"></div>
            <div class="connections-modal-content">
                <div class="connections-modal-header">
                    <h3><i class="fas fa-project-diagram"></i> Conexões: ${card.name}</h3>
                    <button class="connections-modal-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="connections-grid">
                    <div class="connection-section">
                        <h4><i class="fas fa-link"></i> Cartas Similares</h4>
                        <div class="connection-cards">
                            ${similarCards.map(c => `
                                <div class="connection-card" data-card-id="${c.id}">
                                    <div class="connection-card-info">
                                        <span class="connection-name">${c.name}</span>
                                        <span class="connection-group">${formatGroupName(c.group)}</span>
                                    </div>
                                    <div class="connection-similarity">${c.similarity}</div>
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="connection-section">
                        <h4><i class="fas fa-${cardElements[card.id]?.toLowerCase() === 'fogo' ? 'fire' : 
                                                 cardElements[card.id]?.toLowerCase() === 'água' ? 'tint' :
                                                 cardElements[card.id]?.toLowerCase() === 'ar' ? 'wind' :
                                                 cardElements[card.id]?.toLowerCase() === 'terra' ? 'mountain' : 'star'}"></i> 
                            Mesmo Elemento (${cardElements[card.id]})
                        </h4>
                        <div class="connection-cards">
                            ${elementalCards.map(c => `
                                <div class="connection-card" data-card-id="${c.id}">
                                    <div class="connection-card-info">
                                        <span class="connection-name">${c.name}</span>
                                        <span class="connection-group">${formatGroupName(c.group)}</span>
                                    </div>
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="connection-section">
                        <h4><i class="fas fa-tags"></i> Temas Relacionados</h4>
                        <div class="connection-tags">
                            ${cardTags[card.id]?.map(tag => `
                                <span class="connection-tag" data-tag="${tag}">${tag}</span>
                            `).join('')}
                        </div>
                        <div class="related-cards">
                            ${thematicCards.map(c => `
                                <div class="related-card" data-card-id="${c.id}">
                                    <span class="related-card-name">${c.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="connections-modal-actions">
                    <button class="btn btn-outline close-connections">
                        <i class="fas fa-times"></i> Fechar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.connections-modal-close').addEventListener('click', closeConnectionsModal);
        modal.querySelector('.close-connections').addEventListener('click', closeConnectionsModal);
        modal.querySelector('.connections-modal-overlay').addEventListener('click', closeConnectionsModal);
        
        modal.querySelectorAll('.connection-card, .related-card').forEach(conn => {
            conn.addEventListener('click', function() {
                const targetCardId = this.dataset.cardId;
                closeConnectionsModal();
                setTimeout(() => {
                    openCardModal(parseInt(targetCardId), filteredCards.findIndex(c => c.id == targetCardId));
                }, 300);
            });
        });
        
        modal.querySelectorAll('.connection-tag').forEach(tag => {
            tag.addEventListener('click', function() {
                const tagName = this.dataset.tag;
                closeConnectionsModal();
                setTimeout(() => {
                    filterByTag(tagName);
                }, 300);
            });
        });
        
        document.body.style.overflow = 'hidden';
    }
    
    function closeConnectionsModal() {
        const modal = document.querySelector('.connections-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                isConnectionsOpen = false;
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }
    
    function findSimilarCards(card) {
        const cardText = `${card.meaning} ${card.reversed}`.toLowerCase();
        const cardWords = new Set(cardText.split(/\W+/).filter(w => w.length > 3));
        
        return allCards
            .filter(c => c.id !== card.id)
            .map(other => {
                const otherText = `${other.meaning} ${other.reversed}`.toLowerCase();
                const otherWords = new Set(otherText.split(/\W+/).filter(w => w.length > 3));
                
                const intersection = [...cardWords].filter(x => otherWords.has(x));
                const similarity = intersection.length / Math.max(cardWords.size, otherWords.size);
                
                return { ...other, similarity };
            })
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5)
            .map(c => ({
                ...c,
                similarity: `${Math.round(c.similarity * 100)}% similar`
            }));
    }
    
    function findElementalCards(card) {
        const element = cardElements[card.id];
        return allCards
            .filter(c => c.id !== card.id && cardElements[c.id] === element)
            .slice(0, 5);
    }
    
    function findThematicCards(card) {
        const cardTagsList = cardTags[card.id] || [];
        return allCards
            .filter(c => c.id !== card.id && cardTags[c.id]?.some(tag => cardTagsList.includes(tag)))
            .slice(0, 5);
    }
    
    function createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card-container ${viewMode}-view ${studyProgress[card.id] ? 'studied' : ''} ${isStudyMode ? 'study-mode' : ''}`;
        cardDiv.dataset.cardId = card.id;
        cardDiv.dataset.cardIndex = filteredCards.findIndex(c => c.id === card.id);
        
        const imageUrl = `images/${card.img}`;
        const placeholderIcon = getGroupIcon(card.group);
        const element = cardElements[card.id];
        const planet = cardPlanets[card.id];
        const zodiac = cardSigns[card.id];
        const isStudied = studyProgress[card.id];
        const isFavorite = favoriteCards.includes(card.id);
        
        let cardHTML = '';
        
        if (viewMode === 'grid') {
            cardHTML = `
                <div class="card-image">
                    ${isStudied ? '<div class="studied-badge"><i class="fas fa-check-circle"></i></div>' : ''}
                    ${isFavorite ? '<div class="favorite-badge"><i class="fas fa-star"></i></div>' : ''}
                    <img class="card-img" src="${imageUrl}" alt="${card.name}" 
                         loading="lazy" onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='<div class=\\'image-placeholder\\'><i class=\\'${placeholderIcon}\\'></i></div>'">
                    <div class="card-metadata">
                        ${element ? `<span class="card-element-badge ${element.toLowerCase()}">${element}</span>` : ''}
                        ${planet ? `<span class="card-planet-badge">${planet}</span>` : ''}
                    </div>
                </div>
                
                <div class="card-content">
                    <h4 class="card-name">${card.name}</h4>
                    <div class="card-group">${formatGroupName(card.group)}</div>
                    <p class="card-meaning">${isStudyMode ? '???' : truncateText(card.meaning, 120)}</p>
                    
                    <div class="card-tags">
                        ${(cardTags[card.id] || []).slice(0, 3).map(tag => `
                            <span class="card-tag">${tag}</span>
                        `).join('')}
                    </div>
                    
                    <div class="card-footer">
                        <div class="card-actions">
                            <button class="card-action mark-studied" title="${isStudied ? 'Marcar como não estudada' : 'Marcar como estudada'}">
                                <i class="fas fa-${isStudied ? 'check-circle' : 'circle'}"></i>
                            </button>
                            <button class="card-action ${isFavorite ? 'active' : ''} toggle-favorite" data-card-id="${card.id}" title="${isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                                <i class="fas fa-star"></i>
                            </button>
                            <button class="card-action card-comparison-add" data-card-id="${card.id}" title="Adicionar à comparação">
                                <i class="fas fa-balance-scale"></i>
                            </button>
                            <button class="card-action show-card-connections" data-card-id="${card.id}" title="Ver conexões">
                                <i class="fas fa-project-diagram"></i>
                            </button>
                        </div>
                        <a href="#" class="view-more">
                            <span>Ver detalhes</span>
                            <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `;
        } else if (viewMode === 'list') {
            cardHTML = `
                <div class="card-list-content">
                    <div class="list-left">
                        <div class="card-number">${extractCardNumber(card) || ''}</div>
                        <div class="card-name-group">
                            <h4 class="card-name">${card.name}</h4>
                            <div class="card-group">${formatGroupName(card.group)}</div>
                        </div>
                    </div>
                    <div class="list-middle">
                        <div class="card-keywords">
                            ${(cardKeywords[card.id] || []).map(keyword => `
                                <span class="keyword">${keyword}</span>
                            `).join('')}
                        </div>
                    </div>
                    <div class="list-right">
                        <div class="card-metadata">
                            ${element ? `<span class="metadata-item ${element.toLowerCase()}">${element}</span>` : ''}
                            ${planet ? `<span class="metadata-item">${planet}</span>` : ''}
                        </div>
                        <div class="card-actions">
                            <button class="card-action mark-studied" title="${isStudied ? 'Estudada' : 'Não estudada'}">
                                <i class="fas fa-${isStudied ? 'check-circle' : 'circle'}"></i>
                            </button>
                            <button class="card-action ${isFavorite ? 'active' : ''} toggle-favorite" data-card-id="${card.id}">
                                <i class="fas fa-star"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            cardHTML = `
                <div class="card-compact">
                    <div class="compact-header">
                        <div class="card-number">${extractCardNumber(card) || ''}</div>
                        <h4 class="card-name">${truncateText(card.name, 20)}</h4>
                        ${isStudied ? '<i class="fas fa-check studied-icon"></i>' : ''}
                        ${isFavorite ? '<i class="fas fa-star favorite-icon"></i>' : ''}
                    </div>
                    <div class="compact-body">
                        <div class="card-group-badge">${formatGroupName(card.group).charAt(0)}</div>
                        ${element ? `<div class="element-indicator ${element.toLowerCase()}"></div>` : ''}
                    </div>
                </div>
            `;
        }
        
        cardDiv.innerHTML = cardHTML;
        
        if (isStudyMode) {
            cardDiv.addEventListener('click', function(e) {
                if (!e.target.closest('.card-action') && !e.target.closest('.view-more')) {
                    e.preventDefault();
                    const meaningEl = this.querySelector('.card-meaning');
                    if (meaningEl && meaningEl.textContent === '???') {
                        meaningEl.textContent = truncateText(card.meaning, 120);
                        this.classList.add('revealed');
                    }
                }
            });
        } else {
            cardDiv.addEventListener('click', function(e) {
                if (!e.target.closest('.card-action') && !e.target.closest('.view-more')) {
                    e.preventDefault();
                    const cardId = parseInt(this.dataset.cardId);
                    const cardIndex = parseInt(this.dataset.cardIndex);
                    openCardModal(cardId, cardIndex);
                }
            });
        }
        
        const viewMoreLink = cardDiv.querySelector('.view-more');
        if (viewMoreLink) {
            viewMoreLink.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const cardId = parseInt(cardDiv.dataset.cardId);
                const cardIndex = parseInt(cardDiv.dataset.cardIndex);
                openCardModal(cardId, cardIndex);
            });
        }
        
        cardDiv.querySelectorAll('.mark-studied').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                markCardAsStudied(card.id);
            });
        });
        
        cardDiv.querySelectorAll('.toggle-favorite').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleFavorite(card.id);
            });
        });
        
        cardDiv.querySelectorAll('.card-comparison-add').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                addToComparison(card.id);
            });
        });
        
        cardDiv.querySelectorAll('.show-card-connections').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                showCardConnections(card.id);
            });
        });
        
        return cardDiv;
    }
    
    function renderCards() {
        if (!tarotGrid) return;
        
        if (filteredCards.length === 0) {
            tarotGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>Nenhuma carta encontrada</h3>
                    <p>Tente ajustar sua busca ou filtro.</p>
                    <button class="btn btn-outline" onclick="document.querySelector('.filter-btn[data-filter=\\'all\\']').click()">
                        Mostrar todas as cartas
                    </button>
                </div>
            `;
            if (searchResults) searchResults.textContent = '';
            return;
        }
        
        tarotGrid.className = `tarot-grid ${viewMode}-view`;
        tarotGrid.innerHTML = '';
        
        filteredCards.forEach((card) => {
            const cardElement = createCardElement(card);
            tarotGrid.appendChild(cardElement);
        });
        
        updateResultsCount();
        showComparisonNotification();
    }
    
    function openCardModal(cardId, cardIndex) {
        const card = allCards.find(c => c.id === cardId);
        if (!card) return;
        
        currentCard = card;
        currentCardIndex = filteredCards.findIndex(c => c.id === cardId);
        
        const nameEl = document.getElementById('modalCardName');
        const groupEl = document.getElementById('modalCardGroup');
        const uprightEl = document.getElementById('uprightMeaning');
        const reversedEl = document.getElementById('reversedMeaning');
        const modalImg = document.getElementById('modalCardImg');
        
        if (nameEl) nameEl.textContent = card.name;
        if (groupEl) {
            groupEl.textContent = formatGroupName(card.group);
            groupEl.innerHTML += `
                ${cardElements[card.id] ? `<span class="modal-element ${cardElements[card.id].toLowerCase()}">${cardElements[card.id]}</span>` : ''}
                ${cardPlanets[card.id] ? `<span class="modal-planet">${cardPlanets[card.id]}</span>` : ''}
                ${cardSigns[card.id] ? `<span class="modal-zodiac">${cardSigns[card.id]}</span>` : ''}
            `;
        }
        if (uprightEl) uprightEl.innerHTML = `<p>${card.meaning}</p>`;
        if (reversedEl) reversedEl.innerHTML = `<p>${card.reversed}</p>`;
        
        if (modalImg) {
            const imageUrl = `images/${card.img}`;
            modalImg.src = imageUrl;
            modalImg.alt = card.name;
            modalImg.classList.remove('reversed');
        }
        
        updateOrientationBadge(false);
        updateCardNavigation();
        
        if (cardDetailsModal) {
            cardDetailsModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            const modalBody = cardDetailsModal.querySelector('.modal-body');
            const existingConnections = modalBody.querySelector('.card-connections');
            if (existingConnections) existingConnections.remove();
            
            const connections = findSimilarCards(card).slice(0, 3);
            if (connections.length > 0) {
                const connectionsHTML = `
                    <div class="card-connections">
                        <h4>Conexões Relacionadas</h4>
                        <div class="connections-list">
                            ${connections.map(c => `
                                <div class="connection-item" data-card-id="${c.id}">
                                    <span class="connection-name">${c.name}</span>
                                    <span class="connection-similarity">${c.similarity}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                modalBody.querySelector('.modal-card-info').insertAdjacentHTML('beforeend', connectionsHTML);
                
                modalBody.querySelectorAll('.connection-item').forEach(item => {
                    item.addEventListener('click', function() {
                        const targetCardId = this.dataset.cardId;
                        closeModal();
                        setTimeout(() => {
                            openCardModal(parseInt(targetCardId), filteredCards.findIndex(c => c.id == targetCardId));
                        }, 300);
                    });
                });
            }
        }
        
        showMeaningTab('upright');
        
        
        cardHistory.unshift({
            cardId: cardId,
            action: 'viewed',
            timestamp: new Date().toISOString()
        });
        
        if (cardHistory.length > 50) {
            cardHistory.pop();
        }
        
        localStorage.setItem('tarot-view-history', JSON.stringify(cardHistory));
    }
    
    function updateStats() {
        if (totalCardsElement) totalCardsElement.textContent = allCards.length;
        if (filteredCardsElement) filteredCardsElement.textContent = filteredCards.length;
        
        const studiedCount = Object.keys(studyProgress).length;
        const favoritesCount = favoriteCards.length;
        
        const statsContainer = document.querySelector('.cartas-stats');
        if (statsContainer) {
            
            let progressElement = statsContainer.querySelector('.study-progress-count');
            let favoritesElement = statsContainer.querySelector('.favorites-count');
            
            if (!progressElement && studiedCount > 0) {
                progressElement = document.createElement('div');
                progressElement.className = 'stat study-progress-count';
                progressElement.innerHTML = `
                    <span class="stat-number">${studiedCount}</span>
                    <span class="stat-label">Estudadas</span>
                `;
                statsContainer.appendChild(progressElement);
            } else if (progressElement) {
                progressElement.querySelector('.stat-number').textContent = studiedCount;
            }
            
            if (!favoritesElement && favoritesCount > 0) {
                favoritesElement = document.createElement('div');
                favoritesElement.className = 'stat favorites-count';
                favoritesElement.innerHTML = `
                    <span class="stat-number">${favoritesCount}</span>
                    <span class="stat-label">Favoritas</span>
                `;
                statsContainer.appendChild(favoritesElement);
            } else if (favoritesElement) {
                if (favoritesCount > 0) {
                    favoritesElement.querySelector('.stat-number').textContent = favoritesCount;
                } else {
                    favoritesElement.remove();
                }
            }
        }
    }
    
    function updateStudyModeUI() {
        const studyBtn = document.querySelector('.toggle-study-mode');
        if (studyBtn) {
            studyBtn.classList.toggle('active', isStudyMode);
            studyBtn.innerHTML = `<i class="fas fa-graduation-cap"></i> ${isStudyMode ? 'Desativar' : 'Ativar'} Modo Estudo`;
        }
        
        const tarotGrid = document.getElementById('tarotGrid');
        if (tarotGrid) {
            tarotGrid.classList.toggle('study-mode-active', isStudyMode);
        }
    }
    
    function updateViewModeUI() {
        document.querySelectorAll('.toggle-view-mode').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewMode);
        });
    }
    
    function showNotification(message) {
        const existingNotification = document.querySelector('.floating-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = 'floating-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    function formatGroupName(group) {
        const groupNames = {
            'major-arcana': 'Arcanos Maiores',
            'suit-wands': 'Paus',
            'suit-cups': 'Copas',
            'suit-swords': 'Espadas',
            'suit-pentacles': 'Ouros'
        };
        
        return groupNames[group] || group.replace('suit-', '').charAt(0).toUpperCase() + group.replace('suit-', '').slice(1);
    }
    
    function getGroupIcon(group) {
        const icons = {
            'major-arcana': 'fas fa-crown',
            'suit-wands': 'fas fa-fire',
            'suit-cups': 'fas fa-tint',
            'suit-swords': 'fas fa-crosshairs',
            'suit-pentacles': 'fas fa-coins'
        };
        
        return icons[group] || 'fas fa-clover';
    }
    
    function closeModal() {
        if (cardDetailsModal) {
            cardDetailsModal.style.display = 'none';
        }
        document.body.style.overflow = 'auto';
        currentCard = null;
    }
    
    function toggleCardOrientation() {
        const modalImg = document.getElementById('modalCardImg');
        if (!modalImg) return;

        const isReversed = modalImg.classList.toggle('reversed');
        
        updateOrientationBadge(isReversed);
        
        if (isReversed) {
            showMeaningTab('reversed');
        } else {
            showMeaningTab('upright');
        }
    }
    
    function updateOrientationBadge(isReversed) {
        const badge = document.getElementById('orientationBadge');
        if (badge) {
            badge.innerHTML = isReversed ? 
                '<i class="fas fa-moon"></i><span>Invertida</span>' :
                '<i class="fas fa-sun"></i><span>Direita</span>';
        }
    }
    
    function showMeaningTab(meaningType) {
        if (meaningTabs) {
            meaningTabs.forEach(tab => {
                tab.classList.remove('active');
                if (tab.getAttribute('data-meaning') === meaningType) {
                    tab.classList.add('active');
                }
            });
        }
        
        document.querySelectorAll('.meaning-text').forEach(text => {
            text.classList.remove('active');
        });
        
        const targetText = document.getElementById(`${meaningType}Meaning`);
        if (targetText) targetText.classList.add('active');
        
        if (toggleOrientationBtn) {
            if (meaningType === 'reversed') {
                toggleOrientationBtn.innerHTML = '<i class="fas fa-sync-alt"></i><span>Reverter para Direita</span>';
            } else {
                toggleOrientationBtn.innerHTML = '<i class="fas fa-sync-alt"></i><span>Inverter Carta</span>';
            }
        }
    }
    
    function showPreviousCard() {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            const prevCard = filteredCards[currentCardIndex];
            if (prevCard) {
                openCardModal(prevCard.id, currentCardIndex);
            }
        }
    }
    
    function showNextCard() {
        if (currentCardIndex < filteredCards.length - 1) {
            currentCardIndex++;
            const nextCard = filteredCards[currentCardIndex];
            if (nextCard) {
                openCardModal(nextCard.id, currentCardIndex);
            }
        }
    }
    
    function updateCardNavigation() {
        const indexEl = document.getElementById('currentCardIndex');
        const totalEl = document.getElementById('totalCardsModal');
        
        if (indexEl) indexEl.textContent = currentCardIndex + 1;
        if (totalEl) totalEl.textContent = filteredCards.length;
        
        if (prevCardBtn) prevCardBtn.disabled = currentCardIndex === 0;
        if (nextCardBtn) nextCardBtn.disabled = currentCardIndex === filteredCards.length - 1;
    }
    
    function updateResultsCount() {
        if (!searchResults) return;
        
        if (filteredCards.length === allCards.length && !searchTerm && currentFilter === 'all') {
            searchResults.textContent = '';
        } else {
            const studiedInFilter = filteredCards.filter(card => studyProgress[card.id]).length;
            const favoritesInFilter = filteredCards.filter(card => favoriteCards.includes(card.id)).length;
            
            let resultText = `Mostrando ${filteredCards.length} de ${allCards.length} cartas`;
            if (studiedInFilter > 0) resultText += ` • ${studiedInFilter} estudadas`;
            if (favoritesInFilter > 0) resultText += ` • ${favoritesInFilter} favoritas`;
            
            searchResults.textContent = resultText;
        }
    }
    
    function showError(message, error) {
        console.error(message, error);
        
        if (tarotGrid) {
            tarotGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>${message}</h3>
                    <p>${error.message || 'Erro desconhecido'}</p>
                    <p>Verifique se o arquivo <code>files/cards.json</code> existe e está no formato correto.</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        Tentar novamente
                    </button>
                </div>
            `;
        }
    }
    
    function truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarSistemaCartas);
} else {
    iniciarSistemaCartas();
}
