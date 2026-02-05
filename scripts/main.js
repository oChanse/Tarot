

document.addEventListener('DOMContentLoaded', function() {
    
    initTheme();
    initNavigation();
    loadPage('home');
    setCurrentYear();
    carregarContador();
    
    
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('mobileMenuToggle').addEventListener('click', toggleMobileMenu);
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
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
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
            if (window.innerWidth <= 768) {
                mobileNav.style.display = 'none';
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
}

function loadPage(page) {
    const contentArea = document.getElementById('contentArea');
    
    
    contentArea.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Carregando ${page}...</p>
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
        })
        .catch(error => {
            console.error('Erro:', error);
            contentArea.innerHTML = `
                <div class="error-container">
                    <h2>Erro ao carregar a página</h2>
                    <p>${error.message}</p>
                    <button onclick="loadPage('home')">Voltar para o início</button>
                </div>
            `;
        });
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
    
    
    document.head.appendChild(link);
}

function loadPageScript(page) {
    const existingPageScript = document.getElementById('page-script');
    if (existingPageScript) {
        if (window.estudosCleanup) {
            window.estudosCleanup();
        }
        existingPageScript.remove();
    }
    
    const script = document.createElement('script');
    script.id = 'page-script';
    script.src = `scripts/${page}.js`;
    
    document.body.appendChild(script);
}
