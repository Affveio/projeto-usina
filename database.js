// database.js - Conexão Silenciosa e Robusta com Supabase
const SUPABASE_URL = 'https://ttcycjnlzchagnneqpym.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fbDsAd9r_ordMh0-lGycWw_IPRQykl5';

let supabase = null;
let cloudConnected = false;

window.initDatabase = async function() {
    try {
        if (typeof window.supabase !== 'undefined') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            const { error } = await supabase.from('configuracoes').select('id').limit(1);
            if (!error) {
                cloudConnected = true;
                return { success: true };
            } else {
                console.error("Supabase Select Error:", error);
                return { success: false, error: error.message || JSON.stringify(error) };
            }
        } else {
            return { success: false, error: "A biblioteca do Supabase não foi carregada (CDN bloqueado ou sem internet)." };
        }
    } catch(e) {
        console.error("Critical Init Error:", e);
        return { success: false, error: e.message || "Erro desconhecido na inicialização." };
    }
};

window.isCloudAvailable = () => cloudConnected && supabase !== null;

window.dbSalvarNota = async function(nota) {
    try {
        if (!window.isCloudAvailable()) return null;
        // Ajuste para garantir que materiais seja JSONB
        const payload = { ...nota };
        const { error } = await supabase.from('notas').insert([payload]);
        if (error) throw error;
        return true;
    } catch(e) {
        console.error("Erro ao salvar nota na nuvem:", e);
        return false;
    }
};

window.dbListarNotas = async function() {
    try {
        if (!window.isCloudAvailable()) return [];
        const { data, error } = await supabase.from('notas').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch(e) {
        console.error("Erro ao listar notas da nuvem:", e);
        return [];
    }
};

window.dbSalvarConfig = async function(tipo, payload) {
    try {
        if (!window.isCloudAvailable()) return false;
        const { error } = await supabase.from('configuracoes').upsert({ id: tipo, dados: payload, updated_at: new Date().toISOString() });
        if (error) throw error;
        return true;
    } catch(e) {
        console.error(`Erro ao salvar config [${tipo}] na nuvem:`, e);
        return false;
    }
};

window.dbCarregarConfig = async function(tipo, valorDefault) {
    try {
        if (!window.isCloudAvailable()) return valorDefault;
        const { data, error } = await supabase.from('configuracoes').select('dados').eq('id', tipo).single();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
        return data ? data.dados : valorDefault;
    } catch(e) {
        console.warn(`Aviso ao carregar config [${tipo}] da nuvem:`, e.message);
        return valorDefault;
    }
};

window.dbSincronizarTudoLocalParaNuvem = async function() {
    if (!window.isCloudAvailable()) return { success: false, message: "Nuvem Offline" };
    
    try {
        const tracos = JSON.parse(localStorage.getItem('usina_tracos') || '{}');
        const frota = JSON.parse(localStorage.getItem('usina_frota') || '{}');
        const motoristas = JSON.parse(localStorage.getItem('usina_motoristas') || '{}');
        const silos = JSON.parse(localStorage.getItem('usina_silos_db') || '{}');
        const materiais = JSON.parse(localStorage.getItem('usina_materiais') || '[]');
        
        await window.dbSalvarConfig('tracos', tracos);
        await window.dbSalvarConfig('frota', frota);
        await window.dbSalvarConfig('motoristas', motoristas);
        await window.dbSalvarConfig('silos', silos);
        await window.dbSalvarConfig('materiais', materiais);
        
        return { success: true, message: "Sincronização concluída com sucesso!" };
    } catch(e) {
        return { success: false, message: e.message };
    }
};
