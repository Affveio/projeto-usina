// database.js - Conexão Silenciosa e Robusta

const SUPABASE_URL = 'https://ttcycjnlzchagnneqpym.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fbDsAd9r_ordMh0-lGycWw_IPRQykl5';

let supabase = null;

window.initDatabase = async function() {
    try {
        if (typeof window.supabase !== 'undefined') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
    } catch(e) {
        console.warn("Falha na inicialização do Supabase:", e);
    }
    return supabase;
};

window.dbSalvarNota = async function(nota) {
    try {
        if (!supabase) return null;
        await supabase.from('notas').insert([nota]);
    } catch(e) {
        console.error("Erro ao salvar nota na nuvem:", e);
    }
};

window.dbListarNotas = async function() {
    try {
        if (!supabase) return [];
        const { data } = await supabase.from('notas').select('*').order('created_at', { ascending: false });
        return data || [];
    } catch(e) {
        return [];
    }
};

window.dbSalvarConfig = async function(tipo, payload) {
    try {
        if (!supabase) return;
        await supabase.from('configuracoes').upsert({ id: tipo, dados: payload });
    } catch(e) {}
};

window.dbCarregarConfig = async function(tipo, valorDefault) {
    try {
        if (!supabase) return valorDefault;
        const { data } = await supabase.from('configuracoes').select('dados').eq('id', tipo).single();
        return data ? data.dados : valorDefault;
    } catch(e) {
        return valorDefault;
    }
};

window.dbAtualizarSilos = async function(silos) {
    await window.dbSalvarConfig('silos', silos);
};
