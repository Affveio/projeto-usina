// app.js - Versão com Seleção Corrigida

// --- DADOS ---
const TRACOS = {
    "AT-375-CON.10.210.REV.00-3H": { cimento: 210, agua: 202, areia: 1010, brita0: 950, mira410: 1.68, recover: 0, viscocrete: 0 },
    "AT-375-CON.15.230.REV.00-3H": { cimento: 230, agua: 205, areia: 1000, brita0: 940, mira410: 1.84, recover: 0, viscocrete: 0 },
    "AT-375-CON.20.270.REV.00-3H": { cimento: 270, agua: 203, areia: 990, brita0: 900, mira410: 2.16, recover: 0, viscocrete: 0 },
    "AT-375-CON.25.320.REV.01-3H": { cimento: 320, agua: 193, areia: 965, brita0: 915, mira410: 2.72, recover: 0, viscocrete: 0 },
    "AT-375-CON.30.340.REV.00-3H": { cimento: 340, agua: 188, areia: 925, brita0: 950, mira410: 2.72, recover: 0, viscocrete: 0 },
    "AT-375-CON.35.370.REV.00-3H": { cimento: 370, agua: 176, areia: 910, brita0: 590, mira410: 2.96, recover: 0, viscocrete: 2.59 },
    "AT-375-CON.45.400.REV.00-B0-3H": { cimento: 400, agua: 179, areia: 845, brita0: 1000, mira410: 2.80, recover: 0.60, viscocrete: 3.20 }
};

const FROTA = {
    "AL-8828": "TLV-2G93", "AL-8831": "TLB-7D75", "AL-8835": "TIP-5A25", "AL-8836": "TJV-8I29",
    "AL-7249": "RVA4F86", "AL-7311": "TFS1D45", "AL-7148": "RYP2H94", "AL-7233": "RYP3G14", "AL-7312": "TGK8G25"
};

const MOTORISTAS = {
    "60580": "LUAN JONAS DAVI", "57888": "JOSE EDIVALDO CONCEICAO OLIVEIRA",
    "60045": "JOSE FELIPE GONÇALO FERREIRA", "60022": "ARIANOR ALVES", "58264": "DAMIAO LUCIANO DA SILVA"
};

const MATS = [
    { id: "cimento", label: "Cimento", unit: "KG" }, { id: "areia", label: "Areia", unit: "KG" },
    { id: "agua", label: "Água", unit: "L" }, { id: "brita0", label: "Brita 0", unit: "KG" },
    { id: "mira410", label: "Mira 410", unit: "KG" }, { id: "recover", label: "Recover", unit: "KG" },
    { id: "viscocrete", label: "Visco", unit: "KG" }
];

let estado = { traco: "", motorista: "", al: "", volume: 0 };

// --- FUNÇÕES GLOBAIS (window.xxx) ---

window.selecionarTraco = function(t) {
    console.log("Selecionado Traço:", t);
    estado.traco = t;
    document.getElementById('inputTracoDisplay').value = t;
    recalcular();
    atualizarDestaque('listaTracos', t);
};

window.selecionarPlaca = function(al) {
    console.log("Selecionada Placa:", al);
    estado.al = al;
    document.getElementById('inputPlacaDisplay').value = al;
    document.getElementById('inputFrota').value = FROTA[al] || "";
    atualizarDestaque('listaPlacas', al);
};

window.selecionarMotorista = function(mat, nome) {
    console.log("Selecionado Motorista:", nome);
    estado.motorista = mat;
    document.getElementById('inputMotMatriculaDisplay').value = mat;
    document.getElementById('inputMotoristaDisplay').value = nome;
    atualizarDestaque('listaMotoristas', nome);
};

function atualizarDestaque(idLista, texto) {
    document.querySelectorAll(`#${idLista} li`).forEach(li => {
        li.classList.toggle('selected', li.innerText.includes(texto));
    });
}

function recalcular() {
    const t = TRACOS[estado.traco];
    if(!t) return;
    const vol = parseFloat(document.getElementById('inputVolume').value) || 0;
    
    MATS.forEach(m => {
        const val = (t[m.id] || 0) * vol;
        const el = document.getElementById('top_' + m.id);
        if(el) el.innerText = val.toLocaleString('pt-BR', {minimumFractionDigits: 1});
    });

    const aguaTot = (t.agua || 0) * vol;
    const elAgua = document.getElementById('top_agua_usina');
    if(elAgua) elAgua.innerText = aguaTot.toLocaleString('pt-BR', {minimumFractionDigits: 1});
    document.getElementById('inputAguaUsina').value = Math.round(aguaTot);
}

// --- INICIALIZAÇÃO ---

function popularListas() {
    const lt = document.getElementById('listaTracos');
    const lp = document.getElementById('listaPlacas');
    const lm = document.getElementById('listaMotoristas');

    if(lt) lt.innerHTML = Object.keys(TRACOS).map(t => `<li onclick="window.selecionarTraco('${t}')">${t}</li>`).join('');
    if(lp) lp.innerHTML = Object.keys(FROTA).map(p => `<li onclick="window.selecionarPlaca('${p}')">${p}</li>`).join('');
    if(lm) lm.innerHTML = Object.keys(MOTORISTAS).map(m => `<li onclick="window.selecionarMotorista('${m}', '${MOTORISTAS[m]}')">${MOTORISTAS[m]}</li>`).join('');
}

function popularBarraMateriais() {
    const head = document.getElementById('header-barra-materiais');
    const body = document.getElementById('body-barra-materiais');
    if(!head || !body) return;
    head.innerHTML = '<tr>' + MATS.map(m => `<th>${m.label.toUpperCase()}</th>`).join('') + '<th>ÁGUA USINA</th></tr>';
    body.innerHTML = '<tr>' + MATS.map(m => `<td id="top_${m.id}">0,0</td>`).join('') + '<td id="top_agua_usina">0,0</td></tr>';
}

window.onload = function() {
    popularBarraMateriais();
    popularListas();
    
    const hoje = new Date();
    document.getElementById('inputDate').value = hoje.toLocaleDateString('pt-BR');
    document.getElementById('inputHoraSaida').value = hoje.toTimeString().substring(0,5);
    document.getElementById('inputVolume').addEventListener('input', recalcular);

    // Conexão Cloud básica
    if (window.initDatabase) window.initDatabase();
};

window.imprimirNota = function() {
    alert("Salvando nota...");
    window.print();
};
