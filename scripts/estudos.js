if (window.estudosInitialized) {
    if (typeof window.estudosCleanup === 'function') {
        window.estudosCleanup();
    }
}

window.estudosInitialized = false;

function iniciarSistemaEstudos() {
   if (window.estudosInitialized) return;
    
    console.log('Iniciando sistema de estudos...');
    window.estudosInitialized = true;
    
    const estudosContainer = document.getElementById('estudos-container');
    const estudosSidebar = document.getElementById('estudosSidebar');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarContent = document.getElementById('sidebarContent');
    const estudosMain = document.getElementById('estudosMain');
    const studySearch = document.getElementById('studySearch');
    
    if (!estudosSidebar || !sidebarContent) {
        console.error('Elementos do sistema de estudos não encontrados!');
        return;
    }
    
    const estudosState = {
        allStudies: [],
        filteredStudies: [],
        categories: [],
        currentStudyId: null,
        currentCategoryFilter: 'all',
        searchTerm: '',
        sidebarOpen: false,
        currentStudyCSS: null,
        studyProgress: JSON.parse(localStorage.getItem('tarot_studies_progress')) || {},
        favoriteStudies: JSON.parse(localStorage.getItem('tarot_studies_favorites')) || [],
        studyHistory: JSON.parse(localStorage.getItem('tarot_studies_history')) || [],
        eventListeners: []
    };
    
    function addTrackedListener(element, event, handler) {
        if(element){
            element.addEventListener(event, handler);
            estudosState.eventListeners.push({ element, event, handler });
        }
    }
    
    async function init() {
        try {
            injectGlobalStyles();

            console.log('Carregando dados dos estudos...');
            await loadStudiesData();
            console.log('Dados carregados:', estudosState.allStudies.length, 'estudos');
            
            setupEventListeners();
            renderSidebar();
            updateStats();
            updateWelcomeStats();
            checkAutoOpenSidebar();
            
            console.log('Sistema de estudos inicializado com sucesso!');
        } catch (error) {
            console.error('Erro ao inicializar sistema de estudos:', error);
            showError('Erro ao carregar estudos', error);
        }
    }
    function injectGlobalStyles() {
        if (document.getElementById('estudos-global-styles')) return;

        const style = document.createElement('style');
        style.id = 'estudos-global-styles';
        style.textContent = `
            .study-notification {
                position: fixed; bottom: 20px; right: 20px;
                background: var(--bg-card, #fff); 
                border: 1px solid var(--border-color);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                z-index: 10000;
                transform: translateX(100px); opacity: 0;
                transition: all 0.3s ease;
            }
            .study-notification.show { transform: translateX(0); opacity: 1; }
            .notification-content { display: flex; align-items: center; gap: 12px; padding: 15px 20px; color: var(--text-primary); }
            .notification-content i { color: #4CAF50; font-size: 1.2rem; }
            
            .no-results { text-align: center; padding: 40px 20px; color: var(--text-secondary); }
            .no-results i { font-size: 3rem; margin-bottom: 15px; opacity: 0.5; }
            
            .error-message { text-align: center; padding: 60px 20px; }
            .error-message i { font-size: 3rem; color: #f44336; margin-bottom: 20px; }
            
            
        `;
        document.head.appendChild(style);
    }
    async function loadStudiesData() {
        try {
            const response = await fetch('files/estudos.json');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.studies || !Array.isArray(data.studies)) {
                throw new Error('Formato inválido do JSON: falta array "studies"');
            }
            
            estudosState.allStudies = data.studies;
            estudosState.categories = data.categories;
            
            estudosState.allStudies.forEach(study => {
                study.isCompleted = !!estudosState.studyProgress[study.id];
                study.isFavorite = estudosState.favoriteStudies.includes(study.id);
                study.categoryData = estudosState.categories.find(c => c.id === study.category) || estudosState.categories[0];
                study.readingTime = calculateReadingTime(study.content);
                if (!study.css) {
                    study.css = generateDefaultCSS(study.categoryData.color);
                }
            });
            
            estudosState.filteredStudies = [...estudosState.allStudies];
            console.log('Estudos processados:', estudosState.allStudies.length);
            
        } catch (error) {
            console.error('Erro ao carregar estudos:', error);
            loadExampleData();
        }
    }
    
    function generateDefaultCSS(color) {
        return `
        <style>
        .study-content { 
            font-family: 'Georgia', 'Times New Roman', serif; 
            line-height: 1.7; 
            color: #333; 
            background: white; 
            padding: 2rem; 
            border-radius: 12px; 
            border-left: 6px solid ${color};
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); 
            max-width: 100%; 
            height: auto; 
            min-height: 600px; 
            max-height: 80vh; 
            overflow-y: auto; 
        }
        .study-content::-webkit-scrollbar { width: 10px; }
        .study-content::-webkit-scrollbar-track { background: #f5f5f5; border-radius: 5px; }
        .study-content::-webkit-scrollbar-thumb { background: ${color}; border-radius: 5px; }
        .study-content h2, .study-content h3 { color: ${color}; }
        .study-content blockquote { border-left: 4px solid ${color}; background: ${color}10; }
        </style>`;
    }
    
    function loadExampleData() {
        estudosState.categories = [
            {
                id: "classico",
                name: "Clássico & Mitológico",
                description: "Estudos sobre a história e mitologia do Tarot",
                color: "#8B4513",
                icon: "fas fa-landmark"
            },
            {
                id: "psico",
                name: "Psicológico (Jung)",
                description: "Abordagem psicológica e junguiana do Tarot",
                color: "#4B0082",
                icon: "fas fa-brain"
            }
        ];
        
        estudosState.allStudies = [
            {
                id: "estudo-1",
                category: "classico",
                title: "O Livro Mudo: Arqueologia do Simbólico & Genealogia Mítica",
                subtitle: "Uma jornada pela história e mitologia do Tarot",
                content: `
                    <div class="text-content">
                        <h2>📜 O Livro Mudo: Arqueologia do Simbólico & Genealogia Mítica</h2>
                        <p>O Tarot clássico constitui uma <strong>criptografia da alma ocidental</strong>. Não nasceu como ferramenta esotérica, mas como espelho da consciência renascentista...</p>
                        <h3>1. A Genealogia Histórica: Da Corte à Cripta</h3>
                        <p>Contrariando o mito romântico de origem egípcia...</p>
                    </div>
                `,
                css: generateDefaultCSS("#8B4513"),
                estimatedReadingTime: 25,
                tags: ["história", "mitologia", "símbolos"],
                author: "Bibliotheca",
                date: "2024-01-15"
            },
            {
                id: "estudo-2",
                category: "psico",
                title: "O Espelho da Alma: O Tarot na Perspectiva da Psicologia Analítica Junguiana",
                subtitle: "Abordagem psicológica e junguiana do Tarot",
                content: `
                    <div class="text-content">
                        <h2>🜄 O Espelho da Alma: O Tarot na Perspectiva da Psicologia Analítica Junguiana</h2>
                        <p>"Quem olha para fora, sonha; quem olha para dentro, desperta." — Carl Gustav Jung...</p>
                    </div>
                `,
                css: generateDefaultCSS("#4B0082"),
                estimatedReadingTime: 20,
                tags: ["jung", "psicologia", "arquétipos"],
                author: "Bibliotheca",
                date: "2024-01-20"
            }
        ];
        
        estudosState.allStudies.forEach(study => {
            study.isCompleted = !!estudosState.studyProgress[study.id];
            study.isFavorite = estudosState.favoriteStudies.includes(study.id);
            study.categoryData = estudosState.categories.find(c => c.id === study.category) || estudosState.categories[0];
            study.readingTime = calculateReadingTime(study.content);
        });
        
        estudosState.filteredStudies = [...estudosState.allStudies];
    }
    
    function calculateReadingTime(content) {
        if (!content) return 5;
        const wordCount = content.split(/\s+/).length;
        return Math.max(5, Math.ceil(wordCount / 200));
    }
    
    function setupEventListeners() {
        if (sidebarToggleBtn) {
            addTrackedListener(sidebarToggleBtn, 'click', openSidebar);
        }
        
        if (closeSidebarBtn) {
            addTrackedListener(closeSidebarBtn, 'click', closeSidebar);
        }
        
        if (sidebarOverlay) {
            addTrackedListener(sidebarOverlay, 'click', closeSidebar);
        }
        
        if (studySearch) {
            let searchTimeout;
            addTrackedListener(studySearch, 'input', function(e) {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    estudosState.searchTerm = e.target.value.toLowerCase().trim();
                    applyFilters();
                }, 300);
            });
        }
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            addTrackedListener(btn, 'click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                estudosState.currentCategoryFilter = this.dataset.filter;
                applyFilters();
            });
        });
        
        addTrackedListener(document, 'keydown', function(e) {
            if (e.key === 'Escape') {
                closeSidebar();
            }
            if (e.key === 'ArrowLeft' && estudosState.currentStudyId) {
                navigateToPreviousStudy();
            }
            if (e.key === 'ArrowRight' && estudosState.currentStudyId) {
                navigateToNextStudy();
            }
        });
        
        if (window.innerWidth <= 768) {
            addTrackedListener(document, 'click', function(e) {
                if (estudosState.sidebarOpen && estudosSidebar && !estudosSidebar.contains(e.target) && 
                    sidebarToggleBtn && !sidebarToggleBtn.contains(e.target)) {
                    closeSidebar();
                }
            });
        }
    }
    
    function applyFilters() {
        estudosState.filteredStudies = estudosState.allStudies.filter(study => {
            switch(estudosState.currentCategoryFilter) {
                case 'favorites':
                    if (!study.isFavorite) return false;
                    break;
                case 'completed':
                    if (!study.isCompleted) return false;
                    break;
                case 'unread':
                    if (study.isCompleted) return false;
                    break;
                case 'all':
                default:
                    break;
            }
            
            if (estudosState.searchTerm) {
                const inTitle = study.title.toLowerCase().includes(estudosState.searchTerm);
                const inSubtitle = study.subtitle.toLowerCase().includes(estudosState.searchTerm);
                const inTags = study.tags.some(tag => tag.toLowerCase().includes(estudosState.searchTerm));
                const inCategory = study.categoryData.name.toLowerCase().includes(estudosState.searchTerm);
                
                return inTitle || inSubtitle || inTags || inCategory;
            }
            
            return true;
        });
        
        renderSidebar();
    }
    
    function renderSidebar() {
        if (!sidebarContent) return;
        
        const studiesByCategory = {};
        estudosState.filteredStudies.forEach(study => {
            if (!studiesByCategory[study.category]) {
                studiesByCategory[study.category] = [];
            }
            studiesByCategory[study.category].push(study);
        });
        
        const sortedCategories = estudosState.categories.filter(cat => studiesByCategory[cat.id]?.length > 0);
        
        sidebarContent.innerHTML = '';
        
        if (sortedCategories.length === 0) {
            sidebarContent.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>Nenhum estudo encontrado</p>
                    <button class="btn btn-outline" onclick="document.querySelector('.filter-btn[data-filter=\"all\"]').click()">
                        Mostrar todos
                    </button>
                </div>
            `;
            return;
        }
        
        sortedCategories.forEach(category => {
            const categoryStudies = studiesByCategory[category.id];
            
            const categoryElement = document.createElement('div');
            categoryElement.className = 'study-category';
            categoryElement.innerHTML = `
                <div class="category-header" style="border-color: ${category.color}">
                    <div class="category-icon" style="background: ${category.color}">
                        <i class="${category.icon}"></i>
                    </div>
                    <div class="category-title">
                        <h4>${category.name}</h4>
                        <span>${categoryStudies.length} estudo${categoryStudies.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
                <div class="category-studies">
                    ${categoryStudies.map(study => `
                        <div class="study-item ${study.id === estudosState.currentStudyId ? 'active' : ''} ${study.isCompleted ? 'completed' : ''}" 
                             data-study-id="${study.id}">
                            <div class="study-icon" style="background: ${category.color}20; color: ${category.color}">
                                <i class="${category.icon}"></i>
                            </div>
                            <div class="study-info">
                                <h5>${study.title}</h5>
                                <div class="study-meta">
                                    <span class="study-time">
                                        <i class="far fa-clock"></i>
                                        ${study.readingTime} min
                                    </span>
                                    ${study.isCompleted ? '<span class="study-status"><i class="fas fa-check"></i> Lido</span>' : ''}
                                </div>
                                <div class="study-tags">
                                    ${study.tags.map(tag => `<span class="study-tag">${tag}</span>`).join('')}
                                </div>
                            </div>
                            <div class="study-actions">
                                <button class="study-action-btn favorite ${study.isFavorite ? 'active' : ''}" 
                                        data-study-id="${study.id}"
                                        title="${study.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                                    <i class="fas fa-star"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            sidebarContent.appendChild(categoryElement);
        });
        
        document.querySelectorAll('.study-item').forEach(item => {
            addTrackedListener(item, 'click', function(e) {
                if (!e.target.closest('.study-action-btn')) {
                    const studyId = this.dataset.studyId;
                    loadStudy(studyId);
                    if (window.innerWidth <= 768) {
                        closeSidebar();
                    }
                }
            });
        });
        
        document.querySelectorAll('.study-action-btn.favorite').forEach(btn => {
            addTrackedListener(btn, 'click', function(e) {
                e.stopPropagation();
                const studyId = this.dataset.studyId;
                toggleFavorite(studyId);
            });
        });
    }
    
    function loadStudy(studyId) {
        const study = estudosState.allStudies.find(s => s.id === studyId);
        if (!study) return;
        
        estudosState.currentStudyId = studyId;
        
        if (estudosState.currentStudyCSS) {
            estudosState.currentStudyCSS.remove();
            estudosState.currentStudyCSS = null;
        }
        
        if (study.css && study.css.trim() !== '') {
            estudosState.currentStudyCSS = document.createElement('style');
            estudosState.currentStudyCSS.textContent = study.css;
            estudosState.currentStudyCSS.id = 'current-study-css';
            document.head.appendChild(estudosState.currentStudyCSS);
        }
        
        document.querySelectorAll('.study-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.studyId === studyId) {
                item.classList.add('active');
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
        
        if (!estudosMain) return;
        
        estudosMain.className = `estudos-main category-${study.category}`;
        
        const studyContent = `
            <div class="study-content active">
                <div class="study-header">
                    <div class="study-title-section">
                        <h2>${study.title}</h2>
                        <div class="study-actions-top">
                            <button class="study-action-btn ${study.isCompleted ? 'completed' : ''}" id="markAsReadBtn" 
                                    title="${study.isCompleted ? 'Marcar como não lido' : 'Marcar como lido'}">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="study-action-btn favorite ${study.isFavorite ? 'active' : ''}" id="favoriteStudyBtn"
                                    title="${study.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                                <i class="fas fa-star"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="study-meta-info">
                        <span class="study-category-badge" style="background: ${study.categoryData.color}20; color: ${study.categoryData.color}">
                            <i class="${study.categoryData.icon}"></i>
                            ${study.categoryData.name}
                        </span>
                        <span class="study-reading-time">
                            <i class="far fa-clock"></i>
                            ${study.readingTime} min de leitura
                        </span>
                        <span class="study-date">
                            <i class="far fa-calendar"></i>
                            ${formatDate(study.date)}
                        </span>
                    </div>
                    
                    <div class="study-tags-container">
                        ${study.tags.map(tag => `<span class="study-tag">${tag}</span>`).join('')}
                    </div>
                </div>
                
                <div class="study-body" id="studyBody">
                    ${study.content}
                </div>
                
                <div class="study-navigation">
                    <button class="nav-btn prev" id="prevStudyBtn" disabled>
                        <i class="fas fa-chevron-left"></i>
                        <span>Anterior</span>
                    </button>
                    
                    <div class="study-progress-indicator">
                        <span id="studyPosition">1</span> de <span id="totalFilteredStudies">${estudosState.filteredStudies.length}</span>
                    </div>
                    
                    <button class="nav-btn next" id="nextStudyBtn">
                        <span>Próximo</span>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
        
        estudosMain.innerHTML = studyContent;
        
        const markBtn = document.getElementById('markAsReadBtn');
        if (markBtn) {
            addTrackedListener(markBtn, 'click', () => toggleReadStatus(studyId));
        }
        
        const favBtn = document.getElementById('favoriteStudyBtn');
        if (favBtn) {
            addTrackedListener(favBtn, 'click', () => toggleFavorite(studyId));
        }
        
        const prevBtn = document.getElementById('prevStudyBtn');
        if (prevBtn) {
            addTrackedListener(prevBtn, 'click', navigateToPreviousStudy);
        }
        
        const nextBtn = document.getElementById('nextStudyBtn');
        if (nextBtn) {
            addTrackedListener(nextBtn, 'click', navigateToNextStudy);
        }
        
        updateStudyNavigation();
        addToHistory(studyId);
    }
    
    function toggleReadStatus(studyId) {
        const study = estudosState.allStudies.find(s => s.id === studyId);
        if (!study) return;
        
        if (estudosState.studyProgress[studyId]) {
            delete estudosState.studyProgress[studyId];
            study.isCompleted = false;
            showNotification('Estudo marcado como não lido');
        } else {
            estudosState.studyProgress[studyId] = {
                date: new Date().toISOString(),
                completed: true,
                percent: 100
            };
            study.isCompleted = true;
            showNotification('Estudo marcado como lido');
        }
        
        localStorage.setItem('tarot_studies_progress', JSON.stringify(estudosState.studyProgress));
        updateStats();
        renderSidebar();
        
        const markBtn = document.getElementById('markAsReadBtn');
        if (markBtn) {
            markBtn.classList.toggle('completed', study.isCompleted);
            markBtn.title = study.isCompleted ? 'Marcar como não lido' : 'Marcar como lido';
        }
    }
    
    function toggleFavorite(studyId) {
        const study = estudosState.allStudies.find(s => s.id === studyId);
        if (!study) return;
        
        const index = estudosState.favoriteStudies.indexOf(studyId);
        if (index === -1) {
            estudosState.favoriteStudies.push(studyId);
            study.isFavorite = true;
            showNotification('Estudo adicionado aos favoritos');
        } else {
            estudosState.favoriteStudies.splice(index, 1);
            study.isFavorite = false;
            showNotification('Estudo removido dos favoritos');
        }
        
        localStorage.setItem('tarot_studies_favorites', JSON.stringify(estudosState.favoriteStudies));
        updateWelcomeStats();
        renderSidebar();
        
        const favBtn = document.getElementById('favoriteStudyBtn');
        if (favBtn) {
            favBtn.classList.toggle('active', study.isFavorite);
            favBtn.title = study.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
        }
        
        if (estudosState.currentCategoryFilter === 'favorites') {
            applyFilters();
        }
    }
    
    function addToHistory(studyId) {
        estudosState.studyHistory.unshift({
            studyId: studyId,
            timestamp: new Date().toISOString()
        });
        
        if (estudosState.studyHistory.length > 50) {
            estudosState.studyHistory.pop();
        }
        
        localStorage.setItem('tarot_studies_history', JSON.stringify(estudosState.studyHistory));
    }
    
    function navigateToPreviousStudy() {
        const currentIndex = estudosState.filteredStudies.findIndex(s => s.id === estudosState.currentStudyId);
        if (currentIndex > 0) {
            const prevStudy = estudosState.filteredStudies[currentIndex - 1];
            loadStudy(prevStudy.id);
        }
    }
    
    function navigateToNextStudy() {
        const currentIndex = estudosState.filteredStudies.findIndex(s => s.id === estudosState.currentStudyId);
        if (currentIndex < estudosState.filteredStudies.length - 1) {
            const nextStudy = estudosState.filteredStudies[currentIndex + 1];
            loadStudy(nextStudy.id);
        }
    }
    
    function updateStudyNavigation() {
        const currentIndex = estudosState.filteredStudies.findIndex(s => s.id === estudosState.currentStudyId);
        const prevBtn = document.getElementById('prevStudyBtn');
        const nextBtn = document.getElementById('nextStudyBtn');
        const studyPosition = document.getElementById('studyPosition');
        const totalFilteredStudies = document.getElementById('totalFilteredStudies');
        
        if (prevBtn) prevBtn.disabled = currentIndex <= 0;
        if (nextBtn) nextBtn.disabled = currentIndex >= estudosState.filteredStudies.length - 1;
        if (studyPosition) studyPosition.textContent = currentIndex + 1;
        if (totalFilteredStudies) totalFilteredStudies.textContent = estudosState.filteredStudies.length;
    }
    
    function updateStats() {
        const totalStudies = estudosState.allStudies.length;
        const completedStudies = Object.keys(estudosState.studyProgress).length;
        const percentage = totalStudies > 0 ? Math.round((completedStudies / totalStudies) * 100) : 0;
        
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = document.getElementById('progressPercentage');
        const completedStudiesEl = document.getElementById('completedStudies');
        const totalStudiesEl = document.getElementById('totalStudies');
        
        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (progressPercentage) progressPercentage.textContent = `${percentage}%`;
        if (completedStudiesEl) completedStudiesEl.textContent = completedStudies;
        if (totalStudiesEl) totalStudiesEl.textContent = totalStudies;
    }
    
    function updateWelcomeStats() {
        const totalStudies = estudosState.allStudies.length;
        const completedStudies = Object.keys(estudosState.studyProgress).length;
        const favorites = estudosState.favoriteStudies.length;
        
        const welcomeTotalStudies = document.getElementById('welcomeTotalStudies');
        const welcomeCompleted = document.getElementById('welcomeCompleted');
        const welcomeFavorites = document.getElementById('welcomeFavorites');
        
        if (welcomeTotalStudies) welcomeTotalStudies.textContent = totalStudies;
        if (welcomeCompleted) welcomeCompleted.textContent = completedStudies;
        if (welcomeFavorites) welcomeFavorites.textContent = favorites;
    }
    
    function openSidebar() {
    if (estudosSidebar) estudosSidebar.classList.add('active');
    estudosState.sidebarOpen = true;
    
    if (window.innerWidth <= 768 && sidebarOverlay) {
        sidebarOverlay.classList.add('active');
    }
}

function closeSidebar() {
    if (estudosSidebar) estudosSidebar.classList.remove('active');
    estudosState.sidebarOpen = false;
    
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
}
    
    function checkAutoOpenSidebar() {
    if (window.innerWidth > 768) {
            
            if (estudosSidebar) {
                estudosSidebar.classList.add('active');
                estudosState.sidebarOpen = true;
            }
            
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
            }
        } else {
            
            closeSidebar();
        }
    }
    
    function showNotification(message) {
        const existingNotification = document.querySelector('.study-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = 'study-notification';
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
    
    function showError(message, error) {
        console.error(message, error);
        
        if (estudosMain) {
            estudosMain.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>${message}</h3>
                    <p>${error.message || 'Erro desconhecido'}</p>
                    <p>Verifique se o arquivo <code>files/estudos.json</code> existe e está no formato correto.</p>
                    <button class="btn btn-primary" onclick="reiniciarEstudos()">
                        Tentar novamente
                    </button>
                </div>
            `;
        }
    }
    
    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }
    
    function cleanupEventListeners() {
        estudosState.eventListeners.forEach(({ element, event, handler }) => {
            if(element) element.removeEventListener(event, handler);
        });
        estudosState.eventListeners = [];

        if (estudosState.currentStudyCSS) {
            estudosState.currentStudyCSS.remove();
            estudosState.currentStudyCSS = null;
        }
        const oldCSS = document.getElementById('current-study-css');
        if (oldCSS) oldCSS.remove();

        const globalStyles = document.getElementById('estudos-global-styles');
        if (globalStyles) globalStyles.remove();
    }
    
    window.estudosCleanup = function() {
        cleanupEventListeners();
        window.estudosInitialized = false;
        delete window.estudosState;
    };
    
    function reiniciarEstudos() {
        if (window.estudosCleanup) {
            window.estudosCleanup();
        }
        window.estudosInitialized = false;
        iniciarSistemaEstudos();
    }
    
    window.reiniciarEstudos = reiniciarEstudos;
    
    init();
}

var studyStyles = document.createElement('style');
studyStyles.textContent = `
    .study-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--bg-paper);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 10000;
        transform: translateX(100px);
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .study-notification.show {
        transform: translateX(0);
        opacity: 1;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 15px 20px;
        color: var(--text-color);
    }
    
    .notification-content i {
        color: #4CAF50;
        font-size: 1.2rem;
    }
    
    .no-results {
        text-align: center;
        padding: 40px 20px;
        color: #666;
    }
    
    .no-results i {
        font-size: 3rem;
        margin-bottom: 15px;
        color: #ccc;
    }
    
    .error-message {
        text-align: center;
        padding: 60px 20px;
        color: #333;
    }
    
    .error-message i {
        font-size: 3rem;
        color: #f44336;
        margin-bottom: 20px;
    }
    
    .category-classico .study-content {
        border-left-color: #8B4513;
    }
    .category-psico .study-content {
        border-left-color: #4B0082;
    }
    .category-oculto .study-content {
        border-left-color: #00008B;
    }
    .category-goetia .study-content {
        border-left-color: #8B0000;
    }
    .category-moderno .study-content {
        border-left-color: #006400;
    }
`;

if (!document.querySelector('#study-styles')) {
    studyStyles.id = 'study-styles';
    document.head.appendChild(studyStyles);
}


(function() {
    let initTimeout;
    
    function delayedInit() {
        clearTimeout(initTimeout);
        initTimeout = setTimeout(() => {
            if (!window.estudosInitialized) {
                iniciarSistemaEstudos();
            }
        }, 100);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', delayedInit);
    } else {
        delayedInit();
    }
})();

window.iniciarSistemaEstudos = iniciarSistemaEstudos;
