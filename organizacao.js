/* Navegação organizada: mantém módulos antigos acessíveis, sem duplicar cards no início. */
(function(){
'use strict';
const groups=[
 {title:'Rotina financeira',subtitle:'Atividades do seu cargo',icon:'💼',items:[
 ['eco','🏢','Demandas dos departamentos','Analise documentos e solicitações'],
 ['pay','📕','Contas a pagar','Conferência e baixas'],
 ['receive','💵','Contas a receber','Cobranças e recebimentos'],
 ['reconcile','🏦','Conciliação bancária','Conferência de extratos'],
 ['cash','📈','Fluxo de caixa','Entradas e saídas'],
 ['treasury','🏛','Tesouraria','Saldos e movimentações'],
 ['documents','📄','Documentos','Registros e comprovantes'],
 ['approvals','✅','Autorizações','Solicitações pendentes']]},
 {title:'Contabilidade e análise',subtitle:'Escrituração, relatórios e indicadores',icon:'📚',items:[
 ['integrated','📊','Fechamento contábil','DRE, balanço, diário e auditoria'],
 ['v7ledger','📒','Oficina contábil','Partidas dobradas e exercícios'],
 ['v4report','📋','Relatórios e razão','Escrituração do ciclo comercial'],
 ['analysis','📉','Análise financeira','Indicadores e interpretação'],
 ['v5cashflow','📆','Projeção de caixa','Cenários por vencimento'],
 ['fiscal','⚖️','Apuração fiscal','Regimes e obrigações'],
 ['tax','🧾','Tributos e notas','Classificação tributária']]},
 {title:'Gestão corporativa',subtitle:'Setores e decisões da empresa',icon:'🏭',items:[
 ['market','🌐','Mercado empresarial','Clientes e oportunidades'],
 ['process','🔁','Processos e operações','Fluxos entre setores'],
 ['ultra-depts','🏭','Departamentos','Funcionários e atividades'],
 ['ultra-contract','📝','Contratos','Compromissos comerciais'],
 ['freight','🚚','Cotações de frete','Custos de transporte'],
 ['v4bank','🏦','Crédito e parcelas','Financiamentos simulados'],
 ['ultra-bank','🤝','Negociação bancária','Interações com instituições']]},
 {title:'Pessoas e comunicação',subtitle:'Recursos humanos e relacionamento',icon:'👥',items:[
 ['v5payroll','🧮','Folha e rescisões','Cenários didáticos de RH'],
 ['ultra-rh','👥','Gestão de pessoas','Equipe e rotinas de RH'],
 ['ultra-mail','✉️','E-mails e gestores','Comunicações profissionais']]},
 {title:'Laboratório e histórico',subtitle:'Acompanhe módulos didáticos anteriores',icon:'🧪',items:[
 ['ultra3accounting','📗','Diário comercial','Pedidos e lançamentos ilustrativos'],
 ['v8statements','📑','Demonstrativos do ecossistema','Livro paralelo para estudo']]}
];
let selected='all',term='';
window.finanzCategory=function(value){selected=value;render()};
window.finanzSearch=function(value){term=String(value||'').toLocaleLowerCase('pt-BR');const root=document.getElementById('organized-modules');if(root)root.innerHTML=drawGroups()};
function drawGroups(){
 return groups.filter(g=>selected==='all'||selected===g.title).map(g=>{
 const items=g.items.filter(x=>(x[2]+' '+x[3]).toLocaleLowerCase('pt-BR').includes(term));
 if(!items.length)return '';
 return `<section class="finanz-module-section"><div class="finanz-section-heading"><span>${g.icon}</span><div><h2>${g.title}</h2><p class="hint">${g.subtitle}</p></div></div><div class="grid">${items.map(([key,icon,title,desc])=>`<button class="tile finanz-module-tile" onclick="switchTab('${key}')"><span class="emoji">${icon}</span><b>${title}</b><small>${desc}</small></button>`).join('')}</div></section>`;
 }).join('')||'<p class="hint">Nenhum módulo corresponde à pesquisa.</p>';
}
const oldHome=home;
home=function(){
 if(sub!=='overview')return oldHome();
 const pending=state.ecosystem?.companies?.[state.active]?.cases?.filter(x=>x.status==='pending'||x.status==='clarification').length||0;
 return `<div class="finanz-home-heading"><h1>Central de trabalho</h1><p class="sub">Financeiro e contabilidade · ${esc(company().name)}</p></div>`+
 card(`<div class="row"><div><small class="muted">Empresa ativa</small><h2>${esc(company().name)}</h2><p class="hint">${esc(company().sector)} · ${esc(company().tax)}</p></div>${b('Trocar empresa',"navTo('companies')",'secondary small')}</div><div class="finanz-quick-actions">${b('Solicitações ('+pending+')',"switchTab('eco')",'primary small')}${b('Fechamento contábil',"switchTab('integrated')",'secondary small')}</div>`,'hero')+
 `<div class="finanz-category-nav"><button class="${selected==='all'?'active':''}" onclick="finanzCategory('all')">Todos</button>${groups.map(g=>`<button class="${selected===g.title?'active':''}" onclick="finanzCategory('${g.title}')">${g.icon} ${g.title}</button>`).join('')}</div>`+
 `<div class="finanz-search-wrap"><input aria-label="Pesquisar módulos" type="search" placeholder="Pesquisar módulo..." value="${esc(term)}" oninput="finanzSearch(this.value)"></div>`+
 `<div id="organized-modules">${drawGroups()}</div>`;
};
render();
})();
