let counter = 0;

function createNewTab(url = "https://www.google.com") {
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
    document.getElementById('content').appendChild(wv);

    // trigger enter animation
    requestAnimationFrame(() => {
        tab.classList.remove('enter');
        tab.classList.add('enter-active');
    });

    wv.addEventListener('did-finish-load', () => {
        const titleSpan = tab.querySelector('span:first-child');
        if (titleSpan) {
            try { 
                titleSpan.innerText = wv.getTitle().substring(0, 15); 
            } catch(e) {}
        }
        if(wv.classList.contains('active')) {
            try {
                document.getElementById('url-input').value = wv.getURL();
            } catch(e) {}
        }
    });

    activateTab(id);
}

function activateTab(id) {
    document.querySelectorAll('.tab, webview').forEach(el => el.classList.remove('active'));
    const btn = document.getElementById(`btn-${id}`);
    if (btn) btn.classList.add('active');
    const activeWv = document.getElementById(id);
    if (activeWv) activeWv.classList.add('active');
    try { 
        document.getElementById('url-input').value = activeWv.getURL(); 
    } catch(e) {}
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
    }, 250);
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

document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('url-input');
    if (urlInput) {
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                let val = e.target.value;
                if(!val.startsWith('http')) val = 'https://' + val;
                const w = document.querySelector('webview.active');
                if (w) w.loadURL(val);
            }
        });
    }

    // Iniciar com uma aba
    createNewTab();
});