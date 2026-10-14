/* finanZ Pro ULTRA v5: cenários de folha, férias, rescisão e projeção de caixa.
   Regras configuráveis para fins didáticos; não constitui cálculo legal. */
(function(){'use strict';
const st=()=>{state.ultra5 ||= {companies:{}};return state.ultra5.companies[state.active] ||= {scenarios:[],settings:{inss:9,irrf:0,fgts:8,benefit:250,employer:20}}};
const emps=()=> (state.ultra?.employees||[]).filter(x=>x.company===state.active);
const fmt=n=>money(Number(n)||0);
const safe=s=>esc(String(s??''));
const hd=t=>`<div class="row"><h1>${t}</h1>${b('← Voltar',"switchTab('overview')",'secondary small')}</div><p class="sub">Cenários educacionais · ${safe(company().name)}</p>`;
const todayOffset=n=>{let d=new Date();d.setDate(d.getDate()+(state.ecosystem?.companies?.[state.active]?.day||0)+n);return d.toISOString().slice(0,10)};
function calc(emp,kind,days=30){
 let p=st().settings,base=Number(emp.salary)||0, gross=kind==='férias'?base/30*days+(base/30*days)/3:kind==='rescisão'?base+base/12:base;
 let inss=+(gross*p.inss/100).toFixed(2),irrf=+(gross*p.irrf/100).toFixed(2);
 let benefits=kind==='mensal'?Number(p.benefit):0;
 let net=+(gross-inss-irrf+benefits).toFixed(2);
 let fgts=+(gross*p.fgts/100).toFixed(2),employer=+(gross*p.employer/100).toFixed(2);
 return {gross,inss,irrf,fgts,employer,benefits,net,companyCost:+(gross+fgts+employer+benefits).toFixed(2)};
}
function payroll(){
 let p=st().settings;
 return hd('RH · Folha e desligamentos')+card(`<h2>Parâmetros de simulação</h2><p class="notice">As taxas abaixo são hipóteses editáveis. Não representam automaticamente as faixas oficiais de INSS/IRRF, incidências de FGTS, convenções coletivas, regras de férias ou rescisão.</p><form onsubmit="v5Rates(event)"><div class="formgrid">${[['inss','Desconto INSS hipotético (%)'],['irrf','IRRF hipotético (%)'],['fgts','FGTS hipotético (%)'],['employer','Encargos patronais hipotéticos (%)'],['benefit','Benefício pago (R$)']].map(([k,label])=>`<div><label>${label}</label><input name="${k}" type="number" min="0" max="${k==='benefit'?100000:100}" step=".01" value="${p[k]}" required></div>`).join('')}</div><button class="primary full">Salvar parâmetros</button></form>`)+card(`<h2>Colaboradores e simulações</h2>${emps().map(x=>`<div class="item"><b>${safe(x.name)} · ${safe(x.role)}</b><p>Salário-base: ${fmt(x.salary)}</p><div class="row" style="flex-wrap:wrap">${b('Folha',`v5Sim('${x.id}','mensal')`,'primary small')}${b('Férias (30 dias)',`v5Sim('${x.id}','férias')`,'secondary small')}${b('Rescisão ilustrativa',`v5Sim('${x.id}','rescisão')`,'secondary small')}</div></div>`).join('')||'<p class="hint">Cadastre colaboradores no módulo RH existente.</p>'}`)+card(`<h2>Simulações registradas</h2>${st().scenarios.slice(0,12).map(x=>`<div class="item"><b>${safe(x.name)} · ${safe(x.kind)}</b><p>Bruto ${fmt(x.gross)} · Líquido estimado ${fmt(x.net)} · Custo empresa ${fmt(x.companyCost)}</p><p class="hint">${safe(x.date)} · Cenário sem validade trabalhista</p>${!x.exported?b('Enviar para análise financeira',`v5Send('${x.id}')`,'primary small'):'Encaminhado ao financeiro'}</div>`).join('')||'<p class="hint">Nenhum cenário.</p>'}`)}
window.v5Rates=e=>{e.preventDefault();let f=new FormData(e.target),p=st().settings;for(let k of Object.keys(p)){let v=Number(f.get(k));if(!Number.isFinite(v)||v<0||v>(k==='benefit'?100000:100))return toast('Confira as taxas');p[k]=v}save();render();toast('Parâmetros salvos')};
window.v5Sim=(id,kind)=>{let emp=emps().find(x=>x.id===id);if(!emp)return;let v=calc(emp,kind);let rec={id:uid(),employee:id,name:emp.name,kind,date:todayOffset(0),...v};st().scenarios.unshift(rec);save();modal(`<h2>${safe(kind)} · ${safe(emp.name)}</h2>${Object.entries({Bruto:v.gross,'Desconto INSS (hipótese)':v.inss,'Desconto IRRF (hipótese)':v.irrf,'Benefício':v.benefits,'Líquido estimado':v.net,'FGTS (hipótese)':v.fgts,'Encargos patronais (hipótese)':v.employer,'Custo estimado da empresa':v.companyCost}).map(([k,val])=>`<div class="detail"><span>${k}</span><b>${fmt(val)}</b></div>`).join('')}<p class="notice">Férias e rescisões reais dependem de datas, médias, verbas, motivos, descontos e regras legais não modelados aqui. Não usar para pagamento real.</p>${b('Fechar','closeModal();render()','primary full')}`)};
window.v5Send=id=>{let x=st().scenarios.find(x=>x.id===id&&!x.exported);if(!x)return;
 let eco=state.ecosystem.companies[state.active];let caseId='v5-'+x.id;
 eco.cases.unshift({id:caseId,type:'v5payroll',actor:'RH / Departamento Pessoal',description:`Conferir cenário ${x.kind} de ${x.name}. RH aguarda validação dos parâmetros e documentos antes de liberar pagamentos.`,value:x.net,created:todayOffset(0),due:todayOffset(3),status:'pending',docs:[`Colaborador: ${x.name}`,`Tipo: ${x.kind}`,`Salário bruto estimado: ${fmt(x.gross)}`,`Líquido hipotético: ${fmt(x.net)}`,`Custo total hipotético: ${fmt(x.companyCost)}`,`Cálculos legais e documentação: não validados`],missing:true,company:state.active});
 eco.events.unshift({id:uid(),date:todayOffset(0),sector:'RH',description:`Encaminhou cenário de ${x.kind} de ${x.name} para conferência`,caseId});
 x.exported=true;save();render();toast('Cenário enviado. Autorizar está bloqueado até validação legal.');
};
function cashflow(){
 let titles=txs().filter(t=>t.status==='open'),start=balance(),days=[0,7,15,30,60,90];
 let sum=(kind,limit)=>titles.filter(t=>t.kind===kind&&new Date(t.due)<=new Date(todayOffset(limit))).reduce((a,t)=>a+Number(t.value||0),0);
 let html=days.map(d=>{let receive=sum('receive',d),pay=sum('pay',d);return `<div class="item"><b>Até ${d===0?'hoje':d+' dias'}</b><div class="detail"><span>Recebimentos previstos</span><b>${fmt(receive)}</b></div><div class="detail"><span>Pagamentos previstos</span><b>${fmt(pay)}</b></div><div class="detail"><span>Saldo projetado</span><b>${fmt(start+receive-pay)}</b></div></div>`}).join('');
 return hd('Fluxo de caixa projetado')+card(`<h2>Projeção por vencimento</h2><p class="notice">Cenário determinístico: considera recebimento integral dos títulos abertos na data prevista, sem novos eventos, tributos futuros ou inadimplência. Não equivale a previsão garantida.</p><div class="detail"><span>Saldo atual</span><b>${fmt(start)}</b></div>${html}`)+card(`<h2>Riscos para analisar</h2><p>Verifique títulos vencidos, clientes inadimplentes, pagamentos críticos e disponibilidade de crédito antes de autorizar desembolsos.</p>${b('Ver contas a receber',"switchTab('receive')",'secondary full')}`)}
const prev=moduleView;
moduleView=function(){if(sub==='v5payroll')return payroll();if(sub==='v5cashflow')return cashflow();return prev()};
const oldHome=home;
home=function(){let h=oldHome();if(sub!=='overview')return h;return card(`<h2>📈 Novos cenários de gestão</h2><div class="grid"><button class="tile" onclick="switchTab('v5payroll')"><span class="emoji">👥</span><b>Folha e rescisões</b></button><button class="tile" onclick="switchTab('v5cashflow')"><span class="emoji">📆</span><b>Fluxo projetado</b></button></div><p class="hint">Cenários didáticos, não cálculos legais oficiais.</p>`)+h};
save();render();
})();
