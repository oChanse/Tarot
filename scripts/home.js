
document.addEventListener('DOMContentLoaded', function() {
    console.log('Átrio da Bibliotheca carregado');
    
    
    const pathCards = document.querySelectorAll('.path-card');
    pathCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const path = this.getAttribute('data-path');
            
            
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 200);
            
            
            switch(path) {
                case 'cartas':
                    alert('Redirecionando para: Estudo das Cartas');
                    
                    break;
                case 'perguntas':
                    alert('Redirecionando para: Estudo das Perguntas');
                    
                    break;
                case 'leituras':
                    alert('Redirecionando para: Prática de Leituras');
                    
                    break;
                case 'autoconhecimento':
                    alert('Redirecionando para: Tarot e Autoconhecimento');
                    
                    break;
            }
        });
    });
    
    
    initTipsSlider();
});


function initTipsSlider() {
    const tipCards = document.querySelectorAll('.tip-card');
    const tipDots = document.querySelectorAll('.tip-dot');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    let currentIndex = 0;
    
    
    function showTip(index) {
        
        tipCards.forEach(card => {
            card.classList.remove('active');
        });
        
        
        tipDots.forEach(dot => {
            dot.classList.remove('active');
        });
        
        
        if (index < 0) index = tipCards.length - 1;
        if (index >= tipCards.length) index = 0;
        
        
        tipCards[index].classList.add('active');
        tipDots[index].classList.add('active');
        
        currentIndex = index;
    }
    
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            showTip(currentIndex - 1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            showTip(currentIndex + 1);
        });
    }
    
    
    tipDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showTip(index);
        });
    });
    
    
    setInterval(() => {
        showTip(currentIndex + 1);
    }, 10000);
}
