/* finanZ Pro v9: operações ligadas a tarefas, validação e conciliação de saldos. */
(function(){'use strict';
const db=()=>{state.ultra9??={companies:{}};return state.ultra9.companies[state.active]??={audits:[],lastDay:-1}};
const eco=()=>state.ecosystem.companies[state.active];
const money2=n=>money(Number(n)||0);
const safe=s=>esc(String(s??''));
const date=n=>{let x=new Date();x.setDate(x.getDate()+eco().day+n);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
function emit(){
 let d=db(),n=eco().day;if(d.lastDay===n)return;d.lastDay=n;
 // An event is an operational request; it does not become a receivable before invoicing.
 if(n%4!==0){save();return}
 let amount=2000+(n*317)%7300,customer=['Rede Aurora','Grupo Ápice','Mercantil Centro','Indústria Pioneira'][n%4];
 let id='v9-sale-'+state.active+'-'+n;if(eco().cases.some(x=>x.id===id))return;
 let type=company().sector==='Transporte'?'frete':company().sector==='Indústria'?'fabricação':company().sector==='Comércio'?'fornecimento':'serviço';
 let cost=+(amount*.62).toFixed(2);
 let c={id,type:'v9sale',actor:'Comercial',description:`O comercial negociou uma proposta de ${type} com ${customer}. O setor solicita parecer sobre margem, prazo e risco antes de confirmar o pedido.`,value:amount,created:date(0),due:date(3),status:'pending',company:state.active,party:customer,ref:'PRO-'+n,cost,docs:[`Cliente: ${customer}`,`Pedido: PRO-${n}`,`Objeto: ${type}`,`Valor de venda: ${money2(amount)}`,`Custo estimado: ${money2(cost)}`,`Margem estimada: ${money2(amount-cost)}`,`Prazo de recebimento: 30 dias após faturamento`,`Entrega/execução: ainda não realizada`]};
 eco().cases.unshift(c);eco().events.unshift({id:uid(),date:date(0),sector:'Comercial',description:c.description,caseId:id});save();
}
const oldAdvance=window.ecoAdvance;
window.ecoAdvance=function(){oldAdvance();emit();save();render()};
const oldReview=window.ecoReview;
window.ecoReview=function(id){let c=eco().cases.find(x=>x.id===id);if(!c||c.type!=='v9sale')return oldReview(id);
 modal(`<h2>Proposta comercial · ${safe(c.ref)}</h2><p>${safe(c.description)}</p><h3>Documentos e informações</h3>${c.docs.map(x=>`<div class="item">${safe(x)}</div>`).join('')}<p class="notice">Sua decisão é financeira. A execução será feita pelo setor operacional, e só então haverá faturamento.</p><label>Justificativa</label><textarea id="eco-reason" rows="4" placeholder="Analise custo, margem e prazo"></textarea><div class="row">${b('Rejeitar',`ecoDecide('${id}','rejected')`,'danger')}${b('Pedir esclarecimentos',`ecoDecide('${id}','clarification')`,'secondary')}${b('Autorizar',`ecoDecide('${id}','approved')`,'primary')}</div>`)
};
const oldDecide=window.ecoDecide;
window.ecoDecide=function(id,decision){let c=eco().cases.find(x=>x.id===id);if(!c||c.type!=='v9sale')return oldDecide(id,decision);
 if(!['pending','clarification'].includes(c.status))return;
 let reason=document.getElementById('eco-reason')?.value.trim()||'';
 if(reason.length<15)return toast('Justifique sua análise com pelo menos 15 caracteres');
 c.status=decision;c.reason=reason;c.decided=date(0);
 if(decision==='approved'){c.status='em execução';c.completeDay=eco().day+2;eco().events.unshift({id:uid(),date:date(0),sector:'Operações',description:`Pedido ${c.ref} autorizado. Operações assumiu a execução.`,caseId:id})}
 db().audits.unshift({id,decision,reason,date:date(0)});save();closeModal();render();toast('Decisão registrada')
};
const advance=window.ecoAdvance;
window.ecoAdvance=function(){advance();
 for(let c of eco().cases.filter(x=>x.type==='v9sale'&&x.status==='em execução'&&eco().day>=x.completeDay)){
  c.status='entregue';let id='v9-billing-'+c.id;
  if(eco().cases.some(x=>x.id===id))continue;
  let inv={id,type:'billing',actor:'Faturamento',description:`Operações concluiu o pedido ${c.ref}. Faturamento solicita conferência da nota simulada e do título a receber.`,value:c.value,created:date(0),due:date(2),status:'pending',company:state.active,party:c.party,ref:'NF-'+c.ref,docs:[`Pedido: ${c.ref}`,`Cliente: ${c.party}`,`Entrega concluída no dia simulado ${eco().day}`,`Valor faturado: ${money2(c.value)}`,`Recebimento: 30 dias após faturamento`,`Nota fiscal: documento didático, sem autorização da SEFAZ`],receiveDue:date(30)};
  eco().cases.unshift(inv);eco().events.unshift({id:uid(),date:date(0),sector:'Faturamento',description:inv.description,caseId:id});
 }
 save();render();
};
const oldHome=home;home=function(){let h=oldHome();if(sub!=='overview')return h;return card(`<h2>Ciclo comercial conectado</h2><p>Comercial negocia, você avalia, operações executa e faturamento gera o recebível.</p>${b('Ver solicitações',"switchTab('eco')",'primary full')}`)+h};
render();
})();
