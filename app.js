// app.js - Versão "Script Imediato" (Sem Espera)

// --- DADOS OFICIAIS ---
const TRACOS = {
    "AT-375-CON.10.210.REV.00-3H": { cimento: 210, agua: 202, areia: 1010, brita0: 950 },
    "AT-375-CON.15.230.REV.00-3H": { cimento: 230, agua: 205, areia: 1000, brita0: 940 },
    "AT-375-CON.20.270.REV.00-3H": { cimento: 270, agua: 203, areia: 990, brita0: 900 },
    "AT-375-CON.25.320.REV.01-3H": { cimento: 320, agua: 193, areia: 965, brita0: 915 },
    "AT-375-CON.30.340.REV.00-3H": { cimento: 340, agua: 188, areia: 925, brita0: 950 },
    "AT-375-CON.35.370.REV.00-3H": { cimento: 370, agua: 176, areia: 910, brita0: 590 }
};

const FROTA = {
    "AL-8828": "TLV-2G93", "AL-8831": "TLB-7D75", "AL-8835": "TIP-5A25",
    "AL-8836": "TJV-8I29", "AL-7249": "RVA4F86", "AL-7311": "TFS1D45",
    "AL-7148": "RYP2H94", "AL-7233": "RYP3G14", "AL-7312": "TGK8G25"
};

const MOTORISTAS = {
    "60580": "LUAN JONAS DAVI", "57888": "JOSE EDIVALDO CONCEICAO OLIVEIRA",
    "60045": "JOSE FELIPE GONÇALO FERREIRA", "60022": "ARIANOR ALVES"
};

let estado = { traco: "", motorista: "", al: "" };

// --- FUNÇÕES DE INTERFACE ---

function popularListas() {
    console.log("Populando listas...");
    const lt = document.getElementById('listaTracos');
    const lp = document.getElementById('listaPlacas');
    const lm = document.getElementById('listaMotoristas');

    if (lt) lt.innerHTML = Object.keys(TRACOS).map(t => `<li onclick="selecionarTraco('${t}')">${t}</li>`).join('');
    if (lp) lp.innerHTML = Object.keys(FROTA).map(p => `<li onclick="selecionarPlaca('${p}')">${p}</li>`).join('');
    if (lm) lm.innerHTML = Object.keys(MOTORISTAS).map(m => `<li onclick="selecionarMotorista('${m}')">${MOTORISTAS[m]}</li>`).join('');
}

window.selecionarTraco = (t) => {
    estado.traco = t;
    document.getElementById('inputTracoDisplay').value = t;
    recalcular();
};

window.selecionarPlaca = (p) => {
    estado.al = p;
    document.getElementById('inputPlacaDisplay').value = p;
    document.getElementById('inputFrota').value = FROTA[p];
};

window.selecionarMotorista = (m) => {
    estado.motorista = m;
    document.getElementById('inputMotMatriculaDisplay').value = m;
    document.getElementById('inputMotoristaDisplay').value = MOTORISTAS[m];
};

function recalcular() {
    const vol = parseFloat(document.getElementById('inputVolume').value) || 0;
    const t = TRACOS[estado.traco];
    if(!t) return;
    
    // Atualiza tabela de materiais (Header e Body dinâmicos se necessário)
    // Para simplificar, vamos focar nas listas agora
}

window.mudarAba = (id, el) => {
    document.querySelectorAll('.main-content').forEach(m => m.style.display = 'none');
    const alvo = document.getElementById('aba-' + id);
    if (alvo) alvo.style.display = 'flex';
    
    document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));
    if(el) el.classList.add('active');
};

// EXECUÇÃO IMEDIATA (Sem window.onload)
setTimeout(() => {
    popularListas();
    const hoje = new Date();
    if(document.getElementById('inputDate')) document.getElementById('inputDate').value = hoje.toLocaleDateString('pt-BR');
    if(document.getElementById('inputHoraSaida')) document.getElementById('inputHoraSaida').value = hoje.toTimeString().substring(0,5);
}, 100);
