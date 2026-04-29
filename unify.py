import os

def build():
    with open('prototipo_novo_sistema.html', 'r', encoding='utf-8') as f:
        html = f.read()

    with open('database_v2.js', 'r', encoding='utf-8') as f:
        db_content = f.read()
    with open('cloud_v2.js', 'r', encoding='utf-8') as f:
        cloud_content = f.read()

    # SCRIPT DE CORREÇÃO DE DADOS (LEGADO REMOVIDO EM FAVOR DA LÓGICA NATIVA)
    script_fix = ""
    
    modal_html = """
    <div id="cloud-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:1000000; justify-content:center; align-items:center; font-family: sans-serif;">
        <div style="background:white; padding:30px; border-radius:15px; width:450px; max-width:90%; box-shadow:0 10px 25px rgba(0,0,0,0.5); text-align:center; color: #1e293b;">
            <h2 style="margin-top:0;">Painel da Nuvem</h2>
            <div style="margin-bottom: 20px; text-align: left; background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0;">
                <label style="display: block; font-size: 12px; font-weight: bold; color: #64748b; margin-bottom: 5px;">IDENTIFICAÇÃO DA USINA:</label>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="cloud-unidade-input" placeholder="Ex: A369 ou A375" style="flex: 1; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;">
                    <button onclick="window.salvarUnidade()" style="background: #334155; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer;">Salvar</button>
                </div>
            </div>
            <div id="cloud-status-text" style="font-size:20px; font-weight:bold; margin:20px 0;">● Conectando...</div>
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button onclick="window.realizarSincronizacao()" style="flex: 1; background:#14b8a6; color:white; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer;">Sincronizar</button>
                <button onclick="window.trocarSenhaPainel()" style="background:#64748b; color:white; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer;">🔑 Trocar Senha</button>
            </div>
            <button onclick="window.gerarBackupExcelLocal()" style="background:#f1f5f9; color:#1e293b; border:1px solid #cbd5e1; padding:10px; border-radius:8px; font-weight:bold; cursor:pointer; width:100%; margin-bottom:20px;">💾 Gerar Backup Excel (.csv)</button>
            <button onclick="window.fecharConfigCloud()" style="background:none; border:none; color:#64748b; cursor:pointer; text-decoration: underline;">Fechar Painel</button>
        </div>
    </div>
    """

    inline_scripts = f"{script_fix}\n<script>{db_content}</script>\n<script>{cloud_content}</script>"
    html = html.replace('<head>', '<head>\n' + inline_scripts, 1)
    html = html.replace('</body>', modal_html + '\n</body>', 1)

    cloud_button = """            <li style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                <a href="javascript:void(0)" onclick="window.abrirConfigCloud()" style="color: #14b8a6; text-decoration: none; font-size: 13px;">☁️ Painel Multi-Usina</a>
            </li>
            <li style="padding: 10px 0;">
                <div id="cloud-badge" style="padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; width: fit-content; background: #334155; color: #94a3b8;">● Conectando...</div>
            </li>
        </ul>"""
    
    if '        </ul>' in html:
        html = html.replace('        </ul>', cloud_button, 1)

    # GERAR VERSÃO USINA LOCAL (Sem seletor, apenas aviso fixo)
    html_usina = html.replace('id="display-unidade-fixa" style="display: none;', 'id="display-unidade-fixa" style="display: block;')
    # Substituição mais robusta para esconder o seletor
    html_usina = html_usina.replace('id="select-unidade-rapido"', 'id="select-unidade-rapido" style="display: none;"')
    
    with open('Nota de Concreto Aterpa.html', 'w', encoding='utf-8') as f:
        f.write(html_usina)
        
    # GERAR VERSÃO VERCEL (Com seletor ativo)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
        
    print("Correção de Água (Mistura) e Gelo aplicada com sucesso!")

if __name__ == "__main__":
    build()
