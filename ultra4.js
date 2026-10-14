/* finanZ Pro ULTRA v4: demonstrativos, crédito e rotinas integradas (simulação didática). */
(function(){'use strict';
const fmt=n=>money(Math.round((Number(n)||0)*100)/100);
const clean=s=>esc(String(s??''));
const data=()=>{state.ultra4 ||= {companies:{}};return state.ultra4.companies[state.active] ||= {loans:[],proposals:[],audit:[],lastDay:-1}};
const eco=()=>state.ecosystem.companies[state.active];
const book=()=>state.ultra3.companies[state.active];
const dayDate=(offset=0)=>{let d=new Date();d.setDate(d.getDate()+eco().day+offset);return d.toISOString().slice(0,10)};
const head=t=>`<div class="row"><h1>${t}</h1>${b('← Voltar',"switchTab('overview')",'secondary small')}</div><p class="sub">${clean(company().name)} · Simulação educacional</p>`;
function entry(origin,memo,lines){
  if(book().journal.some(x=>x.caseId===origin))return false;
  let sum=k=>lines.filter(x=>x.side===k).reduce((a,x)=>a+x.value,0);
  if(Math.abs(sum('D')-sum('C'))>.01)throw Error('Partida não balanceada');
  book().journal.unshift({id:uid(),caseId:origin,date:dayDate(),memo,entries:lines});
  return true;
}
function cashAccount(){return 'Caixa e bancos'}
function addTitle(kind,name,value,due,category,origin){
  if(state.tx.some(t=>t.originCase===origin))return;
  state.tx.push({id:uid(),company:state.active,kind,name,value,due,status:'open',category,created:dayDate(),originCase:origin});
}
function addCase(type,actor,description,value,docs,extra={}){
 const id='v4-'+uid();
 eco().cases.unshift({id,type,actor,description,value,created:dayDate(),due:dayDate(3),status:'pending',docs,company:state.active,...extra});
 eco().events.unshift({id:uid(),date:dayDate(),sector:actor,description,caseId:id});
}
function report(){
 let journal=book().journal, totals={};
 for(const j of journal)for(const e of j.entries){let x=totals[e.account]||{D:0,C:0};x[e.side]+=e.value;totals[e.account]=x}
 let rec=txs().filter(t=>t.kind==='receive'&&t.status==='open'),pay=txs().filter(t=>t.kind==='pay'&&t.status==='open');
 let sum=xs=>xs.reduce((a,x)=>a+Number(x.value||0),0);
 let revenue=Object.entries(totals).filter(([k])=>k.startsWith('Receita')).reduce((a,[k,v])=>a+v.C-v.D,0);
 let expenses=Object.entries(totals).filter(([k])=>/Custo|Despesa|Juros/.test(k)).reduce((a,[k,v])=>a+v.D-v.C,0);
 let loans=data().loans.filter(x=>x.status==='ativo'),debt=loans.reduce((a,x)=>a+x.balance,0);
 return head('Painel contábil e financeiro')+card(`<h2>Posição operacional</h2><div class="row">${stat('Saldo de caixa',fmt(balance()))}${stat('A receber',fmt(sum(rec)))}</div><div class="row">${stat('A pagar',fmt(sum(pay)))}${stat('Dívida bancária v4',fmt(debt))}</div><p class="notice">Valores de títulos e saldos vêm de controles diferentes. Não somar como se fossem um balanço fechado.</p>`)+card(`<h2>Resultado parcial da escrituração</h2><div class="detail"><span>Receitas registradas no diário</span><b>${fmt(revenue)}</b></div><div class="detail"><span>Custos e despesas registrados</span><b>${fmt(expenses)}</b></div><div class="detail"><span>Resultado parcial</span><b>${fmt(revenue-expenses)}</b></div><p class="notice">Não é uma DRE oficial: faltam apuração fiscal, CMV completo, provisões, competência de todos os eventos e saldos iniciais.</p>`)+card(`<h2>Razão simplificado</h2>${Object.entries(totals).map(([k,v])=>`<div class="detail"><span>${clean(k)}</span><b>D ${fmt(v.D)} / C ${fmt(v.C)}</b></div>`).join('')||'<p class="hint">Sem lançamentos.</p>'}`)+card(`<h2>Rastreabilidade</h2>${journal.slice(0,20).map(j=>`<div class="item"><b>${clean(j.memo)}</b><p class="hint">${clean(j.date)} · ${clean(j.caseId)}</p></div>`).join('')||'<p class="hint">Sem registros.</p>'}`)}
function bank(){
 let d=data();
 return head('Crédito e amortização')+card(`<h2>Solicitar proposta bancária</h2><p>O banco virtual avalia caixa e exposição a dívidas. O financiamento só entra no caixa após contratação.</p><form onsubmit="v4RequestLoan(event)"><label>Valor (R$)</label><input name="amount" type="number" min="500" step=".01" required><label>Prazo (meses)</label><input name="months" type="number" min="2" max="60" value="12" required><label>Finalidade</label><select name="purpose"><option>Capital de giro</option><option>Investimento em equipamentos</option><option>Expansão operacional</option></select><button class="primary full">Solicitar análise</button></form>`)+card(`<h2>Propostas e contratos</h2>${d.loans.map(l=>`<div class="item"><b>${fmt(l.amount)} · ${clean(l.bank)}</b><p>${clean(l.purpose)} · ${l.months} meses · ${l.rate}% a.m. · ${clean(l.status)}</p><p>Parcela ${fmt(l.payment)} · Saldo devedor ${fmt(l.balance)}</p>${l.status==='aprovado'?b('Contratar',`v4SignLoan('${l.id}')`,'primary small'):''}${l.status==='ativo'?b('Pagar próxima parcela',`v4PayLoan('${l.id}')`,'secondary small'):''}</div>`).join('')||'<p class="hint">Nenhuma proposta.</p>'}`)}
window.v4RequestLoan=e=>{
 e.preventDefault();let f=new FormData(e.target),amount=Number(f.get('amount')),months=Number(f.get('months')),purpose=String(f.get('purpose'));
 if(!Number.isFinite(amount)||amount<500||!Number.isInteger(months)||months<2||months>60)return toast('Dados inválidos');
 let current=data().loans.filter(x=>x.status==='ativo').reduce((a,x)=>a+x.balance,0);
 let rate=+(1.35+(current>balance()?0.65:0)+(amount>balance()?0.4:0)).toFixed(2),r=rate/100;
 let payment=amount*r/(1-Math.pow(1+r,-months));
 let approved=amount<=Math.max(5000,Math.max(0,balance())*2.5)&&payment<=Math.max(900,Math.max(0,balance())*.25);
 data().loans.unshift({id:uid(),bank:'Banco Horizonte (simulado)',amount,months,purpose,rate,payment,balance:amount,paid:0,status:approved?'aprovado':'recusado',created:dayDate()});
 save();render();toast(approved?'Proposta aprovada para contratação':'Proposta recusada por risco de crédito');
};
window.v4SignLoan=id=>{
 let l=data().loans.find(x=>x.id===id&&x.status==='aprovado');if(!l)return;
 l.status='ativo';l.signed=dayDate();company().bank+=l.amount;
 entry('v4-loan-'+l.id,'Contratação de empréstimo '+l.bank,[{side:'D',account:cashAccount(),value:l.amount},{side:'C',account:'Empréstimos bancários a pagar',value:l.amount}]);
 save();render();toast('Crédito contratado e lançado no diário');
};
window.v4PayLoan=id=>{
 let l=data().loans.find(x=>x.id===id&&x.status==='ativo');if(!l)return;
 let interest=Math.round(l.balance*l.rate)/100,principal=Math.min(l.balance,Math.max(0,l.payment-interest));
 if(principal<=0)return toast('Parcela não amortiza o principal');
 let payment=Math.round((interest+principal)*100)/100;
 if(balance()<payment)return toast('Saldo insuficiente para pagar a parcela');
 let n=l.paid+1;company().bank-=payment;l.balance=Math.max(0,Math.round((l.balance-principal)*100)/100);l.paid=n;
 entry('v4-payment-'+l.id+'-'+n,'Parcela '+n+' do empréstimo',[
 {side:'D',account:'Empréstimos bancários a pagar',value:+principal.toFixed(2)},
 {side:'D',account:'Despesa com juros',value:+interest.toFixed(2)},
 {side:'C',account:cashAccount(),value:+payment.toFixed(2)}
 ]);
 if(l.balance<.02||l.paid>=l.months){l.status='quitado';l.balance=0}
 save();render();toast('Parcela paga e contabilizada');
};
function generate(){
 let d=data(),n=eco().day;if(d.lastDay===n)return;d.lastDay=n;
 if(n%3===0){let v=1400+(n*379)%4300;
 addCase('v4supplier','Compras',`O fornecedor encaminhou contraproposta para materiais necessários à operação. Compras solicita avaliação financeira.`,v,[`Fornecedor: Distribuidora Vértice`,`Pedido: CP-${n}`,`Preço inicial: ${fmt(v)}`,`Desconto à vista proposto: 4%`,`Prazo alternativo: 30 dias sem desconto`,`Conferência de disponibilidade de caixa necessária`],{party:'Distribuidora Vértice',ref:'CP-'+n,payDue:dayDate(30)})}
 if(n%5===0){let v=4500+(n*107)%8500;
 addCase('v4customer','Comercial',`O cliente solicitou extensão do prazo de pagamento. Comercial pede análise de risco antes de aceitar.`,v,[`Cliente: Rede Novo Horizonte`,`Proposta: CL-${n}`,`Valor: ${fmt(v)}`,`Prazo original: 15 dias`,`Prazo solicitado: 45 dias`,`Histórico de pagamentos: 1 atraso recente`,`A aprovação comercial não equivale a faturamento`],{party:'Rede Novo Horizonte',ref:'CL-'+n})}
 if(n%7===0){let gross=(state.ultra?.employees||[]).filter(x=>x.company===state.active).reduce((a,x)=>a+Number(x.salary||0),0);
 if(gross)addCase('v4hr','RH',`O departamento pessoal solicita conciliação da folha bruta de ${dayDate().slice(0,7)}.`,gross,[`Total bruto cadastrado: ${fmt(gross)}`,`INSS, IRRF, FGTS, férias, ponto e benefícios: pendentes de conferência`,`Não registrar como salário líquido sem a apuração legal`],{missing:true})}
 }
const advance=window.ecoAdvance;
window.ecoAdvance=function(){advance();generate();save();render()};
const review=window.ecoReview;
window.ecoReview=function(id){
 let c=eco().cases.find(x=>x.id===id);if(!c||!c.type.startsWith('v4'))return review(id);
 modal(`<h2>${clean(c.actor)}: análise financeira</h2><p>${clean(c.description)}</p><div class="detail"><span>Valor de referência</span><b>${fmt(c.value)}</b></div><div class="detail"><span>Prazo</span><b>${clean(c.due)}</b></div><h3>Documentos</h3>${c.docs.map(x=>`<div class="item">${clean(x)}</div>`).join('')}<p class="notice">${c.type==='v4hr'?'A folha está incompleta. Solicite esclarecimentos.':'Aprovar registra a condição negociada, mas não inventa entrega ou faturamento.'}</p><label>Justificativa da análise</label><textarea id="eco-reason" rows="4" placeholder="Fundamente com base nos dados disponíveis"></textarea><div class="row">${b('Rejeitar',`ecoDecide('${id}','rejected')`,'danger')}${b('Esclarecer',`ecoDecide('${id}','clarification')`,'secondary')}${b('Autorizar',`ecoDecide('${id}','approved')`,'primary')}</div>`)
};
const decide=window.ecoDecide;
window.ecoDecide=function(id,decision){
 let c=eco().cases.find(x=>x.id===id);if(!c||!c.type.startsWith('v4'))return decide(id,decision);
 let reason=document.getElementById('eco-reason')?.value.trim()||'';
 if(reason.length<15)return toast('Fundamente sua análise em pelo menos 15 caracteres');
 if(c.missing&&decision==='approved')return toast('Apuração legal pendente. Solicite esclarecimentos');
 c.status=decision;c.reason=reason;c.decided=dayDate();
 if(c.type==='v4customer'&&decision==='approved'){let target=txs().find(t=>t.kind==='receive'&&t.status==='open'&&t.name===c.party);if(target){target.due=dayDate(45);c.linkedTitle=target.id}else{c.status='clarification';c.reason+=' | Sem recebível existente vinculado. Comercial deve informar o título.';}}
 if(c.type==='v4supplier'&&decision==='approved'){c.value=+(c.value*.96).toFixed(2);addTitle('pay',c.party,c.value,dayDate(1),'Compra negociada à vista',c.id);entry(c.id,'Compra negociada '+c.ref,[{side:'D',account:'Materiais / Custos operacionais',value:c.value},{side:'C',account:'Fornecedores / Contas a pagar',value:c.value}])}
 data().audit.unshift({id,decision,reason,date:dayDate()});
 eco().events.unshift({id:uid(),date:dayDate(),sector:'Financeiro',description:`${c.actor}: ${decision}. ${reason}`,caseId:id});
 save();closeModal();render();toast('Decisão registrada');
};
const oldModule=moduleView;
moduleView=function(){if(sub==='v4report')return report();if(sub==='v4bank')return bank();return oldModule()};
const oldHome=home;
home=function(){let h=oldHome();if(sub!=='overview')return h;return card(`<h2>📊 Contabilidade e tesouraria integradas</h2><p class="hint">Acompanhe a escrituração parcial e os financiamentos simulados. As operações continuam originadas nos departamentos virtuais.</p><div class="grid"><button class="tile" onclick="switchTab('v4report')"><span class="emoji">📒</span><b>Relatórios e razão</b></button><button class="tile" onclick="switchTab('v4bank')"><span class="emoji">🏦</span><b>Crédito e parcelas</b></button></div>`)+h};
save();render();
})();
