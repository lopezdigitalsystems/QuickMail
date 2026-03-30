document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    let currentLang = 'es';
    let dictionary = {};

    // DOM Elements
    const languageSelect = document.getElementById('languageSelect');
    const emailAddressInput = document.getElementById('emailAddress');
    const copyBtn = document.getElementById('copyBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const qrBtn = document.getElementById('qrBtn');
    const countdownEl = document.getElementById('countdown');
    const inboxList = document.getElementById('inboxList');
    const emptyState = document.getElementById('emptyState');
    const qrModal = document.getElementById('qrModal');
    const closeQrBtn = document.getElementById('closeQrBtn');
    const qrImage = document.getElementById('qrImage');
    const timerProgress = document.getElementById('timerProgress');
    const copyToast = document.getElementById('copyToast');

    // Email Viewer Elements
    const emailViewer = document.getElementById('emailViewer');
    const backToInboxBtn = document.getElementById('backToInboxBtn');
    const viewerSubject = document.getElementById('viewerSubject');
    const viewerFrom = document.getElementById('viewerFrom');
    const viewerDate = document.getElementById('viewerDate');
    const viewerBody = document.getElementById('viewerBody');

    // API & State
    let currentEmail = '';
    let apiToken = '';
    let accountId = '';
    let timeRemaining = 15 * 60; // 15 minutos en segundos (Visual UI Timer)
    let timerInterval = null;
    let pollInterval = null;
    let receivedMessageIds = new Set();
    const API_BASE = 'https://api.mail.tm';

    // ======== 1. i18n Logic ======== 
    async function loadTranslations(lang) {
        try {
            const res = await fetch(`lang/${lang}.json`);
            if (!res.ok) throw new Error('Translation not found');
            dictionary = await res.json();
            currentLang = lang;
            document.documentElement.lang = lang;
            updateDOMTranslations();
        } catch (error) {
            console.error('Error loading language file:', error);
            // Fallback for local testing without server if fetch fails for file://
            if (lang === 'es' && Object.keys(dictionary).length === 0) {
                dictionary = {
                    "subtitle": "Correo anónimo instantáneo. Elimina el spam.",
                    "generating": "generando...",
                    "copyBtnTitle": "Copiar Correo",
                    "refreshBtnTitle": "Forzar Refresco",
                    "qrBtnTitle": "Ver Código QR",
                    "inboxTitle": "Bandeja de Entrada",
                    "liveSyncTitle": "Sincronización en tiempo real",
                    "liveTitle": "Live",
                    "waitingEmails": "Esperando correos entrantes...",
                    "autoUpdateTip": "Tu bandeja se actualizará automáticamente",
                    "scanQrTitle": "Escanea tu código QR",
                    "scanQrDesc": "Usa tu móvil para enviar un correo a esta dirección.",
                    "closeBtn": "Cerrar",
                    "copyToastMsg": "Copiado al portapapeles ✓",
                    "loadingEmails": "Cargando mensaje...",
                    "noSender": "Remitente Desconocido",
                    "noSubject": "Sin Asunto",
                    "backBtn": "Volver a la bandeja",
                    "errorGen": "Error al generar correo."
                };
                updateDOMTranslations();
            }
        }
    }

    function updateDOMTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dictionary[key]) el.textContent = dictionary[key];
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (dictionary[key] && el.value.includes('...')) el.value = dictionary[key]; 
        });

        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (dictionary[key]) el.title = dictionary[key];
        });
    }

    if(languageSelect) {
        languageSelect.addEventListener('change', (e) => loadTranslations(e.target.value));
    }

    // ======== 2. Temp Mail API Logic (Mail.tm) ======== 
    function generateRandomString(length) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let res = '';
        for (let i = 0; i < length; i++) {
            res += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return res;
    }

    async function initSession() {
        // Clear state
        if (timerInterval) clearInterval(timerInterval);
        if (pollInterval) clearInterval(pollInterval);
        receivedMessageIds.clear();
        
        emailAddressInput.value = dictionary['generating'] || 'generando...';
        timeRemaining = 15 * 60;
        updateTimerDisplay();

        showInbox(); // Ensure we are in inbox view
        resetInboxView();
        animateButton(refreshBtn);

        try {
            // 1. Get Domain
            const domainsRes = await fetch(`${API_BASE}/domains`);
            const domainsData = await domainsRes.json();
            const domain = domainsData['hydra:member'][0].domain;

            // 2. Create Account
            const username = generateRandomString(10);
            const password = generateRandomString(16);
            currentEmail = `${username}@${domain}`;

            const accountRes = await fetch(`${API_BASE}/accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: currentEmail, password })
            });

            if (!accountRes.ok) throw new Error('Failed to create account');
            const accountData = await accountRes.json();
            accountId = accountData.id;

            // 3. Get Token
            const tokenRes = await fetch(`${API_BASE}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: currentEmail, password })
            });

            if (!tokenRes.ok) throw new Error('Failed to get token');
            const tokenData = await tokenRes.json();
            apiToken = tokenData.token;

            // Session Ready
            emailAddressInput.value = currentEmail;
            
            // Start Visual Timer
            timerInterval = setInterval(tick, 1000);

            // Start polling for emails every 5 seconds
            pollInterval = setInterval(pollEmails, 5000);
            
            // Do initial poll
            pollEmails();

        } catch (error) {
            console.error(error);
            emailAddressInput.value = dictionary['errorGen'] || 'Error...';
            setTimeout(initSession, 3000); // Retry after 3 seconds
        }
    }

    async function pollEmails() {
        if (!apiToken) return;
        try {
            const res = await fetch(`${API_BASE}/messages`, {
                headers: { 'Authorization': `Bearer ${apiToken}` }
            });
            if (!res.ok) return;
            const data = await res.json();
            
            // Check for new messages
            const messages = data['hydra:member'] || [];
            if (messages.length > 0) {
                emptyState.style.display = 'none';
            } else {
                emptyState.style.display = 'flex';
            }

            messages.forEach(msg => {
                if (!receivedMessageIds.has(msg.id)) {
                    receivedMessageIds.add(msg.id);
                    appendEmailListItem(msg);
                }
            });
        } catch (error) {
            console.error('Polling error:', error);
        }
    }

    async function fetchEmailContent(id) {
        showEmailViewer();
        viewerSubject.textContent = dictionary['loadingEmails'] || 'Cargando...';
        viewerFrom.textContent = '';
        viewerDate.textContent = '';
        viewerBody.innerHTML = '<div class="loader-pulse" style="margin:2rem auto; width:30px; height:30px;"></div>';

        try {
            const res = await fetch(`${API_BASE}/messages/${id}`, {
                headers: { 'Authorization': `Bearer ${apiToken}` }
            });
            const data = await res.json();

            viewerSubject.textContent = data.subject || dictionary['noSubject'];
            viewerFrom.textContent = data.from.address || dictionary['noSender'];
            
            // Format Date
            const dt = new Date(data.createdAt);
            viewerDate.textContent = dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

            if (data.html && data.html.length > 0) {
                // Render HTML securely inside isolated iframe
                const iframe = document.createElement('iframe');
                iframe.sandbox = 'allow-same-origin';
                iframe.srcdoc = data.html[0];
                viewerBody.innerHTML = '';
                viewerBody.appendChild(iframe);
            } else {
                // Fallback to text
                viewerBody.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit;">${data.text || ''}</pre>`;
            }

        } catch (error) {
            viewerBody.innerHTML = `<p style="color:red">Error loading message.</p>`;
        }
    }

    // ======== 3. UI Interactions & Updates ========
    function appendEmailListItem(msg) {
        const item = document.createElement('div');
        item.className = 'email-item';
        
        const dt = new Date(msg.createdAt);
        const timeStr = dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const fromName = msg.from.name || msg.from.address;

        item.innerHTML = `
            <div class="email-item-header">
                <span>${fromName}</span>
                <span>${timeStr}</span>
            </div>
            <h3 class="email-item-subject">${msg.subject || (dictionary['noSubject'] || 'No Subject')}</h3>
            <div class="email-item-snippet">${msg.intro || '...'}</div>
        `;
        
        item.addEventListener('click', () => fetchEmailContent(msg.id));

        // Insert at the top of the list
        if (inboxList.firstChild && inboxList.firstChild !== emptyState) {
            inboxList.insertBefore(item, inboxList.firstChild);
        } else {
            inboxList.insertBefore(item, emptyState);
        }
    }

    function resetInboxView() {
        // Remove all email items
        Array.from(inboxList.children).forEach(child => {
            if (child.id !== 'emptyState') child.remove();
        });
        emptyState.style.display = 'flex';
    }

    function showEmailViewer() {
        inboxList.style.display = 'none';
        emailViewer.classList.remove('hidden');
    }

    function showInbox() {
        inboxList.style.display = 'flex';
        emailViewer.classList.add('hidden');
        if(receivedMessageIds.size > 0) emptyState.style.display = 'none';
    }

    function tick() {
        if (timeRemaining > 0) {
            timeRemaining--;
            updateTimerDisplay();
        } else {
            initSession(); // Restart completely
        }
    }

    function updateTimerDisplay() {
        const mins = Math.floor(timeRemaining / 60);
        const secs = timeRemaining % 60;
        countdownEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        const totalSeconds = 15 * 60;
        const percentage = (timeRemaining / totalSeconds) * 100;
        timerProgress.style.width = `${percentage}%`;
        
        if (timeRemaining <= 60) {
            countdownEl.style.color = '#ff6e84';
            document.querySelector('.icon-pulse').style.color = '#ff6e84';
            timerProgress.style.background = 'linear-gradient(90deg, #d73357, #ff6e84)';
        } else {
            countdownEl.style.color = 'var(--primary-indigo)';
            document.querySelector('.icon-pulse').style.color = 'var(--primary-indigo)';
            timerProgress.style.background = 'linear-gradient(90deg, var(--primary-dim), var(--primary-indigo))';
        }
    }

    function copyToClipboard() {
        if(currentEmail === '') return;
        emailAddressInput.focus();
        emailAddressInput.select();
        try {
            document.execCommand('copy');
            triggerCopySuccess();
        } catch (err) {
            // Modern fallback
            navigator.clipboard.writeText(currentEmail).then(triggerCopySuccess);
        }
    }

    function triggerCopySuccess() {
        copyToast.classList.add('show');
        const originalIcon = '<i data-lucide="copy"></i>';
        copyBtn.innerHTML = '<i data-lucide="check"></i>';
        copyBtn.style.color = '#10b981';
        copyBtn.style.borderColor = '#10b981';
        lucide.createIcons();
        
        setTimeout(() => {
            copyToast.classList.remove('show');
            copyBtn.innerHTML = originalIcon;
            copyBtn.style.color = '';
            copyBtn.style.borderColor = '';
            lucide.createIcons();
        }, 2000);
    }

    function animateButton(btn) {
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = '', 150);
    }

    function showQrCode() {
        if (!currentEmail) return;
        // Use a fast and reliable QR Code API
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=mailto:${encodeURIComponent(currentEmail)}&bgcolor=FFFFFF`;
        qrImage.style.opacity = '0.5';
        qrImage.onload = () => { qrImage.style.opacity = '1'; };
        qrImage.src = qrUrl;
        
        qrModal.classList.add('visible');
    }

    function closeQrCode() {
        qrModal.classList.remove('visible');
    }

    // ====== Event Listeners ======
    copyBtn.addEventListener('click', () => {
        animateButton(copyBtn);
        copyToClipboard();
    });

    refreshBtn.addEventListener('click', () => {
        initSession(); 
    });

    qrBtn.addEventListener('click', () => {
        animateButton(qrBtn);
        showQrCode();
    });
    
    closeQrBtn.addEventListener('click', closeQrCode);
    qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) closeQrCode();
    });

    backToInboxBtn.addEventListener('click', showInbox);

    // Bootstrap App
    loadTranslations(currentLang).then(() => {
        initSession();
    });
});
