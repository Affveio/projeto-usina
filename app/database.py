from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Motorista(db.Model):
    __tablename__ = 'motoristas'
    id = db.Column(db.Integer, primary_key=True)
    matricula = db.Column(db.String(20), unique=True, nullable=True)
    nome = db.Column(db.String(100), nullable=False)

class Betoneira(db.Model):
    __tablename__ = 'betoneiras'
    id = db.Column(db.Integer, primary_key=True)
    placa = db.Column(db.String(20), unique=True, nullable=False)

class Silo(db.Model):
    __tablename__ = 'silos'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(50), unique=True, nullable=False)

class Traco(db.Model):
    __tablename__ = 'tracos'
    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(100), unique=True, nullable=False)
    fck = db.Column(db.Integer, nullable=True)
    cimento_kg = db.Column(db.Float, nullable=False)
    areia_kg = db.Column(db.Float, nullable=False)
    agua_l = db.Column(db.Float, nullable=False)
    brita0_kg = db.Column(db.Float, nullable=False)
    brita1_kg = db.Column(db.Float, nullable=False)
    mira410_kg = db.Column(db.Float, nullable=False)
    recover_kg = db.Column(db.Float, nullable=False)
    viscocrete_kg = db.Column(db.Float, nullable=False, default=0)

class Nota(db.Model):
    __tablename__ = 'notas'
    id = db.Column(db.Integer, primary_key=True)
    numero_nota = db.Column(db.Integer, unique=True, nullable=False)
    data = db.Column(db.String(20), nullable=False)
    hora_mistura = db.Column(db.String(10), nullable=True)
    hora_saida = db.Column(db.String(10), nullable=True)
    
    motorista_id = db.Column(db.Integer, db.ForeignKey('motoristas.id'), nullable=True)
    betoneira_id = db.Column(db.Integer, db.ForeignKey('betoneiras.id'), nullable=True)
    silo_id = db.Column(db.Integer, db.ForeignKey('silos.id'), nullable=True)
    traco_id = db.Column(db.Integer, db.ForeignKey('tracos.id'), nullable=True)
    
    local = db.Column(db.String(200), nullable=True)
    volume_m3 = db.Column(db.Float, nullable=False)
    agua_colocada_l = db.Column(db.Float, nullable=True)
    folga_agua_obra_l = db.Column(db.Float, nullable=True)
    gelo_kg = db.Column(db.Float, nullable=True)
    
    total_cimento = db.Column(db.Float, nullable=True)
    total_areia = db.Column(db.Float, nullable=True)
    total_agua_retida = db.Column(db.Float, nullable=True)
    total_agua = db.Column(db.Float, nullable=True)
    total_brita0 = db.Column(db.Float, nullable=True)
    total_brita1 = db.Column(db.Float, nullable=True)
    total_mira = db.Column(db.Float, nullable=True)
    total_recover = db.Column(db.Float, nullable=True)
    total_viscocrete = db.Column(db.Float, nullable=True)

    motorista = db.relationship('Motorista')
    betoneira = db.relationship('Betoneira')
    silo = db.relationship('Silo')
    traco = db.relationship('Traco')

    def to_dict(self):
        return {
            'id': self.id,
            'numero_nota': self.numero_nota,
            'data': self.data,
            'hora_mistura': self.hora_mistura,
            'hora_saida': self.hora_saida,
            'motorista': self.motorista.nome if self.motorista else '',
            'betoneira': self.betoneira.placa if self.betoneira else '',
            'silo': self.silo.nome if self.silo else '',
            'traco': self.traco.codigo if self.traco else '',
            'local': self.local,
            'volume_m3': self.volume_m3
        }
