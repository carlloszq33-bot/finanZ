/* finanZ Pro: fechamento verificável, sem afirmar conformidade legal. */
(function(){
'use strict';
const get=()=>{state.integrated??={companies:{}};return state.integrated.companies[state.active]??={entries:[],keys:{},lastDay:-1}};
const eco=()=>state.ecosystem.companies[state.active];
const m=n=>money(Math.round((Number(n)||0)*100)/100);
const s=x=>esc(String(x??''));
const map={'Banco':'A','Clientes':'A','Estoque':'A','Despesas antecipadas':'A','Fornecedores':'P','Salários a pagar':'P','Capital social':'PL','Ajustes de abertura':'PL','Receita de serviços':'R','Receita de vendas':'R','Custo de serviços':'D','Despesas operacionais':'D','Despesas de pessoal':'D'};
function entry(key,description,lines,date){
 const d=get();if(d.keys[key])return false;
 const deb=lines.filter(l=>l.side==='D').reduce((a,l)=>a+l.value,0);
 const cred=lines.filter(l=>l.side==='C').reduce((a,l)=>a+l.value,0);
 if(!lines.length||lines.some(l=>!map[l.account]||!Number.isFinite(l.value)||l.value<=0)||Math.abs(deb-cred)>.001)throw Error('Partidas desequilibradas: '+key);
 d.keys[key]=1;d.entries.push({key,description,lines,date:date||today()});return true;
}
const pair=(d,c,v)=>[{side:'D',account:d,value:v},{side:'C',account:c,value:v}];
function sync(){
 let changed=false,d=get();
 // O capital cadastrado não representa necessariamente o caixa integralizado.
 // Registrar abertura pelo saldo bancário informado; não inventar ativos faltantes.
 const opening=Number(company().bank)||0;
 if(opening>0)changed=entry('opening','Saldo bancário inicial informado no cadastro',pair('Banco','Ajustes de abertura',opening),company().created)||changed;
 for(const t of txs()){
  let v=Number(t.value);if(!Number.isFinite(v)||v<=0)continue;
  const origin=eco().cases.find(c=>c.id===t.originCase);
  // Somente documentos cuja natureza foi identificada são apropriados por competência.
  let debit,credit;
  if(t.kind==='receive'&&['billing','v3invoice'].includes(origin?.type)){
    debit='Clientes';credit=['Comércio','Indústria'].includes(company().sector)?'Receita de vendas':'Receita de serviços';
  }else if(t.kind==='pay'&&['purchase','v3purchase','v4supplier'].includes(origin?.type)){
    debit=['Comércio','Indústria'].includes(company().sector)?'Estoque':'Despesas operacionais';credit='Fornecedores';
  }else if(t.kind==='pay'&&['payroll','v3payroll'].includes(origin?.type)){
    debit='Despesas de pessoal';credit='Salários a pagar';
  }else continue;
  changed=entry('doc-'+t.id,'Documento '+(t.document||t.name),pair(debit,credit,v),t.created)||changed;
  if(t.status==='paid'){
    changed=entry('settle-'+t.id,'Liquidação '+t.name,t.kind==='receive'?pair('Banco','Clientes',v):pair(credit,'Banco',v),t.paid)||changed;
  }
 }
 if(changed)save();
 return changed;
}
function calc(){
 sync();const accounts=Object.fromEntries(Object.keys(map).map(x=>[x,{debit:0,credit:0}]));
 for(const j of get().entries)for(const l of j.lines)accounts[l.account][l.side==='D'?'debit':'credit']+=l.value;
 const net=k=>{let a=accounts[k],v=a.debit-a.credit;return ['A','D'].includes(map[k])?v:-v};
 const sum=k=>Object.keys(map).filter(x=>map[x]===k).reduce((a,x)=>a+net(x),0);
 return {accounts,net,sum,profit:sum('R')-sum('D')};
}
const line=(label,val)=>`<div class="detail"><span>${s(label)}</span><b>${m(val)}</b></div>`;
function view(){
 const c=calc(),assets=c.sum('A'),liabilities=c.sum('P'),equity=c.sum('PL')+c.profit;
 const rows=k=>Object.keys(map).filter(x=>map[x]===k).map(x=>line(x,c.net(x))).join('');
 return `<div class="row"><h1>Fechamento contábil</h1>${b('← Voltar',"switchTab('overview')",'secondary small')}</div>`+
 card(`<h2>DRE do livro integrado</h2>${rows('R')}${rows('D')}${line('Resultado',c.profit)}<p class="notice">DRE restrita aos eventos contabilizados. Não inclui impostos, depreciação, provisões nem saldos históricos não importados.</p>`)+
 card(`<h2>Balanço do livro integrado</h2><h3>Ativo</h3>${rows('A')}${line('Total do ativo',assets)}<h3>Passivo</h3>${rows('P')}${line('Total do passivo',liabilities)}<h3>Patrimônio líquido e resultado</h3>${rows('PL')}${line('Resultado acumulado no livro',c.profit)}${line('Total do PL',equity)}${line('Diferença contábil',assets-liabilities-equity)}<p class="notice">A diferença zero verifica as partidas dobradas, mas não garante completude ou conformidade. Ajustes de abertura representam apenas o saldo inicial informado.</p>`)+
 card(`<h2>Balancete</h2>${Object.entries(c.accounts).filter(([k,v])=>v.debit||v.credit).map(([k,v])=>`<div class="detail"><span>${s(k)}</span><b>D ${m(v.debit)} · C ${m(v.credit)}</b></div>`).join('')}`)+
 card(`<h2>Diário rastreável (${get().entries.length} lançamentos)</h2>${get().entries.slice(-60).reverse().map(j=>`<div class="item"><strong>${s(j.description)}</strong><p>${s(j.date)} · ${s(j.key)}</p>${j.lines.map(l=>`<p>${l.side} ${s(l.account)}: ${m(l.value)}</p>`).join('')}</div>`).join('')}`)+
 card(`<h2>Conferência de integridade</h2>${b('Executar auditoria interna','integratedAudit()','primary full')}<p class="hint">Valida lançamentos, duplicidades e equilíbrio, não substitui testes no iPhone ou auditoria legal.</p>`);
}
window.integratedAudit=function(){
 const d=get(),keys=new Set(),issues=[];
 for(const j of d.entries){if(keys.has(j.key))issues.push('Lançamento duplicado '+j.key);keys.add(j.key);let debit=0,credit=0;for(const l of j.lines){if(!map[l.account]||!(l.value>0))issues.push('Conta ou valor inválido '+j.key);if(l.side==='D')debit+=l.value;else if(l.side==='C')credit+=l.value;else issues.push('Lado inválido '+j.key)}if(Math.abs(debit-credit)>.001)issues.push('Desequilíbrio '+j.key)}
 const c=calc();if(Math.abs(c.sum('A')-c.sum('P')-c.sum('PL')-c.profit)>.01)issues.push('Equação patrimonial não fecha');
 modal(`<h2>Auditoria interna</h2><p>${issues.length?'Problemas encontrados: '+issues.length:'Sem inconsistências estruturais no livro integrado.'}</p>${issues.map(x=>`<p>${s(x)}</p>`).join('')}${b('Fechar','closeModal()','secondary full')}`);
};
const oldHome=home;home=function(){const h=oldHome();if(sub!=='overview')return h;return card(`<h2>Fechamento e auditoria</h2><p>Consulte DRE, balanço e partidas contábeis do livro integrado, com rastreabilidade por título.</p>${b('Abrir fechamento',"switchTab('integrated')",'primary full')}`)+h};
const oldModule=moduleView;moduleView=function(){if(sub==='integrated')return view();return oldModule()};
const oldDecide=window.ecoDecide;if(typeof oldDecide==='function')window.ecoDecide=function(id,decision){const result=oldDecide(id,decision);sync();return result};
const oldSettle=window.settle;if(typeof oldSettle==='function')window.settle=function(id){const result=oldSettle(id);sync();return result};
const oldAdvance=window.ecoAdvance;if(typeof oldAdvance==='function')window.ecoAdvance=function(){const result=oldAdvance();sync();return result};
sync();render();
})();
