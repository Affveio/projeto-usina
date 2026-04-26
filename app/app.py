from flask import Flask, render_template, request, jsonify, make_response
from database import db, Motorista, Betoneira, Silo, Traco, Nota
import os

app = Flask(__name__)

db_path = os.path.join(os.path.abspath(os.path.dirname(__name__)), 'usina.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

@app.route('/')
def index():
    motoristas = Motorista.query.order_by(Motorista.nome).all()
    betoneiras = Betoneira.query.order_by(Betoneira.placa).all()
    silos = Silo.query.all()
    tracos = Traco.query.order_by(Traco.codigo).all()
    
    ultimo_numero = db.session.query(db.func.max(Nota.numero_nota)).scalar()
    proximo_numero = (ultimo_numero or 0) + 1

    return render_template('index.html', motoristas=motoristas, betoneiras=betoneiras, silos=silos, tracos=tracos, proximo_numero=proximo_numero)

@app.route('/historico')
def historico():
    notas = Nota.query.order_by(Nota.numero_nota.desc()).limit(100).all()
    return render_template('historico.html', notas=notas)

@app.route('/cadastros')
def cadastros():
    return render_template('cadastros.html')

@app.route('/relatorios')
def relatorios():
    import datetime
    from sqlalchemy import func
    
    # Se não foi informada uma data, usa hoje
    data_selecionada = request.args.get('data', datetime.date.today().isoformat())
    
    # Realiza as somatórias no banco para a data selecionada
    notas_agregadas = db.session.query(
        func.count(Nota.id).label('qnt_notas'),
        func.sum(Nota.volume_m3).label('volume_total'),
        func.sum(Nota.total_cimento).label('total_cimento'),
        func.sum(Nota.total_areia).label('total_areia'),
        func.sum(Nota.total_agua).label('total_agua'),
        func.sum(Nota.total_agua_retida).label('total_agua_retida'),
        func.sum(Nota.total_brita0).label('total_brita0'),
        func.sum(Nota.total_brita1).label('total_brita1'),
        func.sum(Nota.total_mira).label('total_mira'),
        func.sum(Nota.total_recover).label('total_recover'),
        func.sum(Nota.gelo_kg).label('total_gelo')
    ).filter(Nota.data == data_selecionada).first()
    
    # Converte o objeto do SQLAlchemy pra dict pra evitar nulos quebrando a view
    resumo = {
        'qnt_notas': notas_agregadas.qnt_notas or 0,
        'volume_total': notas_agregadas.volume_total or 0,
        'total_cimento': notas_agregadas.total_cimento or 0,
        'total_areia': notas_agregadas.total_areia or 0,
        'total_agua': notas_agregadas.total_agua or 0,
        'total_agua_retida': notas_agregadas.total_agua_retida or 0,
        'total_brita0': notas_agregadas.total_brita0 or 0,
        'total_brita1': notas_agregadas.total_brita1 or 0,
        'total_mira': notas_agregadas.total_mira or 0,
        'total_recover': notas_agregadas.total_recover or 0,
        'total_gelo': notas_agregadas.total_gelo or 0,
    }

    return render_template('relatorios.html', resumo=resumo, data_selecionada=data_selecionada)

@app.route('/api/traco/<int:traco_id>')
def get_traco(traco_id):
    traco = Traco.query.get_or_404(traco_id)
    return jsonify({
        'cimento_kg': traco.cimento_kg,
        'areia_kg': traco.areia_kg,
        'agua_l': traco.agua_l,
        'brita0_kg': traco.brita0_kg,
        'brita1_kg': traco.brita1_kg,
        'mira410_kg': traco.mira410_kg,
        'recover_kg': traco.recover_kg,
        'viscocrete_kg': traco.viscocrete_kg
    })

@app.route('/salvar_nota', methods=['POST'])
def salvar_nota():
    try:
        data = request.form
        traco = Traco.query.get(data.get('traco_id'))
        vol = float(data.get('volume_m3', 1.0))
        
        # Coletar Umidades Deste Formulario
        umi_areia = float(data.get('umidade_areia', 0))
        umi_brita0 = float(data.get('umidade_brita0', 0))
        umi_brita1 = float(data.get('umidade_brita1', 0))
        
        nota = Nota(
            numero_nota=int(data.get('numero_nota')),
            data=data.get('data'),
            hora_mistura=data.get('hora_mistura'),
            hora_saida=data.get('hora_saida'),
            motorista_id=data.get('motorista_id') or None,
            betoneira_id=data.get('betoneira_id') or None,
            silo_id=data.get('silo_id') or None,
            traco_id=traco.id if traco else None,
            local=data.get('local'),
            volume_m3=vol,
            agua_colocada_l=float(data.get('agua_colocada_l') or 0),
            folga_agua_obra_l=float(data.get('folga_agua_obra_l') or 0),
            gelo_kg=float(data.get('gelo_kg') or 0)
        )
        
        if traco:
            c_cimento_seco = traco.cimento_kg * vol
            c_areia_seca = traco.areia_kg * vol
            c_agua_seca = traco.agua_l * vol
            c_brita0_seca = traco.brita0_kg * vol
            c_brita1_seca = traco.brita1_kg * vol
            c_mira = traco.mira410_kg * vol
            c_recover = traco.recover_kg * vol
            c_viscocrete = traco.viscocrete_kg * vol

            # Calcula pesos úmidos agregados
            c_areia_u = c_areia_seca * (1 + (umi_areia / 100))
            c_brita0_u = c_brita0_seca * (1 + (umi_brita0 / 100))
            c_brita1_u = c_brita1_seca * (1 + (umi_brita1 / 100))

            # Calcula as águas retidas
            agua_areia = c_areia_u - c_areia_seca
            agua_brita0 = c_brita0_u - c_brita0_seca
            agua_brita1 = c_brita1_u - c_brita1_seca
            
            # Subtrai das águas
            total_agua_retida = agua_areia + agua_brita0 + agua_brita1
            c_agua_corrigida = c_agua_seca - total_agua_retida

            # Salva na Nota (armazena os pesos com água retida e o desconto de água a colocar)
            nota.total_cimento = c_cimento_seco
            nota.total_areia = c_areia_u
            nota.total_agua = c_agua_corrigida
            nota.total_agua_retida = total_agua_retida
            nota.total_brita0 = c_brita0_u
            nota.total_brita1 = c_brita1_u
            nota.total_mira = c_mira
            nota.total_recover = c_recover
            nota.total_viscocrete = c_viscocrete
        
        db.session.add(nota)
        db.session.commit()
        return jsonify({'success': True, 'nota_id': nota.id})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/imprimir/<int:nota_id>')
def imprimir(nota_id):
    nota = Nota.query.get_or_404(nota_id)
    formato = request.args.get('format', 'print')
    response = make_response(render_template('imprimir_nota.html', nota=nota, format=formato))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

if __name__ == '__main__':
    app.run(debug=True, port=5000)
