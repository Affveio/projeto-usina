import os
import sqlite3
from app import app, db
from database import Motorista, Betoneira, Silo, Traco

# Deleta DB antigo se existir para comecar limpo
db_path = 'usina.db'
if os.path.exists(db_path):
    os.remove(db_path)

with app.app_context():
    db.create_all()

    # Silos
    s1 = Silo(nome="Silo 1")
    s2 = Silo(nome="Silo 2")
    db.session.add_all([s1, s2])

    # Betoneiras iniciais do Excel
    betoneiras_placas = ["TLV-2G93", "TLB-7D75", "TIP-5A25", "TJV-8I29", "RVA4F86", "TFS1D45", "RYP2H94", "RYP3G14", "TFH5B45", "TGK8G25", "TFR6E95"]
    bet_objs = [Betoneira(placa=p) for p in betoneiras_placas]
    db.session.add_all(bet_objs)

    # Motoristas iniciais do Excel
    motoristas_data = [
        ("57888", "JOSE EDIVALDO CONCEICAO OLIVEIRA"),
        ("60045", "JOSE FELIPE GONÇALO FERREIRA"),
        ("60022", "ARIANOR ALVES"),
        ("60121", "CARLOS EUGENIO VITORINO DE MEDEIROS"),
        ("58264", "DAMIAO LUCIANO DA SILVA"),
        ("60580", "LUAN JONAS DAVI"),
        ("58052", "EDSON LUIZ MIRANDA"),
        ("57506", "WILLIAN ARMANDO MARCANO"),
        ("57744", "FLAVIO DOS SANTOS ESTACIO"),
        ("59935", "JOSE ADIEL DE SOUZA DE BRITO"),
        ("60042", "JOSE SERGIO"),
        ("60972", "MANOEL ALVES DE LIMA")
    ]
    mot_objs = [Motorista(matricula=m[0], nome=m[1]) for m in motoristas_data]
    db.session.add_all(mot_objs)

    # Traco basico do Excel AT-369-CON.20.270.REV.00-6H	
    traco1 = Traco(
        codigo="AT-369-CON.20.270.REV.00-6H",
        fck=20,
        cimento_kg=270,
        areia_kg=998,
        agua_l=195,
        brita0_kg=366,
        brita1_kg=549,
        mira410_kg=1.89,
        recover_kg=0.68,
        viscocrete_kg=0
    )
    db.session.add(traco1)
    
    traco2 = Traco(
        codigo="AT-375-CON.30.340.REV.00-3H",
        fck=30,
        cimento_kg=340,
        areia_kg=1020,
        agua_l=185,
        brita0_kg=400,
        brita1_kg=560,
        mira410_kg=2.5,
        recover_kg=1.0,
        viscocrete_kg=0
    )
    db.session.add(traco2)

    db.session.commit()
    print("Banco de dados criado com sucesso e populado com dados iniciais!")
