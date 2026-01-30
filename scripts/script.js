document.addEventListener('partialsLoaded', () => {
    console.log("Partials carregados! Inicializando sistema...");
    
    const grid = document.getElementById('tarotGrid');
    const spreadArea = document.getElementById('spreadArea');
    const spreadSelect = document.getElementById('spreadSelect');
    const resetBtn = document.getElementById('resetReading');
    const modal = document.getElementById('cardSelectorModal');
    const modalGrid = document.getElementById('modalGrid');
    const closeModalBtn = document.querySelector('.close-modal');

    let allCards = [];
    let currentSlotContext = null;

    if (!grid || !spreadArea || !spreadSelect) {
        console.warn("Alguns elementos não foram encontrados. Verificando novamente...");
        setTimeout(initializeIfReady, 100);
        return;
    }

    window.openSubTab = function(evt, tabName) {
        const subContents = document.getElementsByClassName("sub-content");
        for (let i = 0; i < subContents.length; i++) {
            subContents[i].classList.remove("active");
        }

        const subLinks = document.getElementsByClassName("sub-tab-btn");
        for (let i = 0; i < subLinks.length; i++) {
            subLinks[i].classList.remove("active");
        }

        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add("active");
        }
        
        if (evt.currentTarget) {
            evt.currentTarget.classList.add("active");
        }
    };

    function initializeEvents() {
        const tabs = document.querySelectorAll('.nav-btn');
        const contents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                const targetId = tab.getAttribute('data-target');
                const targetContent = document.getElementById(targetId);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
        
        const subNav = document.getElementById('subNav');
        if (subNav) {
            subNav.addEventListener('click', (e) => {
                const btn = e.target.closest('.sub-tab-btn');
                if (!btn) return;
                
                const tabName = btn.getAttribute('data-subtab');
                if (!tabName) return;
                
                document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.sub-content').forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                
                const targetTab = document.getElementById(tabName);
                if (targetTab) {
                    targetTab.classList.add('active');
                }
            });
        }
        
        const cardSearch = document.getElementById('cardSearch');
        const modalSearch = document.getElementById('modalSearch');
        const clearSearch = document.getElementById('clearSearch');
        
        if (cardSearch) {
            cardSearch.addEventListener('input', (e) => {
                filterCards(e.target.value.toLowerCase());
                if (clearSearch) {
                    if (e.target.value) {
                        clearSearch.classList.add('visible');
                    } else {
                        clearSearch.classList.remove('visible');
                    }
                }
            });
            
            cardSearch.addEventListener('focus', () => {
                if (clearSearch && cardSearch.value) {
                    clearSearch.classList.add('visible');
                }
            });
            
            cardSearch.addEventListener('blur', () => {
                if (clearSearch) {
                    setTimeout(() => {
                        if (!document.activeElement.classList.contains('search-clear')) {
                            clearSearch.classList.remove('visible');
                        }
                    }, 100);
                }
            });
        }
        
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                if (cardSearch) {
                    cardSearch.value = '';
                    cardSearch.focus();
                    filterCards('');
                    clearSearch.classList.remove('visible');
                }
            });
            
            clearSearch.addEventListener('mouseenter', () => {
                clearSearch.classList.add('visible');
            });
        }
        
        if (modalSearch) {
            modalSearch.addEventListener('input', (e) => {
                filterModalCards(e.target.value.toLowerCase());
            });
        }
    }

    fetch('files/cards.json')
        .then(response => response.json())
        .then(data => {
            allCards = data;
            renderLibrary(allCards);
            renderModalGrid(allCards);
            initSpreadSystem();
            console.log("Cartas carregadas com sucesso!");
        })
        .catch(err => console.error("Erro ao carregar cartas:", err));

    function renderLibrary(cards) {
        if (!grid) {
            console.error("Elemento tarotGrid não encontrado!");
            return;
        }
        
        grid.innerHTML = '';
        cards.forEach(card => {
            const cardElement = createLibraryCard(card);
            if (cardElement) {
                grid.appendChild(cardElement);
            }
        });
    }

    function createLibraryCard(card) {
        const el = document.createElement('div');
        el.className = `card-container ${card.group || ''}`;
        el.innerHTML = `
            <div class="card-content">
                <img class="card-img" src="images/${card.img}" alt="${card.name}" loading="lazy">
                <div class="card-name">${card.name}</div>
                <div class="card-meaning">${card.meaning}</div>
            </div>
        `;

        el.addEventListener('click', () => {
            const isRev = el.classList.toggle('is-reversed');
            const nameEl = el.querySelector('.card-name');
            const meanEl = el.querySelector('.card-meaning');
            if (nameEl && meanEl) {
                nameEl.textContent = isRev ? `${card.name} (Invertida)` : card.name;
                meanEl.textContent = isRev ? card.reversed : card.meaning;
            }
        });

        return el;
    }

    function renderModalGrid(cards) {
        if (!modalGrid) {
            console.error("Elemento modalGrid não encontrado!");
            return;
        }
        
        modalGrid.innerHTML = '';
        cards.forEach(card => {
            const mini = document.createElement('div');
            mini.className = 'mini-card';
            mini.innerHTML = `<img src="images/${card.img}" alt="${card.name}"><span>${card.name}</span>`;
            mini.addEventListener('click', () => selectCardForSlot(card));
            modalGrid.appendChild(mini);
        });
    }

    function filterCards(searchTerm) {
        const grid = document.getElementById('tarotGrid');
        if (!grid || !allCards) return;
        
        const cardElements = grid.querySelectorAll('.card-container');
        let visibleCount = 0;
        
        cardElements.forEach(cardEl => {
            const name = cardEl.querySelector('.card-name')?.textContent?.toLowerCase() || '';
            const meaning = cardEl.querySelector('.card-meaning')?.textContent?.toLowerCase() || '';
            
            const matches = name.includes(searchTerm) || meaning.includes(searchTerm);
            cardEl.style.display = matches ? '' : 'none';
            
            if (matches) visibleCount++;
        });
        
        updateResultsCount(visibleCount, cardElements.length);
    }

    function filterModalCards(searchTerm) {
    const modalGrid = document.getElementById('modalGrid');
    if (!modalGrid) return;
    
    const miniCards = modalGrid.querySelectorAll('.mini-card');
    let visibleCount = 0;
    
    miniCards.forEach(miniCard => {
        const name = miniCard.querySelector('span')?.textContent?.toLowerCase() || '';
        const matches = name.includes(searchTerm);
        
        if (matches) {
            miniCard.classList.remove('hidden');
            miniCard.style.display = '';
        } else {
            miniCard.classList.add('hidden');
            miniCard.style.display = 'none';
        }
        
        if (matches) visibleCount++;
    });
    
    updateModalResultsCount(visibleCount, miniCards.length);
    
    modalGrid.style.display = 'none';
    modalGrid.offsetHeight;
    modalGrid.style.display = 'grid';
}

    function updateResultsCount(visible, total) {
        let resultsEl = document.getElementById('searchResults');
        if (!resultsEl) {
            resultsEl = document.createElement('div');
            resultsEl.id = 'searchResults';
            resultsEl.className = 'search-results';
            document.querySelector('.search-container').appendChild(resultsEl);
        }
        
        if (visible === total) {
            resultsEl.textContent = '';
        } else {
            resultsEl.textContent = `${visible} de ${total} cartas`;
        }
    }

    function updateModalResultsCount(visible, total) {
        let resultsEl = document.querySelector('.modal-results');
        if (!resultsEl) {
            resultsEl = document.createElement('div');
            resultsEl.className = 'modal-results search-results';
            document.querySelector('.modal-search-container').appendChild(resultsEl);
        }
        
        if (visible === total) {
            resultsEl.textContent = '';
        } else {
            resultsEl.textContent = `${visible} de ${total} cartas`;
        }
    }

    function openModal(context) {
        currentSlotContext = context;
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    function closeModal() {
        if (modal) {
            modal.classList.add('hidden');
        }
        currentSlotContext = null;
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => { 
            if (e.target === modal) closeModal(); 
        });
    }

    const spreads = {
        'one': { desc: "Resposta nua, sem desvio. O núcleo da questão.", slots: [{ name: 'A Resposta' }] },
        'two_light_shadow': { desc: "O visível e o oculto em tensão.", slots: [{ name: 'Luz' }, { name: 'Sombra' }] },
        'three_time': { desc: "O fio do tempo em três pulsações.", slots: [{ name: 'Passado' }, { name: 'Presente' }, { name: 'Futuro' }] },
        'three_dilemma': { desc: "Onde você está, o que trava, o que guia.", slots: [{ name: 'Situação' }, { name: 'Obstáculo' }, { name: 'Conselho' }] },
        'two_qa': { desc: "O que pede resposta e o que exige movimento.", slots: [{ name: 'A Questão' }, { name: 'A Ação' }] },
        'cross_simple': { desc: "Estrutura essencial da situação.", slots: [{ name: '1. Situação' }, { name: '2. Desafio' }, { name: '3. Base' }, { name: '4. Resultado' }] },
        'path_five': { desc: "De onde vem, por onde passa, onde chega.", slots: [{ name: '1. Origem' }, { name: '2. Momento' }, { name: '3. Ajuda' }, { name: '4. Estorvo' }, { name: '5. Destino' }] },
        'choice_ab': { desc: "Dois caminhos, dois desfechos.", slots: [{ name: 'Foco' }, { name: 'Opção A: Caminho' }, { name: 'Opção A: Fim' }, { name: 'Opção B: Caminho' }, { name: 'Opção B: Fim' }] },
        'horseshoe': { desc: "Evolução gradual da situação.", slots: [{ name: '1. Passado' }, { name: '2. Presente' }, { name: '3. Futuro' }, { name: '4. Você' }, { name: '5. Outros' }, { name: '6. Medos' }, { name: '7. Final' }] },
        'celtic_simple': { desc: "Camadas conscientes e inconscientes do conflito.", slots: [{ name: '1. Situação' }, { name: '2. Obstáculo' }, { name: '3. Consciente' }, { name: '4. Inconsciente' }, { name: '5. Passado' }, { name: '6. Futuro' }, { name: '7. Resultado' }] },
        'relationship': { desc: "Espelhos emocionais entre duas vontades.", slots: [{ name: '1. Você' }, { name: '2. O Outro' }, { name: '3. Sente (Você)' }, { name: '4. Sente (Outro)' }, { name: '5. Vínculo' }, { name: '6. Futuro' }] },
        'mirror': { desc: "O eu que se mostra, o eu que se esconde.", slots: [{ name: '1. Máscara' }, { name: '2. Sombra' }, { name: '3. Desejo' }, { name: '4. Medo' }, { name: '5. Integração' }] },
        'karmic': { desc: "Movimentos do passado moldando o agora.", slots: [{ name: '1. Passado Longínquo' }, { name: '2. Passado Recente' }, { name: '3. Presente' }, { name: '4. Futuro Próximo' }, { name: '5. Lição Kármica' }] },
        'decision_map': { desc: "Radiografia interna de uma escolha difícil.", slots: [{ name: '1. Motivo' }, { name: '2. Medo' }, { name: '3. Ganho' }, { name: '4. Perda' }, { name: '5. Conselho Int.' }, { name: '6. Conselho Ext.' }, { name: '7. Risco' }, { name: '8. Resultado' }] },
        'mandala_simple': { desc: "Ciclos centrais da vida em equilíbrio.", slots: [{ name: '1. Eu' }, { name: '2. $$' }, { name: '3. Mente' }, { name: '4. Lar' }, { name: '5. Criatividade' }, { name: '6. Saúde' }, { name: '7. Parcerias' }, { name: '8. Fim/Início' }] },
        'mandala_center': { desc: "Forças que orbitam um eixo central.", slots: [{ name: 'EIXO' }, { name: 'Norte' }, { name: 'Nordeste' }, { name: 'Leste' }, { name: 'Sudeste' }, { name: 'Sul' }, { name: 'Sudoeste' }, { name: 'Oeste' }, { name: 'Noroeste' }] },
        'tree': { desc: "Estrutura viva do crescimento.", slots: [{ name: 'Raiz 1' }, { name: 'Raiz 2' }, { name: 'Tronco' }, { name: 'Galho Esq.' }, { name: 'Galho Dir.' }, { name: 'Folha 1' }, { name: 'Folha 2' }, { name: 'Folha 3' }, { name: 'Topo' }, { name: 'Fruto' }] },
        'celtic_full': { desc: "A leitura completa do destino em movimento.", slots: [{ name: '1. Centro' }, { name: '2. Cruzando' }, { name: '3. Raiz' }, { name: '4. Passado' }, { name: '5. Coroa' }, { name: '6. Futuro' }, { name: '7. Si Mesmo' }, { name: '8. Ambiente' }, { name: '9. Esperanças' }, { name: '10. Resultado' }] },
        'self_map': { desc: "Mapa simbólico da psique.", slots: [{ name: '1. Ego' }, { name: '2. Valores' }, { name: '3. Mente' }, { name: '4. Base' }, { name: '5. Expressão' }, { name: '6. Rotina' }, { name: '7. O Outro' }, { name: '8. Transformação' }, { name: '9. Expansão' }, { name: '10. Missão' }, { name: '11. Social' }, { name: '12. Inconsciente' }] },
        'chaos': { desc: "Fragmentos dispersos buscando sentido.", slots: [{ name: 'Caos 1' }, { name: 'Caos 2' }, { name: 'Caos 3' }, { name: 'Caos 4' }, { name: 'Caos 5' }, { name: 'Caos 6' }, { name: 'Caos 7' }, { name: 'Caos 8' }, { name: 'Caos 9' }, { name: 'Caos 10' }, { name: 'Caos 11' }, { name: 'Caos 12' }, { name: 'SÍNTESE' }] }
    };

    function initSpreadSystem() {
        if (!spreadArea || !spreadSelect || !resetBtn) {
            console.error("Elementos do spread não encontrados!");
            return;
        }
        
        renderSpread('one');
        
        spreadSelect.addEventListener('change', (e) => renderSpread(e.target.value));
        resetBtn.addEventListener('click', () => renderSpread(spreadSelect.value));
        
        console.log("Sistema de spreads inicializado!");
    }

    function renderSpread(type) {
        if (!spreadArea || !spreadSelect) return;
        
        spreadArea.innerHTML = '';
        const spreadData = spreads[type];

        const descBox = document.getElementById('spreadDescription');
        if (descBox && spreadData) {
            descBox.innerHTML = `<strong>${spreadSelect.options[spreadSelect.selectedIndex].text}:</strong> ${spreadData.desc}`;
        }

        if (spreadData && spreadData.slots) {
            spreadData.slots.forEach(slotInfo => {
                const wrapper = document.createElement('div');
                wrapper.className = 'slot-wrapper';

                const header = document.createElement('div');
                header.className = 'slot-header';
                header.innerHTML = slotInfo.name;

                const slot = document.createElement('div');
                slot.className = 'card-slot';
                slot.innerHTML = `<span style="color:var(--text-muted); font-size:2rem;">+</span>`;

                const desc = document.createElement('div');
                desc.className = 'slot-desc';

                slot.addEventListener('click', function() {
                    if (slot.classList.contains('filled')) return;
                    openModal({ 
                        slotElement: slot, 
                        headerElement: header, 
                        descElement: desc, 
                        positionName: slotInfo.name 
                    });
                });

                wrapper.appendChild(header);
                wrapper.appendChild(slot);
                wrapper.appendChild(desc);
                spreadArea.appendChild(wrapper);
            });
        }
    }

    function selectCardForSlot(card) {
        if (!currentSlotContext) return;

        const { slotElement, headerElement, descElement, positionName } = currentSlotContext;

        if (slotElement) {
            headerElement.innerHTML = `${card.name}<small>${positionName}</small>`;
            slotElement.innerHTML = '';
            slotElement.classList.add('filled');

            const img = document.createElement('img');
            img.src = `images/${card.img}`;
            img.className = 'slot-image';
            img.alt = card.name;
            slotElement.appendChild(img);

            descElement.textContent = card.meaning;
            descElement.classList.add('visible');
            descElement.classList.remove('reversed-text');

            img.addEventListener('click', (e) => {
                e.stopPropagation();
                const isReversed = img.classList.toggle('reversed');

                if (isReversed) {
                    descElement.textContent = card.reversed;
                    descElement.classList.add('reversed-text');
                    headerElement.innerHTML = `${card.name} (Inv.)<small>${positionName}</small>`;
                } else {
                    descElement.textContent = card.meaning;
                    descElement.classList.remove('reversed-text');
                    headerElement.innerHTML = `${card.name}<small>${positionName}</small>`;
                }
            });
        }

        closeModal();
    }

    function initializeIfReady() {
        const criticalElements = [
            'tarotGrid', 'spreadArea', 'spreadSelect', 
            'cardSelectorModal', 'modalGrid'
        ];
        
        const allExist = criticalElements.every(id => document.getElementById(id));
        
        if (allExist) {
            console.log("Todos os elementos encontrados. Inicializando...");
            initializeEvents();
        } else {
            console.log("Aguardando elementos...");
            setTimeout(initializeIfReady, 100);
        }
    }
    
    initializeIfReady();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            document.dispatchEvent(new Event('partialsLoaded'));
        }, 100);
    });
} else {
    setTimeout(() => {
        document.dispatchEvent(new Event('partialsLoaded'));
    }, 100);
}