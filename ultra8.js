/* finanZ Pro v8: diário integrado, demonstrativos parciais e autonomia por setores. */
(function(){'use strict';
const d=()=>{state.ultra8??={companies:{}};return state.ultra8.companies[state.active]??={posted:{},entries:[],lastDay:-1}};
const fmt=n=>money(Number(n)||0),safe=s=>esc(String(s??''));
const curDay=()=>state.ecosystem.companies[state.active].day;
const dt=offset=>{let x=new Date();x.setDate(x.getDate()+curDay()+offset);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
const chart={
 'Bancos':'A','Clientes':'A','Estoque':'A','Imobilizado':'A',
 'Fornecedores':'P','Salários a pagar':'P','Empréstimos bancários':'P',
 'Capital social':'PL','Lucros acumulados':'PL',
 'Receita de serviços':'R','Receita de vendas':'R',
 'Custo de serviços':'D','Custo de mercadorias':'D','Despesas operacionais':'D',
 'Despesas com pessoal':'D','Despesas financeiras':'D'
};
function post(key,memo,lines,date=dt(0)){
 if(d().posted[key])return false;
 const total=side=>lines.filter(x=>x.side===side).reduce((s,x)=>s+x.amount,0);
 if(!lines.length||lines.some(x=>!chart[x.account]||!Number.isFinite(x.amount)||x.amount<=0)||Math.abs(total('D')-total('C'))>.005)throw Error('Lançamento inválido');
 d().entries.unshift({id:key,date,memo,lines});d().posted[key]=true;return true;
}
function lines(a,b,value){return [{account:a,side:'D',amount:value},{account:b,side:'C',amount:value}]}
function synchronize(){
 // Só registra novos eventos identificados e evita recontar dados legados como se tivessem origem comprovada.
 let changed=false;
 for(const t of txs()){
  const v=Number(t.value);
  if(!t.originCase||!Number.isFinite(v)||v<=0)continue;
  const origin=state.ecosystem.companies[state.active].cases.find(c=>c.id===t.originCase);
  const type=origin?.type||'';
  // Eventos gerados pelo ecossistema são lançados ao criar o título; títulos antigos sem origem ficam fora.
  if(type==='billing'||type==='v3invoice'){
   changed=post('v8-title-'+t.id,'Faturamento '+(t.document||t.name),lines('Clientes',company().sector==='Comércio'||company().sector==='Indústria'?'Receita de vendas':'Receita de serviços',v),t.created||dt(0))||changed;
  }else if(type==='purchase'||type==='v3purchase'||type==='v4supplier'){
   changed=post('v8-title-'+t.id,'Compra '+t.name,lines(company().sector==='Comércio'||company().sector==='Indústria'?'Estoque':'Despesas operacionais','Fornecedores',v),t.created||dt(0))||changed;
  }else if(type==='payroll'){
   changed=post('v8-title-'+t.id,'Folha bruta '+t.name,lines('Despesas com pessoal','Salários a pagar',v),t.created||dt(0))||changed;
  }
  if(t.status==='paid'&&d().posted['v8-title-'+t.id]){
   const liability=t.kind==='pay'?(type==='payroll'?'Salários a pagar':'Fornecedores'):'Clientes';
   const ln=t.kind==='pay'?lines(liability,'Bancos',v):lines('Bancos',liability,v);
   changed=post('v8-settle-'+t.id,'Liquidação '+t.name,ln,t.paid||dt(0))||changed;
  }
 }
 if(changed)save();
}
function totals(){
 synchronize();
 const res={};for(const name of Object.keys(chart))res[name]={debit:0,credit:0};
 for(const j of d().entries)for(const l of j.lines)res[l.account][l.side==='D'?'debit':'credit']+=l.amount;
 const net=(name)=>{const x=res[name];return chart[name]==='A'||chart[name]==='D'?x.debit-x.credit:x.credit-x.debit};
 const sum=kind=>Object.keys(chart).filter(x=>chart[x]===kind).reduce((a,x)=>a+net(x),0);
 return {res,net,sum,profit:sum('R')-sum('D')};
}
const pair=(label,value)=>`<div class="detail"><span>${safe(label)}</span><b>${fmt(value)}</b></div>`;
function statements(){
 const t=totals(),assets=t.sum('A'),liabilities=t.sum('P'),equity=t.sum('PL')+t.profit,delta=assets-liabilities-equity;
 return `<div class="row"><h1>Demonstrações integradas</h1>${b('← Voltar',"switchTab('overview')",'secondary small')}</div><p class="sub">${safe(company().name)} · lançamentos rastreáveis do ecossistema</p>`+
 card(`<h2>DRE parcial</h2>${Object.keys(chart).filter(x=>chart[x]==='R').map(x=>pair(x,t.net(x))).join('')}${Object.keys(chart).filter(x=>chart[x]==='D').map(x=>pair(x,-t.net(x))).join('')}${pair('Resultado parcial',t.profit)}<p class="notice">Somente eventos com origem rastreável no ecossistema. Não inclui tributos, provisões, custo integral, ajustes e competências ainda não modelados.</p>`)+
 card(`<h2>Balanço patrimonial parcial</h2><h3>Ativo</h3>${Object.keys(chart).filter(x=>chart[x]==='A').map(x=>pair(x,t.net(x))).join('')}${pair('Total do ativo',assets)}<h3>Passivo</h3>${Object.keys(chart).filter(x=>chart[x]==='P').map(x=>pair(x,t.net(x))).join('')}${pair('Total do passivo',liabilities)}<h3>Patrimônio líquido</h3>${Object.keys(chart).filter(x=>chart[x]==='PL').map(x=>pair(x,t.net(x))).join('')}${pair('Resultado do período',t.profit)}${pair('Total do PL parcial',equity)}${pair('Diferença de conciliação',delta)}<p class="notice">Balanço parcial: o saldo bancário inicial e outros saldos legados não possuem contrapartidas de abertura nesta escrituração. Não é balanço oficial.</p>`)+
 card(`<h2>Balancete de verificação</h2>${Object.entries(t.res).filter(([k,v])=>v.debit||v.credit).map(([k,v])=>`<div class="detail"><span>${safe(k)}</span><b>D ${fmt(v.debit)} / C ${fmt(v.credit)}</b></div>`).join('')||'<p class="hint">Sem eventos escriturados.</p>'}`)+
 card(`<h2>Diário integrado</h2>${d().entries.slice(0,40).map(j=>`<div class="item"><b>${safe(j.memo)}</b><p class="hint">${safe(j.date)} · ${safe(j.id)}</p>${j.lines.map(l=>`<p>${l.side} · ${safe(l.account)} · ${fmt(l.amount)}</p>`).join('')}</div>`).join('')||'<p class="hint">Avance as operações e aprove faturamentos ou compras para gerar registros.</p>'}`);
}
const first=['Comercial','Compras','Operações','RH','Administração','Logística'];
const parties=['Rede Solar','Grupo Horizonte','Empresa Aurora','Cliente Meridian','Indústria Alfa','Comercial Vértice'];
function workforce(){
 const e=state.ecosystem.companies[state.active],v=d(),day=e.day;
 if(v.lastDay===day)return;v.lastDay=day;
 const sector=first[day%first.length],party=parties[day%parties.length],value=+(1200+(day*487)%7900).toFixed(2);
 const name=company().sector==='Transporte'?'transporte de mercadorias':company().sector==='Indústria'?'fabricação sob encomenda':company().sector==='Comércio'?'fornecimento de produtos':'prestação de serviços';
 let description='',docs=[],type='',due=dt(5);
 if(sector==='Comercial'){type='v8commercial';description=`Comercial recebeu solicitação de ${name} de ${party} e está negociando condições. A área financeira precisa avaliar prazo, margem e risco do cliente.`;docs=[`Cliente: ${party}`,`Proposta comercial: PC-${day}`,`Preço solicitado: ${fmt(value)}`,`Custo estimado pelo setor operacional: ${fmt(value*.68)}`,`Pagamento proposto: 30 dias após a entrega`,`Status: negociação, ainda sem faturamento`]}
 else if(sector==='Compras'){type='purchase';description=`Compras solicita validação financeira de insumos para atender pedidos em andamento.`;docs=[`Fornecedor: ${party}`,`Cotação: CO-${day}`,`Valor: ${fmt(value)}`,`Entrega: 5 dias`,`Pagamento: 15 dias após o pedido`,`Conferir saldo e necessidade operacional`]}
 else if(sector==='Operações'){type='v8ops';description=`Operações informou ocorrência com custo adicional e solicita provisão de caixa e avaliação de impacto.`;docs=[`Ordem de serviço OS-${day}`,`Estimativa de custo adicional: ${fmt(value)}`,`Causa: manutenção corretiva`,`Verificar comprovantes e aprovação da gestão`]}
 else if(sector==='RH'){type='v8hr';description=`RH encaminhou documentação preliminar de folha e benefícios para conferência.`;docs=[`Competência: ${dt(0).slice(0,7)}`,`Valor bruto estimado: ${fmt(value)}`,`Ponto, férias e benefícios: aguardando documentação`,`INSS/IRRF/FGTS: não apurados`]}
 else if(sector==='Administração'){type='v8admin';description=`Diretoria pede parecer financeiro sobre investimento planejado.`;docs=[`Projeto: EXP-${day}`,`Investimento: ${fmt(value)}`,`Prazo esperado de retorno: 18 meses`,`Financiamento: não contratado`,`Analisar caixa, risco e alternativas`]}
 else {type='v8log';description=`Logística reportou custos extraordinários em uma entrega e solicita análise.`;docs=[`Remessa: LG-${day}`,`Custo previsto: ${fmt(value)}`,`Ocorrência: reentrega`,`Documento fiscal e comprovantes: pendentes`]}
 const id='v8-'+state.active+'-'+day;
 if(!e.cases.some(x=>x.id===id)){
  e.cases.unshift({id,type,actor:sector,description,value,created:dt(0),due,status:'pending',docs,party,company:state.active,missing:type==='v8hr'||type==='v8log'});
  e.events.unshift({id:uid(),date:dt(0),sector,description,caseId:id});
 }
 save();
}
const oldAdvance=window.ecoAdvance;
window.ecoAdvance=function(){oldAdvance();workforce();synchronize();save();render()};
const oldDecide=window.ecoDecide;
window.ecoDecide=function(id,decision){oldDecide(id,decision);synchronize();save()};
const oldModule=moduleView;
moduleView=function(){if(sub==='v8statements')return statements();return oldModule()};
const oldHome=home;
home=function(){const h=oldHome();if(sub!=='overview')return h;return card(`<h2>📚 Escrituração integrada e demonstrações</h2><p>Eventos originados por outros departamentos alimentam lançamentos contábeis rastreáveis. Este painel não soma os diários didáticos antigos para evitar dupla contagem. Demonstrativos parciais identificam o que ainda não foi escriturado.</p>${b('Ver DRE, Balanço e Diário',"switchTab('v8statements')",'primary full')}`)+h};
render();
})();
