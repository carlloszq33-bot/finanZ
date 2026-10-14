/* finanZ Pro Master: interface de mercado acessível, titularidade e controles de edição. */
(function(){
'use strict';
const isOwner = c => !!c && (c.owner===true || c.owned===true || (typeof pro==='function' && pro().ventures?.some(v=>v.companyId===c.id)));
const predefined = new Set(['a1','a2','a3','a4']);
state.companies.forEach(c=>{if(predefined.has(c.id)){c.owner=false;c.owned=false;}else {c.owner=true;c.owned=true;}});
const priorForm=companyForm, priorSubmit=submitCompany;
companyForm=function(id){
 const c=id?state.companies.find(x=>x.id===id):null;
 if(!id){toast('Crie sua empresa em Início → Empreender');navTo('home');switchTab('venture');return;}
 if(!isOwner(c)){toast('Empresa contratante: edição não autorizada');return;}
 return priorForm(id);
};
submitCompany=function(e,id){
 e.preventDefault();
 if(!id || !isOwner(state.companies.find(c=>c.id===id))){toast('Alteração não autorizada');return;}
 return priorSubmit(e,id);
};
companies=function(){
 const c=company();
 const top=`<div class="row"><h1>Empresas</h1>${b('+ Abrir negócio',"navTo('home');switchTab('venture')",'primary small')}</div><p class="sub">Empresas contratantes têm dados definidos pela simulação. Somente empresas próprias podem ser administradas.</p>`;
 const ts=tabs([['overview','Minhas empresas'],['settings','Configurações']],sub,'switchTab');
 if(sub==='settings')return top+ts+card(`<h2>${esc(c.name)}</h2><p class="hint">${isOwner(c)?'Empresa própria: configuração de cadastro disponível. Alterações tributárias devem respeitar regras e prazos.':'Empresa contratante: dados protegidos. Você opera conforme as políticas desta empresa.'}</p><div class="detail"><span>Segmento</span><b>${esc(c.sector)}</b></div><div class="detail"><span>Regime tributário</span><b>${esc(c.tax)}</b></div><div class="detail"><span>Capital inicial</span><b>${money(c.capital)}</b></div><div class="detail"><span>Saldo bancário inicial</span><b>${money(c.bank)}</b></div>${isOwner(c)?b('Editar minha empresa',`companyForm('${c.id}')`,'primary'):'<p class="notice">🔒 Você não é proprietário desta empresa. Nome, segmento, regime e capital não podem ser editados.</p>'}`);
 return top+ts+state.companies.map(x=>{const own=isOwner(x);return card(`<div class="row"><div><strong>🏢 ${esc(x.name)}</strong><p class="hint">${esc(x.sector)} · ${esc(x.tax)}</p><span class="badge ${own?'orange':''}">${own?'Empresa própria':'Empresa contratante'}</span></div><span class="badge">${x.id===state.active?'Em operação':'Disponível'}</span></div><div class="row" style="margin-top:14px">${b(x.id===state.active?'Selecionada':'Selecionar empresa',`setActive('${x.id}')`,'primary small')}${b('Detalhes',`companyDetail('${x.id}')`,'secondary small')}${own?b('Editar',`companyForm('${x.id}')`,'secondary small'):''}</div>`)}).join('');
};
companyDetail=function(id){const c=state.companies.find(x=>x.id===id);if(!c)return;const own=isOwner(c);modal(`<h2>${esc(c.name)}</h2><p class="hint">${own?'Empresa própria':'Empresa contratante · dados protegidos'}</p><div class="detail"><span>Segmento</span><b>${esc(c.sector)}</b></div><div class="detail"><span>Regime</span><b>${esc(c.tax)}</b></div><div class="detail"><span>Capital inicial</span><b>${money(c.capital)}</b></div><div class="detail"><span>Saldo bancário inicial</span><b>${money(c.bank)}</b></div><div class="row" style="margin-top:14px">${b('Fechar','closeModal()')}${own?b('Editar',`closeModal();companyForm('${id}')`,'primary'):''}</div>`)};
const priorHome=home;
home=function(){let h=priorHome();if(sub!=='overview')return h;
 const m=state.market||{day:0,leads:[]};const n=m.leads.filter(x=>x.company===state.active&&x.status==='new').length;
 const block=card(`<div class="row"><div><strong>🌐 Mercado empresarial</strong><p class="hint">${n} solicitações novas · ciclo ${m.day} · ${esc(company().sector)}</p></div>${b('Abrir mercado',"switchTab('market')",'primary small')}</div><div class="row" style="margin-top:12px">${b('Avançar ciclo',"advanceMarket();switchTab('market')",'secondary small')}${b('Ver operações',"switchTab('process')",'secondary small')}</div>`,'market-feature');
 return block+h;
};
const priorModule=moduleView;
moduleView=function(){if(sub==='market')return window.marketBoard();return priorModule();};
const priorRender=render;
render=function(){priorRender();let action=document.getElementById('master-market-shortcut');if(!action){const header=document.querySelector('.header-actions');if(header){action=document.createElement('button');action.id='master-market-shortcut';action.className='iconbtn market-shortcut';action.textContent='🌐 Mercado';action.onclick=()=>{navTo('home');switchTab('market')};header.prepend(action)}}};
const originalOpenVenture=openVenture;
openVenture=function(e){originalOpenVenture(e);let c=company();if(c?.owner){c.owned=true;save();}};
save();render();
})();
