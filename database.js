// database.js - Integração com Supabase na Nuvem

// Configuração oficial do projeto ATERPA Usina
const SUPABASE_URL = 'https://ttcycjnlzchagnneqpym.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fbDsAd9r_ordMh0-lGycWw_IPRQykl5';

let supabase = null;

// Inicialização segura que pode ser chamada externamente
window.initDatabase = async function() {
    if (typeof window.supabase !== 'undefined' && SUPABASE_URL && SUPABASE_KEY) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
        console.warn("Supabase não carregado ou chaves ausentes. Usando armazenamento local.");
    }
    return supabase;
};

// --- OPERAÇÕES DE NOTAS ---

window.dbSalvarNota = async function(nota) {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('notas')
        .insert([nota])
        .select();
    
    if (error) throw error;
    return data[0];
};

window.dbListarNotas = async function(filtros = {}) {
    if (!supabase) return JSON.parse(localStorage.getItem('usina_historico') || '[]');
    
    let query = supabase.from('notas').select('*').order('created_at', { ascending: false });
    
    if (filtros.dataIni) query = query.gte('data', filtros.dataIni);
    if (filtros.dataFim) query = query.lte('data', filtros.dataFim);
    if (filtros.nf) query = query.eq('nf', filtros.nf);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

window.dbExcluirNota = async function(nf) {
    if (!supabase) return;
    const { error } = await supabase.from('notas').delete().eq('nf', nf);
    if (error) throw error;
};

// --- OPERAÇÕES DE CONFIGURAÇÃO (TRAÇOS, MATERIAIS, FROTA) ---

window.dbSalvarConfig = async function(tipo, payload) {
    if (!supabase) {
        localStorage.setItem('usina_' + tipo, JSON.stringify(payload));
        return;
    }
    const { error } = await supabase
        .from('configuracoes')
        .upsert({ id: tipo, dados: payload })
        .select();
    
    if (error) throw error;
};

window.dbCarregarConfig = async function(tipo, valorDefault) {
    if (!supabase) return JSON.parse(localStorage.getItem('usina_' + tipo) || JSON.stringify(valorDefault));
    
    const { data, error } = await supabase
        .from('configuracoes')
        .select('dados')
        .eq('id', tipo)
        .single();
    
    if (error && error.code !== 'PGRST116') throw error; 
    return data ? data.dados : valorDefault;
};

// --- SINCRONIZAÇÃO DE SILOS ---

window.dbAtualizarSilos = async function(silos) {
    await window.dbSalvarConfig('silos', silos);
};
