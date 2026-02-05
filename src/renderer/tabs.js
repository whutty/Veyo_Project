let counter = 0;
const NEW_TAB_URL = 'file://' + window.location.pathname.replace(/index\.html$/, '') + 'src/renderer/newtab.html';

console.log('NEW_TAB_URL:', NEW_TAB_URL);

function getDomainFromURL(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname || url;
    } catch(e) {
        console.error('Error parsing URL:', url, e);
        return url;
    }
}

function getFullURL(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.href;
    } catch(e) {
        return url;
    }
}

function validateAndFormatURL(input) {
    input = input.trim();
    if (!input) return null;
    
    // Se parecer URL
    if (input.includes('.') && !input.includes(' ')) {
        return input.startsWith('http') ? input : 'https://' + input;
    }
    
    // Se não, fazer busca no Google
    return 'https://www.google.com/search?q=' + encodeURIComponent(input);
}

function createNewTab(url = NEW_TAB_URL) {
    counter++;
    const id = `t-${counter}`;

    // Criar Aba
    const tab = document.createElement('div');
    tab.className = 'tab enter';
    tab.id = `btn-${id}`;
    tab.innerHTML = `<span style="overflow:hidden;white-space:nowrap;">Nova Guia</span> <span class="close-btn" style="cursor:pointer;">×</span>`;
    tab.addEventListener('click', () => activateTab(id));
    document.getElementById('tabs-list').appendChild(tab);

    // botão fechar
    const closeBtn = tab.querySelector('.close-btn');
    closeBtn.addEventListener('click', (e) => closeTab(e, id));

    // Criar Webview
    const wv = document.createElement('webview');
    wv.id = id;
    wv.src = url;
    wv.preload = 'src/preload.js';
    document.getElementById('content').appendChild(wv);

    // Eventos de carregamento
    wv.addEventListener('did-start-loading', () => {
        console.log('Loading started:', id, url);
        showLoadingIndicator();
        updateProgressBar(10);
    });

    wv.addEventListener('did-stop-loading', () => {
        console.log('Loading stopped:', id);
        hideLoadingIndicator();
        updateProgressBar(100);
        setTimeout(() => updateProgressBar(0), 300);
    });

    wv.addEventListener('did-finish-load', () => {
        console.log('Page loaded:', id, wv.getURL());
        const titleSpan = tab.querySelector('span:first-child');
        if (titleSpan) {
            try { 
                titleSpan.innerText = wv.getTitle().substring(0, 15); 
            } catch(e) { console.error('Error updating title:', e); }
        }
        updateURLBar(id);
    });

    wv.addEventListener('page-title-updated', (e) => {
        console.log('Title updated:', e.title);
        const titleSpan = tab.querySelector('span:first-child');
        if (titleSpan) titleSpan.innerText = e.title.substring(0, 15);
    });

    wv.addEventListener('page-favicon-updated', (e) => {
        console.log('Favicon updated');
    });

    wv.addEventListener('crashed', () => {
        console.error('Webview crashed');
        wv.loadURL('data:text/html,<div style="padding:20px;font-family:system-ui;"><h1>Página Parou de Funcionar</h1><p>Tente recarregar.</p></div>');
    });

    wv.addEventListener('render-process-gone', (e) => {
        console.error('Render process gone:', e.reason);
    });

    wv.addEventListener('did-fail-load', (e) => {
        console.error('Failed to load:', e.errorCode, e.errorDescription);
    });

    // trigger enter animation
    requestAnimationFrame(() => {
        tab.classList.remove('enter');
        tab.classList.add('enter-active');
    });

    activateTab(id);
    saveTabsState();
}

function activateTab(id) {
    document.querySelectorAll('.tab, webview').forEach(el => el.classList.remove('active'));
    const btn = document.getElementById(`btn-${id}`);
    if (btn) btn.classList.add('active');
    const activeWv = document.getElementById(id);
    if (activeWv) activeWv.classList.add('active');
    updateURLBar(id);
}

function updateURLBar(id) {
    const wv = document.getElementById(id);
    const urlInput = document.getElementById('url-input');
    if (wv && urlInput) {
        try {
            const fullURL = wv.getURL();
            const domain = getDomainFromURL(fullURL);
            urlInput.value = domain;
            urlInput.dataset.fullUrl = fullURL;
            urlInput.title = fullURL;
        } catch(e) {}
    }
}

function closeTab(e, id) {
    e.stopPropagation();
    const btn = document.getElementById(`btn-${id}`);
    const wv = document.getElementById(id);
    
    if (btn) {
        btn.classList.remove('enter-active');
        btn.classList.add('exit', 'exit-active');
        btn.addEventListener('transitionend', () => btn.remove(), { once: true });
    }
    if (wv) wv.remove();

    // ativar outra aba após animação
    setTimeout(() => {
        const remaining = document.querySelectorAll('.tab');
        if (remaining.length > 0) {
            const first = remaining[0].id.replace('btn-', '');
            activateTab(first);
        } else {
            createNewTab();
        }
        saveTabsState();
    }, 250);
}

function showLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) indicator.classList.remove('hidden');
}

function hideLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) indicator.classList.add('hidden');
}

function updateProgressBar(progress) {
    const bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = progress + '%';
}

function saveTabsState() {
    const tabs = Array.from(document.querySelectorAll('.tab')).map(tab => {
        const wv = document.getElementById(tab.id.replace('btn-', ''));
        return wv ? wv.getURL() : '';
    });
    localStorage.setItem('savedTabs', JSON.stringify(tabs));
}

function restoreTabs() {
    const saved = localStorage.getItem('savedTabs');
    if (saved) {
        try {
            const tabs = JSON.parse(saved);
            if (tabs.length > 0) {
                tabs.forEach(url => createNewTab(url));
                return;
            }
        } catch(e) {}
    }
    createNewTab();
}

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
}

function applyPerformance(mode) {
    document.body.setAttribute('data-performance', mode);
}

function applyLanguage(lang) {
    const i18n = {
        pt: {
            back: 'Voltar',
            forward: 'Avançar',
            reload: 'Recarregar',
            devtools: 'DevTools (F12)',
            url_placeholder: 'Pesquisar com o Google ou inserir endereço',
            title: 'Veyo Browser',
        },
        en: {
            back: 'Back',
            forward: 'Forward',
            reload: 'Reload',
            devtools: 'DevTools (F12)',
            url_placeholder: 'Search with Google or enter address',
            title: 'Veyo Browser',
        },
        es: {
            back: 'Atrás',
            forward: 'Adelante',
            reload: 'Recargar',
            devtools: 'DevTools (F12)',
            url_placeholder: 'Buscar con Google o ingresar dirección',
            title: 'Veyo Browser',
        },
    };

    const dict = i18n[lang] || i18n.pt;
    document.title = dict.title;
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (dict[key]) el.setAttribute('title', dict[key]);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) el.setAttribute('placeholder', dict[key]);
    });
}

// Atalhos de Teclado
function handleKeyboard(e) {
    // Ctrl+T: Nova aba
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        createNewTab();
    }
    // Ctrl+W: Fechar aba
    if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) {
            const id = activeTab.id.replace('btn-', '');
            closeTab({ stopPropagation: () => {} }, id);
        }
    }
    // Ctrl+Tab: Próxima aba
    if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
        e.preventDefault();
        const tabs = document.querySelectorAll('.tab');
        const activeIdx = Array.from(tabs).findIndex(t => t.classList.contains('active'));
        const nextIdx = (activeIdx + 1) % tabs.length;
        activateTab(tabs[nextIdx].id.replace('btn-', ''));
    }
    // Ctrl+Shift+Tab: Aba anterior
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        const tabs = document.querySelectorAll('.tab');
        const activeIdx = Array.from(tabs).findIndex(t => t.classList.contains('active'));
        const prevIdx = (activeIdx - 1 + tabs.length) % tabs.length;
        activateTab(tabs[prevIdx].id.replace('btn-', ''));
    }
}

// Atalhos de Navegação
function back() { 
    const w = document.querySelector('webview.active'); 
    if (w) w.goBack(); 
}

function forward() { 
    const w = document.querySelector('webview.active'); 
    if (w) w.goForward(); 
}

function reload() { 
    const w = document.querySelector('webview.active'); 
    if (w) w.reload(); 
}

function toggleDevTools() {
    const w = document.querySelector('webview.active');
    if (w) {
        if (w.isDevToolsOpened()) {
            w.closeDevTools();
        } else {
            w.openDevTools();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('veyo-theme') || 'light';
    applyTheme(savedTheme);
    const savedPerf = localStorage.getItem('veyo-performance') || 'normal';
    applyPerformance(savedPerf);
    const savedLang = localStorage.getItem('veyo-lang') || 'pt';
    applyLanguage(savedLang);
    window.addEventListener('storage', (e) => {
        if (e.key === 'veyo-theme') {
            applyTheme(e.newValue || 'light');
        }
        if (e.key === 'veyo-performance') {
            applyPerformance(e.newValue || 'normal');
        }
        if (e.key === 'veyo-lang') {
            applyLanguage(e.newValue || 'pt');
        }
    });

    const urlInput = document.getElementById('url-input');
    if (urlInput) {
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const url = validateAndFormatURL(e.target.value);
                if (url) {
                    const w = document.querySelector('webview.active');
                    if (w) w.loadURL(url);
                }
            }
        });
    }

    // Atalhos globais
    document.addEventListener('keydown', handleKeyboard);

    // Restaurar abas salvas ou criar uma nova
    restoreTabs();
});
