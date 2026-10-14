/* finanZ Pro v7: oficina de lançamentos contábeis com partidas dobradas. */
(function(){'use strict';
const db=()=>{state.ultra6??={companies:{}};return state.ultra6.companies[state.active]??={entries:[]}};
const e=s=>esc(String(s??''));
const m=n=>money(Number(n)||0);
const accounts={
 'Caixa e bancos':'A','Clientes a receber':'A','Estoques':'A','Imobilizado':'A',
 'Fornecedores a pagar':'P','Salários a pagar':'P','Empréstimos a pagar':'P',
 'Capital social':'PL','Receita de serviços':'R','Receita de vendas':'R',
 'Despesa com salários':'D','Despesa financeira':'D','Custo de serviços':'D','Custo de mercadorias':'D'
};
function view(){const journal=db().entries, totals={};
 for(const j of journal)for(const l of j.lines){totals[l.account]??={d:0,c:0};totals[l.account][l.side]+=l.amount;}
 const sum=(side)=>Object.values(totals).reduce((a,v)=>a+v[side],0);
 const rev=Object.entries(totals).filter(([k])=>accounts[k]==='R').reduce((a,[k,v])=>a+v.c-v.d,0);
 const exp=Object.entries(totals).filter(([k])=>accounts[k]==='D').reduce((a,[k,v])=>a+v.d-v.c,0);
 const select=(id)=>`<select id="${id}">${Object.keys(accounts).map(x=>`<option value="${e(x)}">${e(x)}</option>`).join('')}</select>`;
 return `<div class="row"><h1>Escrituração contábil</h1>${b('← Voltar',"switchTab('overview')",'secondary small')}</div><p class="sub">Exercícios de débito e crédito · ${e(company().name)}</p>`+
 card(`<h2>Novo lançamento manual</h2><p class="hint">Registre um fato contábil com duas contas e valores iguais. Não há lançamento financeiro automático nesta oficina.</p><form onsubmit="v7Post(event)"><label>Histórico</label><input name="memo" maxlength="150" required placeholder="Ex.: compra de equipamento a prazo"><label>Conta debitada</label>${select('v7debit')}<label>Conta creditada</label>${select('v7credit')}<label>Valor (R$)</label><input name="amount" type="number" min="0.01" step="0.01" required><button class="primary full">Registrar no diário</button></form>`)+
 card(`<h2>Balancete dos lançamentos manuais</h2><div class="detail"><span>Total de débitos</span><b>${m(sum('d'))}</b></div><div class="detail"><span>Total de créditos</span><b>${m(sum('c'))}</b></div><p class="hint">${Math.abs(sum('d')-sum('c'))<.01?'Partidas balanceadas':'Diferença identificada'}</p>${Object.entries(totals).map(([k,v])=>`<div class="detail"><span>${e(k)}</span><b>D ${m(v.d)} · C ${m(v.c)}</b></div>`).join('')||'<p class="hint">Nenhum lançamento.</p>'}`)+
 card(`<h2>Resultado parcial desta oficina</h2><div class="detail"><span>Receitas</span><b>${m(rev)}</b></div><div class="detail"><span>Custos e despesas</span><b>${m(exp)}</b></div><div class="detail"><span>Resultado</span><b>${m(rev-exp)}</b></div><p class="notice">Este resultado considera apenas os lançamentos manuais da oficina. Não é uma DRE ou balanço patrimonial oficial nem integra automaticamente os demais módulos.</p>`)+
 card(`<h2>Diário</h2>${journal.slice(0,30).map(j=>`<div class="item"><b>${e(j.memo)}</b><p>${e(j.date)} · ${m(j.amount)}</p><p>Débito: ${e(j.lines[0].account)} · Crédito: ${e(j.lines[1].account)}</p></div>`).join('')||'<p class="hint">Sem lançamentos.</p>'}`);
}
window.v7Post=function(ev){ev.preventDefault();const f=new FormData(ev.target),debit=document.getElementById('v7debit').value,credit=document.getElementById('v7credit').value,amount=Number(f.get('amount')),memo=String(f.get('memo')||'').trim();
 if(!accounts[debit]||!accounts[credit]||debit===credit||!Number.isFinite(amount)||amount<=0||amount>1e10||memo.length<5)return toast('Revise contas, histórico e valor');
 const val=Math.round(amount*100)/100;db().entries.unshift({id:uid(),date:new Date().toISOString().slice(0,10),memo,amount:val,lines:[{side:'d',account:debit,amount:val},{side:'c',account:credit,amount:val}]});save();render();toast('Lançamento registrado no diário');};
const oldModule=moduleView;moduleView=function(){if(sub==='v7ledger')return view();return oldModule()};
const oldHome=home;home=function(){const h=oldHome();if(sub!=='overview')return h;return card(`<h2>📚 Oficina contábil</h2><p>Pratique lançamentos em partidas dobradas, confira o balancete e avalie o resultado parcial.</p>${b('Abrir escrituração',"switchTab('v7ledger')",'primary full')}`)+h};
render();
})();
