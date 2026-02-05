


window.bibliotheca = window.bibliotheca || {
    currentPage: 'home',
    theme: 'light',
    isMobileMenuOpen: false
};


document.addEventListener('DOMContentLoaded', function() {
    console.log('Bibliotheca inicializando...');
    
    
    initTheme();
    
    
    initNavigation();
    
    
    loadPage('home');
    
    
    setCurrentYear();
    
    
    carregarContador();
    
    
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('mobileMenuToggle').addEventListener('click', toggleMobileMenu);
    
    console.log('Bibliotheca inicializada com sucesso');
});


async function carregarContador() {
    const key = "bibliotheca-visitas";

    try {
        const response = await fetch(
            `https://countapi.mileshilliard.com/api/v1/hit/${key}`
        );

        const data = await response.json();

        const contadorEl = document.getElementById("contador");
        if (contadorEl) {
            contadorEl.textContent = data.value.toLocaleString('pt-BR');
            
            
            contadorEl.style.transform = 'scale(1.1)';
            setTimeout(() => {
                contadorEl.style.transform = 'scale(1)';
            }, 300);
        }
    } catch (error) {
        console.error("Erro ao carregar contador:", error);
        const contadorEl = document.getElementById("contador");
        if (contadorEl) {
            contadorEl.textContent = "∞";
        }
    }
}


function setCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}


function initTheme() {
    const savedTheme = localStorage.getItem('bibliotheca-theme') || 'light';
    window.bibliotheca.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}


function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    window.bibliotheca.theme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('bibliotheca-theme', newTheme);
    updateThemeIcon(newTheme);
}


function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}


function toggleMobileMenu() {
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav) {
        const isVisible = mobileNav.style.display === 'block';
        mobileNav.style.display = isVisible ? 'none' : 'block';
        window.bibliotheca.isMobileMenuOpen = !isVisible;
    }
}


function initNavigation() {
    
    const desktopLinks = document.querySelectorAll('.desktop-nav .nav-link');
    desktopLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            setActiveNavLink(page);
            loadPage(page);
        });
    });
    
    
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            setActiveNavLink(page);
            loadPage(page);
            
            
            const mobileNav = document.querySelector('.mobile-nav');
            if (window.innerWidth <= 768 && mobileNav.style.display === 'block') {
                mobileNav.style.display = 'none';
                window.bibliotheca.isMobileMenuOpen = false;
            }
        });
    });
}


function setActiveNavLink(page) {
    
    const allLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    allLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    
    const activeDesktopLink = document.querySelector(`.nav-link[data-page="${page}"]`);
    const activeMobileLink = document.querySelector(`.mobile-nav-link[data-page="${page}"]`);
    
    if (activeDesktopLink) activeDesktopLink.classList.add('active');
    if (activeMobileLink) activeMobileLink.classList.add('active');
    
    
    window.bibliotheca.currentPage = page;
}


function loadPage(page) {
    console.log(`Carregando página: ${page}`);
    
    const contentArea = document.getElementById('contentArea');
    
    
    contentArea.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Carregando ${getPageTitle(page)}...</p>
        </div>
    `;
    
    
    fetch(`parts/${page}.html`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar a página: ${response.statusText}`);
            }
            return response.text();
        })
        .then(html => {
            
            contentArea.innerHTML = html;
            
            
            loadPageCSS(page);
            
            
            loadPageScript(page);
            
            
            window.scrollTo(0, 0);
            
            console.log(`Página ${page} carregada com sucesso`);
        })
        .catch(error => {
            console.error('Erro ao carregar página:', error);
            contentArea.innerHTML = `
                <div class="error-container">
                    <h2>Erro ao carregar a página</h2>
                    <p>${error.message}</p>
                    <button onclick="loadPage('home')" class="btn-primary">
                        <i class="fas fa-home"></i> Voltar para o início
                    </button>
                </div>
            `;
        });
}


function getPageTitle(page) {
    const titles = {
        'home': 'Início',
        'estudos': 'Estudos',
        'cartas': 'Cartas',
        'mesa': 'Mesa'
    };
    
    return titles[page] || page;
}


function waitForElement(selector, callback, maxAttempts = 30) {
    let attempts = 0;
    const interval = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
            clearInterval(interval);
            callback(element);
        } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.warn(`Elemento ${selector} não encontrado após ${maxAttempts} tentativas`);
        }
        attempts++;
    }, 100);
}


function loadPageCSS(page) {
    
    const existingPageCSS = document.getElementById('page-css');
    if (existingPageCSS) {
        existingPageCSS.remove();
    }
    
    
    const link = document.createElement('link');
    link.id = 'page-css';
    link.rel = 'stylesheet';
    link.href = `visuals/${page}.css`;
    
    
    link.onload = function() {
        console.log(`CSS ${page}.css carregado com sucesso`);
    };
    
    link.onerror = function() {
        console.warn(`CSS ${page}.css não encontrado, usando estilo padrão`);
    };
    
    document.head.appendChild(link);
}


function loadPageScript(page) {
    console.log(`Carregando script: ${page}.js`);
    
    
    const existingPageScript = document.getElementById('page-script');
    if (existingPageScript) {
        console.log('Removendo script anterior');
        existingPageScript.remove();
    }
    
    
    const script = document.createElement('script');
    script.id = 'page-script';
    script.src = `scripts/${page}.js`;
    
    
    script.onload = function() {
        console.log(`Script ${page}.js carregado com sucesso`);
        
        
        if (typeof window.initHomePage === 'function' && page === 'home') {
            console.log('Executando initHomePage...');
            setTimeout(() => {
                window.initHomePage();
            }, 100);
        }
    };
    
    script.onerror = function() {
        console.warn(`Script ${page}.js não encontrado ou não carregado`);
        
        
        if (page === 'home') {
            console.log('Tentando inicializar home sem script específico...');
            setTimeout(() => {
                if (typeof window.initHomePage === 'function') {
                    window.initHomePage();
                }
            }, 300);
        }
    };
    
    document.body.appendChild(script);
}


window.loadPage = loadPage;
window.setActiveNavLink = setActiveNavLink;
window.toggleTheme = toggleTheme;
window.toggleMobileMenu = toggleMobileMenu;

console.log('main.js carregado com sucesso');
