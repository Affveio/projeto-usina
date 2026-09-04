// database_v2.js - VERSÃO PRECISÃO TOTAL (510 AGUA + GELO FIX)
const SUPABASE_URL = 'https://ttcycjnlzchagnneqpym.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0Y3ljam5semNoYWdubmVxcHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNjQzMTksImV4cCI6MjA5Mjc0MDMxOX0.h-K5p9r1Szx_v8EVZO4Z8nMJkPetOt0h82HHG5FV970'; 

window.getCloudDebugInfo = () => ({ url: SUPABASE_URL, lib: "VANILLA (Nativa)" });

window.initDatabase = async () => {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/configuracoes?select=id&limit=1`, {
            method: 'GET', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        return { success: response.ok };
    } catch (e) { return { success: false }; }
};

function cyrb128(str) {
    let h1 = 1779033703, h2 = 3024734165, h3 = 336245433, h4 = 502493390;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
}

const gerarIDNota = (n) => {
    // ID determinístico baseado em NF + Data + Unidade (garantindo apenas caracteres hexadecimais válidos para UUID)
    const nf = (n.nf || n.numero || '0').toString().trim();
    const data = (n.data || '0').toString().replace(/\D/g, '');
    const unidade = (n.unidade || localStorage.getItem('usina_unidade') || 'A369').toString().trim().toUpperCase();
    
    // Se a nota foi editada, incluímos o timestamp no hash para gerar um ID diferente e único
    const sufixoEditada = (n.materiais && n.materiais.editada === "SIM") ? `_${n.timestamp || Date.now()}` : "";
    const chave = `${unidade}_${nf}_${data}${sufixoEditada}`;
    const hash = cyrb128(chave);
    const hex = hash.map(x => x.toString(16).padStart(8, '0')).join('');
    
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`.toLowerCase();
};

window.dbBaixarHistoricoDaNuvem = async () => {
    if (window.isSyncing) return { success: false };
    try {
        const unidadeAtual = localStorage.getItem('usina_unidade') || 'A369';
        
        let notasNuvem = [];
        let offset = 0;
        const limit = 1000;
        let temMais = true;
        
        while (temMais) {
            let url = `${SUPABASE_URL}/rest/v1/notas?select=*&order=timestamp.desc&limit=${limit}&offset=${offset}`;
            if (unidadeAtual !== 'GERAL') {
                url = `${SUPABASE_URL}/rest/v1/notas?unidade=eq.${unidadeAtual}&select=*&order=timestamp.desc&limit=${limit}&offset=${offset}`;
            }
            const resNotas = await fetch(url, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            if (!resNotas.ok) {
                console.error("Falha ao buscar lote do histórico:", resNotas.statusText);
                break;
            }
            const lote = await resNotas.json();
            notasNuvem = notasNuvem.concat(lote);
            if (lote.length < limit || notasNuvem.length >= 1000) {
                temMais = false;
            } else {
                offset += limit;
            }
        }
        
        if (notasNuvem.length > 0) {
            let todasNotasLocais = JSON.parse(localStorage.getItem('usina_historico_' + unidadeAtual) || '[]');
            
            // 1. Filtragem Local Inteligente
            let historicoProcessado = [];
            if (unidadeAtual === 'GERAL') {
                historicoProcessado = notasNuvem;
            } else {
                historicoProcessado = notasNuvem.filter(n => !n.unidade || n.unidade === unidadeAtual);
            }

            // 2. Mesclar com Local (preservando notas locais ainda não sincronizadas ou mais recentes)
            const mapaFinal = {};
            
            // Inicializa com todas as notas locais da unidade atual
            todasNotasLocais.forEach(n => {
                if (n && (!n.unidade || n.unidade === unidadeAtual)) {
                    const key = n.id || (typeof gerarIDNota === 'function' ? gerarIDNota(n) : `${n.nf}_${n.data}`);
                    mapaFinal[key] = n;
                }
            });

            // Adiciona as notas processadas da nuvem (elas sobrescrevem apenas se a da nuvem for mais recente)
            historicoProcessado.forEach(n => {
                if (!n.unidade && unidadeAtual !== 'GERAL') n.unidade = unidadeAtual;
                
                n.id = typeof gerarIDNota === 'function' ? gerarIDNota(n) : (n.id || `${n.nf}_${n.data}`);
                const key = n.id;
                
                const local = mapaFinal[key];
                // ✅ CORREÇÃO ANTI-REVERSÃO: Se a nota local tem timestamp maior, não sobrescreve
                if (local && (Number(local.timestamp) || 0) > (Number(n.timestamp) || 0)) {
                    console.log(`⚠️ Nota NF=${n.nf} preservada (editada localmente e mais recente).`);
                } else {
                    mapaFinal[key] = n;
                }
            });

            let historicoFinal = Object.values(mapaFinal).sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));

            // 3. Política de retenção local: 90 dias ou últimas 900 notas (teto seguro para LocalStorage de 5MB)
            const LIMITE_NOTAS = 900;
            const DIAS_90_MS = 90 * 24 * 60 * 60 * 1000;
            const corte90Dias = Date.now() - DIAS_90_MS;

            historicoFinal = historicoFinal.filter((n, idx) => {
                const ts = Number(n.timestamp) || 0;
                return idx < LIMITE_NOTAS || ts >= corte90Dias;
            }).slice(0, LIMITE_NOTAS);

            // 4. Salvar estritamente na chave da unidade atual com recuperação automática de cota
            try {
                localStorage.setItem('usina_historico_' + unidadeAtual, JSON.stringify(historicoFinal));
            } catch (quotaErr) {
                console.warn("Aviso de cota do LocalStorage: reduzindo lote para acomodar na memória local...", quotaErr);
                try {
                    const slice600 = historicoFinal.slice(0, 600);
                    localStorage.setItem('usina_historico_' + unidadeAtual, JSON.stringify(slice600));
                } catch (e2) {
                    const slice300 = historicoFinal.slice(0, 300);
                    localStorage.setItem('usina_historico_' + unidadeAtual, JSON.stringify(slice300));
                }
            }
            try { localStorage.removeItem('usina_historico'); } catch (e) {}

            if (window.carregarHistorico) window.carregarHistorico();
        }
        return { success: true };
    } catch (e) { 
        console.error("Erro ao baixar histórico:", e);
        return { success: false }; 
    }
};

// Download completo do histórico direto da nuvem para exportação Excel (SEM LIMITE)
window.dbBaixarHistoricoCompleto = async (unidadeAlvo, dtIni, dtFim) => {
    let todasNotas = [];
    let offset = 0;
    const limit = 1000;
    let temMais = true;

    while (temMais) {
        let url = `${SUPABASE_URL}/rest/v1/notas?select=*&order=timestamp.desc&limit=${limit}&offset=${offset}`;
        if (unidadeAlvo && unidadeAlvo !== 'GERAL') {
            url = `${SUPABASE_URL}/rest/v1/notas?unidade=eq.${unidadeAlvo}&select=*&order=timestamp.desc&limit=${limit}&offset=${offset}`;
        }
        const res = await fetch(url, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (!res.ok) {
            console.error("Falha ao buscar lote completo do Supabase:", res.statusText);
            break;
        }
        const lote = await res.json();
        todasNotas = todasNotas.concat(lote);
        if (lote.length < limit) {
            temMais = false;
        } else {
            offset += limit;
        }
    }

    // Filtrar por período de data se fornecido
    if (dtIni || dtFim) {
        todasNotas = todasNotas.filter(nota => {
            let partes = (nota.data || "").trim().split('/');
            if (partes.length === 3) {
                let dataNota = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
                if (dtIni && dataNota < dtIni) return false;
                if (dtFim && dataNota > dtFim) return false;
                return true;
            }
            return false;
        });
    }

    return todasNotas;
};

window.isSyncing = false;

window.dbExcluirNota = async (id, notaOpcional = null) => {
    if (!id && !notaOpcional) return { success: false, error: "Dados insuficientes" };
    try {
        // Tenta 1: Pelo ID Único
        let url = `${SUPABASE_URL}/rest/v1/notas?id=eq.${id}`;
        
        // Tenta 2: Se falhar ou não tiver ID, usa NF + Unidade + Data (Garantia Extra)
        if (!id && notaOpcional) {
            const nf = notaOpcional.nf || notaOpcional.numero;
            const unidade = notaOpcional.unidade || localStorage.getItem('usina_unidade');
            const data = notaOpcional.data;
            url = `${SUPABASE_URL}/rest/v1/notas?nf=eq.${nf}&unidade=eq.${unidade}&data=eq.${data}`;
        }

        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });

        if (response.ok) return { success: true };
        return { success: false, error: "Falha na exclusão remota" };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

window.dbAtualizarNotaIndividual = async (nota) => {
    try {
        if (!nota.id) nota.id = gerarIDNota(nota);
        
        // 1. Deletar registro existente para garantir substituição limpa (Delete-before-Post)
        await window.dbExcluirNota(nota.id, nota);
        
        // 2. Preparar nota para inserção usando whitelist de colunas reais do banco
        const novaNota = {};
        const colunasPermitidas = [
            "id", "nf", "data", "hora_saida", "turno", "al", "placa", "matricula", "motorista", "frente", 
            "traco", "volume", "agua_obra", "agua_usina", "agua_retida", "gelo", "silo", "materiais", 
            "hora_mistura", "betoneira", "agua_colocada", "agua_colocar_obr", "timestamp", 
            "vias_copias", "materiais_json", "local", "qtd", "vias", "unidade", 
            "BRITA 2", "MIRA 410", "MIRA FLOW 397", "RECOVER", "RETARD CENTRALMENT 200", 
            "VISCOCRETE 6090", "GELO", "agua", "BBRITA 2", "agua_mistura", "agua_corrigida", "fck", "slump"
        ];
        
        colunasPermitidas.forEach(key => {
            if (nota[key] !== undefined && nota[key] !== null) {
                novaNota[key] = nota[key];
            }
        });
        
        // Mapeamentos específicos idênticos à sincronização geral
        novaNota.agua = nota.agua_mistura || nota.agua_corrigida || nota.agua || 0;
        novaNota.qtd = novaNota.agua;
        novaNota.gelo = nota.gelo || 0;
        if (nota.frente && !novaNota.local) novaNota.local = nota.frente;
        if (nota.al && !novaNota.betoneira) novaNota.betoneira = nota.al;
        
        if (nota.materiais && typeof nota.materiais === 'object') {
            novaNota.materiais = nota.materiais;
        }

        // 3. Inserir nova versão atualizada
        const response = await fetch(`${SUPABASE_URL}/rest/v1/notas`, {
            method: 'POST',
            headers: { 
                'apikey': SUPABASE_KEY, 
                'Authorization': `Bearer ${SUPABASE_KEY}`, 
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(novaNota)
        });
        
        if (!response.ok) {
            const errText = await response.text();
            console.error("Falha no Supabase ao salvar nota individual:", errText);
        }
        return response.ok;
    } catch (e) {
        console.error("Erro em dbAtualizarNotaIndividual:", e);
        return false;
    }
};

window.dbSincronizarTudoLocalParaNuvem = async () => {
    if (window.isSyncing) return { success: false };
    window.isSyncing = true;

    try {
        const unidadeAtual = localStorage.getItem('usina_unidade') || 'A369';
        let notasRaw = JSON.parse(localStorage.getItem('usina_historico_' + unidadeAtual) || localStorage.getItem('usina_historico') || '[]');
        if (notasRaw.length === 0) { window.isSyncing = false; return { success: true }; }
        
        const colunasPermitidas = [
            "id", "unidade", "timestamp", "nf", "data", "hora_saida", "turno", "al", "placa", "matricula", "motorista", "frente", 
            "traco", "volume", "agua_obra", "agua_usina", "agua_retida", "gelo", "silo", "materiais", 
            "hora_mistura", "betoneira", "agua_colocada", "agua_colocar_obr", "vias_copias", "materiais_json", 
            "local", "qtd", "vias", "BRITA 2", "MIRA 410", "MIRA FLOW 397", "RECOVER", "RETARD CENTRALMENT 200", 
            "VISCOCRETE 6090", "GELO", "agua", "BBRITA 2", "agua_mistura", "agua_corrigida", "fck", "slump"
        ];
        
        const mapaUnico = new Map();

        notasRaw.forEach(n => {
            const finalUnidade = n.unidade || unidadeAtual; // Usa a unidade da nota se disponível
            const novaNota = {};
            
            colunasPermitidas.forEach(key => {
                let valor = (n[key] !== undefined && n[key] !== null) ? n[key] : null;
                if (typeof valor === 'object' && key !== 'materiais') valor = null;
                novaNota[key] = valor;
            });

            novaNota.agua = n.agua_mistura || n.agua_corrigida || n.agua || 0;
            novaNota.qtd = novaNota.agua; 
            novaNota.gelo = n.gelo || 0;
            novaNota.unidade = finalUnidade;
            
            if (n.frente && !novaNota.local) novaNota.local = n.frente;
            if (n.al && !novaNota.betoneira) novaNota.betoneira = n.al;

            const finalId = (n.id && n.id.length > 30) ? n.id : gerarIDNota(n);
            novaNota.id = finalId;
            
            if (!n.id) {
                n.id = finalId;
            }
            
            if (n.materiais && typeof n.materiais === 'object') {
                novaNota.materiais = n.materiais;
            }
            
            mapaUnico.set(finalId, novaNota);
        });

        const notasPadronizadas = Array.from(mapaUnico.values());
        const idsLocais = new Set(notasPadronizadas.map(n => n.id));
        let sucessos = 0;
        let falhas = 0;

        // 1. ENVIO/ATUALIZAÇÃO (UPSERT)
        for (const nota of notasPadronizadas) {
            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/notas`, {
                    method: 'POST',
                    headers: { 
                        'apikey': SUPABASE_KEY, 
                        'Authorization': `Bearer ${SUPABASE_KEY}`, 
                        'Content-Type': 'application/json', 
                        'Prefer': 'resolution=merge-duplicates' 
                    },
                    body: JSON.stringify(nota)
                });
                if (response.ok) {
                    sucessos++;
                } else {
                    falhas++;
                    const errText = await response.text();
                    console.error(`Erro ao sincronizar nota NF=${nota.nf}:`, errText);
                }
            } catch (e) { 
                falhas++;
                console.error("Erro na requisição de sincronização:", e);
            }
        }

        // Grava os IDs gerados de volta no localStorage para manter a consistência local
        localStorage.setItem('usina_historico_' + unidadeAtual, JSON.stringify(notasRaw));
        localStorage.setItem('usina_historico', JSON.stringify(notasRaw));



        window.isSyncing = false;
        if (falhas === 0) {
            return { success: true, message: `Sincronizado! (${sucessos} notas)` };
        } else {
            return { success: true, message: `Sincronizado parcial: ${sucessos} ok, ${falhas} falhas.` };
        }
    } catch (e) { 
        console.error("Erro Conexão:", e);
        alert("Erro de Conexão:\n" + e.message);
        window.isSyncing = false;
        return { success: false, error: e.message }; 
    }
};

window.dbAtualizarEstoqueSilos = async () => {
    const silos = JSON.parse(localStorage.getItem('usina_silos_db') || '{"Silo 1": 0, "Silo 2": 0}');
    const unidade = localStorage.getItem('usina_unidade') || 'USINA-PADRAO';
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/estoque`, {
            method: 'POST',
            headers: { 
                'apikey': SUPABASE_KEY, 
                'Authorization': `Bearer ${SUPABASE_KEY}`, 
                'Content-Type': 'application/json', 
                'Prefer': 'resolution=merge-duplicates' 
            },
            body: JSON.stringify({
                unidade: unidade,
                silo1: silos['Silo 1'],
                silo2: silos['Silo 2'],
                atualizado_em: new Date().toISOString()
            })
        });
    } catch (e) { console.error("Erro ao sincronizar silos:", e); }
};

window.dbBaixarEstoqueSilos = async () => {
    const unidade = localStorage.getItem('usina_unidade') || 'USINA-PADRAO';
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/estoque?unidade=eq.${unidade}&select=*`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (response.ok) {
            const dados = await response.json();
            if (dados && dados.length > 0) {
                const cloudSilos = { "Silo 1": dados[0].silo1, "Silo 2": dados[0].silo2 };
                localStorage.setItem('usina_silos_db', JSON.stringify(cloudSilos));
                return cloudSilos;
            }
        }
    } catch (e) { console.error("Erro ao baixar silos:", e); }
    return null;
};

window.trocarUnidadeRapido = async function(novaUnidade) {
    if (!novaUnidade) return;
    localStorage.setItem('usina_unidade', novaUnidade);
    
    // IMPORTANTE: Atualizar a URL com o HASH para que ao recarregar a página saiba qual usina usar
    const url = new URL(window.location.href);
    url.hash = novaUnidade;
    window.location.href = url.href; 
    
    // Recarrega fisicamente a página para atualizar o estado global limpo
    window.location.reload();
};
