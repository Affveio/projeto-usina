// app.js - Versão Final (Prioridade de Interface)

const TRACOS_DEFAULT = {
    "AT-375-CON.10.210.REV.00-3H": { cimento: 210, agua: 202, recover: 0, mira410: 1.68, viscocrete: 0, areia: 1010, brita0: 950, brita1: 0, gelo: 0, fck: 10, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.10.210.REV.00-6H": { cimento: 210, agua: 202, recover: 0.53, mira410: 1.47, viscocrete: 0, areia: 1010, brita0: 950, brita1: 0, gelo: 0, fck: 10, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.15.230.REV.00-3H": { cimento: 230, agua: 205, recover: 0, mira410: 1.84, viscocrete: 0, areia: 1000, brita0: 940, brita1: 0, gelo: 0, fck: 15, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.15.230.REV.00-6H": { cimento: 230, agua: 205, recover: 0.58, mira410: 1.61, viscocrete: 0, areia: 1000, brita0: 940, brita1: 0, gelo: 0, fck: 15, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.20.270.REV.00-3H": { cimento: 270, agua: 203, recover: 0, mira410: 2.16, viscocrete: 0, areia: 990, brita0: 900, brita1: 0, gelo: 0, fck: 20, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.20.270.REV.00-6H": { cimento: 270, agua: 203, recover: 0.68, mira410: 1.89, viscocrete: 0, areia: 990, brita0: 900, brita1: 0, gelo: 0, fck: 20, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.25.320.REV.01-3H": { cimento: 320, agua: 193, recover: 0, mira410: 2.72, viscocrete: 0, areia: 965, brita0: 915, brita1: 0, gelo: 0, fck: 25, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.25.320.REV.01-6H": { cimento: 320, agua: 193, recover: 0.78, mira410: 2.17, viscocrete: 0, areia: 965, brita0: 915, brita1: 0, gelo: 0, fck: 25, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.30.340.REV.00-3H": { cimento: 340, agua: 188, recover: 0, mira410: 2.72, viscocrete: 0, areia: 925, brita0: 950, brita1: 0, gelo: 0, fck: 30, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.30.340.REV.00-6H": { cimento: 340, agua: 188, recover: 0.85, mira410: 2.38, viscocrete: 0, areia: 925, brita0: 950, brita1: 0, gelo: 0, fck: 30, slump_ini: 100, slump_fim: 160, classe: 'S100' }
};

const FROTA_DEFAULT = {
    "AL-8828": { placa: "TLV-2G93" }, "AL-8831": { placa: "TLB-7D75" }, "AL-8835": { placa: "TIP-5A25" },
    "AL-8836": { placa: "TJV-8I29" }, "AL-7249": { placa: "RVA4F86" }, "AL-7311": { placa: "TFS1D45" },
    "AL-7148": { placa: "RYP2H94" }, "AL-7233": { placa: "RYP3G14" }, "AL-7312": { placa: "TGK8G25" }
};

const MOTORISTAS_DEFAULT = {
    "60580": { nome: "LUAN JONAS DAVI" }, "57888": { nome: "JOSE EDIVALDO CONCEICAO OLIVEIRA" },
    "60045": { nome: "JOSE FELIPE GONÇALO FERREIRA" }, "60022": { nome: "ARIANOR ALVES" }
};

const MAT_DB = [
    { id: "cimento", label: "Cimento", unit: "KG" },
    { id: "areia", label: "Areia", unit: "KG" },
    { id: "agua", label: "Água", unit: "L" },
    { id: "brita0", label: "Brita 0", unit: "KG" }
];

let TRACOS_DB = TRACOS_DEFAULT;
let FROTA_DB = FROTA_DEFAULT;
let MOTORISTAS_DB = MOTORISTAS_DEFAULT;
let SILOS_DB = { "Silo 1": 0, "Silo 2": 0 };
let estado = { traco: "", motorista: "", al: "" };

window.onload = function() {
    // 1. POPULA IMEDIATAMENTE (Sem await)
    popularBarraMateriais();
    popularListas();
    
    // 2. CONFIGURA CAMPOS
    const hoje = new Date();
    document.getElementById('inputDate').value = hoje.toLocaleDateString('pt-BR');
    document.getElementById('inputHoraSaida').value = hoje.toTimeString().substring(0,5);
    document.getElementById('inputVolume').addEventListener('input', recalcular);

    // 3. TENTA NUVEM EM SEGUNDO PLANO
    inicializarNuvem();
};

async function inicializarNuvem() {
    try {
        if (window.initDatabase) await window.initDatabase();
        TRACOS_DB = await window.dbCarregarConfig('tracos', TRACOS_DEFAULT);
        FROTA_DB = await window.dbCarregarConfig('frota', FROTA_DEFAULT);
        MOTORISTAS_DB = await window.dbCarregarConfig('motoristas', MOTORISTAS_DEFAULT);
        SILOS_DB = await window.dbCarregarConfig('silos', { "Silo 1": 0, "Silo 2": 0 });
        
        // Atualiza se houver novos dados
        popularListas();
        atualizarSilosUI();
    } catch(e) {}
}

function popularBarraMateriais() {
    const head = document.getElementById('header-barra-materiais');
    const body = document.getElementById('body-barra-materiais');
    if(!head || !body) return;
    head.innerHTML = '<tr>' + MAT_DB.map(m => `<th>${m.label.toUpperCase()}</th>`).join('') + '</tr>';
    body.innerHTML = '<tr>' + MAT_DB.map(m => `<td id="top${m.id}">0,0</td>`).join('') + '</tr>';
}

function popularListas() {
    const lt = document.getElementById('listaTracos');
    const lp = document.getElementById('listaPlacas');
    const lm = document.getElementById('listaMotoristas');
    if(!lt || !lp || !lm) return;

    lt.innerHTML = Object.keys(TRACOS_DB).map(t => `<li onclick="selecionarTraco('${t}')">${t}</li>`).join('');
    lp.innerHTML = Object.keys(FROTA_DB).map(p => `<li onclick="selecionarPlaca('${p}')">${p}</li>`).join('');
    lm.innerHTML = Object.keys(MOTORISTAS_DB).map(m => `<li onclick="selecionarMotorista('${m}')">${MOTORISTAS_DB[m].nome}</li>`).join('');
}

window.selecionarTraco = (t) => {
    estado.traco = t;
    document.getElementById('inputTracoDisplay').value = t;
    recalcular();
};

window.selecionarPlaca = (p) => {
    estado.al = p;
    document.getElementById('inputPlacaDisplay').value = p;
    document.getElementById('inputFrota').value = FROTA_DB[p].placa;
};

window.selecionarMotorista = (m) => {
    estado.motorista = m;
    document.getElementById('inputMotMatriculaDisplay').value = m;
    document.getElementById('inputMotoristaDisplay').value = MOTORISTAS_DB[m].nome;
};

function recalcular() {
    const vol = parseFloat(document.getElementById('inputVolume').value) || 0;
    const t = TRACOS_DB[estado.traco];
    if(!t) return;
    MAT_DB.forEach(m => {
        const val = (t[m.id] || 0) * vol;
        const el = document.getElementById('top' + m.id);
        if(el) el.innerText = val.toLocaleString('pt-BR', {minimumFractionDigits: 1});
    });
}

function atualizarSilosUI() {
    const fmt = (v) => (v || 0).toLocaleString('pt-BR');
    document.getElementById('visorSilo1').innerHTML = `${fmt(SILOS_DB['Silo 1'])} <span style="font-size:10px;">KG</span>`;
    document.getElementById('visorSilo2').innerHTML = `${fmt(SILOS_DB['Silo 2'])} <span style="font-size:10px;">KG</span>`;
}

window.mudarAba = (id, el) => {
    document.querySelectorAll('.main-content').forEach(m => m.style.display = 'none');
    document.getElementById('aba-' + id).style.display = 'flex';
    document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));
    if(el) el.classList.add('active');
};
