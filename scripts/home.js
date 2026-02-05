

console.log('home.js carregado - inicializando...');


function initHomePage() {
    console.log('Inicializando página Home...');
    
    
    setupPathCards();
    
    
    initTipsSlider();
    
    
    setTimeout(() => {
        const tipCards = document.querySelectorAll('.tip-card');
        tipCards.forEach(card => {
            card.style.display = 'none';
        });
        
        const activeCard = document.querySelector('.tip-card.active');
        if (activeCard) {
            activeCard.style.display = 'block';
        }
    }, 100);
}


function setupPathCards() {
    console.log('Configurando path cards...');
    
    
    document.addEventListener('click', function(e) {
        
        const pathCard = e.target.closest('.path-card');
        if (pathCard) {
            e.preventDefault();
            
            
            pathCard.style.transform = 'scale(0.98)';
            setTimeout(() => {
                pathCard.style.transform = '';
            }, 200);
            
            
            const path = pathCard.getAttribute('data-path');
            console.log(`Path card clicado: ${path}`);
            
            
            if (typeof window.loadPage === 'function') {
                window.loadPage(path);
                
                
                if (typeof window.setActiveNavLink === 'function') {
                    window.setActiveNavLink(path);
                }
            } else {
                console.error('Função loadPage não encontrada no escopo global');
                alert(`Redirecionando para: ${path}`);
            }
        }
    });
}


function initTipsSlider() {
    console.log('Inicializando tips slider...');
    
    
    setTimeout(() => {
        const tipCards = document.querySelectorAll('.tip-card');
        const tipDots = document.querySelectorAll('.tip-dot');
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        
        console.log(`Encontrados ${tipCards.length} tip cards`);
        console.log(`Encontrados ${tipDots.length} tip dots`);
        
        if (tipCards.length === 0) {
            console.warn('Nenhum tip card encontrado! Verifique o HTML.');
            return;
        }
        
        let currentIndex = 0;
        let autoRotateInterval;
        
        
        function showTip(index) {
            console.log(`Mostrando tip ${index}`);
            
            
            if (index < 0) index = tipCards.length - 1;
            if (index >= tipCards.length) index = 0;
            
            
            tipCards.forEach(card => {
                card.classList.remove('active');
                card.style.display = 'none';
            });
            
            tipDots.forEach(dot => {
                dot.classList.remove('active');
            });
            
            
            tipCards[index].classList.add('active');
            tipCards[index].style.display = 'block';
            
            if (tipDots[index]) {
                tipDots[index].classList.add('active');
            }
            
            currentIndex = index;
        }
        
        
        if (prevBtn) {
            console.log('Configurando botão anterior');
            prevBtn.addEventListener('click', function() {
                console.log('Botão anterior clicado');
                showTip(currentIndex - 1);
                resetAutoRotate();
            });
        }
        
        if (nextBtn) {
            console.log('Configurando botão próximo');
            nextBtn.addEventListener('click', function() {
                console.log('Botão próximo clicado');
                showTip(currentIndex + 1);
                resetAutoRotate();
            });
        }
        
        
        tipDots.forEach((dot, index) => {
            dot.addEventListener('click', function() {
                console.log(`Dot ${index} clicado`);
                showTip(index);
                resetAutoRotate();
            });
        });
        
        
        function startAutoRotate() {
            if (autoRotateInterval) {
                clearInterval(autoRotateInterval);
            }
            
            autoRotateInterval = setInterval(() => {
                console.log('Auto-rotacionando para próximo tip');
                showTip(currentIndex + 1);
            }, 5000); 
        }
        
        
        function resetAutoRotate() {
            startAutoRotate();
        }
        
        
        const initialActive = document.querySelector('.tip-card.active');
        if (initialActive) {
            const initialIndex = Array.from(tipCards).indexOf(initialActive);
            currentIndex = initialIndex;
            console.log(`Tip ativo inicial: ${currentIndex}`);
        } else {
            
            if (tipCards.length > 0) {
                showTip(0);
            }
        }
        
        
        setTimeout(() => {
            showTip(currentIndex);
        }, 50);
        
        
        startAutoRotate();
        
        
        window.addEventListener('beforeunload', function() {
            if (autoRotateInterval) {
                clearInterval(autoRotateInterval);
            }
        });
        
    }, 300); 
}


if (document.readyState === 'loading') {
    
    document.addEventListener('DOMContentLoaded', initHomePage);
} else {
    
    initHomePage();
}


window.initHomePage = initHomePage;
window.setupPathCards = setupPathCards;
window.initTipsSlider = initTipsSlider;

console.log('home.js carregado com sucesso');
