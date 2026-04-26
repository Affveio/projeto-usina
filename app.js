// app.js - Lógica Principal da Usina (Versão Ultra-Robusta)

// --- ESTADO E BANCO DE DADOS ---
const TRACOS_DEFAULT = {
    "AT-375-CON.10.210.REV.00-3H": { cimento: 210, agua: 202, recover: 0, mira410: 1.68, viscocrete: 0, areia: 1010, brita0: 950, brita1: 0, gelo: 0, fck: 10, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.10.210.REV.00-6H": { cimento: 210, agua: 202, recover: 0.53, mira410: 1.47, viscocrete: 0, areia: 1010, brita0: 950, brita1: 0, gelo: 0, fck: 10, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.15.230.REV.00-3H": { cimento: 230, agua: 205, recover: 0, mira410: 1.84, viscocrete: 0, areia: 1000, brita0: 940, brita1: 0, gelo: 0, fck: 15, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.15.230.REV.00-6H": { cimento: 230, agua: 205, recover: 0.58, mira410: 1.61, viscocrete: 0, areia: 1000, brita0: 940, brita1: 0, gelo: 0, fck: 15, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-EXT.15.240.REV.00-6H": { cimento: 240, agua: 190, recover: 0.60, mira410: 1.68, viscocrete: 0, areia: 1010, brita0: 960, brita1: 0, gelo: 0, fck: 15, slump_ini: 50, slump_fim: 100, classe: 'S50' },
    "AT-375-CON.20.270.REV.00-3H": { cimento: 270, agua: 203, recover: 0, mira410: 2.16, viscocrete: 0, areia: 990, brita0: 900, brita1: 0, gelo: 0, fck: 20, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.20.270.REV.00-6H": { cimento: 270, agua: 203, recover: 0.68, mira410: 1.89, viscocrete: 0, areia: 990, brita0: 900, brita1: 0, gelo: 0, fck: 20, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.25.320.REV.01-3H": { cimento: 320, agua: 193, recover: 0, mira410: 2.72, viscocrete: 0, areia: 965, brita0: 915, brita1: 0, gelo: 0, fck: 25, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.25.320.REV.01-6H": { cimento: 320, agua: 193, recover: 0.78, mira410: 2.17, viscocrete: 0, areia: 965, brita0: 915, brita1: 0, gelo: 0, fck: 25, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.30.340.REV.00-3H": { cimento: 340, agua: 188, recover: 0, mira410: 2.72, viscocrete: 0, areia: 925, brita0: 950, brita1: 0, gelo: 0, fck: 30, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.30.340.REV.00-6H": { cimento: 340, agua: 188, recover: 0.85, mira410: 2.38, viscocrete: 0, areia: 925, brita0: 950, brita1: 0, gelo: 0, fck: 30, slump_ini: 100, slump_fim: 160, classe: 'S100' },
    "AT-375-CON.35.370.REV.00-3H": { cimento: 370, agua: 176, recover: 0, mira410: 2.96, viscocrete: 2.59, areia: 910, brita0: 590, brita1: 370, gelo: 0, fck: 35, slump_ini: 160, slump_fim: 220, classe: 'S160' },
    "AT-375-CON.35.370_REV.00-6H": { cimento: 370, agua: 176, recover: 0.93, mira410: 2.96, viscocrete: 2.59, areia: 910, brita0: 590, brita1: 370, gelo: 0, fck: 35, slump_ini: 160, slump_fim: 220, classe: 'S160' },
    "AT-375-CON.45.400.REV.00-B0-3H": { cimento: 400, agua: 179, recover: 0.60, mira410: 2.80, viscocrete: 3.20, areia: 845, brita0: 1000, brita1: 0, gelo: 0, fck: 45, slump_ini: 220, slump_fim: 260, classe: 'S220' }
};

const FROTA_DEFAULT = {
    "AL-8828": { placa: "TLV-2G93", ativo: true },
    "AL-8831": { placa: "TLB-7D75", ativo: true },
    "AL-8835": { placa: "TIP-5A25", ativo: true },
    "AL-8836": { placa: "TJV-8I29", ativo: true },
    "AL-7249": { placa: "RVA4F86", ativo: true },
    "AL-7311": { placa: "TFS1D45", ativo: true },
    "AL-7148": { placa: "RYP2H94", ativo: true },
    "AL-7233": { placa: "RYP3G14", ativo: true },
    "AL-7349": { placa: "TFH5B45", ativo: true },
    "AL-7312": { placa: "TGK8G25", ativo: true },
    "AL-9161": { placa: "TFR6E95", ativo: true },
    "AL-9597": { placa: "TFH5B45", ativo: true }
};

const MOTORISTAS_DEFAULT = {
    "57888": { nome: "JOSE EDIVALDO CONCEICAO OLIVEIRA", ativo: true },
    "60045": { nome: "JOSE FELIPE GONÇALO FERREIRA", ativo: true },
    "60022": { nome: "ARIANOR ALVES", ativo: true },
    "60121": { nome: "CARLOS EUGENIO VITORINO DE MEDEIROS", ativo: true },
    "58264": { nome: "DAMIAO LUCIANO DA SILVA", ativo: true },
    "60580": { nome: "LUAN JONAS DAVI", ativo: true },
    "58052": { nome: "EDSON LUIZ MIRANDA", ativo: true },
    "57506": { nome: "WILLIAN ARMANDO MARCANO", ativo: true },
    "57744": { nome: "FLAVIO DOS SANTOS ESTACIO", ativo: true },
    "59935": { nome: "JOSE ADIEL DE SOUZA DE BRITO", ativo: true },
    "60042": { nome: "JOSE SERGIO", ativo: true },
    "60972": { nome: "MANOEL ALVES DE LIMA", ativo: true },
    "58372": { nome: "VALDEITON CARVALHO", ativo: true }
};

const MATERIAIS_DEFAULT = [
    { id: "cimento", label: "Cimento CP II-F 40", unit: "KG", type: "cement" },
    { id: "areia", label: "Areia Natural", unit: "KG", type: "aggregate" },
    { id: "agua", label: "Água", unit: "L", type: "water" },
    { id: "brita0", label: "Brita 0", unit: "KG", type: "aggregate" },
    { id: "brita1", label: "Brita 1", unit: "KG", type: "aggregate" },
    { id: "mira410", label: "Mira 410", unit: "KG", type: "additive" },
    { id: "recover", label: "Recover", unit: "KG", type: "additive" },
    { id: "viscocrete", label: "Viscocrete 6090", unit: "KG", type: "additive" },
    { id: "gelo", label: "Gelo", unit: "LTS", type: "ice" }
];

let TRACOS_DB = TRACOS_DEFAULT;
let FROTA_DB = FROTA_DEFAULT;
let MOTORISTAS_DB = MOTORISTAS_DEFAULT;
let MAT_DB = MATERIAIS_DEFAULT;
let SILOS_DB = { "Silo 1": 0, "Silo 2": 0 };

let estado = {
    tracoSelecionado: "AT-375-CON.15.230.REV.00-3H",
    motoristaSelecionadoObj: { matricula: "60580", nome: "LUAN JONAS DAVI" },
    placaSelecionadaObj: { al: "AL-7312", placa: "TGK8G25" },
    senhaLiberada: false
};

// --- INICIALIZAÇÃO ---

window.onload = async function() {
    // 1. Carrega dados padrão IMEDIATAMENTE (Garante que nada fique vazio)
    popularBarraMateriais();
    popularTracos();
    popularFrota();
    atualizarSilosUI();
    
    // 2. Configura campos básicos
    const hoje = new Date();
    document.getElementById('inputDate').value = hoje.toLocaleDateString('pt-BR');
    document.getElementById('inputHoraSaida').value = hoje.toTimeString().substring(0,5);
    document.getElementById('inputVolume').addEventListener('input', recalcular);
    document.getElementById('inputAguaUsina').addEventListener('input', recalcular);

    // 3. Tenta conectar à nuvem de forma assíncrona (Não trava a tela)
    setTimeout(async () => {
        try {
            if (window.initDatabase) await window.initDatabase();
            await carregarDadosIniciais();
        } catch(e) {
            console.warn("Rodando em modo Offline. Cloud indisponível.");
        }
    }, 500);
};

async function carregarDadosIniciais() {
    try {
        TRACOS_DB = await window.dbCarregarConfig('tracos', TRACOS_DEFAULT);
        FROTA_DB = await window.dbCarregarConfig('frota', FROTA_DEFAULT);
        MOTORISTAS_DB = await window.dbCarregarConfig('motoristas', MOTORISTAS_DEFAULT);
        MAT_DB = await window.dbCarregarConfig('materiais', MATERIAIS_DEFAULT);
        SILOS_DB = await window.dbCarregarConfig('silos', { "Silo 1": 0, "Silo 2": 0 });

        // Atualiza a tela com dados da nuvem
        popularBarraMateriais();
        popularTracos();
        popularFrota();
        atualizarSilosUI();
        recalcular();
    } catch(e) {
        console.error("Falha ao sincronizar com nuvem:", e);
    }
}

// --- LÓGICA DE UI ---

window.mudarAba = async function(abaId, el) {
    document.querySelectorAll('.main-content').forEach(m => m.style.display = 'none');
    const alvo = document.getElementById('aba-' + abaId);
    if (alvo) alvo.style.display = 'flex';

    if (el) {
        document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));
        el.classList.add('active');
    }
};

function recalcular() {
    const vol = parseFloat(document.getElementById('inputVolume').value) || 0;
    const traco = TRACOS_DB[estado.tracoSelecionado];
    if (!traco) return;

    MAT_DB.forEach(mat => {
        const base = traco[mat.id] || 0;
        const total = base * vol;
        const elTop = document.getElementById('top' + mat.id.charAt(0).toUpperCase() + mat.id.slice(1));
        if (elTop) elTop.innerText = total.toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 2});
    });
}

window.imprimirNota = async function() {
    const nf = document.getElementById('inputNF').value;
    if (!nf) return alert("Preencha a NF!");
    alert("Salvando Nota...");
    window.print();
};

function popularBarraMateriais() {
    const head = document.getElementById('header-barra-materiais');
    const body = document.getElementById('body-barra-materiais');
    if(!head || !body) return;
    head.innerHTML = '<tr>' + MAT_DB.map(m => `<th>${m.label}</th>`).join('') + '</tr>';
    body.innerHTML = '<tr>' + MAT_DB.map(m => `<td id="top${m.id.charAt(0).toUpperCase()}${m.id.slice(1)}">0,0</td>`).join('') + '</tr>';
}

function popularTracos() {
    const list = document.getElementById('listaTracos');
    if (!list) return;
    list.innerHTML = "";
    Object.keys(TRACOS_DB).forEach(nome => {
        let li = document.createElement('li');
        li.innerText = nome;
        li.onclick = () => {
            estado.tracoSelecionado = nome;
            document.getElementById('inputTracoDisplay').value = nome;
            recalcular();
        };
        list.appendChild(li);
    });
}

function popularFrota() {
    const listM = document.getElementById('listaMotoristas');
    const listP = document.getElementById('listaPlacas');
    if (!listM || !listP) return;
    listM.innerHTML = ""; listP.innerHTML = "";
    Object.keys(MOTORISTAS_DB).forEach(mat => {
        let li = document.createElement('li');
        li.innerText = MOTORISTAS_DB[mat].nome;
        li.onclick = () => {
            estado.motoristaSelecionadoObj = { matricula: mat, nome: MOTORISTAS_DB[mat].nome };
            document.getElementById('inputMotoristaDisplay').value = MOTORISTAS_DB[mat].nome;
        };
        listM.appendChild(li);
    });
    Object.keys(FROTA_DB).forEach(al => {
        let li = document.createElement('li');
        li.innerText = al;
        li.onclick = () => {
            estado.placaSelecionadaObj = { al: al, placa: FROTA_DB[al].placa };
            document.getElementById('inputPlacaDisplay').value = al;
        };
        listP.appendChild(li);
    });
}

function atualizarSilosUI() {
    const fmt = (v) => (v || 0).toLocaleString('pt-BR');
    if (document.getElementById('visorSilo1')) document.getElementById('visorSilo1').innerHTML = `${fmt(SILOS_DB['Silo 1'])} <span style="font-size:10px;">KG</span>`;
    if (document.getElementById('visorSilo2')) document.getElementById('visorSilo2').innerHTML = `${fmt(SILOS_DB['Silo 2'])} <span style="font-size:10px;">KG</span>`;
}
