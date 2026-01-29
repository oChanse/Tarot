document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('tarotGrid');

    fetch('cards.json')
        .then(response => response.json())
        .then(data => {
            renderCards(data);
        })
        .catch(error => {
            console.error('Erro ao carregar cartas:', error);
            grid.innerHTML = '<p style="text-align:center;">Erro ao carregar o oráculo.</p>';
        });

    function renderCards(cards) {
        cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = `card-container ${card.group}`;

            cardEl.innerHTML = `
                <div class="card-content">
                    <img class="card-img" src="images/${card.img}" loading="lazy" alt="${card.name}" onerror="this.src='https://via.placeholder.com/150x220/1b1026/e0d9e6?text=Tarot'">
                    <div class="card-name">${card.name}</div>
                    <div class="card-meaning">${card.meaning}</div>
                </div>
            `;

            cardEl.addEventListener('click', () => {
                const content = cardEl.querySelector('.card-content');
                const nameEl = cardEl.querySelector('.card-name');
                const meaningEl = cardEl.querySelector('.card-meaning');

                content.classList.add('fading');

                setTimeout(() => {
                    const isReversed = cardEl.classList.toggle('is-reversed');

                    if (isReversed) {
                        nameEl.textContent = `${card.name} (Invertida)`;
                        meaningEl.textContent = card.reversed;
                    } else {
                        nameEl.textContent = card.name;
                        meaningEl.textContent = card.meaning;
                    }

                    content.classList.remove('fading');
                }, 300);
            });

            grid.appendChild(cardEl);
        });
    }
});
