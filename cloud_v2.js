// cloud_v2.js - VERSÃO MULTI-USINAS + BACKUP
window.abrirConfigCloud = async () => {
    const senhaSalva = localStorage.getItem('usina_senha_acesso') || '1988';
    const master = "ATERPA369";
    const pass = await window.pedirSenha("Digite a senha de acesso ao Painel Multi-Usinas:");
    
    if (pass !== senhaSalva && pass !== master && pass !== "1988") {
        if (pass !== null) alert("❌ Senha incorreta!");
        return;
    }

    const modal = document.getElementById('cloud-modal');
    if (modal) modal.style.display = 'flex';
    
    // Carregar nome da unidade salvo
    const unidadeSalva = localStorage.getItem('usina_unidade') || '';
    const inputUnidade = document.getElementById('cloud-unidade-input');
    if (inputUnidade) inputUnidade.value = unidadeSalva;

    const debug = window.getCloudDebugInfo ? window.getCloudDebugInfo() : { url: '---', lib: '---' };
    const setElem = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    setElem('cloud-debug-url', debug.url);
    setElem('cloud-debug-lib', debug.lib);
    
    const badge = document.getElementById('cloud-badge');
    const statusText = document.getElementById('cloud-status-text');
    if (badge && badge.innerText.includes('Online')) {
        if (statusText) statusText.innerHTML = '<span style="color: #10b981;">✅ CONECTADO</span>';
    }
};

window.salvarUnidade = async () => {
    const senhaSalva = localStorage.getItem('usina_senha_acesso') || '1988';
    const master = "ATERPA369";
    const pass = await window.pedirSenha("Confirme a senha para alterar a unidade:");
    
    if (pass !== senhaSalva && pass !== master && pass !== "1988") {
        if (pass !== null) alert("❌ Senha incorreta! Alteração não permitida.");
        return;
    }

    const nome = document.getElementById('cloud-unidade-input').value.trim().toUpperCase();
    if (!nome) return alert("Informe o nome da unidade!");

    // Chama a função global de troca rápida que já limpa e recarrega tudo
    if (window.trocarUnidadeRapido) {
        await window.trocarUnidadeRapido(nome);
    } else {
        localStorage.setItem('usina_unidade', nome);
    }

    alert("✅ Unidade '" + nome + "' configurada e dados sincronizados!");
    window.fecharConfigCloud();
};

window.trocarSenhaPainel = async () => {
    const senhaSalva = localStorage.getItem('usina_senha_acesso') || '1988';
    const master = "ATERPA369";
    const pass = await window.pedirSenha("Digite a senha (ADM ou Normal) para trocar a senha de acesso:");
    
    if (pass !== master && pass !== senhaSalva && pass !== "1988") {
        if (pass !== null) alert("❌ Senha incorreta! Acesso negado.");
        return;
    }
    
    const novaSenha = await window.pedirSenha("Digite a NOVA SENHA de acesso:");
    if (novaSenha && novaSenha.length >= 4) {
        localStorage.setItem('usina_senha_acesso', novaSenha);
        alert("✅ Senha de acesso alterada para: " + novaSenha);
    } else {
        alert("❌ Senha inválida! Use pelo menos 4 caracteres.");
    }
};

window.fecharConfigCloud = () => {
    const modal = document.getElementById('cloud-modal');
    if (modal) modal.style.display = 'none';
};

window.gerarBackupExcelLocal = () => {
    const notas = JSON.parse(localStorage.getItem('usina_historico') || '[]');
    if (notas.length === 0) { alert("Histórico vazio."); return; }
    const colunas = Object.keys(notas[0]);
    let csvContent = "\uFEFF" + colunas.join(";") + "\n";
    notas.forEach(n => {
        const linha = colunas.map(col => `"${(n[col] || "").toString().replace(/"/g, '""')}"`);
        csvContent += linha.join(";") + "\n";
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `BACKUP_USINA_${localStorage.getItem('usina_unidade') || 'GERAL'}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    link.click();
};

window.realizarSincronizacao = async () => {
    const result = await window.dbSincronizarTudoLocalParaNuvem();
    if (result.success) {
        alert(result.message || "✅ Sincronização concluída!");
        await window.dbBaixarHistoricoDaNuvem();
    } else {
        alert("❌ Erro: " + result.error);
    }
};

window.inicializarNuvem = async () => {
    const badge = document.getElementById('cloud-badge');
    if (!badge) return;
    badge.innerText = "● Conectando...";
    const result = await window.initDatabase ? await window.initDatabase() : { success: false };
    if (result.success) {
        badge.innerText = "● Nuvem Online";
        badge.style.background = "#dcfce7";
        badge.style.color = "#166534";
        await window.dbBaixarHistoricoDaNuvem();
    }
};

document.addEventListener('click', (e) => {
    if (e.target && e.target.innerText && e.target.innerText.includes('GRAVAR E IMPRIMIR')) {
        setTimeout(async () => { await window.dbSincronizarTudoLocalParaNuvem(); }, 3000);
    }
});

setTimeout(window.inicializarNuvem, 1000);
