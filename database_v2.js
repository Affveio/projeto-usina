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

const gerarIDNota = (n) => {
    // Criar um ID determinístico baseado nos dados da nota (NF, Data, Hora, Unidade)
    const nf = (n.nf || '0').toString().padStart(6, '0');
    const data = (n.data || '0').toString().replace(/\D/g, '').padStart(6, '0');
    const hora = (n.hora_mistura || n.hora_saida || '0').toString().replace(/\D/g, '').padStart(6, '0');
    
    // PRIORIDADE: Unidade gravada na nota, senão a unidade atual do sistema
    const unidadeOriginal = n.unidade || localStorage.getItem('usina_unidade') || 'A369';
    const unidadeSlug = unidadeOriginal.substring(0,3).toUpperCase().padStart(3, 'X');
    
    // Formato UUID: 8-4-4-4-12
    const parte1 = nf.padStart(8, '0');
    const parte2 = data.substring(0, 4);
    const parte3 = data.substring(4, 6) + hora.substring(0, 2);
    const parte4 = hora.substring(2, 6).padStart(4, '0');
    const parte5 = (unidadeSlug + nf + data).substring(0, 12).padStart(12, '0');
    
    return `${parte1}-${parte2}-${parte3}-${parte4}-${parte5}`.toLowerCase();
};

window.dbBaixarHistoricoDaNuvem = async () => {
    if (window.isSyncing) return { success: false };
    try {
        const unidadeAtual = localStorage.getItem('usina_unidade') || 'A369';
        // Baixamos um pouco mais (200) para garantir que pegamos tudo que precisa ser migrado/filtrado
        let url = `${SUPABASE_URL}/rest/v1/notas?select=*&order=timestamp.desc&limit=200`;
        
        const resNotas = await fetch(url, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        
        if (resNotas.ok) {
            const notasNuvem = await resNotas.json();
            let todasNotasLocais = JSON.parse(localStorage.getItem('usina_historico') || '[]');
            
            // 1. Filtragem Local Inteligente
            let historicoProcessado = [];
            if (unidadeAtual === 'GERAL') {
                historicoProcessado = notasNuvem;
            } else {
                // Se estamos em uma usina específica:
                // Pegamos notas da usina OU notas sem unidade (que serão "adotadas" por este computador)
                historicoProcessado = notasNuvem.filter(n => !n.unidade || n.unidade === unidadeAtual);
            }

            // 2. Mesclar com Local e Preservar outras usinas
            const mapaFinal = {};
            
            // Preserva o que já temos de outras usinas que não vieram no fetch (opcional, mas seguro)
            todasNotasLocais.forEach(n => {
                if (n.unidade && n.unidade !== unidadeAtual && unidadeAtual !== 'GERAL') {
                    mapaFinal[n.id] = n;
                }
            });

            // Adiciona as notas processadas da nuvem
            historicoProcessado.forEach(n => {
                // Se a nota não tem unidade, ela "vira" a unidade atual ao ser baixada
                if (!n.unidade && unidadeAtual !== 'GERAL') n.unidade = unidadeAtual;
                mapaFinal[n.id] = n;
            });

            const historicoFinal = Object.values(mapaFinal).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            localStorage.setItem('usina_historico', JSON.stringify(historicoFinal));

            if (window.carregarHistorico) window.carregarHistorico();
        }
        return { success: true };
    } catch (e) { 
        console.error("Erro ao baixar histórico:", e);
        return { success: false }; 
    }
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

window.dbSincronizarTudoLocalParaNuvem = async () => {
    if (window.isSyncing) return { success: false };
    window.isSyncing = true;

    try {
        let notasRaw = JSON.parse(localStorage.getItem('usina_historico') || '[]');
        if (notasRaw.length === 0) { window.isSyncing = false; return { success: true }; }

        const unidadeAtual = localStorage.getItem('usina_unidade') || 'NÃO DEFINIDA';
        const todasAsChavesSet = new Set(["id", "unidade", "timestamp", "nf", "data", "agua", "gelo", "local", "frente", "motorista", "placa", "al", "hora_mistura", "hora_saida", "traco", "volume", "betoneira", "materiais"]);
        
        notasRaw.forEach(n => {
            Object.keys(n).forEach(key => {
                const val = n[key];
                if (((typeof val !== 'object' && val !== undefined) || key === 'materiais') && key !== 'created_at' && key !== 'id') {
                    todasAsChavesSet.add(key);
                }
            });
        });
        
        const todasAsChaves = Array.from(todasAsChavesSet);
        const mapaUnico = new Map();

        notasRaw.forEach(n => {
            const finalUnidade = n.unidade || unidadeAtual; // Usa a unidade da nota se disponível
            const novaNota = {};
            todasAsChaves.forEach(key => {
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
                if (response.ok) sucessos++; else falhas++;
            } catch (e) { falhas++; }
        }

        // 2. ESPELHAMENTO: Deletar da nuvem o que não existe mais localmente (para esta unidade)
        try {
            const resNuvem = await fetch(`${SUPABASE_URL}/rest/v1/notas?select=id&unidade=eq.${unidadeAtual}`, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            if (resNuvem.ok) {
                const idsNuvem = await resNuvem.json();
                for (const item of idsNuvem) {
                    if (!idsLocais.has(item.id)) {
                        // Se está na nuvem mas não está no local, deleta da nuvem
                        await window.dbExcluirNota(item.id);
                    }
                }
            }
        } catch (e) { console.error("Erro no espelhamento:", e); }

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
    // Força o recarregamento total da página para limpar estados antigos e carregar os novos dados
    window.location.reload();
};

window.dbSalvarConfiguracoes = async (tipo, payload) => {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/configuracoes`, {
            method: 'POST',
            headers: { 
                'apikey': SUPABASE_KEY, 
                'Authorization': `Bearer ${SUPABASE_KEY}`, 
                'Content-Type': 'application/json', 
                'Prefer': 'resolution=merge-duplicates' 
            },
            body: JSON.stringify({ id: tipo, dados: payload, updated_at: new Date().toISOString() })
        });
        return response.ok;
    } catch (e) { return false; }
};

window.dbCarregarConfiguracoes = async (tipo, valorDefault) => {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/configuracoes?id=eq.${tipo}&select=dados`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (response.ok) {
            const data = await response.json();
            return data && data.length > 0 ? data[0].dados : valorDefault;
        }
    } catch (e) {}
    return valorDefault;
};
