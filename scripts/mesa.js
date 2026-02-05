


function iniciarSistemaMesa() {
    
    let tarotCards = [];
    let currentCards = [];
    let selectedCard = null;
    let activeLayers = new Set(['base']);
    let currentTheme = 'felt';
    let readingMode = 'free';
    let magnetismStrength = 30;
    let layerOpacity = 50;
    let isGridVisible = false;
    let isConnectionsVisible = false;
    let isFullscreen = false;
    let sessionStartTime = Date.now();
    let timerInterval = null;
    let notes = '';
    let customPatterns = JSON.parse(localStorage.getItem('tarot-custom-patterns')) || [];
    let draggedCard = null;
    let dragOffset = { x: 0, y: 0 };
    
    
    init();
    
    async function init() {
    try {
            await loadCards();
            setupEventListeners();
            setupDragAndDrop();
            startTimer();
            updateStatus();
            loadSavedNotes();
            
            setupMobileInterface();
            
            showToast('Mesa de Tarot carregada. Toque nas cartas para começar.', 'success');
        } catch (error) {
            console.error('Erro ao inicializar a mesa:', error);
            showToast('Erro ao carregar cartas. Verifique o console.', 'error');
        }
    }
    
    async function loadCards() {
        try {
            const response = await fetch('files/cards.json');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const cards = await response.json();
            
            
            if (!Array.isArray(cards) || cards.length === 0) {
                throw new Error('Arquivo JSON não contém um array de cartas válido');
            }
            
            tarotCards = cards;
            renderAvailableCards();
            
        } catch (error) {
            console.error('Erro ao carregar cartas:', error);
            throw error;
        }
    }
    
    
    
    function renderAvailableCards() {
        const container = document.getElementById('availableCards');
        if (!container) return;
        
        container.innerHTML = '';
        
        
        const displayCards = tarotCards 
        
        
        const gridContainer = document.createElement('div');
        gridContainer.className = 'cards-grid';
        
        displayCards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card-thumbnail';
            cardEl.dataset.cardId = card.id;
            cardEl.draggable = true;
            cardEl.title = card.name;
            
            
            const img = new Image();
            img.src = `images/${card.img || 'default.jpg'}`;
            img.alt = card.name;
            img.onerror = () => {
                cardEl.innerHTML = `
                    <div class="card-placeholder">
                        <i class="fas fa-clover"></i>
                        <span class="card-name">${card.name}</span>
                    </div>
                `;
            };
            
            cardEl.appendChild(img);
            
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'card-thumb-info';
            infoDiv.innerHTML = `
                <div class="card-name">${card.name}</div>
                <div class="card-group">${card.group || 'Tarot'}</div>
            `;
            cardEl.appendChild(infoDiv);
            
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'card-thumb-actions';
            actionsDiv.innerHTML = `
                <button class="rotate-outside" data-card-id="${card.id}" title="Girar">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <button class="favorite-outside" data-card-id="${card.id}" title="Favoritar">
                    <i class="far fa-heart"></i>
                </button>
            `;
            cardEl.appendChild(actionsDiv);
            
            gridContainer.appendChild(cardEl);
        });
        
        container.appendChild(gridContainer);
    }
    
    function setupEventListeners() {
        
        
        
        document.querySelectorAll('.layer-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const layer = e.currentTarget.dataset.layer;
                toggleLayer(layer);
                e.currentTarget.classList.toggle('active');
            });
        });
        
        
        const magnetismSlider = document.getElementById('magnetism');
        const opacitySlider = document.getElementById('layerOpacity');
        
        if (magnetismSlider) {
            magnetismSlider.addEventListener('input', (e) => {
                magnetismStrength = e.target.value;
                document.getElementById('magnetismValue').textContent = `${e.target.value}%`;
            });
        }
        
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                layerOpacity = e.target.value;
                document.getElementById('opacityValue').textContent = `${e.target.value}%`;
                updateLayersOpacity();
            });
        }
        
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                currentTheme = e.currentTarget.dataset.theme;
                updateTableTheme();
            });
        });
        
        
        const modeSelect = document.getElementById('readingMode');
        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                readingMode = e.target.value;
                setupReadingMode();
            });
        }
        
        
        const searchInput = document.getElementById('cardsFilter');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterAvailableCards(e.target.value);
            });
        }
        
        
        document.getElementById('clearFilter')?.addEventListener('click', () => {
            document.getElementById('cardsFilter').value = '';
            filterAvailableCards('');
        });
        
        document.getElementById('addRandomCard')?.addEventListener('click', addRandomCard);
        document.getElementById('drawThree')?.addEventListener('click', drawThreeCards);
        document.getElementById('newReading')?.addEventListener('click', newReading);
        document.getElementById('clearTable')?.addEventListener('click', clearTable);
        document.getElementById('toggleFullscreen')?.addEventListener('click', toggleFullscreen);
        document.getElementById('exitFullscreen')?.addEventListener('click', toggleFullscreen);
        
        
        document.getElementById('showHelp')?.addEventListener('click', showHelp);
        document.getElementById('showConnections')?.addEventListener('click', toggleConnections);
        document.getElementById('toggleGrid')?.addEventListener('click', toggleGrid);
        
        
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                switchTab(tabName);
            });
        });
        
        
        document.getElementById('rotateSelected')?.addEventListener('click', () => {
            if (selectedCard) rotateCard(selectedCard);
        });
        document.getElementById('removeSelected')?.addEventListener('click', () => {
            if (selectedCard) removeCardFromTable(selectedCard);
        });
        document.getElementById('addToCollection')?.addEventListener('click', favoriteCard);
        document.getElementById('shareReading')?.addEventListener('click', shareReading);
        
        
        const notesTextarea = document.getElementById('readingNotes');
        if (notesTextarea) {
            notesTextarea.addEventListener('input', (e) => {
                notes = e.target.value;
            });
        }
        
        document.getElementById('saveNotes')?.addEventListener('click', saveNotes);
        document.getElementById('clearNotes')?.addEventListener('click', clearNotes);
        
        
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.modal-overlay').style.display = 'none';
            });
        });
        
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.style.display = 'none';
                }
            });
        });
        
        
        document.addEventListener('keydown', handleKeyboard);
        
        
        document.getElementById('savePattern')?.addEventListener('click', savePattern);
        document.getElementById('loadPattern')?.addEventListener('click', loadPattern);
        
        
        const availableCardsContainer = document.getElementById('availableCards');
        if (availableCardsContainer) {
            availableCardsContainer.addEventListener('click', (e) => {
                const cardId = e.target.closest('button')?.dataset.cardId;
                if (!cardId) return;
                
                if (e.target.closest('.rotate-outside')) {
                    rotateCardOutside(cardId);
                } else if (e.target.closest('.favorite-outside')) {
                    toggleFavorite(cardId);
                }
            });
        }
    }
    
    function setupDragAndDrop() {
        const cardsArea = document.getElementById('cardsArea');
        if (!cardsArea) return;
        
        
        document.addEventListener('dragstart', (e) => {
            if (e.target.closest('.card-thumbnail')) {
                const cardId = e.target.closest('.card-thumbnail').dataset.cardId;
                e.dataTransfer.setData('text/plain', cardId);
                e.dataTransfer.effectAllowed = 'copy';
            }
        });
        
        cardsArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        cardsArea.addEventListener('drop', (e) => {
            e.preventDefault();
            const cardId = e.dataTransfer.getData('text/plain');
            const card = tarotCards.find(c => c.id == cardId);
            
            if (card) {
                const rect = cardsArea.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                addCardToTable(card, x, y);
            }
        });
        
        
        cardsArea.addEventListener('mousedown', startCardDrag);
        document.addEventListener('mousemove', dragCard);
        document.addEventListener('mouseup', endCardDrag);
        
        
        cardsArea.addEventListener('touchstart', startCardDragTouch, { passive: false });
        document.addEventListener('touchmove', dragCardTouch, { passive: false });
        document.addEventListener('touchend', endCardDrag);
    }
    
    function startCardDrag(e) {
        if (e.target.closest('.card-action-btn') || e.button !== 0) return;
        
        const card = e.target.closest('.tarot-card');
        if (!card) return;
        
        draggedCard = card;
        const rect = card.getBoundingClientRect();
        const cardsArea = document.getElementById('cardsArea').getBoundingClientRect();
        
        dragOffset = {
            x: e.clientX - rect.left + cardsArea.left,
            y: e.clientY - rect.top + cardsArea.top
        };
        
        card.classList.add('dragging');
        document.body.style.cursor = 'grabbing';
        e.preventDefault();
    }
    
    function dragCard(e) {
        if (!draggedCard) return;
        
        const cardsArea = document.getElementById('cardsArea');
        const areaRect = cardsArea.getBoundingClientRect();
        
        let x = e.clientX - dragOffset.x;
        let y = e.clientY - dragOffset.y;
        
        
        x = Math.max(0, Math.min(x, areaRect.width - draggedCard.offsetWidth));
        y = Math.max(0, Math.min(y, areaRect.height - draggedCard.offsetHeight));
        
        
        if (magnetismStrength > 0) {
            const magnetized = applyMagnetism(x, y);
            if (magnetized) {
                x = magnetized.x;
                y = magnetized.y;
            }
        }
        
        draggedCard.style.left = `${x}px`;
        draggedCard.style.top = `${y}px`;
        
        updateCardPosition(draggedCard.dataset.cardId, x, y);
        updateConnections();
    }
    
    function startCardDragTouch(e) {
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const card = element?.closest('.tarot-card');
        
        if (!card) return;
        
        e.preventDefault();
        draggedCard = card;
        const rect = card.getBoundingClientRect();
        const cardsArea = document.getElementById('cardsArea').getBoundingClientRect();
        
        dragOffset = {
            x: touch.clientX - rect.left + cardsArea.left,
            y: touch.clientY - rect.top + cardsArea.top
        };
        
        card.classList.add('dragging');
    }
    
    function dragCardTouch(e) {
        if (!draggedCard || e.touches.length !== 1) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        const cardsArea = document.getElementById('cardsArea');
        const areaRect = cardsArea.getBoundingClientRect();
        
        let x = touch.clientX - dragOffset.x;
        let y = touch.clientY - dragOffset.y;
        
        
        x = Math.max(0, Math.min(x, areaRect.width - draggedCard.offsetWidth));
        y = Math.max(0, Math.min(y, areaRect.height - draggedCard.offsetHeight));
        
        draggedCard.style.left = `${x}px`;
        draggedCard.style.top = `${y}px`;
        
        updateCardPosition(draggedCard.dataset.cardId, x, y);
        updateConnections();
    }
    
    function endCardDrag() {
        if (!draggedCard) return;
        
        draggedCard.classList.remove('dragging');
        document.body.style.cursor = '';
        draggedCard = null;
    }
    
    function applyMagnetism(x, y) {
        
        const gridSize = 20;
        const strength = magnetismStrength / 100;
        
        if (strength < 0.1) return null;
        
        const snappedX = Math.round(x / gridSize) * gridSize;
        const snappedY = Math.round(y / gridSize) * gridSize;
        
        const dx = snappedX - x;
        const dy = snappedY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 50 * strength) {
            return {
                x: snappedX,
                y: snappedY
            };
        }
        
        return null;
    }
    
    function addCardToTable(card, x, y) {
        const cardsArea = document.getElementById('cardsArea');
        
        
        const emptyState = cardsArea.querySelector('.empty-state');
        if (emptyState) emptyState.remove();
        
        
        const cardId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const cardEl = document.createElement('div');
        cardEl.className = 'tarot-card';
        cardEl.dataset.cardId = cardId;
        cardEl.dataset.originalId = card.id;
        cardEl.style.left = `${x - 60}px`;
        cardEl.style.top = `${y - 90}px`;
        
        
        const img = new Image();
        img.src = `images/${card.img || 'default.jpg'}`;
        img.alt = card.name;
        img.onerror = () => {
            cardEl.innerHTML = `
                <div class="card-placeholder">
                    <i class="fas fa-clover"></i>
                </div>
            `;
        };
        cardEl.appendChild(img);
        
        
        const overlay = document.createElement('div');
        overlay.className = 'card-overlay';
        overlay.innerHTML = `
            <div class="card-actions">
                <button class="card-action-btn rotate-btn" title="Girar carta">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <button class="card-action-btn remove-btn" title="Remover carta">
                    <i class="fas fa-times"></i>
                </button>
                <button class="card-action-btn favorite-btn" title="Favoritar">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        `;
        cardEl.appendChild(overlay);
        
        
        const nameTag = document.createElement('div');
        nameTag.className = 'card-name-tag';
        nameTag.textContent = card.name;
        cardEl.appendChild(nameTag);
        
        cardsArea.appendChild(cardEl);
        
        
        const cardData = {
            id: cardId,
            element: cardEl,
            originalId: card.id,
            x: x - 60,
            y: y - 90,
            rotated: false,
            data: card
        };
        
        currentCards.push(cardData);
        
        
        cardEl.querySelector('.rotate-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            rotateCard(cardData);
        });
        
        cardEl.querySelector('.remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            removeCardFromTable(cardData);
        });
        
        cardEl.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(card.id);
        });
        
        cardEl.addEventListener('click', (e) => {
            if (!e.target.closest('.card-action-btn')) {
                selectCard(cardData);
            }
        });
        
        
        updateCardsCount();
        updateConnections();
        updateReadingDetails();
        
        
        cardEl.classList.add('new');
        setTimeout(() => cardEl.classList.remove('new'), 300);
        
        return cardData;
    }
    
    function selectCard(cardData) {
        
        document.querySelectorAll('.tarot-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        
        cardData.element.classList.add('selected');
        selectedCard = cardData;
        
        
        showCardDetails(cardData);
        
        
        switchTab('card');
    }
    
    function showCardDetails(cardData) {
        const card = cardData.data;
        const details = document.getElementById('cardDetails');
        const noSelection = document.querySelector('.no-selection');
        
        if (!details || !noSelection) return;
        
        
        document.getElementById('selectedCardName').textContent = card.name;
        document.getElementById('selectedCardGroup').textContent = card.group || 'Tarot';
        document.getElementById('selectedCardNumber').textContent = `#${card.id || '0'}`;
        
        const img = document.getElementById('selectedCardImage');
        if (img) {
            img.src = `images/${card.img || 'default.jpg'}`;
            img.onerror = () => img.src = 'images/default.jpg';
        }
        
        document.getElementById('selectedCardMeaning').textContent = card.meaning || 'Sem descrição disponível.';
        document.getElementById('selectedCardReversed').textContent = card.reversed || 'Sem descrição disponível.';
        
        
        const keywordsEl = document.getElementById('selectedCardKeywords');
        if (keywordsEl) {
            keywordsEl.innerHTML = '';
            if (card.keywords) {
                const keywords = card.keywords.split ? card.keywords.split(',') : [];
                keywords.forEach(keyword => {
                    const span = document.createElement('span');
                    span.className = 'keyword-tag';
                    span.textContent = keyword.trim();
                    keywordsEl.appendChild(span);
                });
            }
        }
        
        
        const elementsEl = document.getElementById('selectedCardElements');
        if (elementsEl) {
            elementsEl.innerHTML = '';
            if (card.elements) {
                const elements = card.elements.split ? card.elements.split(',') : [];
                elements.forEach(element => {
                    const span = document.createElement('span');
                    span.className = `element-tag ${element.trim().toLowerCase()}`;
                    span.textContent = element.trim();
                    elementsEl.appendChild(span);
                });
            }
        }
        
        
        document.getElementById('orientationBadge').textContent = 
            cardData.rotated ? 'Invertida' : 'Direita';
        
        
        details.style.display = 'block';
        noSelection.style.display = 'none';
    }
    
    function rotateCard(cardData) {
        cardData.element.classList.toggle('reversed');
        cardData.rotated = !cardData.rotated;
        
        
        if (selectedCard && selectedCard.id === cardData.id) {
            document.getElementById('orientationBadge').textContent = 
                cardData.rotated ? 'Invertida' : 'Direita';
        }
    }
    
    function rotateCardOutside(cardId) {
        
        const cardThumb = document.querySelector(`.card-thumbnail[data-card-id="${cardId}"]`);
        if (cardThumb) {
            const img = cardThumb.querySelector('img');
            img.style.transform = img.style.transform === 'rotate(180deg)' ? '' : 'rotate(180deg)';
        }
    }
    
    function removeCardFromTable(cardData) {
        const index = currentCards.findIndex(c => c.id === cardData.id);
        if (index !== -1) {
            cardData.element.remove();
            currentCards.splice(index, 1);
            
            
            if (selectedCard && selectedCard.id === cardData.id) {
                selectedCard = null;
                const details = document.getElementById('cardDetails');
                const noSelection = document.querySelector('.no-selection');
                if (details && noSelection) {
                    details.style.display = 'none';
                    noSelection.style.display = 'flex';
                }
            }
            
            
            if (currentCards.length === 0) {
                showEmptyState();
            }
            
            updateCardsCount();
            updateConnections();
            updateReadingDetails();
        }
    }
    
    function addRandomCard() {
        if (tarotCards.length === 0) return;
        
        const randomCard = tarotCards[Math.floor(Math.random() * tarotCards.length)];
        const cardsArea = document.getElementById('cardsArea');
        const rect = cardsArea.getBoundingClientRect();
        
        const x = Math.random() * (rect.width - 120) + 60;
        const y = Math.random() * (rect.height - 180) + 90;
        
        addCardToTable(randomCard, x, y);
    }
    
    function drawThreeCards() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => addRandomCard(), i * 300);
        }
    }
    
    function clearTable() {
        if (currentCards.length === 0) return;
        
        if (confirm('Tem certeza que deseja limpar todas as cartas da mesa?')) {
            currentCards.forEach(card => card.element.remove());
            currentCards = [];
            selectedCard = null;
            
            showEmptyState();
            updateCardsCount();
            updateConnections();
            updateReadingDetails();
            
            
            const details = document.getElementById('cardDetails');
            const noSelection = document.querySelector('.no-selection');
            if (details && noSelection) {
                details.style.display = 'none';
                noSelection.style.display = 'flex';
            }
        }
    }
    
    function newReading() {
        if (currentCards.length > 0 && !confirm('Isso irá limpar a leitura atual. Continuar?')) {
            return;
        }
        
        clearTable();
        setupReadingMode();
        notes = '';
        document.getElementById('readingNotes').value = '';
        sessionStartTime = Date.now();
        showToast('Nova leitura iniciada', 'success');
    }
    
    function showEmptyState() {
        const cardsArea = document.getElementById('cardsArea');
        if (cardsArea && !cardsArea.querySelector('.empty-state') && currentCards.length === 0) {
            cardsArea.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-hand-sparkles"></i>
                    </div>
                    <h4>Mesa Vazia</h4>
                    <p>Arraste cartas da barra lateral ou use "Carta Aleatória"</p>
                </div>
            `;
        }
    }
    
    function toggleLayer(layer) {
        const layerEl = document.querySelector(`[data-layer="${layer}"]`);
        
        if (activeLayers.has(layer)) {
            activeLayers.delete(layer);
            layerEl?.classList.remove('active');
        } else {
            activeLayers.add(layer);
            layerEl?.classList.add('active');
        }
        
        updateActiveLayersDisplay();
        updateLayersOpacity();
    }
    
    function updateLayersOpacity() {
        document.querySelectorAll('.layer:not(.base-layer)').forEach(layer => {
            if (layer.classList.contains('active')) {
                layer.style.opacity = layerOpacity / 100;
            }
        });
    }
    
    function updateActiveLayersDisplay() {
        const displayText = Array.from(activeLayers)
            .map(layer => {
                const names = {
                    'base': 'Base',
                    'circles': 'Círculos',
                    'lines': 'Linhas',
                    'geometry': 'Geometrias'
                };
                return names[layer] || layer;
            })
            .join(', ');
        
        document.getElementById('activeLayers').textContent = displayText || 'Nenhuma';
    }
    
    function updateTableTheme() {
        const baseLayer = document.querySelector('.base-layer');
        if (!baseLayer) return;
        
        
        baseLayer.className = 'layer base-layer active';
        baseLayer.classList.add(currentTheme);
    }
    
    function setupReadingMode() {
        const positionsContainer = document.getElementById('readingPositions');
        if (!positionsContainer) return;
        
        positionsContainer.innerHTML = '';
        
        let positions = [];
        
        switch(readingMode) {
            case 'three':
                positions = createThreeCardSpread();
                break;
            case 'celtic':
                positions = createCelticCrossSpread();
                break;
            case 'line':
                positions = createTimelineSpread();
                break;
            case 'wheel':
                positions = createWheelSpread();
                break;
            case 'cross':
                positions = createSimpleCrossSpread();
                break;
            case 'horseshoe':
                positions = createHorseshoeSpread();
                break;
            
            default:
                return; 
        }
        
        
        positions.forEach((pos, index) => {
            const posEl = document.createElement('div');
            posEl.className = 'reading-position';
            posEl.dataset.position = index;
            posEl.style.left = `${pos.x}%`;
            posEl.style.top = `${pos.y}%`;
            posEl.innerHTML = `<span class="position-label">${pos.label}</span>`;
            positionsContainer.appendChild(posEl);
        });
        
        updateReadingDetails();
    }
    
    function createThreeCardSpread() {
        return [
            { x: 30, y: 50, label: 'Passado' },
            { x: 50, y: 50, label: 'Presente' },
            { x: 70, y: 50, label: 'Futuro' }
        ];
    }
    
    function createCelticCrossSpread() {
        return [
            { x: 50, y: 40, label: '1 - Você' },
            { x: 50, y: 60, label: '2 - Desafio' },
            { x: 50, y: 20, label: '3 - Objetivo' },
            { x: 50, y: 80, label: '4 - Raízes' },
            { x: 30, y: 50, label: '5 - Passado' },
            { x: 70, y: 50, label: '6 - Futuro' },
            { x: 20, y: 30, label: '7 - Atitudes' },
            { x: 80, y: 30, label: '8 - Ambiente' },
            { x: 20, y: 70, label: '9 - Esperanças' },
            { x: 80, y: 70, label: '10 - Resultado' }
        ];
    }
    
    
    
    function updateCardPosition(cardId, x, y) {
        const card = currentCards.find(c => c.id === cardId);
        if (card) {
            card.x = x;
            card.y = y;
        }
    }
    
    function updateConnections() {
        if (!isConnectionsVisible) return;
        
        const connectionsLayer = document.getElementById('connectionsLayer');
        if (!connectionsLayer) return;
        
        connectionsLayer.innerHTML = '';
        
        
        for (let i = 0; i < currentCards.length; i++) {
            for (let j = i + 1; j < currentCards.length; j++) {
                const card1 = currentCards[i];
                const card2 = currentCards[j];
                
                const x1 = card1.x + 60;
                const y1 = card1.y + 90;
                const x2 = card2.x + 60;
                const y2 = card2.y + 90;
                
                const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                
                if (distance < 300) {
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', x1);
                    line.setAttribute('y1', y1);
                    line.setAttribute('x2', x2);
                    line.setAttribute('y2', y2);
                    line.setAttribute('class', 'connection-line');
                    line.setAttribute('stroke-opacity', 0.3 * (1 - distance / 300));
                    connectionsLayer.appendChild(line);
                }
            }
        }
    }
    
    function toggleConnections() {
        isConnectionsVisible = !isConnectionsVisible;
        const connectionsLayer = document.getElementById('connectionsLayer');
        const btn = document.getElementById('showConnections');
        
        if (connectionsLayer) {
            connectionsLayer.style.display = isConnectionsVisible ? 'block' : 'none';
        }
        
        if (btn) {
            btn.classList.toggle('active', isConnectionsVisible);
        }
        
        if (isConnectionsVisible) {
            updateConnections();
        }
    }
    
    function toggleGrid() {
        isGridVisible = !isGridVisible;
        const grid = document.getElementById('guideGrid');
        const btn = document.getElementById('toggleGrid');
        
        if (grid) {
            grid.classList.toggle('active', isGridVisible);
        }
        
        if (btn) {
            btn.classList.toggle('active', isGridVisible);
        }
    }
    
    function filterAvailableCards(searchTerm) {
        const cards = document.querySelectorAll('.card-thumbnail');
        searchTerm = searchTerm.toLowerCase().trim();
        
        cards.forEach(card => {
            const name = card.querySelector('.card-name').textContent.toLowerCase();
            const group = card.querySelector('.card-group').textContent.toLowerCase();
            
            if (searchTerm === '' || name.includes(searchTerm) || group.includes(searchTerm)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => updateTimer(), 1000);
    }
    
    function updateTimer() {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        const timerEl = document.getElementById('sessionTimer');
        if (timerEl) {
            timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        
        const readingTimeEl = document.getElementById('readingTime');
        if (readingTimeEl) {
            if (minutes < 60) {
                readingTimeEl.textContent = `${minutes}m`;
            } else {
                const hours = Math.floor(minutes / 60);
                readingTimeEl.textContent = `${hours}h`;
            }
        }
    }
    
    function updateCardsCount() {
        const countEl = document.getElementById('cardsCount');
        const readingCountEl = document.getElementById('readingCardsCount');
        
        if (countEl) {
            countEl.textContent = currentCards.length;
        }
        
        if (readingCountEl) {
            readingCountEl.textContent = currentCards.length;
        }
    }
    
    function updateReadingDetails() {
        updateCardsCount();
        
        
        const connectionsEl = document.getElementById('readingConnections');
        if (connectionsEl && isConnectionsVisible) {
            
            let connections = 0;
            for (let i = 0; i < currentCards.length; i++) {
                for (let j = i + 1; j < currentCards.length; j++) {
                    const card1 = currentCards[i];
                    const card2 = currentCards[j];
                    const distance = Math.sqrt(
                        Math.pow(card2.x - card1.x, 2) + 
                        Math.pow(card2.y - card1.y, 2)
                    );
                    if (distance < 300) connections++;
                }
            }
            connectionsEl.textContent = connections;
        }
        
        
        updatePositionsList();
    }
    
    function updatePositionsList() {
        const container = document.querySelector('.positions-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        const positions = document.querySelectorAll('.reading-position');
        positions.forEach((pos, index) => {
            const posEl = document.createElement('div');
            posEl.className = 'position-item';
            
            
            const posRect = pos.getBoundingClientRect();
            const posCenterX = posRect.left + posRect.width / 2;
            const posCenterY = posRect.top + posRect.height / 2;
            
            let cardName = 'Vazio';
            let cardElement = null;
            
            currentCards.forEach(card => {
                const cardRect = card.element.getBoundingClientRect();
                const cardCenterX = cardRect.left + cardRect.width / 2;
                const cardCenterY = cardRect.top + cardRect.height / 2;
                
                const distance = Math.sqrt(
                    Math.pow(cardCenterX - posCenterX, 2) + 
                    Math.pow(cardCenterY - posCenterY, 2)
                );
                
                if (distance < 100) { 
                    cardName = card.data.name;
                    cardElement = card;
                }
            });
            
            posEl.innerHTML = `
                <span class="position-number">${index + 1}</span>
                <span class="position-label">${pos.querySelector('.position-label').textContent}</span>
                <span class="position-card">${cardName}</span>
            `;
            
            if (cardElement) {
                posEl.classList.add('occupied');
                posEl.addEventListener('click', () => selectCard(cardElement));
            }
            
            container.appendChild(posEl);
        });
    }
    
    function toggleFullscreen() {
        const mesaContainer = document.querySelector('.mesa-container');
        const exitBtn = document.getElementById('exitFullscreen');
        
        if (!isFullscreen) {
            if (mesaContainer.requestFullscreen) {
                mesaContainer.requestFullscreen();
            } else if (mesaContainer.webkitRequestFullscreen) {
                mesaContainer.webkitRequestFullscreen();
            } else if (mesaContainer.msRequestFullscreen) {
                mesaContainer.msRequestFullscreen();
            }
            
            isFullscreen = true;
            if (exitBtn) exitBtn.style.display = 'block';
            
            
            if (!exitBtn) {
                const newExitBtn = document.createElement('button');
                newExitBtn.id = 'exitFullscreen';
                newExitBtn.className = 'action-btn hint';
                newExitBtn.innerHTML = '<i class="fas fa-compress"></i>';
                newExitBtn.title = 'Sair da tela cheia';
                newExitBtn.style.position = 'fixed';
                newExitBtn.style.top = '20px';
                newExitBtn.style.right = '20px';
                newExitBtn.style.zIndex = '1000';
                document.body.appendChild(newExitBtn);
                newExitBtn.addEventListener('click', toggleFullscreen);
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            
            isFullscreen = false;
            const exitBtn = document.getElementById('exitFullscreen');
            if (exitBtn) exitBtn.style.display = 'none';
        }
    }
    
    function switchTab(tabName) {
        
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });
    }
    
    function favoriteCard() {
        if (!selectedCard) return;
        
        const favorites = JSON.parse(localStorage.getItem('tarot-favorites') || '[]');
        const cardId = selectedCard.data.id;
        
        if (!favorites.includes(cardId)) {
            favorites.push(cardId);
            localStorage.setItem('tarot-favorites', JSON.stringify(favorites));
            showToast('Carta adicionada aos favoritos', 'success');
        } else {
            showToast('Carta já está nos favoritos', 'info');
        }
    }
    
    function toggleFavorite(cardId) {
        const favorites = JSON.parse(localStorage.getItem('tarot-favorites') || '[]');
        const index = favorites.indexOf(cardId);
        
        if (index === -1) {
            favorites.push(cardId);
            showToast('Carta adicionada aos favoritos', 'success');
        } else {
            favorites.splice(index, 1);
            showToast('Carta removida dos favoritos', 'info');
        }
        
        localStorage.setItem('tarot-favorites', JSON.stringify(favorites));
        
        
        const favBtn = document.querySelector(`.favorite-outside[data-card-id="${cardId}"] i`);
        if (favBtn) {
            favBtn.className = index === -1 ? 'fas fa-heart' : 'far fa-heart';
        }
    }
    
    function saveNotes() {
        localStorage.setItem('tarot-reading-notes', notes);
        showToast('Anotações salvas', 'success');
    }
    
    function clearNotes() {
        if (confirm('Tem certeza que deseja limpar todas as anotações?')) {
            notes = '';
            document.getElementById('readingNotes').value = '';
            localStorage.removeItem('tarot-reading-notes');
            showToast('Anotações limpas', 'info');
        }
    }
    
    function loadSavedNotes() {
        const saved = localStorage.getItem('tarot-reading-notes');
        if (saved) {
            notes = saved;
            const notesTextarea = document.getElementById('readingNotes');
            if (notesTextarea) {
                notesTextarea.value = saved;
            }
        }
    }
    
    function showHelp() {
        const modal = document.getElementById('helpModal');
        if (!modal) return;
        
        modal.querySelector('.modal-body').innerHTML = `
            <h4>Como usar a Mesa de Tarot</h4>
            <div class="help-content">
                <div class="help-section">
                    <h5><i class="fas fa-layer-group"></i> Camadas Visuais</h5>
                    <p>Ative/desative diferentes camadas de fundo para personalizar sua mesa.</p>
                </div>
                <div class="help-section">
                    <h5><i class="fas fa-cog"></i> Configurações</h5>
                    <p>Ajuste magnetismo para facilitar o alinhamento e opacidade das camadas.</p>
                </div>
                <div class="help-section">
                    <h5><i class="fas fa-chess-board"></i> Modos de Leitura</h5>
                    <p>Selecione entre diferentes spreads de tarot para guiar sua leitura.</p>
                </div>
                <div class="help-section">
                    <h5><i class="fas fa-clover"></i> Trabalhando com Cartas</h5>
                    <ul>
                        <li>Arraste cartas da barra lateral para a mesa</li>
                        <li>Clique em uma carta para ver detalhes</li>
                        <li>Clique com botão direito ou use o botão de girar para inverter</li>
                        <li>Arraste cartas na mesa para reposicionar</li>
                    </ul>
                </div>
                <div class="help-section">
                    <h5><i class="fas fa-info-circle"></i> Painel de Detalhes</h5>
                    <p>Use as abas para ver detalhes da carta, informações da leitura e fazer anotações.</p>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
    }
    
    function shareReading() {
        const readingData = {
            cards: currentCards.map(card => ({
                name: card.data.name,
                position: { x: card.x, y: card.y },
                reversed: card.rotated
            })),
            mode: readingMode,
            notes: notes,
            timestamp: new Date().toISOString()
        };
        
        const shareText = `Leitura de Tarot - ${currentCards.length} cartas\n\n` +
                         currentCards.map((card, i) => 
                             `${i + 1}. ${card.data.name} ${card.rotated ? '(Invertida)' : ''}`
                         ).join('\n') +
                         `\n\nAnotações: ${notes}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Minha Leitura de Tarot',
                text: shareText,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(shareText);
            showToast('Leitura copiada para a área de transferência', 'success');
        }
    }
    
    function savePattern() {
        if (currentCards.length === 0) {
            showToast('Adicione cartas à mesa antes de salvar um padrão', 'warning');
            return;
        }
        
        const name = prompt('Nome do padrão:');
        if (!name) return;
        
        const pattern = {
            id: Date.now(),
            name: name,
            mode: readingMode,
            cards: currentCards.map(card => ({
                id: card.originalId,
                x: card.x,
                y: card.y,
                rotated: card.rotated
            })),
            createdAt: new Date().toISOString()
        };
        
        customPatterns.push(pattern);
        localStorage.setItem('tarot-custom-patterns', JSON.stringify(customPatterns));
        showToast(`Padrão "${name}" salvo`, 'success');
    }
    
    function loadPattern() {
        if (customPatterns.length === 0) {
            showToast('Nenhum padrão salvo encontrado', 'info');
            return;
        }
        
        const patternList = customPatterns.map((p, i) => 
            `${i + 1}. ${p.name} (${p.cards.length} cartas)`
        ).join('\n');
        
        const choice = parseInt(prompt(`Padrões salvos:\n${patternList}\n\nDigite o número do padrão:`));
        if (isNaN(choice) || choice < 1 || choice > customPatterns.length) return;
        
        const pattern = customPatterns[choice - 1];
        
        
        clearTable();
        
        
        readingMode = pattern.mode;
        document.getElementById('readingMode').value = pattern.mode;
        setupReadingMode();
        
        
        pattern.cards.forEach(cardData => {
            const card = tarotCards.find(c => c.id == cardData.id);
            if (card) {
                const addedCard = addCardToTable(card, cardData.x + 60, cardData.y + 90);
                if (cardData.rotated) {
                    rotateCard(addedCard);
                }
            }
        });
        
        showToast(`Padrão "${pattern.name}" carregado`, 'success');
    }
    
    function handleKeyboard(e) {
        
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key) {
            case 'Escape':
                if (isFullscreen) {
                    toggleFullscreen();
                }
                document.querySelectorAll('.modal-overlay').forEach(modal => {
                    modal.style.display = 'none';
                });
                break;
                
            case 'r':
            case 'R':
                if (e.ctrlKey) {
                    addRandomCard();
                    e.preventDefault();
                }
                break;
                
            case 'Delete':
            case 'Backspace':
                if (selectedCard) {
                    removeCardFromTable(selectedCard);
                }
                break;
        }
    }
    
    function updateStatus() {
        updateCardsCount();
        updateActiveLayersDisplay();
        updateTimer();
    }
    
    function showToast(message, type = 'info') {
        
        document.querySelectorAll('.toast').forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    
    function createTimelineSpread() {
        return [
            { x: 10, y: 50, label: 'Passado Distante' },
            { x: 30, y: 50, label: 'Passado Recente' },
            { x: 50, y: 50, label: 'Presente' },
            { x: 70, y: 50, label: 'Futuro Próximo' },
            { x: 90, y: 50, label: 'Futuro Distante' }
        ];
    }
    
    function createWheelSpread() {
        return [
            { x: 50, y: 20, label: 'Norte' },
            { x: 70, y: 30, label: 'Nordeste' },
            { x: 80, y: 50, label: 'Leste' },
            { x: 70, y: 70, label: 'Sudeste' },
            { x: 50, y: 80, label: 'Sul' },
            { x: 30, y: 70, label: 'Sudoeste' },
            { x: 20, y: 50, label: 'Oeste' },
            { x: 30, y: 30, label: 'Noroeste' }
        ];
    }
    
    function createSimpleCrossSpread() {
        return [
            { x: 50, y: 30, label: 'Superior' },
            { x: 30, y: 50, label: 'Esquerda' },
            { x: 50, y: 50, label: 'Centro' },
            { x: 70, y: 50, label: 'Direita' },
            { x: 50, y: 70, label: 'Inferior' }
        ];
    }
    
    function createHorseshoeSpread() {
        return [
            { x: 30, y: 30, label: 'Passado' },
            { x: 50, y: 20, label: 'Presente' },
            { x: 70, y: 30, label: 'Futuro' },
            { x: 20, y: 50, label: 'Conselho' },
            { x: 50, y: 50, label: 'Influências' },
            { x: 80, y: 50, label: 'Obstáculos' },
            { x: 50, y: 80, label: 'Resultado' }
        ];
    }
    

function setupMobileInterface() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) return;
    
    console.log('Configurando interface mobile...');
    
    
    setupMobileSidebar();
    
    
    setupCardSwipe();
    
    
    setupTouchInteractions();
    
    
    setupBottomSheet();
    
    
    setupOrientationDetection();
    
    
    optimizeForTouch();

    setTimeout(fixCardsGridLayout, 100);
    
    
    setTimeout(() => {
        const sidebar = document.querySelector('.mesa-sidebar');
        if (sidebar && window.innerWidth <= 768) {
            sidebar.style.maxHeight = '60vh';
        }
    }, 100);
}
function fixCardsGridLayout() {
    const cardsGrid = document.querySelector('.cards-grid');
    if (cardsGrid) {
        cardsGrid.classList.remove('scrolling');
        
        cardsGrid.style.display = 'grid';
        cardsGrid.style.flexWrap = '';
        cardsGrid.style.overflowX = 'hidden';
        cardsGrid.style.overflowY = 'auto';
        cardsGrid.style.scrollSnapType = '';
        
        const thumbnails = cardsGrid.querySelectorAll('.card-thumbnail');
        thumbnails.forEach(thumb => {
        thumb.style.flex = '';
        thumb.style.width = '';
        thumb.style.scrollSnapAlign = '';
        });
    }
    }
function setupMobileSidebar() {
    const sidebar = document.querySelector('.mesa-sidebar');
    const sidebarNav = sidebar.querySelector('.sidebar-nav');
    const navSections = sidebar.querySelectorAll('.nav-section');
    
    console.log('Configurando sidebar mobile...', navSections.length, 'seções encontradas');
    
    
    navSections.forEach((section, index) => {
        const heading = section.querySelector('h3');
        if (heading) {
            const icon = heading.querySelector('i');
            if (icon) {
                
                const iconClass = Array.from(icon.classList)
                    .find(cls => cls.includes('fa-'));
                
                if (iconClass) {
                    let tabId = '';
                    if (iconClass.includes('sliders')) tabId = 'config';
                    else if (iconClass.includes('clover')) tabId = 'cards';
                    else tabId = 'actions';
                    
                    section.dataset.mobileTab = tabId;
                    console.log('Seção atribuída:', tabId, section);
                }
            }
        }
    });
    
    
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'mobile-tabs';
    tabsContainer.innerHTML = `
        <button class="mobile-tab active" data-tab="config">
            <i class="fas fa-sliders-h"></i>
            <span>Config</span>
        </button>
        <button class="mobile-tab" data-tab="cards">
            <i class="fas fa-clover"></i>
            <span>Cartas</span>
        </button>
        <button class="mobile-tab" data-tab="actions">
            <i class="fas fa-magic"></i>
            <span>Ações</span>
        </button>
    `;
    
    sidebar.insertBefore(tabsContainer, sidebarNav);
    
    
    let actionsSection = sidebar.querySelector('.nav-section[data-mobile-tab="actions"]');
    if (!actionsSection) {
        actionsSection = document.createElement('div');
        actionsSection.className = 'nav-section';
        actionsSection.dataset.mobileTab = 'actions';
        actionsSection.innerHTML = `
            <h3><i class="fas fa-magic"></i> Ações</h3>
            <div class="nav-content">
                <div class="mobile-footer-actions">
                    <button class="primary-btn" id="mobileNewReading">
                        <i class="fas fa-plus-circle"></i>
                        <span>Nova Leitura</span>
                    </button>
                    <button class="secondary-btn" id="mobileClearTable">
                        <i class="fas fa-broom"></i>
                        <span>Limpar Mesa</span>
                    </button>
                    <button class="tertiary-btn" id="mobileToggleFullscreen">
                        <i class="fas fa-expand-alt"></i>
                        <span>Tela Cheia</span>
                    </button>
                </div>
                <div class="control-group" style="margin-top: 20px;">
                    <h4><i class="fas fa-tools"></i> Ferramentas</h4>
                    <div class="card-actions">
                        <button class="btn-icon-text" id="mobileAddRandom">
                            <i class="fas fa-dice"></i>
                            <span>Carta Aleatória</span>
                        </button>
                        <button class="btn-icon-text" id="mobileDrawThree">
                            <i class="fas fa-layer-group"></i>
                            <span>Sortear 3</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        sidebarNav.appendChild(actionsSection);
    }
    
    
    navSections.forEach(section => {
        section.style.display = 'none';
    });
    
    const firstSection = sidebar.querySelector('.nav-section[data-mobile-tab="config"]');
    if (firstSection) {
        firstSection.style.display = 'block';
        firstSection.classList.add('active');
    }
    
    
    tabsContainer.querySelectorAll('.mobile-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            
            tabsContainer.querySelectorAll('.mobile-tab').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            
            sidebar.querySelectorAll('.nav-section[data-mobile-tab]').forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });
            
            
            const targetSection = sidebar.querySelector(`.nav-section[data-mobile-tab="${tabId}"]`);
            if (targetSection) {
                targetSection.style.display = 'block';
                targetSection.classList.add('active');
                
                
                if (tabId === 'cards') {
                    setTimeout(() => {
                        const cardsGrid = targetSection.querySelector('.cards-grid');
                        if (cardsGrid) {
                            cardsGrid.style.display = 'flex';
                        }
                    }, 50);
                }
            }
        });
    });
    
    
    setupMobileButtonEvents();
    
    console.log('Sidebar mobile configurada com sucesso');
}

function setupMobileButtonEvents() {
    
    document.getElementById('mobileNewReading')?.addEventListener('click', newReading);
    document.getElementById('mobileClearTable')?.addEventListener('click', clearTable);
    document.getElementById('mobileToggleFullscreen')?.addEventListener('click', toggleFullscreen);
    document.getElementById('mobileAddRandom')?.addEventListener('click', addRandomCard);
    document.getElementById('mobileDrawThree')?.addEventListener('click', drawThreeCards);
}

function setupCardSwipe() {
    const cardsGrid = document.querySelector('.cards-grid');
    if (!cardsGrid) return;
    
    let startX = 0;
    let scrollLeft = 0;
    let isScrolling = false;
    
    cardsGrid.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        
        startX = e.touches[0].pageX - cardsGrid.offsetLeft;
        scrollLeft = cardsGrid.scrollLeft;
        isScrolling = false;
        
        
        cardsGrid.classList.add('scrolling');
    }, { passive: true });
    
    cardsGrid.addEventListener('touchmove', (e) => {
        if (e.touches.length !== 1) return;
        
        e.preventDefault();
        const x = e.touches[0].pageX - cardsGrid.offsetLeft;
        const walk = (x - startX) * 2;
        
        if (Math.abs(walk) > 5) {
            isScrolling = true;
            cardsGrid.scrollLeft = scrollLeft - walk;
        }
    }, { passive: false });
    
    cardsGrid.addEventListener('touchend', () => {
        cardsGrid.classList.remove('scrolling');
        
        
        if (!isScrolling) {
            
        }
    });
}

function setupTouchInteractions() {
    const cardsArea = document.getElementById('cardsArea');
    
    
    document.querySelectorAll('.card-thumbnail').forEach(thumb => {
        thumb.addEventListener('click', (e) => {
            if (e.target.closest('.card-thumb-actions')) return;
            
            const cardId = thumb.dataset.cardId;
            const card = tarotCards.find(c => c.id == cardId);
            
            if (card) {
                const cardsAreaRect = cardsArea.getBoundingClientRect();
                const x = cardsAreaRect.width / 2;
                const y = cardsAreaRect.height / 2;
                addCardToTable(card, x, y);
                
                
                thumb.style.transform = 'scale(0.95)';
                setTimeout(() => thumb.style.transform = '', 200);
            }
        });
    });
    
    
    cardsArea.addEventListener('touchstart', handleTouchStart, { passive: false });
    cardsArea.addEventListener('touchmove', handleTouchMove, { passive: false });
    cardsArea.addEventListener('touchend', handleTouchEnd);
}

let touchStartX = 0;
let touchStartY = 0;
let touchedCard = null;

function handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    touchedCard = element?.closest('.tarot-card');
    
    if (touchedCard) {
        touchedCard.style.transition = 'none';
        touchedCard.style.zIndex = '1000';
    }
}

function handleTouchMove(e) {
    if (!touchedCard || e.touches.length !== 1) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    
    const currentX = parseFloat(touchedCard.style.left) || 0;
    const currentY = parseFloat(touchedCard.style.top) || 0;
    
    const newX = currentX + dx;
    const newY = currentY + dy;
    
    
    const maxX = cardsArea.offsetWidth - touchedCard.offsetWidth;
    const maxY = cardsArea.offsetHeight - touchedCard.offsetHeight;
    
    touchedCard.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
    touchedCard.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
    
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    
    const cardId = touchedCard.dataset.cardId;
    updateCardPosition(cardId, parseFloat(touchedCard.style.left), parseFloat(touchedCard.style.top));
}

function handleTouchEnd(e) {
    if (!touchedCard) return;
    
    touchedCard.style.transition = 'transform 0.2s, box-shadow 0.2s';
    touchedCard.style.zIndex = '10';
    
    
    if (magnetismStrength > 0) {
        const x = parseFloat(touchedCard.style.left);
        const y = parseFloat(touchedCard.style.top);
        const magnetized = applyMagnetism(x, y);
        
        if (magnetized) {
            touchedCard.style.transition = 'left 0.3s, top 0.3s';
            touchedCard.style.left = magnetized.x + 'px';
            touchedCard.style.top = magnetized.y + 'px';
            
            setTimeout(() => {
                touchedCard.style.transition = 'transform 0.2s, box-shadow 0.2s';
                updateCardPosition(touchedCard.dataset.cardId, magnetized.x, magnetized.y);
            }, 300);
        }
    }
    
    touchedCard = null;
}


function setupBottomSheet() {
    
    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay';
    document.querySelector('.mesa-layout').appendChild(overlay);
    
    
    overlay.addEventListener('click', () => {
        document.querySelector('.info-panel').classList.remove('open');
        overlay.classList.remove('open');
    });
    
    
    const infoPanel = document.querySelector('.info-panel');
    let panelStartY = 0;
    
    infoPanel.addEventListener('touchstart', (e) => {
        panelStartY = e.touches[0].clientY;
    }, { passive: true });
    
    infoPanel.addEventListener('touchmove', (e) => {
        const currentY = e.touches[0].clientY;
        const diff = currentY - panelStartY;
        
        if (diff > 50) { 
            infoPanel.classList.remove('open');
            overlay.classList.remove('open');
        }
    }, { passive: true });
}

function setupOrientationDetection() {
    function checkOrientation() {
        if (window.innerWidth < 768) {
            if (window.innerHeight > window.innerWidth) {
                
                showOrientationNotice();
            } else {
                
                hideOrientationNotice();
            }
        }
    }
    
    function showOrientationNotice() {
        let notice = document.getElementById('orientationNotice');
        if (!notice) {
            notice = document.createElement('div');
            notice.id = 'orientationNotice';
            notice.className = 'orientation-notice';
            notice.innerHTML = `
                <i class="fas fa-rotate-right fa-spin"></i>
                <h3>Gire o Celular</h3>
                <p>Para melhor experiência, use no modo paisagem (deitado)</p>
                <button class="primary-btn" onclick="hideOrientationNotice()">
                    Continuar assim
                </button>
            `;
            document.body.appendChild(notice);
        }
        notice.classList.add('show');
    }
    
    function hideOrientationNotice() {
        const notice = document.getElementById('orientationNotice');
        if (notice) notice.classList.remove('show');
    }
    
    window.checkOrientation = checkOrientation;
    window.hideOrientationNotice = hideOrientationNotice;
    
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    }

    function optimizeForTouch() {
    
    document.querySelectorAll('button').forEach(btn => {
        if (btn.offsetHeight < 44) {
            btn.style.minHeight = '44px';
            btn.style.padding = '12px 16px';
        }
    });
    
    
    document.body.classList.add('touch-device');
    
    
    if (window.innerWidth < 400) {
        document.documentElement.style.fontSize = '14px';
    }
    
    
    const cardsArea = document.getElementById('cardsArea');
    if (cardsArea && window.innerWidth <= 768) {
        cardsArea.style.minHeight = '300px';
    }
}

}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarSistemaMesa);
} else {
    iniciarSistemaMesa();
}


var style = document.createElement('style');
style.textContent = `

#availableCards {
    overflow-y: auto;
    height: 100%;
    padding: 10px;
}

.cards-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: auto;
    gap: 12px;
    padding: 5px;
}

.card-thumbnail {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--bg-paper);
    border-radius: var(--border-radius-sm);
    overflow: hidden;
    cursor: move;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 1px solid var(--border-color);
    min-height: 220px;
    width: 100%;
}

.card-thumbnail:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.card-thumbnail img {
    width: 60%;
    height: 150px;
    object-fit: cover;
    margin-top: 10px;
    border-radius: 4px;
}

.card-thumb-info {
    padding: 10px;
    width: 100%;
    text-align: center;
    background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.05));
}

.card-thumb-info .card-name {
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-color);
}

.card-thumb-info .card-group {
    font-size: 0.7rem;
    color: var(--text-light);
    font-style: italic;
}

.card-thumb-actions {
    position: absolute;
    top: 5px;
    right: 5px;
    display: flex;
    gap: 5px;
}

.card-thumb-actions button {
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
}

.card-thumb-actions button:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
}

.card-placeholder {
    width: 100%;
    height: 250px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--bg-color);
    color: var(--text-light);
    margin-top: 10px;
    border-radius: 4px;
}

.card-placeholder i {
    font-size: 2rem;
    margin-bottom: 10px;
    color: var(--primary-color);
}

.card-placeholder .card-name {
    font-size: 0.8rem;
    text-align: center;
    padding: 0 10px;
    color: var(--text-light);
}


.toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: var(--primary-color);
    color: white;
    padding: 12px 20px;
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    transform: translateY(100px);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
    max-width: 300px;
}

.toast.show {
    transform: translateY(0);
    opacity: 1;
}

.toast-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.toast i {
    font-size: 1.2rem;
}

.toast-success {
    background-color: #4caf50;
}

.toast-error {
    background-color: #f44336;
}

.toast-info {
    background-color: var(--primary-color);
}


.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-light);
    text-align: center;
    padding: 40px;
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 20px;
    color: var(--primary-color);
}

.empty-state h4 {
    margin: 10px 0;
    font-size: 1.2rem;
}

.empty-state p {
    margin: 5px 0;
    font-size: 0.9rem;
}


@media (max-width: 1400px) {
    .cards-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .card-thumbnail img {
        height: 220px;
    }
}

@media (max-width: 1200px) {
    .cards-grid {
        grid-template-columns: 1fr;
    }
}
`;
document.head.appendChild(style);
