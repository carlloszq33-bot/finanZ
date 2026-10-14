/* finanZ Pro • Central de mensagens e negociação simulada. Sem rede e sem IA generativa. */
(function(){
'use strict';
const MIN_DELAY=30000,MAX_DELAY=65000;
const safeId=s=>String(s).replace(/[^a-zA-Z0-9_-]/g,'');
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const getTx=id=>state.tx.find(t=>t.id===id&&t.company===state.active);
function data(){state.inbox=state.inbox||{threads:{},agents:{}};return state.inbox}
function agent(t){const k=t.company+'|'+t.kind+'|'+t.name;let a=data().agents[k];if(!a){let h=0;for(let c of k)h=(h*31+c.charCodeAt(0))>>>0;a={liquidity:15+h%80,flexibility:8+(h>>>3)%38,trust:35+(h>>>5)%55,urgency:15+(h>>>7)%75};data().agents[k]=a;save()}return a}
function thread(t){let d=data().threads[t.id];if(!d){d={txid:t.id,company:t.company,kind:t.kind,party:t.name,messages:[],pending:null,offer:null,unread:0};data().threads[t.id]=d;save()}return d}
function add(d,from,body){d.messages.push({from,body,at:Date.now()});if(from==='party')d.unread++;save()}
function moneyMention(s){let m=s.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(mil|k)?/i);if(!m)return null;let n=Number(m[1].replace(/\./g,'').replace(',','.'));if(m[2])n*=1000;return Number.isFinite(n)?n:null}
function interpret(msg,t,d){const s=norm(msg),a=agent(t),balance=t.value;
const hello=/^(oi|ola|opa|bom dia|boa tarde|boa noite|e ai|eae|salve)[!.,\s]*$/.test(s.trim());
if(hello)return {text:'Olá! Tudo bem? Aqui é o atendimento de '+t.name+'. Em que posso ajudar?',offer:null};
if(/(obrigad|valeu|ate logo|tchau|deixa pra la|mant(er|emos)|dia acordado|vencimento original)/.test(s))return {text:'Combinado. Mantemos as condições já registradas. Ficamos à disposição.',offer:null,clear:true};
if(/(como.*caixa|precisando de dinheiro|precisa.*receber|situacao financeira)/.test(s))return {text:a.urgency>55?'Temos compromissos próximos e antecipações podem nos ajudar, dependendo das condições.':'Nosso planejamento está equilibrado. Podemos analisar uma proposta, mas sem obrigação de aceitar.',offer:null};
const numbers=[...s.matchAll(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(mil|k)?/g)].map(m=>{let n=Number(m[1].replace(/\./g,'').replace(',','.'));return m[2]?n*1000:n});
const percentage=s.match(/(\d{1,2}(?:[,.]\d+)?)\s*%/);
const isOffer=/(pago|pagar|antecip|adiant|proponho|proposta|negoci|desconto|parcel|quita|receb|transfer)/.test(s);
if(isOffer){let partial=numbers.find(n=>n>=1&&n<=balance);let discount=percentage?Number(percentage[1].replace(',','.')):0;
if(discount>0&&discount<=100){let acceptable=Math.max(0,Math.min(12,(a.flexibility/7)+(a.urgency>65?2:0)-(a.liquidity>65?2:0)));
if(discount>acceptable)return {text:`Entendo sua proposta, mas ${discount}% de desconto não é viável para nós neste momento. Podemos manter o vencimento ou conversar sobre outra condição.`,offer:null,clear:true};
return {text:`Podemos considerar ${discount}% de desconto sobre o saldo em aberto (${money(balance)}). Para ter validade, confirme a proposta no botão Formalizar acordo.`,offer:{kind:'discount',percent:discount}}}
if(partial&&partial<balance&&/(antecip|adiant|hoje|parcial|pago|pagar|transfer)/.test(s)){
let accept=a.urgency>40||a.liquidity<40;
return accept?{text:`Receber ${money(partial)} agora pode ser interessante. O restante de ${money(balance-partial)} permanece devido nas condições atuais. Podemos formalizar esse pagamento parcial.`,offer:{kind:'partial',amount:partial}}:{text:`Obrigado pela oferta de ${money(partial)}. No momento preferimos receber ${money(balance)} no vencimento combinado.`,offer:null,clear:true};}
if(/parcel/.test(s))return {text:a.flexibility>20?'Podemos avaliar um parcelamento. Informe o valor de entrada e a data pretendida. Nenhum prazo muda sem formalização.':'Nossa política atual não permite parcelar este título. Podemos discutir o vencimento.',offer:null};
return {text:'Recebi sua proposta. Para avaliá-la, preciso de um valor e das condições de pagamento. A decisão dependerá das nossas necessidades.',offer:null};}
if(/(vencimento|prazo|data)/.test(s))return {text:'O vencimento registrado é '+fmt(t.due)+'. Podemos analisar solicitações de alteração, sem garantia de aprovação.',offer:null};
if(/(sim|concordo|aceito|fechado|combinado)/.test(s)&&d.offer)return {text:'Podemos seguir com a proposta. Use “Formalizar acordo” para registrar a decisão. A conversa, sozinha, não movimenta dinheiro.',offer:d.offer};
return {text:'Entendi sua mensagem. Pode detalhar o que pretende em relação ao título de '+money(balance)+'? Vou avaliar dentro das nossas condições.',offer:null};
}
function processDue(){let changed=false;for(const d of Object.values(data().threads)){if(!d.pending||Date.now()<d.pending.due)continue;let t=state.tx.find(x=>x.id===d.txid&&x.company===d.company);if(!t){d.pending=null;continue}let answer=interpret(d.pending.text,t,d);d.pending=null;if(answer.clear)d.offer=null;if(answer.offer)d.offer=answer.offer;add(d,'party',answer.text);changed=true}if(changed){save();if(document.getElementById('inbox-panel'))window.openInbox(window.inboxSelected||'');updateBadge()}}
function updateBadge(){let n=Object.values(data().threads).filter(d=>d.company===state.active).reduce((a,d)=>a+d.unread,0);let el=document.getElementById('inbox-count');if(el)el.textContent=n?' '+n:''}
window.openInbox=function(id=''){processDue();const list=Object.values(data().threads).filter(d=>d.company===state.active).sort((a,b)=>(b.messages.at(-1)?.at||0)-(a.messages.at(-1)?.at||0));let t=id?getTx(id):null;if(t)thread(t);let selected=t?thread(t):list[0];window.inboxSelected=selected?.txid||'';if(selected){selected.unread=0;save()}
const sidebar=(t?Object.values(data().threads).filter(d=>d.company===state.active):list).map(d=>`<button class="inbox-thread ${selected?.txid===d.txid?'selected':''}" onclick="openInbox('${safeId(d.txid)}')"><strong>${esc(d.party)}</strong><small>${d.kind==='pay'?'Fornecedor':'Cliente'} · ${d.unread?'● Nova mensagem':'Conversa'}</small></button>`).join('');
const history=selected?selected.messages.map(m=>`<div class="chat-bubble ${m.from==='me'?'mine':'theirs'}"><small>${m.from==='me'?'Você':esc(selected.party)} · ${new Date(m.at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</small><div>${esc(m.body)}</div></div>`).join(''):'<p class="hint">Abra um título em Contas a Pagar ou Receber e toque em Conversar.</p>';
const pending=selected?.pending?'<p class="chat-wait">⏳ Aguardando resposta simulada...</p>':'';
const agreement=selected?.offer?`<div class="chat-offer"><b>Proposta em análise</b><p>${selected.offer.kind==='partial'?'Pagamento parcial de '+money(selected.offer.amount):'Desconto de '+selected.offer.percent+'% no saldo'}</p>${b('Formalizar acordo',`inboxFormalize('${safeId(selected.txid)}')`,'primary small')} ${b('Descartar','inboxDiscard()','secondary small')}</div>`:'';
modal(`<div id="inbox-panel"><div class="row"><div><h2>✉ Central de mensagens</h2><p class="hint">Conversas simuladas • ${esc(company().name)}</p></div>${b('Fechar','closeModal()','secondary small')}</div><div class="inbox-layout"><div class="inbox-list">${sidebar||'<p class="hint">Nenhuma conversa.</p>'}</div><div class="inbox-chat"><div class="chat-scroll" id="chat-scroll">${history}${pending}</div>${agreement}${selected?`<form onsubmit="inboxSend(event,'${safeId(selected.txid)}')"><label>Mensagem livre</label><textarea id="inbox-text" rows="3" maxlength="1200" required placeholder="Ex.: Opa! Tenho dois mil para adiantar hoje. Podemos negociar?"></textarea><button class="primary full" type="submit" ${selected.pending?'disabled':''}>Enviar mensagem</button></form>`:''}</div></div><p class="hint">Respostas locais baseadas em regras e condições do fornecedor. Não é IA generativa nem contato real.</p></div>`);
const scroll=document.getElementById('chat-scroll');if(scroll)scroll.scrollTop=scroll.scrollHeight;updateBadge()};
window.inboxSend=function(e,id){e.preventDefault();processDue();let t=getTx(id);if(!t)return toast('Título indisponível');let d=thread(t);if(d.pending)return toast('Aguarde a resposta');let msg=document.getElementById('inbox-text').value.trim();if(!msg)return;add(d,'me',msg);let delay=MIN_DELAY+Math.floor(Math.random()*(MAX_DELAY-MIN_DELAY));d.pending={text:msg,due:Date.now()+delay};save();openInbox(id)};
window.inboxDiscard=function(){let d=data().threads[window.inboxSelected];if(d){d.offer=null;save();openInbox(d.txid)}};
window.inboxFormalize=function(id){let t=getTx(id),d=data().threads[id];if(!t||!d?.offer||t.status!=='open')return toast('Proposta indisponível');let o=d.offer;
if(o.kind==='partial'){if(t.kind==='pay'&&balance()<o.amount)return toast('Saldo insuficiente para antecipar');if(!(o.amount>0&&o.amount<t.value))return toast('Valor parcial inválido');
const paidTx={...t,id:uid(),value:Math.round(o.amount*100)/100,status:'paid',paid:today(),category:t.category,created:today(),workflow:[]};delete paidTx.pendingOffer;state.tx.push(paidTx);t.value=Math.round((t.value-o.amount)*100)/100;state.bank.push({id:uid(),company:state.active,date:today(),description:`Pagamento parcial negociado: ${t.name}`,value:t.kind==='pay'?-o.amount:o.amount,txid:null});
}else if(o.kind==='discount'){t.value=Math.round(t.value*(1-o.percent/100)*100)/100}
add(d,'me','Acordo formalizado no sistema.');t.workflow=t.workflow||[];t.workflow.unshift({date:today(),type:'Acordo por mensagem',detail:o.kind==='partial'?'Pagamento parcial registrado; saldo remanescente '+money(t.value):'Desconto formalizado; saldo atualizado '+money(t.value)});d.offer=null;save();openInbox(id);render();toast('Acordo registrado e valores atualizados')};
const oldDetail=transactionDetail;transactionDetail=function(id){oldDetail(id);const t=getTx(id);if(!t)return;const el=document.querySelector('#modalroot .modal');if(el){let button=document.createElement('button');button.className='secondary full';button.style.marginTop='12px';button.textContent='✉ Conversar com '+(t.kind==='pay'?'fornecedor':'cliente');button.onclick=()=>openInbox(id);el.append(button)}};
window.supplierMessage=function(id){openInbox(id)};
const oldRender=render;render=function(){oldRender();updateBadge()};
setInterval(processDue,1500);
})();
