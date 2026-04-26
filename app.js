// app.js - Versão 100% Completa e Funcional

// --- DADOS DE CONFIGURAÇÃO PADRÃO ---
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
    { id: "cimento", label: "Cimento", unit: "KG" },
    { id: "areia", label: "Areia", unit: "KG" },
    { id: "agua", label: "Água", unit: "L" },
    { id: "brita0", label: "Brita 0", unit: "KG" },
    { id: "mira410", label: "Mira 410", unit: "KG" },
    { id: "recover", label: "Recover", unit: "KG" },
    { id: "viscocrete", label: "Visco", unit: "KG" }
];

let estado = { traco: "", motorista: "", al: "", volume: 0, nf: 0 };

// --- INICIALIZAÇÃO IMEDIATA ---

function inicializar() {
    popularBarraMateriais();
    popularListas();
    
    const hoje = new Date();
    document.getElementById('inputDate').value = hoje.toLocaleDateString('pt-BR');
    document.getElementById('inputHoraSaida').value = hoje.toTimeString().substring(0,5);
    
    document.getElementById('inputVolume').addEventListener('input', (e) => {
        estado.volume = parseFloat(e.target.value) || 0;
        recalcular();
    });

    // Inicia conexão cloud em segundo plano
    if (window.initDatabase) {
        window.initDatabase().then(() => {
            window.dbListarNotas().then(notas => {
                if (notas && notas.length > 0) {
                    const ultimaNF = Math.max(...notas.map(n => parseInt(n.nf) || 0));
                    document.getElementById('inputNF').value = ultimaNF + 1;
                }
            });
        });
    }
}

// --- FUNÇÕES DE INTERFACE ---

function popularBarraMateriais() {
    const head = document.getElementById('header-barra-materiais');
    const body = document.getElementById('body-barra-materiais');
    if(!head || !body) return;
    head.innerHTML = '<tr>' + MATS.map(m => `<th>${m.label.toUpperCase()}</th>`).join('') + '<th>ÁGUA USINA</th></tr>';
    body.innerHTML = '<tr>' + MATS.map(m => `<td id="top_${m.id}">0,0</td>`).join('') + '<td id="top_agua_usina">0,0</td></tr>';
}

function popularListas() {
    const lt = document.getElementById('listaTracos');
    const lp = document.getElementById('listaPlacas');
    const lm = document.getElementById('listaMotoristas');
    if(!lt || !lp || !lm) return;

    lt.innerHTML = Object.keys(TRACOS).map(t => `<li onclick="selecionarTraco('${t}')">${t}</li>`).join('');
    lp.innerHTML = Object.keys(FROTA).map(p => `<li onclick="selecionarPlaca('${p}')">${p}</li>`).join('');
    lm.innerHTML = Object.keys(MOTORISTAS).map(m => `<li onclick="selecionarMotorista('${m}')">${MOTORISTAS[m]}</li>`).join('');
}

window.selecionarTraco = (t) => {
    estado.traco = t;
    document.getElementById('inputTracoDisplay').value = t;
    document.querySelectorAll('#listaTracos li').forEach(li => {
        li.classList.toggle('selected', li.innerText === t);
    });
    recalcular();
};

window.selecionarPlaca = (p) => {
    estado.al = p;
    document.getElementById('inputPlacaDisplay').value = p;
    document.getElementById('inputFrota').value = FROTA[p];
    document.querySelectorAll('#listaPlacas li').forEach(li => {
        li.classList.toggle('selected', li.innerText === p);
    });
};

window.selecionarMotorista = (m) => {
    estado.motorista = m;
    document.getElementById('inputMotMatriculaDisplay').value = m;
    document.getElementById('inputMotoristaDisplay').value = MOTORISTAS[m];
    document.querySelectorAll('#listaMotoristas li').forEach(li => {
        li.classList.toggle('selected', li.innerText.includes(MOTORISTAS[m]));
    });
};

function recalcular() {
    const t = TRACOS[estado.traco];
    if(!t) return;
    
    MATS.forEach(m => {
        const val = (t[m.id] || 0) * estado.volume;
        const el = document.getElementById('top_' + m.id);
        if(el) el.innerText = val.toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1});
    });

    const aguaUsina = (t.agua || 0) * estado.volume;
    document.getElementById('top_agua_usina').innerText = aguaUsina.toLocaleString('pt-BR', {minimumFractionDigits: 1});
    document.getElementById('inputAguaUsina').value = Math.round(aguaUsina);
}

window.imprimirNota = async function() {
    const nf = document.getElementById('inputNF').value;
    if(!nf || !estado.traco) return alert("Preencha a NF e selecione o Traço!");

    const nota = {
        nf: nf,
        traco: estado.traco,
        volume: estado.volume,
        motorista: MOTORISTAS[estado.motorista],
        placa: FROTA[estado.al],
        data: document.getElementById('inputDate').value,
        hora_saida: document.getElementById('inputHoraSaida').value,
        created_at: new Date().toISOString()
    };

    try {
        if(window.dbSalvarNota) await window.dbSalvarNota(nota);
        alert("Nota salva com sucesso na nuvem!");
        window.print();
        document.getElementById('inputNF').value = parseInt(nf) + 1;
    } catch(e) {
        alert("Erro ao salvar nota!");
    }
};

window.mudarAba = (id, el) => {
    document.querySelectorAll('.main-content').forEach(m => m.style.display = 'none');
    document.getElementById('aba-' + id).style.display = 'flex';
    document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));
    if(el) el.classList.add('active');
};

// Start
setTimeout(inicializar, 100);
