/* finanZ Pro: camada de carreira, economia pessoal e empreendedorismo.
   Todos os dados são fictícios e persistidos somente no dispositivo. */
'use strict';
const pro = () => {
  if (!state.pro) state.pro = {date:today(),wallet:0,vr:0,ledger:[],loans:[],ventures:[],experience:0,workDays:0,missions:[],guideDone:false};
  return state.pro;
};
const simDate = () => pro().date;
const simMonth = d => d.slice(0,7);
const activeContract = () => ensureCareer().contracts.find(x=>x.active);
const careerLadder = [
  {role:'Assistente financeiro',salary:2300,authority:2500,need:0},
  {role:'Analista financeiro',salary:3400,authority:6500,need:8},
  {role:'Supervisor financeiro',salary:4700,authority:12000,need:22},
  {role:'Gerente financeiro',salary:6800,authority:30000,need:45},
  {role:'Diretor financeiro (CFO)',salary:11500,authority:90000,need:80},
  {role:'CEO',salary:17000,authority:Infinity,need:130}
];
function proEntry(type,value,desc,date=simDate()){
  const p=pro();p.ledger.unshift({id:uid(),type,value:Math.round(value*100)/100,desc,date});
  p.ledger=p.ledger.slice(0,500);
}
function proTick(){
  const p=pro(),contract=activeContract(),d=simDate(),dom=Number(d.slice(-2));
  if(contract){
    const level=careerLadder.find(x=>x.role===contract.role)||careerLadder[0];
    const salary=contract.salary||level.salary;
    // Valores ilustrativos: 60% no dia 5, 40% no dia 20, sem descontos legais calculados.
    if([5,20].includes(dom)){
      const key=`salary:${contract.id}:${d}`;
      if(!p.ledger.some(x=>x.key===key)){
        const value=Math.round(salary*(dom===5?.6:.4)*100)/100;
        p.wallet+=value;
        p.ledger.unshift({id:uid(),type:'income',value,desc:`Salário simulado (${dom===5?'60%':'40%'}) · ${contract.name}`,date:d,key});
      }
    }
    if(dom===5){
      const key=`vr:${contract.id}:${d}`;
      if(!p.ledger.some(x=>x.key===key)){
        const value=contract.vrAmount??500;
        p.vr+=value;
        p.ledger.unshift({id:uid(),type:'benefit',value,desc:'Crédito de VR fictício',date:d,key});
      }
    }
    p.workDays++;
  }
  p.loans.forEach(l=>{
    if(l.remaining<=0||l.next!==d)return;
    const installment=Math.min(l.remaining,l.installment);
    if(p.wallet>=installment){p.wallet-=installment;l.remaining=Math.max(0,Math.round((l.remaining-installment)*100)/100);proEntry('expense',installment,'Parcela do empréstimo',d);l.next=addSimDays(d,30)}
    else {l.late=(l.late||0)+1;l.next=addSimDays(d,1);proEntry('notice',0,'Parcela não paga: saldo insuficiente',d)}
  });
  p.ventures.forEach(v=>{
    if(v.last===d)return;
    v.last=d;
    if(dom===25){
      const sales=Math.round((v.capital*.08+Math.random()*v.capital*.13)*100)/100;
      const costs=Math.round((sales*(.5+Math.random()*.28)+v.capital*.025)*100)/100;
      v.bank+=sales-costs;v.revenue+=sales;v.costs+=costs;
      v.events.unshift(`${fmt(d)} · Receita ${money(sales)}; custos ${money(costs)} (simulação)`);
      proEntry('business',sales-costs,`Resultado mensal simulado de ${v.name}`,d);
    }
  });
}
function addSimDays(date,n){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function advanceDays(n){if(n>31)return;for(let i=0;i<n;i++){pro().date=addSimDays(simDate(),1);proTick()}save();render();toast(`${n} dia(s) avançado(s) no calendário fictício`)}
function timeBar(){return card(`<div class="pro-time"><span class="pro-pill">📅 ${fmt(simDate())}</span>${b('+1 dia','advanceDays(1)','secondary small')}${b('+7 dias','advanceDays(7)','secondary small')}${b('+30 dias','advanceDays(30)','secondary small')}<small class="pro-mini">Calendário da simulação</small></div>`)}
function personalView(){const p=pro(),ct=activeContract();return `<div class="pro-heading"><h1>Minha carteira</h1><span class="pro-pill">ECONOMIA PESSOAL</span></div><p class="sub">Dinheiro pessoal separado do caixa das empresas.</p>${timeBar()}<div class="pro-metrics"><div class="pro-metric"><small>Saldo disponível</small><strong>${money(p.wallet)}</strong></div><div class="pro-metric"><small>Vale-refeição</small><strong>${money(p.vr)}</strong></div></div>${card(`<h2>Meu contrato</h2>${ct?`<div class="detail"><span>Empregador</span><b>${esc(ct.name)}</b></div><div class="detail"><span>Cargo</span><b>${esc(ct.role)}</b></div><div class="detail"><span>Salário simulado</span><b>${money(ct.salary||2300)}</b></div><p class="hint">Pagamento fictício: 60% no dia 5 e 40% no dia 20. Não representa folha CLT, descontos ou adiantamentos reais.</p>`:'<p class="hint">Aceite uma vaga para receber salário.</p>'}`)}${card(`<h2>Benefícios e crédito</h2><p class="hint">Conversão de VR é uma mecânica fictícia do jogo, não uma orientação para comercializar benefícios.</p><div class="pro-action"><div><b>Conversão de VR</b><p>Consome R$ 2.000 de VR e credita R$ 600 (30%) na carteira.</p></div>${b('Converter','convertVR()','secondary small')}</div><div class="pro-action"><div><b>Empréstimo bancário</b><p>Análise simulada com parcelas e vencimentos.</p></div>${b('Solicitar','loanForm()','primary small')}</div></div>`)}${card(`<h2>Empréstimos</h2>${p.loans.map(l=>`<div class="item"><b>${money(l.remaining)} pendentes</b><p>${l.installments} parcelas originais · ${money(l.installment)} por parcela · Próximo vencimento ${fmt(l.next)}</p>${l.late?`<span class="badge red">${l.late} atraso(s)</span>`:''}</div>`).join('')||'<p class="hint">Nenhum empréstimo.</p>'}`)}${card(`<h2>Extrato pessoal</h2>${p.ledger.slice(0,35).map(x=>`<div class="detail"><span>${fmt(x.date)} · ${esc(x.desc)}</span><b class="${x.type==='income'?'green':x.type==='expense'?'red':''}">${money(x.value)}</b></div>`).join('')||'<p class="hint">Sem movimentações. Avance o calendário após uma contratação.</p>'}`)}`}
function convertVR(){const p=pro();if(p.vr<2000)return toast('VR insuficiente para a conversão fictícia');p.vr-=2000;p.wallet+=600;proEntry('income',600,'Conversão fictícia de VR (R$ 2.000 consumidos)');save();render()}
function loanForm(){modal(`<h2>Solicitação de crédito</h2><p class="hint">Banco fictício. Taxa didática de 2% ao mês, parcelas fixas (Price). Sem IOF ou CET real.</p><form onsubmit="submitLoan(event)"><label>Valor solicitado (R$)</label><input name="amount" type="number" min="500" max="50000" step="100" required value="4000"><label>Prazo (meses)</label><select name="months"><option>6</option><option>12</option><option>18</option><option>24</option></select><button class="primary full">Analisar solicitação</button></form>`)}
function submitLoan(e){e.preventDefault();const f=new FormData(e.target),v=Number(f.get('amount')),n=Number(f.get('months')),p=pro(),ct=activeContract(),income=ct?(ct.salary||2300):0,rate=.02,installment=v*rate/(1-Math.pow(1+rate,-n));if(installment>income*.3||!ct){toast('Crédito recusado: parcela supera 30% da renda ou não há vínculo');return}p.wallet+=v;p.loans.push({id:uid(),principal:v,remaining:Math.round(installment*n*100)/100,installment:Math.round(installment*100)/100,installments:n,next:addSimDays(simDate(),30),late:0});proEntry('income',v,'Empréstimo aprovado (simulação)');save();closeModal();render();toast('Crédito fictício aprovado')}
function ventureForm(){modal(`<h2>Abrir negócio</h2><p class="hint">Capital será transferido da carteira pessoal para a empresa. O caixa empresarial permanecerá separado.</p><form onsubmit="openVenture(event)"><label>Nome fantasia</label><input name="name" maxlength="60" required placeholder="Ex.: Nova Eletrônicos"><label>Atividade</label><select name="sector"><option>Comércio</option><option>Serviços</option><option>Transporte</option><option>Indústria</option></select><label>Regime tributário fictício</label><select name="tax"><option>Simples Nacional</option><option>MEI (SIMEI)</option><option>Lucro Presumido</option><option>Lucro Real</option><option>Lucro Arbitrado</option></select><label>Capital inicial (R$)</label><input name="capital" type="number" min="1000" step="100" value="10000" required><p class="pro-note">O cadastro não valida enquadramento legal, limites ou elegibilidade fiscal. A escolha é didática.</p><button class="primary full">Constituir empresa simulada</button></form>`)}
function openVenture(e){e.preventDefault();const f=new FormData(e.target),p=pro(),capital=Number(f.get('capital'));if(capital>p.wallet)return toast('Saldo pessoal insuficiente para aportar capital');const id=uid(),name=String(f.get('name')).trim();if(!name)return;const c={id,name,sector:f.get('sector'),tax:f.get('tax'),capital,bank:capital,created:simDate(),owner:true};state.companies.push(c);p.wallet-=capital;p.ventures.push({id:uid(),companyId:id,name,capital,bank:capital,revenue:0,costs:0,events:[],last:''});proEntry('expense',capital,`Aporte de capital em ${name}`);state.active=id;save();closeModal();navTo('companies');toast('Negócio simulado constituído')}
function ventureView(){const p=pro();return `<div class="pro-heading"><h1>Meus negócios</h1>${b('+ Abrir negócio','ventureForm()','primary small')}</div><p class="sub">Empreenda com o dinheiro acumulado no jogo.</p>${timeBar()}${p.ventures.map(v=>card(`<h2>${esc(v.name)}</h2><div class="pro-metrics"><div class="pro-metric"><small>Caixa simulado</small><strong>${money(v.bank)}</strong></div><div class="pro-metric"><small>Receita acumulada</small><strong>${money(v.revenue)}</strong></div></div><p class="hint">Custos simulados: ${money(v.costs)}. Resultados mensais simplificados, sem apuração fiscal automática.</p>${b('Abrir empresa',`setActive('${v.companyId}');navTo('home')`,'primary small')}<h3 style="margin-top:16px">Movimentações</h3>${v.events.slice(0,6).map(x=>`<p class="hint">${esc(x)}</p>`).join('')||'<p class="hint">Avance o calendário para gerar resultados.</p>'}`)).join('')||card('<p>Você ainda não abriu uma empresa.</p><p class="hint">Trabalhe, receba salários e acumule capital.</p>')}`}
function careerView(){const p=pro(),ct=activeContract();if(!ct)return card(`<h2>Plano de carreira</h2><p>Primeiro aceite uma proposta de trabalho na aba Vagas.</p>`);const idx=Math.max(0,careerLadder.findIndex(x=>x.role===ct.role)),level=careerLadder[idx],next=careerLadder[idx+1],xp=p.experience;return `<h1>Minha carreira</h1><p class="sub">${esc(ct.name)}</p>${card(`<span class="pro-tag">Cargo atual</span><h2 style="margin-top:8px">${esc(ct.role)}</h2><div class="detail"><span>Salário</span><b>${money(ct.salary||level.salary)}</b></div><div class="detail"><span>Alçada de aprovação</span><b>${level.authority===Infinity?'Sem teto de jogo':money(level.authority)}</b></div><div class="detail"><span>Experiência</span><b>${xp} XP</b></div>${next?`<p>Próximo cargo: <b>${next.role}</b></p><div class="pro-progress"><span style="width:${Math.min(100,Math.round(xp/next.need*100))}%"></span></div><p class="hint">Requer ${next.need} XP e análise de desempenho.</p>${b('Solicitar avaliação','requestPromotion()','primary full')}`:'<p class="pro-status">Topo da trilha simulada</p>'}`)}${card(`<h2>Como evoluir</h2><p class="hint">Ganhe experiência ao concluir demandas e autorizações justificadas. Erros e rejeições também contam no histórico. Promoção não é automática.</p><div class="detail"><span>Dias de trabalho simulados</span><b>${p.workDays}</b></div><div class="detail"><span>Decisões registradas</span><b>${ensureCareer().events.filter(x=>x.company===ct.companyId).length}</b></div>`)}${card(`<h2>Trilha de cargos</h2>${careerLadder.map((x,i)=>`<div class="detail"><span>${i<=idx?'✓':'○'} ${x.role}</span><b>${money(x.salary)}</b></div>`).join('')}`)}`}
function requestPromotion(){const p=pro(),ct=activeContract();if(!ct)return;const idx=careerLadder.findIndex(x=>x.role===ct.role),next=careerLadder[idx+1];if(!next)return toast('Você chegou ao último cargo');const approvals=ensureCareer().approvals.filter(x=>x.company===ct.companyId&&x.status!=='pending'),approved=approvals.filter(x=>x.status==='approved').length;const skills=Object.values(state.skills),attempts=skills.reduce((a,x)=>a+x.attempts,0),correct=skills.reduce((a,x)=>a+x.correct,0);if(p.experience<next.need||approvals.length<3||approved/approvals.length<.5||(attempts>0&&correct/attempts<.6))return toast(`Avaliação negada: exige ${next.need} XP, 3 decisões e desempenho consistente`);ct.role=next.role;ct.salary=next.salary;proEntry('notice',0,`Promoção para ${next.role}`);save();render();toast('Promoção concedida!')}
function fiscalWorkbench(){const c=company(),reg=c.tax,sector=c.sector;const rules={
 'MEI (SIMEI)':['Verificar atividade permitida, receita acumulada e limite aplicável','Simular DAS fixo e declaração anual, sem valores legais automáticos'],
 'Simples Nacional':['Identificar anexo, RBT12 e receitas segregadas','Verificar alíquota efetiva e exceções antes do DAS'],
 'Lucro Presumido':['Classificar receita por atividade e base presumida','Verificar IRPJ, CSLL, PIS/Cofins, ISS/ICMS e períodos de apuração'],
 'Lucro Real':['Conferir escrituração e ajustes fiscais','Analisar créditos, IRPJ/CSLL e regime de PIS/Cofins'],
 'Lucro Arbitrado':['Identificar hipótese de arbitramento','Revisar documentação e bases legais específicas']
 };let sectorRules={Transporte:['CT-e, MDF-e e regras de transporte conforme operação','Cotação, combustível, pedágios e condições do frete'],Comércio:['NF-e, NCM, CFOP e ICMS conforme operação','Estoque, devoluções e fornecedores'],Serviços:['NFS-e e ISS conforme município e atividade','Retenções e contratos de prestação de serviços'],Indústria:['NF-e, NCM, IPI e ICMS conforme operação','Custos industriais e produção']}[sector]||[];
 const tasks=[...(rules[reg]||['Revisar enquadramento']),...sectorRules];return `<h1>Fiscal e tributário</h1><p class="sub">${esc(c.name)} · ${esc(sector)}</p>${card(`<span class="pro-tag">Regime selecionado</span><h2>${esc(reg)}</h2><p class="pro-note">Exercícios simulados. Sem emissão de documentos oficiais, apuração fiscal certificada ou regras legais completas. Consulte normas vigentes para situações reais.</p>`)}${card(`<h2>Checklist de revisão</h2>${tasks.map((t,i)=>`<div class="pro-action"><div><b>${i+1}. ${esc(t)}</b><p>Valide dados, competência, localidade e documentação.</p></div>${b('Revisar',`fiscalTask(${i})`,'secondary small')}</div>`).join('')}`)}${card(`<h2>Fluxo de aprovação</h2><p class="hint">Envie a revisão à central de autorizações. O sistema registra a decisão, mas não recolhe tributos.</p>${b('Solicitar autorização',`requestTax();switchTab('approvals')`,'primary full')}`)}`}
function fiscalTask(i){modal(`<h2>Revisão fiscal ${i+1}</h2><p>Regime: <b>${esc(company().tax)}</b></p><p class="hint">Confira enquadramento, atividade, localidade, competência e documentos. Esta etapa registra sua análise, sem cálculo legal automático.</p><label>Conclusão da análise</label><input id="fiscalAnswer" placeholder="Descreva o que deve ser conferido"><button class="primary full" onclick="saveFiscalTask(${i})">Registrar análise</button>`)}
function saveFiscalTask(i){const answer=document.getElementById('fiscalAnswer')?.value.trim();if(!answer||answer.length<12)return toast('Descreva sua análise com mais detalhes');ensureCareer().events.push({company:state.active,date:simDate(),text:`Revisão fiscal ${i+1}: ${answer.slice(0,120)}`});pro().experience+=1;save();closeModal();render();toast('Análise registrada para revisão')}
// Integração não destrutiva com os módulos financeiros originais.
const oldJobs=jobs,oldCompanies=companies,oldHome=home,oldReports=reports,oldAchievements=achievements,oldModule=moduleView,oldDecide=decideRequest,oldHire=hire,oldRender=render;
hire=function(id){const offer=ensureCareer().offers.find(x=>x.id===id);oldHire(id);const ct=activeContract();if(ct){ct.salary=offer?.salary||2300;ct.vrAmount=500;save()}};
decideRequest=function(id,ok){const a=ensureCareer().approvals.find(x=>x.id===id),before=a?.status;oldDecide(id,ok);if(a&&before==='pending'&&a.status!=='pending'){pro().experience+=ok?3:1;save()}};
function proMenu(){return `<div class="pro-grid">${[['personal','💳 Carteira','Salário, VR e crédito'],['career','📈 Carreira','Promoções e desempenho'],['venture','🏬 Empreender','Abrir e gerir negócio'],['fiscalpro','⚖️ Centro fiscal','Regras por atividade e regime']].map(([id,title,desc])=>`<button class="tile" onclick="switchTab('${id}')"><b>${title}</b><small>${desc}</small></button>`).join('')}</div>`}
home=function(){if(sub==='personal')return personalView();if(sub==='career')return careerView();if(sub==='venture')return ventureView();if(sub==='fiscalpro')return fiscalWorkbench();const h=oldHome();if(sub!=='overview')return h;return `<div class="pro-heading"><h1>Meu ambiente</h1><span class="pro-pill">PRO</span></div>${timeBar()}${card(`<span class="pro-tag">Carteira pessoal</span><div class="pro-hero-number">${money(pro().wallet)}</div><p class="pro-mini">VR disponível: ${money(pro().vr)} · XP: ${pro().experience}</p>${b('Abrir carteira',`switchTab('personal')`,'secondary small')}`)}${card(`<h2>Vida profissional</h2>${proMenu()}`)}${h}`};
companies=function(){if(sub==='venture')return ventureView();if(sub==='career')return careerView();return `<div class="pro-heading"><h1>Empresas</h1>${b('Empreender',`switchTab('venture')`,'primary small')}</div>${card(`<h2>Gestão e carreira</h2><div class="pro-grid"><button class="tile" onclick="switchTab('career')"><b>📈 Evolução profissional</b><small>Cargos e promoções</small></button><button class="tile" onclick="switchTab('venture')"><b>🏬 Negócio próprio</b><small>Capital e operações</small></button></div>`)}${oldCompanies()}`};
jobs=function(){return `${card(`<div class="row"><div><b>Meu perfil profissional</b><p class="hint">${activeContract()?esc(activeContract().role)+' · '+money(activeContract().salary||2300):'Buscando colocação'}</p></div>${b('Carreira',`navTo('companies');switchTab('career')`,'secondary small')}</div>`)}${oldJobs()}`};
reports=function(){return `${card(`<h2>Resumo da carreira</h2><div class="pro-metrics"><div class="pro-metric"><small>Experiência</small><strong>${pro().experience} XP</strong></div><div class="pro-metric"><small>Saldo pessoal</small><strong>${money(pro().wallet)}</strong></div></div><p class="hint">Os relatórios empresariais abaixo são separados do patrimônio pessoal.</p>`)}${oldReports()}`};
achievements=function(){return `${card(`<h2>Progressão profissional</h2><p class="hint">${pro().experience} XP · ${pro().workDays} dias de trabalho simulados</p>${b('Ver carreira',`navTo('companies');switchTab('career')`,'secondary small')}`)}${oldAchievements()}`};
moduleView=function(){if(sub==='fiscal')return fiscalWorkbench();return oldModule()};
// Guia pequeno, contextual e navegável. Não bloqueia toda a tela.
const guideTargets=[['jobs','Vagas','Encontre propostas com cargos, salários e regimes tributários.'],['home','Início','Aqui ficam os departamentos e suas tarefas operacionais.'],['companies','Empresas','Consulte empresas, evolua de cargo ou abra seu negócio.'],['reports','Relatórios','Analise os resultados financeiros das operações.'],['achievements','Conquistas','Acompanhe competências, histórico e progresso.']];
let guideIndex=0;
function clearGuide(){document.querySelector('.pro-guide')?.remove();document.querySelector('.pro-spotlight')?.classList.remove('pro-spotlight')}
function showGuide(){clearGuide();if(guideIndex>=guideTargets.length){state.tourSeen=true;pro().guideDone=true;save();return}const [target,title,desc]=guideTargets[guideIndex];const btn=[...document.querySelectorAll('#nav button')].find(x=>x.getAttribute('onclick')?.includes(`'${target}'`));if(!btn)return;btn.classList.add('pro-spotlight');const r=btn.getBoundingClientRect(),box=document.createElement('div');box.className='pro-guide';box.innerHTML=`<strong>${title}</strong><p>${desc}</p><small>${guideIndex+1}/${guideTargets.length}</small><div class="row"><button class="secondary small" onclick="stopGuide()">Pular</button><button class="primary small" onclick="nextGuide()">${guideIndex===guideTargets.length-1?'Concluir':'Próximo'}</button></div>`;document.body.append(box);const w=box.offsetWidth;box.style.left=Math.max(12,Math.min(innerWidth-w-12,r.left+r.width/2-w/2))+'px';box.style.top=Math.max(12,r.top-box.offsetHeight-12)+'px'}
function stopGuide(){clearGuide();state.tourSeen=true;pro().guideDone=true;save()}
function nextGuide(){guideIndex++;showGuide()}
tour=function(){guideIndex=0;showGuide()};
const previousNav=navTo;navTo=function(p){clearGuide();previousNav(p)};
render=function(){oldRender();if(page==='home'&&sub==='overview'){document.querySelector('#app')?.setAttribute('data-simulation-date',simDate())}};
// Fecha o tutorial antigo da primeira execução e apresenta orientação contextual.
closeModal();if(!pro().guideDone&&!state.tourSeen)setTimeout(()=>{guideIndex=0;showGuide()},500);
save();render();
