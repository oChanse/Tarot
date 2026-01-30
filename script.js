document.addEventListener('DOMContentLoaded', () => {

    const grid = document.getElementById('tarotGrid');
    const spreadArea = document.getElementById('spreadArea');
    const spreadSelect = document.getElementById('spreadSelect');
    const resetBtn = document.getElementById('resetReading');
    const tabs = document.querySelectorAll('.nav-btn');
    const contents = document.querySelectorAll('.tab-content');
    const modal = document.getElementById('cardSelectorModal');
    const modalGrid = document.getElementById('modalGrid');
    const closeModalBtn = document.querySelector('.close-modal');

    let allCards = [];
    let currentSlotContext = null;

    window.openSubTab = function(evt, tabName) {
        const subContents = document.getElementsByClassName("sub-content");
        for (let i = 0; i < subContents.length; i++) {
            subContents[i].classList.remove("active");
        }

        const subLinks = document.getElementsByClassName("sub-tab-btn");
        for (let i = 0; i < subLinks.length; i++) {
            subLinks[i].classList.remove("active");
        }

        document.getElementById(tabName).classList.add("active");
        evt.currentTarget.classList.add("active");
    };

    fetch('cards.json')
        .then(response => response.json())
        .then(data => {
            allCards = data;
            renderLibrary(allCards);
            renderModalGrid(allCards);
            initSpreadSystem();
        })
        .catch(err => console.error("Erro ao carregar cartas:", err));

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.getAttribute('data-target')).classList.add('active');
        });
    });

    function renderLibrary(cards) {
        grid.innerHTML = '';
        cards.forEach(card => grid.appendChild(createLibraryCard(card)));
    }

    function createLibraryCard(card) {
        const el = document.createElement('div');
        el.className = `card-container ${card.group || ''}`;
        el.innerHTML = `
            <div class="card-content">
                <img class="card-img" src="images/${card.img}" alt="${card.name}">
                <div class="card-name">${card.name}</div>
                <div class="card-meaning">${card.meaning}</div>
            </div>
        `;

        el.addEventListener('click', () => {
            const isRev = el.classList.toggle('is-reversed');
            const nameEl = el.querySelector('.card-name');
            const meanEl = el.querySelector('.card-meaning');
            nameEl.textContent = isRev ? `${card.name} (Invertida)` : card.name;
            meanEl.textContent = isRev ? card.reversed : card.meaning;
        });

        return el;
    }

    function renderModalGrid(cards) {
        modalGrid.innerHTML = '';
        cards.forEach(card => {
            const mini = document.createElement('div');
            mini.className = 'mini-card';
            mini.innerHTML = `<img src="images/${card.img}"><span>${card.name}</span>`;
            mini.addEventListener('click', () => selectCardForSlot(card));
            modalGrid.appendChild(mini);
        });
    }

    function openModal(context) {
        currentSlotContext = context;
        modal.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
        currentSlotContext = null;
    }

    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

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
        renderSpread('one');
        spreadSelect.addEventListener('change', (e) => renderSpread(e.target.value));
        resetBtn.addEventListener('click', () => renderSpread(spreadSelect.value));
    }

    function renderSpread(type) {
        spreadArea.innerHTML = '';
        const spreadData = spreads[type];

        document.getElementById('spreadDescription').innerHTML =
            `<strong>${spreadSelect.options[spreadSelect.selectedIndex].text}:</strong> ${spreadData.desc}`;

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
                openModal({ slotElement: slot, headerElement: header, descElement: desc, positionName: slotInfo.name });
            });

            wrapper.appendChild(header);
            wrapper.appendChild(slot);
            wrapper.appendChild(desc);
            spreadArea.appendChild(wrapper);
        });
    }

    function selectCardForSlot(card) {
        if (!currentSlotContext) return;

        const { slotElement, headerElement, descElement, positionName } = currentSlotContext;

        headerElement.innerHTML = `${card.name}<small>${positionName}</small>`;
        slotElement.innerHTML = '';
        slotElement.classList.add('filled');

        const img = document.createElement('img');
        img.src = `images/${card.img}`;
        img.className = 'slot-image';
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

        closeModal();
    }

});
