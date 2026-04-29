// cloud.js - Lógica e Interface de Nuvem para Aterpa Usina

console.log("☁️ cloud.js carregado.");

let lastCloudError = null;

window.inicializarNuvem = async function() {
    console.log("Iniciando conexão com Supabase...");
    const badge = document.getElementById('cloud-badge');
    if (!badge) return;

    if (window.initDatabase) {
        badge.innerText = "● Conectando...";
        badge.style.background = "#fef9c3"; badge.style.color = "#854d0e";
        
        try {
            const res = await window.initDatabase();
            if (res.success) {
                console.log("✅ Nuvem Online!");
                badge.innerText = "● Nuvem Online";
                badge.style.background = "#dcfce7"; badge.style.color = "#166534";
                await window.carregarDadosDaNuvem();
                if(typeof window.popularTudo === 'function') window.popularTudo();
            } else {
                console.warn("⚠️ Nuvem Offline:", res.error);
                lastCloudError = res.error;
                badge.innerText = "● Nuvem Offline";
                badge.style.background = "#fee2e2"; badge.style.color = "#991b1b";
            }
        } catch(e) {
            console.error("❌ Erro ao inicializar nuvem:", e);
            lastCloudError = e.message || e;
            badge.innerText = "● Erro de Conexão";
        }
    } else {
        console.error("❌ database.js não encontrado!");
    }
};

window.carregarDadosDaNuvem = async function() {
    if (!window.isCloudAvailable()) return;
    try {
        console.log("Baixando configurações da nuvem...");
        const t = await window.dbCarregarConfig('tracos', null); if(t) { window.TRACOS_DB = t; }
        const f = await window.dbCarregarConfig('frota', null); if(f) { window.FROTA_DB = f; }
        const m = await window.dbCarregarConfig('motoristas', null); if(m) { window.MOTORISTAS_DB = m; }
        const mat = await window.dbCarregarConfig('materiais', null); if(mat) { window.MAT_DB = mat; }
        const s = await window.dbCarregarConfig('silos', null); if(s) { 
            window.usina_silos_db = s; 
            if(typeof window.atualizarSilosUI === 'function') window.atualizarSilosUI(); 
        }
        console.log("✅ Dados da nuvem sincronizados.");
    } catch(e) { console.error("Erro ao carregar dados da nuvem:", e); }
};

window.abrirConfigCloud = function() {
    console.log("Abrindo Modal de Nuvem...");
    const isOnline = (typeof window.isCloudAvailable === 'function') && window.isCloudAvailable();
    const statusStr = isOnline ? 
        '<span style="color:#16a34a; font-weight: bold;">✅ CONECTADO</span>' : 
        `<span style="color:#dc2626; font-weight: bold;">❌ DESCONECTADO</span><br><div style="color:#991b1b; font-size:12px; margin-top:10px; background:#fff1f1; padding:10px; border-radius:8px; border:1px solid #fecaca; text-align:left; word-break:break-all;"><strong>Motivo:</strong> ${lastCloudError || 'O banco de dados não respondeu ao teste inicial.'}</div>`;
    
    // Remover modal antigo se existir
    const old = document.getElementById('modal-cloud-ui');
    if(old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-cloud-ui';
    modal.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 999999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); font-family: sans-serif;";
    modal.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 20px; width: 500px; text-align: center; color: #333; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
            <div style="font-size: 60px; margin-bottom: 20px;">☁️</div>
            <h2 style="margin-bottom: 10px;">Painel da Nuvem</h2>
            <p style="font-size: 14px; color: #64748b; margin-bottom: 30px;">Status: ${statusStr}</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; text-align: left; border: 1px solid #e2e8f0;">
                <h3 style="font-size: 14px; margin-bottom: 10px;">⬆️ Sincronização Forçada</h3>
                <p style="font-size: 12px; color: #64748b; line-height: 1.4;">Clique abaixo para enviar os Traços e Frota que estão salvos neste navegador para o banco online.</p>
                <button id="btnSyncNow" style="width: 100%; margin-top: 15px; background: #3b82f6; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer;">Sincronizar Dados Locais para Nuvem</button>
            </div>

            <button onclick="document.getElementById('modal-cloud-ui').remove()" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer;">Fechar</button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btnSyncNow').onclick = async function() {
        if (!confirm("Isso substituirá os dados online pelos seus dados locais atuais. Deseja continuar?")) return;
        this.innerText = "Sincronizando...";
        this.disabled = true;
        const res = await window.dbSincronizarTudoLocalParaNuvem();
        alert(res.message);
        this.innerText = "Sincronizar Dados Locais para Nuvem";
        this.disabled = false;
        if(res.success) window.location.reload();
    };
};

// Hooks para salvamento automático
function configurarHooks() {
    console.log("Configurando hooks de salvamento...");
    const hooks = [
        { name: 'salvarTraco', type: 'tracos', getDb: () => window.TRACOS_DB },
        { name: 'salvarVeiculo', type: 'frota', getDb: () => window.FROTA_DB },
        { name: 'salvarMotorista', type: 'motoristas', getDb: () => window.MOTORISTAS_DB },
        { name: 'gravarNotaNoHistorico', type: 'nota' }
    ];

    hooks.forEach(hook => {
        const original = window[hook.name];
        if (typeof original === 'function') {
            window[hook.name] = async function(...args) {
                const res = await original.apply(this, args);
                if (window.isCloudAvailable()) {
                    if (hook.type === 'nota') {
                        if (res) await window.dbSalvarNota(res);
                    } else {
                        await window.dbSalvarConfig(hook.type, hook.getDb());
                    }
                }
                return res;
            };
        }
    });
}

// Auto-inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.inicializarNuvem();
        configurarHooks();
    }, 1000);
});
