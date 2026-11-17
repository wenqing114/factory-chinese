import { segment } from 'pinyin-pro'
import grammarLessons from '../data/grammarData.js'

(()=>{'use strict';
const DATA=window.STUDY_DATA, BASE_WORDS=DATA.words,W=[...BASE_WORDS],S=DATA.sentences,KEY='te-chinese-progress-v1',VOICE_KEY='te-chinese-voice-v2',VOICE_STYLE_KEY='te-chinese-voice-style-v1',CUSTOM_SENTENCES_KEY='te-chinese-custom-sentences-v1',CUSTOM_WORDS_KEY='te-chinese-custom-words-v1',WORD_SETS_KEY='te-chinese-word-sets-v1';
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY))||{}}catch{}
let progress={known:{},difficult:{},attempts:0,correct:0,history:[],...saved};
function normalizeGrammarProgress(value){if(value==null)return {attempts:0,correct:0,completed:[]};if(!value||typeof value!=='object'||Array.isArray(value)){alert('Không đọc được tiến độ ngữ pháp. Tiến độ ngữ pháp sẽ được đặt lại.');return {attempts:0,correct:0,completed:[]}}const attempts=Math.max(0,Number(value.attempts)||0),correct=Math.min(attempts,Math.max(0,Number(value.correct)||0));return {attempts,correct,completed:Array.isArray(value.completed)?[...new Set(value.completed.filter(id=>grammarLessons.some(lesson=>lesson.id===id)))]:[]}}
let grammarProgress=normalizeGrammarProgress(progress.grammar);
function loadCustomWords(){try{const value=JSON.parse(localStorage.getItem(CUSTOM_WORDS_KEY)||'[]');return Array.isArray(value)?value.filter(word=>word&&typeof word.id==='string'&&typeof word.hanzi==='string'&&typeof word.pinyin==='string'&&typeof word.pos==='string'&&typeof word.meaning==='string'&&typeof word.category==='string'):[]}catch{alert('Không đọc được danh sách từ tự thêm. Dữ liệu cũ vẫn được giữ nguyên.');return []}}
let customWords=loadCustomWords();
W.push(...customWords);
const names={home:'🏠 Tổng quan',words:'📚 Từ vựng',flash:'🗂️ Flashcard',listen:'🎧 Nghe chọn đáp án',choice:'✅ Trắc nghiệm',type:'⌨️ Luyện gõ',match:'🧩 Ghép cặp',sentences:'💬 Luyện câu',grammar:'📖 Ngữ pháp',review:'🔖 Ôn từ khó',stats:'📊 Thống kê & sao lưu'};
const AZURE_VOICES=[
 {id:'azure:zh-CN-Xiaoxiao:DragonHDFlashLatestNeural',name:'Xiaoxiao Dragon HD Flash',voice:'zh-CN-Xiaoxiao:DragonHDFlashLatestNeural',locale:'zh-CN'},
 {id:'azure:zh-CN-Yunyi:DragonHDFlashLatestNeural',name:'Yunyi Dragon HD Flash',voice:'zh-CN-Yunyi:DragonHDFlashLatestNeural',locale:'zh-CN'}
];
const $=id=>document.getElementById(id),app=$('app');let page='home',filter='all',index=0,flipped=false,quiz=null,matching=null,search='',category='all',onlyHard=false,selectedSetId=null,addingToSet=false,activeWordIds=null,practiceMode=null,practiceSession=null,selectedSentenceSetKey=null,selectedGrammarId=null,grammarQuiz=null,controlKeyPressed=false,controlKeyUsed=false,matchLoopTimer=null,matchLoopMode='stop';
let voiceURI=AZURE_VOICES[0].id;try{voiceURI=localStorage.getItem(VOICE_KEY)||voiceURI}catch{}
const voiceStyles={natural:{rate:.94,pitch:1.03},expressive:{rate:.96,pitch:1.08},clear:{rate:.8,pitch:1}};
let voiceStyle='natural';try{const storedStyle=localStorage.getItem(VOICE_STYLE_KEY);if(voiceStyles[storedStyle])voiceStyle=storedStyle}catch{}
function loadCustomSentences(){try{const value=JSON.parse(localStorage.getItem(CUSTOM_SENTENCES_KEY)||'[]');return Array.isArray(value)?value.filter(s=>s&&typeof s.id==='string'&&typeof s.hanzi==='string'&&typeof s.pinyin==='string'&&typeof s.meaning==='string'):[]}catch{alert('Không đọc được danh sách câu tự thêm. Dữ liệu cũ vẫn được giữ nguyên.');return []}}
let customSentences=loadCustomSentences();
const sentenceList=()=>[...S,...customSentences],allItems=()=>[...W,...sentenceList()];
function sentenceCreatedDate(sentence){
 const storedDate=typeof sentence.createdAt==='string'?new Date(sentence.createdAt):null;
 if(storedDate&&!Number.isNaN(storedDate.getTime()))return storedDate;
 const legacyTimestamp=/^custom-(\d+)-/.exec(sentence.id)?.[1];
 if(!legacyTimestamp)return null;
 const legacyDate=new Date(Number(legacyTimestamp));
 return Number.isNaN(legacyDate.getTime())?null:legacyDate
}
function localDateKey(date){
 return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}
function customWordDate(word){
 const storedDate=typeof word.createdAt==='string'?new Date(word.createdAt):null;
 if(storedDate&&!Number.isNaN(storedDate.getTime()))return storedDate;
 const legacyTimestamp=/^custom-word-(\d+)-/.exec(word.id)?.[1];
 if(!legacyTimestamp)return null;
 const legacyDate=new Date(Number(legacyTimestamp));
 return Number.isNaN(legacyDate.getTime())?null:legacyDate
}
function customWordTimestamp(word){return customWordDate(word)?.getTime()||0}
function customSentenceTimestamp(sentence){
 return sentenceCreatedDate(sentence)?.getTime()||0
}
function loadWordSets(){try{const value=JSON.parse(localStorage.getItem(WORD_SETS_KEY)||'[]');if(!Array.isArray(value)||!value.every(set=>set&&typeof set.id==='string'&&typeof set.name==='string'&&Array.isArray(set.wordIds)&&set.wordIds.every(id=>typeof id==='string')))throw new Error('Dữ liệu bộ từ không hợp lệ.');return value.map(set=>({...set,wordIds:[...new Set(set.wordIds.filter(id=>W.some(word=>word.id===id)))]}))}catch(error){alert(`Không đọc được các bộ từ đã lưu: ${error instanceof Error?error.message:'dữ liệu không hợp lệ'}. Dữ liệu cũ vẫn được giữ nguyên.`);return []}}
let customWordSets=loadWordSets();
let chineseVoices=[],activeAzureAudio=null,activeAzureAudioUrl='',activeAzureAudioCancel=null,speechRequestId=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>[...a].sort(()=>Math.random()-.5),pick=(a,n)=>shuffle(a).slice(0,n);
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(progress))}catch{alert('Không lưu được dữ liệu trên trình duyệt.')}};
function saveGrammarProgress(next){progress={...progress,grammar:next};persist();grammarProgress=next;return true}
const catOpts=()=>['all',...new Set(W.map(x=>x.category))].map(c=>`<option value="${esc(c)}" ${category===c?'selected':''}>${c==='all'?'Tất cả chủ đề':esc(c)}</option>`).join('');
const pool=()=>W.filter(w=>(category==='all'||w.category===category)&&(!onlyHard||progress.difficult[w.id])&&(!activeWordIds||activeWordIds.includes(w.id)));
function saveWordSets(next){try{localStorage.setItem(WORD_SETS_KEY,JSON.stringify(next));customWordSets=next;return true}catch(error){alert(`Không lưu được bộ từ trên trình duyệt: ${error instanceof Error?error.message:'hãy kiểm tra dung lượng lưu trữ.'}`);return false}}
function saveCustomWords(next){try{localStorage.setItem(CUSTOM_WORDS_KEY,JSON.stringify(next));customWords=next;W.splice(0,W.length,...BASE_WORDS,...next);return true}catch(error){alert(`Không lưu được từ mới trên trình duyệt: ${error instanceof Error?error.message:'hãy kiểm tra dung lượng lưu trữ.'}`);return false}}
function saveCustomWord(text,meaning,pos){
 const createdAt=new Date().toISOString(),word={id:`custom-word-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,hanzi:text,pinyin:segment(text,{format:6}).replace(/\s+([，。！？；：,.!?;:])/g,'$1').trim(),pos:pos||'词语',meaning,category:'Từ tự thêm',createdAt};
 return saveCustomWords([...customWords,word])?word:null
}
function wordSetList(){
 const grouped=new Map();
 const datedWords=[...BASE_WORDS.filter(word=>word.createdAt),...customWords];
 datedWords.forEach(word=>{const date=customWordDate(word),key=date?localDateKey(date):'undated';if(!grouped.has(key))grouped.set(key,{id:`day:${key}`,name:date?`Ngày ${new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}).format(date)}`:'Ngày chưa xác định',date,wordIds:[],automatic:true,daily:true});grouped.get(key).wordIds.push(word.id)});
 const dailySets=[...grouped.values()].sort((a,b)=>(b.date?.getTime()||0)-(a.date?.getTime()||0)||b.id.localeCompare(a.id));
 dailySets.forEach(set=>set.wordIds.sort((a,b)=>customWordTimestamp(datedWords.find(word=>word.id===b))-customWordTimestamp(datedWords.find(word=>word.id===a))));
 const categories=[...new Set(BASE_WORDS.map(word=>word.category))].map(name=>({id:`category:${name}`,name,category:name,wordIds:BASE_WORDS.filter(word=>word.category===name).map(word=>word.id),automatic:true}));
 return [...dailySets,...customWordSets.map(set=>({...set,wordIds:set.wordIds.filter(id=>W.some(word=>word.id===id)),automatic:false})),...categories]
}
function selectedWordSet(){return wordSetList().find(set=>set.id===selectedSetId)}
function openWordSet(id){selectedSetId=id;addingToSet=false;search='';words()}
function createWordSet(name){const clean=name.trim().replace(/\s+/g,' ');if(clean.length<2||clean.length>40){alert('Tên bộ từ cần có từ 2 đến 40 ký tự.');return false}if(customWordSets.some(set=>set.name.localeCompare(clean,undefined,{sensitivity:'accent'})===0)){alert('Đã có bộ từ cùng tên. Hãy chọn tên khác.');return false}const next=[...customWordSets,{id:`custom-set-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name:clean,wordIds:[]}];if(!saveWordSets(next))return false;return true}
function updateVoices(){
 const isMandarin=v=>/^(?:zh-(?:cn|sg|tw|hans|hant)(?:-|$)|cmn(?:-|$))/i.test(v.lang);
 const rank=v=>(/^zh-cn\b/i.test(v.lang)?0:/^zh-sg\b/i.test(v.lang)?10:/^zh-tw\b/i.test(v.lang)?20:30)+(/natural|neural|premium|enhanced/i.test(v.name)?0:1);
 chineseVoices='speechSynthesis'in window?speechSynthesis.getVoices().filter(isMandarin).sort((a,b)=>rank(a)-rank(b)||a.name.localeCompare(b.name)):[];
 const select=$('voiceSelect'),status=$('voiceStatus');if(!select||!status)return;
 const choices=[...AZURE_VOICES.map(v=>v.id),...chineseVoices.map(v=>v.voiceURI)];
 if(!choices.includes(voiceURI))voiceURI=AZURE_VOICES[0].id;
 const azureOptions=AZURE_VOICES.map(v=>`<option value="${esc(v.id)}">${esc(v.name)}</option>`).join('');
 const deviceOptions=chineseVoices.map(v=>`<option value="${esc(v.voiceURI)}">${esc(v.name)} (${esc(v.lang)})</option>`).join('');
 select.innerHTML=`<optgroup label="Microsoft Azure">${azureOptions}</optgroup>${deviceOptions?`<optgroup label="Giọng trên thiết bị">${deviceOptions}</optgroup>`:''}`;
 select.value=voiceURI;select.disabled=false;
 const azureVoice=AZURE_VOICES.find(v=>v.id===voiceURI);
 if(azureVoice)status.textContent=`Đang chọn ${azureVoice.name}. Nhấn ▶ để thử; cần Azure Speech được cấu hình trên máy chủ.`;
 else{const voice=chineseVoices.find(v=>v.voiceURI===voiceURI);status.textContent=voice?`Đang dùng ${voice.name} (${voice.lang}); chất giọng phụ thuộc thiết bị.`:'Chưa có giọng Mandarin trên thiết bị.'}
}
function cancelSpeech(){
 speechRequestId++;
 if('speechSynthesis'in window)speechSynthesis.cancel();
 if(activeAzureAudioCancel)activeAzureAudioCancel();
 else if(activeAzureAudio){activeAzureAudio.pause();activeAzureAudio.removeAttribute('src');activeAzureAudio.load();if(activeAzureAudioUrl)URL.revokeObjectURL(activeAzureAudioUrl);activeAzureAudio=null;activeAzureAudioUrl=''}
}
async function speakAzure(text,voice,slow,style,requestId){
 const status=$('voiceStatus');
 status.textContent=`Đang tạo âm thanh bằng ${voice.name}…`;
 try{
  const response=await fetch('/api/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,voice:voice.voice})});
  if(requestId!==speechRequestId)return false;
  if(!response.ok){
   let message=`Máy chủ trả về HTTP ${response.status}.`;
   try{const result=await response.json();if(typeof result.error==='string')message=result.error}catch{}
   throw new Error(message)
  }
  const blob=await response.blob();
  if(!blob.type.startsWith('audio/'))throw new Error('Máy chủ không trả về dữ liệu âm thanh.');
  if(requestId!==speechRequestId)return false;
  const url=URL.createObjectURL(blob),audio=new Audio(url);
  audio.playbackRate=slow?Math.min(style.rate,.72):style.rate;
  return await new Promise(resolve=>{
   let settled=false;
   const finish=(played,message='')=>{
    if(settled)return;
    settled=true;
    if(activeAzureAudio===audio){activeAzureAudio=null;activeAzureAudioUrl='';activeAzureAudioCancel=null}
    URL.revokeObjectURL(url);
    if(message&&requestId===speechRequestId)status.textContent=message;
    resolve(played)
   };
   activeAzureAudio=audio;activeAzureAudioUrl=url;activeAzureAudioCancel=()=>{audio.pause();audio.removeAttribute('src');audio.load();finish(false)};
   audio.onended=()=>finish(true,`Đã đọc bằng ${voice.name}.`);
   audio.onerror=()=>finish(false,'Không phát được tệp âm thanh Azure.');
   audio.play().catch(error=>finish(false,`Không phát được âm thanh (${error instanceof Error?error.message:'lỗi trình phát'}).`))
  })
 }catch(error){
  if(requestId===speechRequestId)status.textContent=`Không phát được giọng Azure: ${error instanceof Error?error.message:'lỗi không xác định'}`;
  return false
 }
}
function speak(text,slow=false){
 cancelSpeech();const requestId=++speechRequestId,azureVoice=AZURE_VOICES.find(v=>v.id===voiceURI),style=voiceStyles[voiceStyle];
 if(azureVoice)return speakAzure(text,azureVoice,slow,style,requestId);
 if(!('speechSynthesis'in window)){const status=$('voiceStatus');if(status)status.textContent='Trình duyệt không hỗ trợ giọng đọc trên thiết bị.';return Promise.resolve(false)}
 updateVoices();const voice=chineseVoices.find(v=>v.voiceURI===voiceURI);
 if(!voice){$('voiceStatus').textContent='Không tìm thấy giọng tiếng Trung trên thiết bị. Hãy chọn một giọng Azure hoặc cài giọng Mandarin.';return Promise.resolve(false)}
 const u=new SpeechSynthesisUtterance(text);u.voice=voice;u.lang=voice.lang;u.rate=slow?Math.min(style.rate,.72):style.rate;u.pitch=style.pitch;u.volume=1;
 return new Promise(resolve=>{
  let settled=false;
  const finish=played=>{if(settled)return;settled=true;resolve(played)};
  u.onstart=()=>{$('voiceStatus').textContent=`Đang đọc bằng ${voice.name} (${voice.lang})…`};
  u.onend=()=>{updateVoices();finish(true)};
  u.onerror=e=>{if(e.error!=='canceled'&&e.error!=='interrupted')$('voiceStatus').textContent=`Không phát được âm thanh (${e.error}). Hãy thử chọn giọng khác.`;finish(false)};
  try{speechSynthesis.speak(u)}catch(error){$('voiceStatus').textContent=`Không phát được âm thanh (${error instanceof Error?error.message:'lỗi âm thanh'}).`;finish(false)}
 })
}
async function playAnswerSound(correct){
 const AudioContextClass=window.AudioContext||window.webkitAudioContext;
 if(!AudioContextClass)return 'Trình duyệt không hỗ trợ phát âm báo đúng/sai.';
 let context;
 try{
  context=new AudioContextClass();await context.resume();
  const oscillator=context.createOscillator(),gain=context.createGain(),now=context.currentTime;
  oscillator.type='sine';gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.16,now+.025);
  if(correct){oscillator.frequency.setValueAtTime(587.33,now);oscillator.frequency.setValueAtTime(783.99,now+.11);oscillator.frequency.setValueAtTime(1046.5,now+.22);gain.gain.setValueAtTime(.16,now+.29);gain.gain.exponentialRampToValueAtTime(.0001,now+.48);oscillator.start(now);oscillator.stop(now+.49)}
  else{oscillator.frequency.setValueAtTime(330,now);oscillator.frequency.exponentialRampToValueAtTime(196,now+.24);gain.gain.exponentialRampToValueAtTime(.0001,now+.3);oscillator.start(now);oscillator.stop(now+.31)}
  oscillator.connect(gain);gain.connect(context.destination);
  await new Promise(resolve=>{oscillator.onended=resolve});
  await context.close();
  return ''
 }catch(error){
  if(context&&context.state!=='closed')try{await context.close()}catch{}
  return `Không phát được âm báo (${error instanceof Error?error.message:'lỗi âm thanh'}).`
 }
}
const practicePages=['flash','listen','choice','type','match'];
function clearMatchLoopTimer(){if(matchLoopTimer!==null){clearTimeout(matchLoopTimer);matchLoopTimer=null}}
function startPractice(mode,wordIds){
 const ids=[...new Set(wordIds)].filter(id=>W.some(word=>word.id===id));
 if(!ids.length){alert('Bộ từ này chưa có từ để luyện.');return}
 clearMatchLoopTimer();
 cancelSpeech();
 page=mode;practiceMode=mode;activeWordIds=ids;practiceSession={mode,wordIds:shuffle(ids),offset:0,score:0,loopMode:mode==='match'?matchLoopMode:'stop'};
 category='all';onlyHard=false;index=0;flipped=false;quiz=null;matching=null;selectedSetId=null;addingToSet=false;
 document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===mode));
 render();if(mode==='flash')$('flash')?.focus({preventScroll:true})
}
function setPage(p,wordIds=null){
 clearMatchLoopTimer();
 selectedSentenceSetKey=null;
 selectedGrammarId=null;grammarQuiz=null;
 if(practicePages.includes(p)){
  if(Array.isArray(wordIds)){startPractice(p,wordIds);return}
  cancelSpeech();
  page='chooseSet';practiceMode=p;activeWordIds=null;practiceSession=null;selectedSetId=null;addingToSet=false;quiz=null;matching=null;category='all';onlyHard=false;
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===p));render();return
 }
 cancelSpeech();
 page=p;practiceMode=null;practiceSession=null;activeWordIds=Array.isArray(wordIds)?[...wordIds]:null;selectedSetId=null;addingToSet=false;index=0;flipped=false;quiz=null;matching=null;
 document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===p));render()
}
function choosePracticeSet(){
 const sets=wordSetList(),activity=names[practiceMode]?.replace(/^\S+\s/,'')||'Luyện tập';
 const description=practiceMode==='flash'?'Flashcard sẽ lần lượt đưa bạn qua toàn bộ từ trong bộ đã chọn.':practiceMode==='match'?'Mỗi lượt ghép 5 cặp. Có thể bật lặp lại bộ từ ngay trên màn hình làm bài.':'Mỗi lượt tối đa 20 từ. Nếu bộ có nhiều hơn, hãy tiếp tục các lượt sau cho đến khi luyện hết.';
 const action=practiceMode==='flash'?'Ôn toàn bộ từ →':practiceMode==='match'?'Ghép 5 cặp →':'Bắt đầu luyện tập →';
 app.innerHTML=`<section class="practice-picker"><div class="practice-picker-heading"><span class="vocab-eyebrow">CHỌN BỘ TỪ</span><h3>${esc(activity)}</h3><p>${description}</p></div><div class="practice-set-grid">${sets.map(set=>`<button type="button" class="practice-set-card" data-practice-set="${esc(set.id)}" ${set.wordIds.length?'':'disabled'}><span class="vocab-set-kind">${set.daily?'BỘ TỪ THEO NGÀY':set.automatic?'BỘ THEO CHỦ ĐỀ':'BỘ CỦA BẠN'}</span><strong>${esc(set.name)}</strong><span class="vocab-set-count">${set.wordIds.length} từ</span><span class="practice-set-action">${set.wordIds.length?action:'Chưa có từ'}</span></button>`).join('')}</div><button id="cancelPractice" class="outline">← Quay lại</button></section>`;
 app.querySelectorAll('[data-practice-set]').forEach(button=>button.onclick=()=>{const set=sets.find(item=>item.id===button.dataset.practiceSet);if(set)startPractice(practiceMode,set.wordIds)});
 $('cancelPractice').onclick=()=>setPage('home')
}
function filters(){return `<div class="toolbar"><select id="cat">${catOpts()}</select><label class="badge"><input id="hardOnly" type="checkbox" ${onlyHard?'checked':''}> Chỉ từ khó</label></div>`}
function wireFilters(cb){
 const reset=()=>{index=0;quiz=null;matching=null;if(practiceSession&&['listen','choice','type','match'].includes(page))practiceSession={mode:page,wordIds:shuffle(pool().map(word=>word.id)),offset:0,score:0,...(page==='match'?{loopMode:practiceSession.loopMode||'stop'}:{})};cb()};
 $('cat')?.addEventListener('change',e=>{category=e.target.value;reset()});
 $('hardOnly')?.addEventListener('change',e=>{onlyHard=e.target.checked;reset()})
}
function toggleKnown(id){progress.known[id]=!progress.known[id];persist();render()}
function toggleHard(id){progress.difficult[id]=!progress.difficult[id];persist();render()}
function cardButtons(w){return `<button class="outline small" data-speak="${esc(w.id)}">🔊 Nghe</button><button class="outline small" data-known="${esc(w.id)}">${progress.known[w.id]?'✓ Đã thuộc':'Đánh dấu thuộc'}</button><button class="outline small" data-hard="${esc(w.id)}">${progress.difficult[w.id]?'★ Từ khó':'☆ Từ khó'}</button>`}
function bindActions(){app.querySelectorAll('[data-speak]').forEach(b=>b.onclick=()=>{let w=allItems().find(x=>x.id===b.dataset.speak);if(w)speak(w.hanzi)});app.querySelectorAll('[data-known]').forEach(b=>b.onclick=()=>toggleKnown(b.dataset.known));app.querySelectorAll('[data-hard]').forEach(b=>b.onclick=()=>toggleHard(b.dataset.hard))}
const artwork={
 clipboard:'<rect class="art-base" x="30" y="23" width="70" height="84" rx="12"/><rect class="art-paper" x="39" y="34" width="52" height="62" rx="5"/><path class="art-line" d="M49 51h31M49 62h22"/><path class="art-accent" d="m49 78 7 7 15-16"/><rect class="art-detail" x="49" y="18" width="31" height="13" rx="6"/>',
 caliper:'<path class="art-line" d="M30 46h72M43 37v18m18-9v15m18-15v9m18-9v15"/><path class="art-base" d="M38 43v-17h11v28H38m47-8v-9h12v24H85"/><circle class="art-accent" cx="70" cy="82" r="13"/><path class="art-line" d="M70 74v9l6 4"/>',
 approve:'<path class="art-base" d="M29 37q0-12 13-12h43q13 0 13 12v31q0 12-13 12H59L42 94V80q-13 0-13-12z"/><path class="art-paper" d="M45 48h36M45 59h21"/><path class="art-accent" d="m61 68 7 7 14-16"/>',
 warning:'<path class="art-base" d="M64 24 105 96H23z"/><path class="art-line" d="M64 47v23"/><circle class="art-accent" cx="64" cy="82" r="3"/>',
 wrench:'<path class="art-base" d="M89 25a27 27 0 0 0-33 33L29 85a12 12 0 0 0 17 17l27-27a27 27 0 0 0 33-33L91 57 74 40z"/><circle class="art-paper" cx="39" cy="92" r="5"/>',
 machine:'<rect class="art-base" x="29" y="27" width="74" height="72" rx="12"/><rect class="art-paper" x="39" y="38" width="54" height="37" rx="6"/><path class="art-line" d="M49 86h34"/><circle class="art-accent" cx="83" cy="86" r="4"/><path class="art-line" d="M52 56h27m-13-12v24"/>',
 printer:'<path class="art-base" d="M42 25h48v24H42zM35 49h62q9 0 9 9v24H89v17H43V82H26V58q0-9 9-9z"/><path class="art-paper" d="M49 75h38v20H49z"/><path class="art-line" d="M51 34h30m-25 48h25"/><circle class="art-accent" cx="91" cy="62" r="4"/>',
 computer:'<rect class="art-base" x="25" y="25" width="78" height="54" rx="9"/><rect class="art-paper" x="33" y="33" width="62" height="38" rx="4"/><path class="art-accent" d="m48 55 9 8 20-20"/><path class="art-line" d="M64 80v14m-18 4h36"/>',
 server:'<rect class="art-base" x="34" y="20" width="62" height="91" rx="10"/><rect class="art-paper" x="42" y="29" width="46" height="21" rx="5"/><rect class="art-paper" x="42" y="56" width="46" height="21" rx="5"/><rect class="art-paper" x="42" y="83" width="46" height="19" rx="5"/><circle class="art-accent" cx="51" cy="40" r="3"/><circle class="art-accent" cx="51" cy="67" r="3"/><circle class="art-accent" cx="51" cy="92" r="3"/>',
 circuit:'<rect class="art-base" x="28" y="28" width="75" height="75" rx="10"/><rect class="art-paper" x="53" y="51" width="26" height="28" rx="5"/><path class="art-line" d="M65 51V38H43V28m36 48h14v14h10M53 65H41V51H28m38 28v13H50v11"/><circle class="art-accent" cx="43" cy="38" r="4"/><circle class="art-accent" cx="93" cy="93" r="4"/>',
 box:'<path class="art-base" d="m29 43 37-20 38 20v47l-38 20-37-20z"/><path class="art-line" d="m29 43 37 21 38-21M66 64v46"/><path class="art-accent" d="m53 36 37 21v17L53 53z"/>',
 factory:'<path class="art-base" d="M25 101V57l27 16V52l27 17V42h29v59z"/><path class="art-paper" d="M88 51h12v14H88z"/><path class="art-line" d="M38 86h12m8 0h12m9 0h12"/><path class="art-accent" d="M88 29h10v13H88z"/>',
 cabinet:'<rect class="art-base" x="35" y="22" width="60" height="89" rx="8"/><path class="art-paper" d="M43 31h20v71H43zm25 0h19v71H68z"/><circle class="art-accent" cx="58" cy="66" r="3"/><circle class="art-accent" cx="76" cy="66" r="3"/>',
 pin:'<path class="art-base" d="M65 110S31 72 31 52a34 34 0 1 1 68 0c0 20-34 58-34 58z"/><circle class="art-paper" cx="65" cy="52" r="13"/><circle class="art-accent" cx="65" cy="52" r="5"/>',
 cable:'<path class="art-line" d="M31 83c0-22 35-22 35-44s35-22 35 0v42"/><rect class="art-base" x="22" y="79" width="18" height="22" rx="5"/><rect class="art-base" x="92" y="78" width="18" height="22" rx="5"/><path class="art-accent" d="M27 86h8m62 0h8"/>',
 thermo:'<rect class="art-base" x="53" y="22" width="25" height="63" rx="12"/><circle class="art-base" cx="65" cy="89" r="20"/><path class="art-accent" d="M65 78V39"/><path class="art-line" d="M78 42h13m-13 14h9m-9 14h13"/><circle class="art-paper" cx="65" cy="89" r="8"/>',
 hot:'<path class="art-base" d="M65 105c-22 0-34-16-29-34 3-11 13-18 15-31 13 8 15 18 13 25 12-12 13-24 11-37 24 20 33 47 20 64-7 9-18 13-30 13z"/><path class="art-accent" d="M65 94c-10 0-15-8-12-16 2-4 6-7 7-13 7 5 8 11 7 14 6-6 7-12 6-18 11 11 14 23 8 29-4 3-9 4-16 4z"/>',
 cold:'<path class="art-base" d="M65 22v85M28 43l74 43M28 86l74-43"/><path class="art-line" d="m56 31 9 9 9-9m-18 67 9-9 9 9M36 49l13 1 1-13m48 58-13-1-1 13m0-76 1 13 13 1M36 80l1-13 13-1m36 44-1-13-13-1"/>',
 power:'<path class="art-base" d="M58 25v38m15-38v38"/><path class="art-base" d="M43 54h45v17a22 22 0 0 1-45 0z"/><path class="art-line" d="M65 93v16"/><path class="art-accent" d="m71 64-13 17h10l-6 13 17-20H68z"/>',
 terminal:'<rect class="art-base" x="25" y="27" width="82" height="72" rx="11"/><path class="art-paper" d="M34 37h64v12H34z"/><path class="art-accent" d="m42 62 9 8-9 8m16 0h21"/><circle class="art-accent" cx="89" cy="43" r="3"/>',
 refresh:'<path class="art-base" d="M93 48a31 31 0 0 0-54-9l-8 9"/><path class="art-base" d="m31 33v15h15M37 78a31 31 0 0 0 54 9l8-9"/><path class="art-base" d="M99 93V78H84"/><path class="art-accent" d="M64 48v20l13 8"/>',
 signal:'<path class="art-line" d="M23 67h15l9-22 15 43 14-39 11 18h20"/><circle class="art-accent" cx="66" cy="67" r="45" fill="none" stroke-dasharray="3 7"/>',
 person:'<circle class="art-base" cx="65" cy="45" r="19"/><path class="art-base" d="M30 107q2-36 35-36t35 36z"/><circle class="art-paper" cx="58" cy="45" r="2"/><circle class="art-paper" cx="72" cy="45" r="2"/><path class="art-line" d="M58 55q7 6 14 0"/>',
 key:'<circle class="art-base" cx="46" cy="62" r="24"/><circle class="art-paper" cx="46" cy="62" r="9"/><path class="art-base" d="m65 62 40 0v12H91v10H79V72H65z"/><path class="art-accent" d="M39 62h14"/>',
 database:'<ellipse class="art-base" cx="65" cy="36" rx="36" ry="15"/><path class="art-base" d="M29 36v54c0 9 16 16 36 16s36-7 36-16V36"/><path class="art-line" d="M29 54c0 9 16 16 36 16s36-7 36-16m-72 18c0 9 16 16 36 16s36-7 36-16"/><ellipse class="art-paper" cx="65" cy="36" rx="25" ry="8"/>',
 qr:'<rect class="art-base" x="27" y="24" width="76" height="82" rx="10"/><path class="art-line" d="M39 37h22v22H39zm34 0h18v18H73zM39 75h18v18H39zm35-3h10v10H74zm16 12h8v13h-8zm-20 9h11"/><path class="art-accent" d="M45 43h10v10H45zm33 0h8v8h-8zM45 79h7v8h-7z"/>',
 usb:'<rect class="art-base" x="49" y="43" width="34" height="57" rx="9"/><path class="art-base" d="M56 43V26h20v17"/><path class="art-line" d="M60 26v9m12-9v9"/><circle class="art-accent" cx="66" cy="76" r="8"/>',
 label:'<path class="art-base" d="M29 37q0-10 10-10h48l23 24-44 48-37-37z"/><circle class="art-paper" cx="48" cy="47" r="5"/><path class="art-accent" d="M58 55h28M51 66h27m-34 11h29"/>',
 bell:'<path class="art-base" d="M34 85q9-10 9-33a22 22 0 0 1 44 0q0 23 9 33l8 8H26z"/><path class="art-line" d="M55 103q10 12 20 0"/><circle class="art-accent" cx="65" cy="27" r="5"/>',
 idea:'<path class="art-base" d="M65 24a30 30 0 0 0-18 54q6 5 7 16h22q1-11 7-16a30 30 0 0 0-18-54z"/><path class="art-line" d="M54 102h22m-19 8h16"/><path class="art-accent" d="m65 39 5 13h14L73 60l4 14-12-8-12 8 4-14-11-8h14z"/>',
 clock:'<circle class="art-base" cx="65" cy="65" r="40"/><path class="art-paper" d="M65 33a32 32 0 1 0 0 64 32 32 0 0 0 0-64z"/><path class="art-line" d="M65 43v23l17 11"/><circle class="art-accent" cx="65" cy="65" r="4"/>',
 compare:'<rect class="art-base" x="27" y="27" width="34" height="72" rx="9"/><rect class="art-paper" x="69" y="27" width="34" height="72" rx="9"/><path class="art-line" d="M36 46h16m-16 13h11m30-13h16M77 59h11"/><path class="art-accent" d="m39 78 7 7 13-15m22 8h10"/>',
 book:'<path class="art-base" d="M26 34q21-8 39 4v65q-18-12-39-4z"/><path class="art-base" d="M104 34q-21-8-39 4v65q18-12 39-4z"/><path class="art-line" d="M39 51q12-3 19 2m-19 11q12-3 19 2m27-13q8-5 19-2m-19 15q8-5 19-2"/><path class="art-accent" d="M65 39v64"/>',
 play:'<circle class="art-base" cx="65" cy="65" r="42"/><path class="art-paper" d="M56 44v42l34-21z"/><path class="art-accent" d="M36 37 28 27m66 10 8-10"/>',
 pause:'<circle class="art-base" cx="65" cy="65" r="42"/><rect class="art-paper" x="48" y="44" width="12" height="42" rx="4"/><rect class="art-paper" x="70" y="44" width="12" height="42" rx="4"/><path class="art-accent" d="M36 37 28 27m66 10 8-10"/>',
 chain:'<path class="art-base" d="m57 77-8 8a19 19 0 0 1-27-27l20-20a19 19 0 0 1 27 0"/><path class="art-base" d="m73 53 8-8a19 19 0 0 1 27 27L88 92a19 19 0 0 1-27 0"/><path class="art-accent" d="m48 72 34-34"/>',
 sparkle:'<path class="art-base" d="m65 21 10 31 32 13-32 11-10 33-11-33-31-11 31-13z"/><path class="art-accent" d="m108 27 4 12 12 4-12 4-4 13-4-13-12-4 12-4zM30 75l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/>'
};
const wordArt={
 测试:'clipboard',测:'caliper',确认:'approve',问题:'idea',异常:'warning',错误:'warning',Fail:'warning',Pass:'approve',持续:'refresh',出现:'sparkle',导致:'chain',解决:'wrench',修好:'wrench',修复:'wrench',处理:'clipboard',验证:'computer',重新:'refresh',读取:'computer',接不到:'signal',卡住:'warning',治具:'machine',按钮:'machine',设备:'machine',机台:'machine',打印机:'printer',电脑:'computer',服务器:'server',板子:'circuit',样品:'box',首件:'clipboard',产线:'factory',现场:'factory',柜子:'cabinet',位置:'pin',线:'cable',换线:'cable',接线:'cable',拆走:'box',Chamber:'machine',温度:'thermo',高温:'hot',低温:'cold',常温:'thermo',升温:'hot',降温:'cold',卡温度:'thermo',运行:'play',停下来:'pause',停用:'pause',市电:'power',电源:'power',供电:'power',断电:'power',切换:'refresh',切回:'refresh',指令:'terminal',下指令:'terminal',执行:'play',重启:'refresh',reset:'refresh',Console:'terminal',信号:'signal',账号:'person',权限:'key',申请:'clipboard',提供:'box',数据:'database',信息:'idea',SN:'label',二维码:'qr',U盘:'usb',label:'label',提示:'bell',因为:'chain',所以:'chain',特别是:'sparkle',赶紧:'clock',可能:'idea',已经:'approve',一直:'refresh',全部:'box',都:'box',一下:'sparkle',一会儿:'clock',之前:'clock',后:'clock',再:'refresh',自己:'person',一样:'compare',同样:'compare',搞:'wrench',搞起来:'play',运行起来:'play'
};
function flashArt(w){const icon=artwork[wordArt[w.hanzi]||(/Chamber|温度|温度/i.test(w.meaning)?'thermo':/设备|机器|máy|thiết bị/i.test(w.meaning)?'machine':/线|cáp|dây/i.test(w.meaning)?'cable':/测试|检查|kiểm tra/i.test(w.meaning)?'clipboard':'idea')];return `<svg class="flash-illustration" viewBox="0 0 180 130" aria-hidden="true"><path class="art-shadow" d="M16 91c0-24 15-45 39-45 16 0 23-22 48-22 29 0 60 19 60 54s-24 43-68 43-79-6-79-30z"/><g class="art-object">${icon}</g><g class="art-mascot"><path class="mascot-ear" d="m120 64-4-13q12 2 17 13m27 0q5-11 17-13l-4 14"/><circle class="mascot-face" cx="147" cy="81" r="27"/><circle class="mascot-eye" cx="138" cy="79" r="2.5"/><circle class="mascot-eye" cx="156" cy="79" r="2.5"/><path class="mascot-mouth" d="M142 88q5 6 10 0"/><ellipse class="mascot-cheek" cx="132" cy="86" rx="4" ry="2.5"/><ellipse class="mascot-cheek" cx="162" cy="86" rx="4" ry="2.5"/></g><path class="art-star" d="m116 27 3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></svg>`}
function keyboardHints(items){return `<div class="keyboard-hints" aria-label="Phím tắt"><span>Phím tắt</span>${items.map(([key,label])=>`<span><kbd>${key}</kbd> ${label}</span>`).join('')}</div>`}
function home(){
 const k=W.filter(x=>progress.known[x.id]).length,h=W.filter(x=>progress.difficult[x.id]).length;
 app.innerHTML=`<section class="home-hero"><div class="hero-copy"><span class="hero-tag">TE · ORT · TEST</span><h3>Học tiếng Trung theo nhịp của bạn.</h3><p>Từ vựng kỹ thuật, phát âm và bài luyện tập cho công việc tại nhà máy.</p><form id="homeSearch" class="hero-search"><label for="homeSearchInput">Tra nhanh từ vựng</label><div class="search-field"><span aria-hidden="true">⌕</span><input id="homeSearchInput" type="search" placeholder="Chữ Hán, pinyin hoặc nghĩa tiếng Việt"><button type="submit">Tìm từ</button></div></form></div></section><section class="home-progress"><div class="progress-copy"><span class="section-kicker">TIẾN ĐỘ HỌC</span><strong>${k}<small> / ${W.length} từ đã thuộc</small></strong><p>${h} từ cần ôn · ${progress.attempts} lượt luyện</p></div><div class="progress home-progress-bar"><div style="width:${W.length?100*k/W.length:0}%"></div></div></section><div class="home-section-heading"><div><span class="section-kicker">HỌC VÀ LUYỆN</span><h3>Chọn hoạt động</h3></div><span class="badge">${W.length} từ · ${S.length+customSentences.length} câu</span></div><section class="home-paths"><button class="home-path path-vocab" data-go="words"><span class="path-top"><span class="path-number">01</span><span class="path-symbol">字</span></span><strong>Từ vựng</strong><small>Bộ từ theo chủ đề, ngày và bộ riêng</small><span class="path-link">Mở bộ từ <b>→</b></span></button><button class="home-path path-flash" data-go="flash"><span class="path-top"><span class="path-number">02</span><span class="path-symbol">卡</span></span><strong>Flashcard</strong><small>Ghi nhớ từ qua thẻ hai mặt</small><span class="path-link">Bắt đầu <b>→</b></span></button><button class="home-path path-listen" data-go="listen"><span class="path-top"><span class="path-number">03</span><span class="path-symbol">声</span></span><strong>Luyện nghe</strong><small>Nghe từ rồi chọn nghĩa</small><span class="path-link">Luyện ngay <b>→</b></span></button><button class="home-path path-quiz" data-go="choice"><span class="path-top"><span class="path-number">04</span><span class="path-symbol">✓</span></span><strong>Trắc nghiệm</strong><small>Kiểm tra mức độ ghi nhớ</small><span class="path-link">Thử sức <b>→</b></span></button><button class="home-path path-grammar" data-go="grammar"><span class="path-top"><span class="path-number">05</span><span class="path-symbol">法</span></span><strong>Ngữ pháp</strong><small>Học cấu trúc và luyện câu</small><span class="path-link">Học ngay <b>→</b></span></button></section>`;
 app.querySelector('.home-section-heading .badge').textContent=`${W.length} từ · ${S.length+customSentences.length} câu`;
 $('homeSearch').onsubmit=e=>{e.preventDefault();search=$('homeSearchInput').value.trim();setPage('words')};
 app.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>setPage(b.dataset.go))
}
function normalizeSearchText(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function words(){
 const query=search.trim(),normalizedQuery=normalizeSearchText(query),sets=wordSetList();
 const matchesQuery=w=>{const text=[w.hanzi,w.pinyin,w.meaning,w.pos,w.category].join(' ');return !query||text.toLowerCase().includes(query.toLowerCase())||normalizeSearchText(text).includes(normalizedQuery)};
 const setMatches=set=>!query||normalizeSearchText(`${set.name} ${set.wordIds.map(id=>{const word=W.find(item=>item.id===id);return word?[word.hanzi,word.pinyin,word.meaning].join(' '):''}).join(' ')}`).includes(normalizedQuery);
 const selected=selectedWordSet();
 const resultWords=selected?W.filter(w=>selected.wordIds.includes(w.id)&&(category==='all'||w.category===category)&&(!onlyHard||progress.difficult[w.id])&&matchesQuery(w)):[];
 const statsFor=set=>({known:set.wordIds.filter(id=>progress.known[id]).length,hard:set.wordIds.filter(id=>progress.difficult[id]).length});
 const wordCards=(items,removable=false)=>items.map(w=>`<article class="vocab-card"><div class="vocab-card-top"><div class="vocab-labels"><span class="vocab-category">${esc(w.category)}</span><span class="vocab-pos">${esc(w.pos)}</span></div><span class="vocab-state ${progress.known[w.id]?'is-known':''}">${progress.known[w.id]?'✓ Đã thuộc':'Đang học'}</span></div><div class="vocab-word-line"><h4>${esc(w.hanzi)}</h4><button class="vocab-audio" type="button" data-speak="${esc(w.id)}" aria-label="Nghe phát âm ${esc(w.hanzi)}" title="Nghe phát âm">🔊</button></div><p class="vocab-pinyin">${esc(w.pinyin)}</p><p class="vocab-meaning">${esc(w.meaning)}</p><div class="vocab-actions">${cardButtons(w)}${removable?`<button class="outline small danger" type="button" data-remove-word="${esc(w.id)}">Bỏ khỏi bộ</button>`:''}${customWords.some(word=>word.id===w.id)?`<button class="outline small danger" type="button" data-delete-custom-word="${esc(w.id)}">Xóa từ</button>`:''}</div></article>`).join('');
 const customWordForm=`<section class="panel"><h3>Thêm từ muốn học</h3><form id="addWordForm" class="custom-sentence-form"><label>Chữ Hán<input name="hanzi" maxlength="100" required placeholder="例如：确认" autocomplete="off"></label><label>Nghĩa tiếng Việt<textarea name="meaning" maxlength="300" required rows="2" placeholder="Nhập nghĩa tiếng Việt"></textarea></label><label>Từ loại <span>(không bắt buộc)</span><input name="pos" maxlength="30" placeholder="Ví dụ: động từ"></label><p class="form-note">Pinyin được tự tạo trong trình duyệt. Từ mới sẽ được lưu vào bộ từ của ngày thêm trên trình duyệt này.</p><button id="submitWord" type="submit">＋ Thêm từ</button><p id="wordStatus" class="form-status" role="status" aria-live="polite"></p></form></section>`;
 const header=`<section class="vocab-hero"><div class="vocab-heading"><div><span class="vocab-eyebrow">TỪ VỰNG · BỘ TỪ CỦA BẠN</span><h3>${selected?esc(selected.name):'Sắp xếp từ thành bộ riêng'}</h3><p>${selected?`${selected.daily?'Bộ từ theo ngày':selected.automatic?'Bộ chủ đề có sẵn':'Bộ từ tự tạo'} · ${selected.wordIds.length} từ`:'Thêm từ mới để tự tạo bộ theo ngày, hoặc tạo bộ riêng và thêm từ có sẵn vào nhóm.'}</p></div><span class="vocab-total">${selected?`${selected.wordIds.length} từ`:`${W.length} từ`}</span></div><div class="vocab-search"><span aria-hidden="true">⌕</span><input type="search" id="search" aria-label="Tìm bộ từ hoặc từ vựng" placeholder="${selected?'Tìm từ trong bộ: chữ Hán, pinyin, nghĩa':'Tìm bộ hoặc từ: 测试, ceshi, kiểm tra'}" value="${esc(search)}"><button id="clearSearch" class="outline small" type="button" ${query?'':'hidden'}>Xóa</button></div></section>`;
 if(!selected){
  const visibleSets=sets.filter(setMatches);
  const dailySetCount=sets.filter(set=>set.daily).length,topicSetCount=sets.filter(set=>set.automatic&&!set.daily).length;
  app.innerHTML=header+customWordForm+`<form id="createWordSetForm" class="create-set-form"><label for="newWordSetName"><strong>＋ Tạo bộ từ riêng</strong><span>Ví dụ: “Từ cần ôn”, “Giao tiếp ca đêm”</span></label><div><input id="newWordSetName" name="name" maxlength="40" minlength="2" required placeholder="Tên bộ từ mới"><button type="submit">Tạo bộ</button></div></form><div class="vocab-sets-heading"><div><strong>${visibleSets.length} bộ từ</strong><span> · ${dailySetCount} bộ theo ngày · ${customWordSets.length} bộ riêng · ${topicSetCount} bộ chủ đề</span></div></div>${visibleSets.length?`<section class="vocab-set-grid" aria-label="Các bộ từ">${visibleSets.map(set=>{const counts=statsFor(set);return `<article class="vocab-set-card ${set.automatic?'is-topic':''}"><button type="button" class="vocab-set-open" data-open-set="${esc(set.id)}"><span class="vocab-set-icon" aria-hidden="true">${set.daily?'日':set.automatic?'分':'本'}</span><span class="vocab-set-kind">${set.daily?'BỘ TỪ THEO NGÀY':set.automatic?'BỘ THEO CHỦ ĐỀ':'BỘ CỦA BẠN'}</span><strong>${esc(set.name)}</strong><span class="vocab-set-count">${set.wordIds.length} từ · ${counts.known} đã thuộc · ${counts.hard} từ khó</span><span class="vocab-set-link">Mở bộ <b aria-hidden="true">→</b></span></button>${!set.automatic?`<button class="vocab-set-delete" type="button" data-delete-set="${esc(set.id)}" aria-label="Xóa bộ ${esc(set.name)}" title="Xóa bộ">×</button>`:''}</article>`}).join('')}</section>`:`<section class="vocab-empty"><h3>Chưa có bộ nào khớp</h3><p>Thử tên khác hoặc tạo một bộ từ mới.</p><button id="resetVocab" class="outline">Xóa tìm kiếm</button></section>`}`;
  $('createWordSetForm').onsubmit=e=>{e.preventDefault();const input=$('newWordSetName');if(!input.reportValidity()||!createWordSet(input.value))return;selectedSetId=customWordSets.at(-1).id;search='';words()};
  app.querySelectorAll('[data-open-set]').forEach(button=>button.onclick=()=>openWordSet(button.dataset.openSet));
  app.querySelectorAll('[data-delete-set]').forEach(button=>button.onclick=()=>{const set=customWordSets.find(item=>item.id===button.dataset.deleteSet);if(!set||!confirm(`Xóa bộ “${set.name}”? Các từ gốc và tiến độ học không bị xóa.`))return;if(saveWordSets(customWordSets.filter(item=>item.id!==set.id)))words()});
 }else{
  const available=selected.automatic?[]:W.filter(w=>!selected.wordIds.includes(w.id)&&matchesQuery(w));
  app.innerHTML=header+customWordForm+`<div class="vocab-set-toolbar"><button id="backToSets" class="outline">← Tất cả bộ từ</button><div class="vocab-set-actions"><button id="learnSet" ${selected.wordIds.length?'':'disabled'}>🗂️ Ôn tập toàn bộ từ</button><button id="quizSet" class="outline" ${selected.wordIds.length?'':'disabled'}>✅ Trắc nghiệm</button>${!selected.automatic?`<button id="toggleAddWords" class="outline">${addingToSet?'Đóng thêm từ':'＋ Thêm từ'}</button>`:''}</div></div>${filters()}<div class="vocab-sets-heading"><div><strong>${resultWords.length} từ trong bộ</strong><span> · ${statsFor(selected).known} đã thuộc · ${statsFor(selected).hard} từ khó</span></div></div>${resultWords.length?`<section class="vocab-grid" aria-label="Từ trong bộ">${wordCards(resultWords,!selected.automatic)}</section>`:`<section class="vocab-empty"><h3>${selected.wordIds.length?'Không tìm thấy từ phù hợp':'Bộ này chưa có từ'}</h3><p>${selected.wordIds.length?'Thử từ khóa khác hoặc bỏ bộ lọc.':'Thêm từ vào bộ để bắt đầu học.'}</p>${!selected.automatic?`<button class="outline" id="emptyAddWords">＋ Thêm từ vào bộ</button>`:''}</section>`}${addingToSet&&!selected.automatic?`<section class="vocab-add-panel"><div class="vocab-add-heading"><div><h3>Thêm từ vào “${esc(selected.name)}”</h3><p>Chọn từng từ cần gom vào bộ này. Từ vẫn giữ nguyên trong các bộ/chủ đề khác.</p></div><span>${available.length} từ có thể thêm</span></div>${available.length?`<div class="vocab-grid">${wordCards(available.map(w=>({...w,meaning:w.meaning})))}</div>`:`<p class="muted">${query?'Không có từ khớp với nội dung tìm kiếm.':'Tất cả từ đã nằm trong bộ này.'}</p>`}</section>`:''}`;
  $('backToSets').onclick=()=>{selectedSetId=null;addingToSet=false;search='';category='all';onlyHard=false;words()};
  $('learnSet').onclick=()=>{if(selected.wordIds.length)startPractice('flash',selected.wordIds)};
  $('quizSet').onclick=()=>{if(selected.wordIds.length)setPage('choice',selected.wordIds)};
  $('toggleAddWords')?.addEventListener('click',()=>{addingToSet=!addingToSet;search='';words()});
  $('emptyAddWords')?.addEventListener('click',()=>{addingToSet=true;search='';words()});
  app.querySelectorAll('[data-remove-word]').forEach(button=>button.onclick=()=>{const latest=customWordSets.find(set=>set.id===selected.id);if(!latest)return;const next=customWordSets.map(set=>set.id===latest.id?{...set,wordIds:set.wordIds.filter(id=>id!==button.dataset.removeWord)}:set);if(saveWordSets(next))words()});
   app.querySelectorAll('[data-delete-custom-word]').forEach(button=>button.onclick=()=>{const word=customWords.find(item=>item.id===button.dataset.deleteCustomWord);if(!word||!confirm(`Xóa từ “${word.hanzi}” khỏi danh sách từ tự thêm?`))return;if(saveCustomWords(customWords.filter(item=>item.id!==word.id))){delete progress.known[word.id];delete progress.difficult[word.id];persist();words()}});
  if(addingToSet&&!selected.automatic)app.querySelectorAll('.vocab-add-panel .vocab-card').forEach((card,index)=>{const word=available[index];const action=card.querySelector('.vocab-actions');if(!word||!action)return;action.innerHTML=`<button class="small" type="button" data-add-word="${esc(word.id)}">＋ Thêm vào bộ</button>`;action.querySelector('[data-add-word]').onclick=()=>{const latest=customWordSets.find(set=>set.id===selected.id);if(!latest||latest.wordIds.includes(word.id))return;const next=customWordSets.map(set=>set.id===latest.id?{...set,wordIds:[...set.wordIds,word.id]}:set);if(saveWordSets(next))words()}});
 }
  $('addWordForm').onsubmit=e=>{e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const input=form.elements.hanzi,text=input.value.trim().replace(/\s+/g,' '),meaning=form.elements.meaning.value.trim(),pos=form.elements.pos.value.trim(),status=$('wordStatus');status.classList.remove('form-status--error');if(!/[\u3400-\u9fff]/.test(text)){status.classList.add('form-status--error');status.textContent='Vui lòng nhập từ có chữ Hán.';input.focus();return}const word=saveCustomWord(text,meaning,pos);if(!word)return;selectedSetId=`day:${localDateKey(new Date(word.createdAt))}`;addingToSet=false;search='';category='all';onlyHard=false;words();const nextStatus=$('wordStatus');if(nextStatus)nextStatus.textContent='Đã thêm từ vào bộ từ của ngày hôm nay.';$('addWordForm')?.elements.hanzi.focus()};
 wireFilters(words);
 $('search').oninput=e=>{const cursor=e.target.selectionStart;search=e.target.value;words();$('search').focus();$('search').setSelectionRange(cursor,cursor)};
 $('clearSearch').onclick=()=>{search='';words();$('search').focus()};
 $('resetVocab')?.addEventListener('click',()=>{search='';category='all';onlyHard=false;words()});
 if(!selected)app.querySelector('#newWordSetName')?.focus({preventScroll:true});
 bindActions()
}
function flash(){
 const a=pool();if(!a.length){app.innerHTML=filters()+'<div class="panel">Không có từ trong bộ lọc này. Hãy đổi chủ đề hoặc bỏ chọn “Chỉ từ khó”.</div>';wireFilters(flash);return}
 index%=a.length;const w=a[index];
 app.innerHTML=filters()+`<div class="panel flash-panel"><div class="flash-heading"><div><p class="eyebrow">FLASHCARD · ${esc(w.category)}</p><h3>Ghi nhớ từ vựng</h3></div><span class="badge">${index+1} / ${a.length}</span></div><div id="flash" class="flash" role="button" tabindex="0" aria-label="Thẻ từ ${esc(w.hanzi)}. Nhấn Enter hoặc Space để lật">${flashArt(w)}<div class="hint">${flipped?'NGHĨA TIẾNG VIỆT':'TỪ TIẾNG TRUNG'} · Nhấn để lật thẻ</div><div class="hanzi">${flipped?esc(w.meaning):esc(w.hanzi)}</div><div class="py">${flipped?esc(w.pinyin):'Pinyin sẽ hiện khi lật thẻ'}</div></div><div class="controls"><button class="outline" id="prev">← Trước</button><button class="outline" id="flip">Lật thẻ <kbd>Space</kbd></button><button class="outline" data-speak="${w.id}">🔊 Nghe</button><button class="outline" id="slow">🐢 Nghe chậm</button><button id="next">Tiếp → <kbd>→</kbd></button></div>${keyboardHints([['← / →','Chuyển thẻ'],['Space','Lật thẻ'],['Ctrl','Nghe']])}<div class="controls card-actions">${cardButtons(w)}</div></div>`;
 wireFilters(flash);$('flash').onclick=()=>{flipped=!flipped;flash()};$('flip').onclick=()=>{flipped=!flipped;flash()};$('prev').onclick=()=>{index=(index+a.length-1)%a.length;flipped=false;flash()};$('next').onclick=()=>{index=(index+1)%a.length;flipped=false;flash()};$('slow').onclick=()=>speak(w.hanzi,true);bindActions()
}
function newQuiz(mode){
 if(!practiceSession||practiceSession.mode!==mode){const ids=shuffle(pool().map(word=>word.id));practiceSession={mode,wordIds:ids,offset:0,score:0}}
 const words=practiceSession.wordIds.slice(practiceSession.offset,practiceSession.offset+20).map(id=>W.find(word=>word.id===id)).filter(Boolean);
 if(!words.length)return null;
 return {mode,items:words,at:0,score:0,answered:false,selected:null,done:false}
}
function quizPage(mode){
 if(!quiz||quiz.mode!==mode)quiz=newQuiz(mode);
 if(!quiz){app.innerHTML=filters()+'<div class="panel">Không có từ phù hợp.</div>';wireFilters(()=>quizPage(mode));return}
 if(quiz.done){
  const completed=practiceSession.offset+quiz.items.length,hasMore=completed<practiceSession.wordIds.length,total=practiceSession.wordIds.length,percent=Math.round(100*practiceSession.score/completed);
  app.innerHTML=`<div class="panel center"><h2>${hasMore?'🎉 Hoàn thành lượt luyện!':'🎉 Đã luyện hết bộ từ!'}</h2><div class="hanzi">${practiceSession.score}/${completed}</div><p>Đúng ${percent}% · Đã luyện ${completed}/${total} từ</p><div class="controls"><button id="${hasMore?'nextRound':'again'}">${hasMore?`Luyện tiếp ${Math.min(20,total-completed)} từ →`:'Luyện lại bộ từ'}</button><button id="chooseAnother" class="outline">Chọn bộ khác</button></div></div>`;
  $('nextRound')?.addEventListener('click',()=>{practiceSession.offset=completed;quiz=null;quizPage(mode)});
  $('again')?.addEventListener('click',()=>startPractice(mode,practiceSession.wordIds));
  $('chooseAnother').onclick=()=>setPage(mode);return
 }
 const w=quiz.items[quiz.at];let opts=quiz.options;
 if(!opts||opts.id!==w.id){const distractors=(activeWordIds?W:pool()).filter(x=>x.id!==w.id);opts={id:w.id,values:shuffle([w,...pick(distractors,3)])};quiz.options=opts}
 const reverse=mode==='choice'&&quiz.at%2===1;
 const question=mode==='listen'?'Nghe từ rồi chọn nghĩa đúng':mode==='type'?'Nhập từ tiếng Trung tương ứng':'';
 const prompt=mode==='type'?esc(w.meaning):mode==='choice'&&reverse?esc(w.meaning):`<button id="speakPrompt" class="quiz-prompt-audio" aria-label="Phát âm ${esc(w.hanzi)}">${esc(w.hanzi)} <span aria-hidden="true">🔊</span></button>`;
 const optionLabels=opts.values.map(x=>reverse?x.hanzi:x.meaning);
 const stackedOptions=optionLabels.some(label=>Array.from(label.trim()).length>22||label.trim().split(/\s+/).length>4);
 const optionMarkup=opts.values.map((x,i)=>`<button data-option="${i}" class="${quiz.answered?(x.id===w.id?'correct':quiz.selected===x.id?'wrong':''):''}" ${quiz.answered?'disabled':''}><kbd>${String.fromCharCode(65+i)}</kbd><span>${esc(optionLabels[i])}</span>${quiz.answered&&x.id===w.id?'<span class="option-correct-mark" aria-label="Đáp án đúng">✓</span>':''}${quiz.answered&&quiz.selected===x.id&&x.id!==w.id?'<span class="option-wrong-mark" aria-label="Bạn đã chọn sai">✕</span>':''}</button>`).join('');
 app.innerHTML=filters()+`<div class="panel quiz-panel"><div class="muted">Câu ${quiz.at+1}/${quiz.items.length} · Đúng ${quiz.score}</div><div class="progress" style="margin:12px 0"><div style="width:${100*quiz.at/quiz.items.length}%"></div></div>${question?`<h3>${question}</h3>`:''}<div class="center">${mode==='listen'?`<div class="listen-controls"><button id="listenNow">🔊 Phát âm</button><button class="outline" id="listenSlow">🐢 Chậm</button></div>`:`<div class="hanzi">${prompt}</div>`}${mode==='choice'&&!reverse?`<div class="py">${esc(w.pinyin)}</div>`:''}</div>${mode==='type'?`<div class="toolbar"><input id="answerText" placeholder="Nhập chữ Hán..." ${quiz.answered?'disabled':''}><button id="submitAnswer" ${quiz.answered?'disabled':''}>Kiểm tra</button></div>`:`<div class="options${stackedOptions?' options--stacked':''}">${optionMarkup}</div>`}${quiz.answered?`<div class="feedback" ${mode==='type'?'id="typeAnswerFeedback" tabindex="-1"':''}><strong>${quiz.selected===w.id?'✅ Chính xác!':'❌ Chưa đúng.'}</strong><span class="answer-details"><span class="answer-hanzi">${esc(w.hanzi)}</span><span class="answer-pinyin">${esc(w.pinyin)}</span><span class="answer-meaning">${esc(w.meaning)}</span></span><button class="outline small" data-speak="${esc(w.id)}">🔊 Phát âm</button><p id="soundFeedback" class="sound-feedback" role="status" aria-live="polite"></p></div><div class="controls"><button id="advance">${quiz.at===quiz.items.length-1?'Xem kết quả':'Câu tiếp theo →'} <kbd>Enter</kbd></button><button class="outline" data-hard="${w.id}">${progress.difficult[w.id]?'★ Đã lưu từ khó':'☆ Lưu từ khó'}</button></div>`:''}</div>`;
 if(mode==='type'&&!quiz.answered)$('answerText')?.focus({preventScroll:true});
 if(!quiz.answered)app.insertAdjacentHTML('beforeend',keyboardHints(mode==='type'?[['Enter','Kiểm tra'],['Ctrl','Nghe từ']]:[['A–D','Chọn đáp án'],['Enter','Câu tiếp theo'],['Ctrl','Nghe lại']]));
 else if(mode==='type')app.insertAdjacentHTML('beforeend',keyboardHints([['Enter / Space','Câu tiếp theo'],['Ctrl','Nghe từ']]));
 wireFilters(()=>{quiz=null;quizPage(mode)});
 const grade=(correct,selectedId=correct?w.id:null)=>{
  if(quiz.answered)return;
  const currentQuiz=quiz,questionIndex=quiz.at;quiz.answered=true;quiz.selected=selectedId;
  if(correct){quiz.score++;practiceSession.score++}
  progress.attempts++;if(correct)progress.correct++;
  progress.history.push({date:new Date().toISOString(),mode,correct,word:w.hanzi});
  progress.history=progress.history.slice(-300);if(!correct)progress.difficult[w.id]=true;
  persist();quizPage(mode);
  if(mode==='type')$('typeAnswerFeedback')?.focus({preventScroll:true});
  else $('advance')?.focus({preventScroll:true});
  const soundFeedback=$('soundFeedback');
  if(soundFeedback)soundFeedback.textContent=`Đang phát âm báo ${correct?'đúng':'sai'}…`;
  playAnswerSound(correct).then(async message=>{
   const isCurrent=()=>quiz===currentQuiz&&quiz.at===questionIndex&&page===mode&&document.contains(soundFeedback);
   if(!isCurrent())return;
   if(mode==='choice'){
    soundFeedback.textContent=message?`${message} Đang đọc đáp án…`:'Đang đọc đáp án…';
    const played=await speak(w.hanzi);
    if(isCurrent()&&played)soundFeedback.textContent=message?`${message} Đã đọc đáp án.`:`Đã phát âm báo ${correct?'đúng':'sai'} và đọc đáp án.`;
    else if(isCurrent()&&!played)soundFeedback.textContent=message?`${message} Không phát được phần đọc từ; hãy thử chọn giọng Mandarin.`:`Đã phát âm báo ${correct?'đúng':'sai'}. Không phát được phần đọc từ; hãy thử chọn giọng Mandarin.`;
    return;
   }
   soundFeedback.textContent=message||'Đã phát âm báo.';
  })
 };
 if(mode==='type'){
  if(!quiz.answered){$('submitAnswer').onclick=()=>grade($('answerText').value.replace(/\s/g,'').toLowerCase()===w.hanzi.replace(/\s/g,'').toLowerCase());$('answerText').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();$('submitAnswer').click()}}}
 }else{
  if(mode==='choice'&&!reverse)$('speakPrompt').onclick=()=>speak(w.hanzi);
  app.querySelectorAll('[data-option]').forEach(button=>button.onclick=()=>{
   const selected=opts.values[Number(button.dataset.option)];
   grade(selected.id===w.id,selected.id)
  })
 }
 if(mode==='listen'){$('listenNow').onclick=()=>speak(w.hanzi);$('listenSlow').onclick=()=>speak(w.hanzi,true)}
 if(quiz.answered){$('advance').onclick=()=>{cancelSpeech();quiz.at++;quiz.answered=false;quiz.selected=null;quiz.options=null;if(quiz.at>=quiz.items.length)quiz.done=true;quizPage(mode)};bindActions()}
}
function match(){
 clearMatchLoopTimer();
 if(!practiceSession||practiceSession.mode!=='match')practiceSession={mode:'match',wordIds:shuffle(pool().map(word=>word.id)),offset:0,score:0};
 const roundSize=5,roundWords=practiceSession.wordIds.slice(practiceSession.offset,practiceSession.offset+roundSize).map(id=>W.find(word=>word.id===id)).filter(Boolean);
 if(!matching)matching={a:roundWords,left:shuffle(roundWords),right:shuffle(roundWords),first:null,done:[],mistakes:0};
 const m=matching;
 if(!m.a.length){app.innerHTML=filters()+'<div class="panel">Không có từ phù hợp.</div>';wireFilters(()=>{matching=null;match()});return}
 const roundNumber=Math.floor(practiceSession.offset/roundSize)+1,roundProgress=Math.round(m.done.length/m.a.length*100),roundComplete=m.done.length===m.a.length,completed=practiceSession.offset+m.a.length,hasMore=completed<practiceSession.wordIds.length,total=practiceSession.wordIds.length,canLoop=!hasMore&&practiceSession.loopMode==='loop';
 const roundNotice=roundComplete?`<div class="match-round-notice"><p>🎉 ${hasMore?'Đã ghép xong lượt này!':canLoop?'Đã hoàn thành một vòng! Đang bắt đầu vòng mới…':'Đã hoàn thành bộ từ!'} <span>${practiceSession.score}/${completed} cặp đúng · ${m.mistakes} lượt ghép sai</span></p><div class="match-round-actions">${hasMore?`<button id="nextRound">Ghép tiếp ${Math.min(roundSize,total-completed)} cặp →</button>`:''}<button id="chooseAnother" class="outline">Chọn bộ khác</button></div></div>`:'';
 app.innerHTML=filters()+`<section class="panel match-panel"><div class="match-heading"><div><span class="vocab-eyebrow">GHÉP CẶP · LƯỢT ${roundNumber}</span><h3>Nối từ với nghĩa</h3><p>Chọn một từ tiếng Trung, sau đó chọn nghĩa tương ứng.</p></div><div class="match-heading-tools"><label class="match-loop-toggle"><span class="match-loop-copy"><strong>Lặp lại bộ từ</strong><small>${practiceSession.loopMode==='loop'?'Bật · Sẽ tự bắt đầu vòng mới':'Tắt · Dừng khi hết bộ'}</small></span><input id="matchLoopToggle" type="checkbox" role="switch" aria-label="Lặp lại bộ từ sau khi hoàn thành" ${practiceSession.loopMode==='loop'?'checked':''}><span class="match-switch" aria-hidden="true"></span></label><div class="match-counter"><strong>${m.done.length}<span>/${m.a.length}</span></strong><span>cặp đã ghép</span></div></div></div><div class="match-progress" role="progressbar" aria-label="Tiến độ ghép cặp" aria-valuemin="0" aria-valuemax="${m.a.length}" aria-valuenow="${m.done.length}"><span style="width:${roundProgress}%"></span></div><div class="match-columns"><section class="match-column"><h4>Tiếng Trung</h4><div class="match-list">${m.left.map((w,i)=>`<button type="button" class="match match-choice match-choice--hanzi ${m.done.includes(w.id)?'done':''} ${m.first===w.id?'selected':''}" data-left="${esc(w.id)}" aria-pressed="${m.first===w.id}" ${m.done.includes(w.id)?'disabled':''}><span class="match-index">${String(i+1).padStart(2,'0')}</span><span class="match-hanzi">${esc(w.hanzi)}</span><span class="match-pinyin">${esc(w.pinyin||'')}</span></button>`).join('')}</div></section><section class="match-column"><h4>Nghĩa tiếng Việt</h4><div class="match-list">${m.right.map((w,i)=>`<button type="button" class="match match-choice ${m.done.includes(w.id)?'done':''}" data-right="${esc(w.id)}" ${m.done.includes(w.id)?'disabled':''}><span class="match-index">${String(i+1).padStart(2,'0')}</span><span>${esc(w.meaning)}</span></button>`).join('')}</div></section></div><p id="matchInfo" class="match-message ${m.notice?'match-message--error':''}" role="status" aria-live="polite">${esc(m.notice||(roundComplete?'Đã hoàn thành lượt ghép.':'Chọn một từ ở cột trái rồi chọn nghĩa ở cột phải.'))}</p>${roundNotice}</section>`;
 wireFilters(()=>{matching=null;match()});
 $('matchLoopToggle').onchange=e=>{matchLoopMode=e.target.checked?'loop':'stop';practiceSession.loopMode=matchLoopMode;clearMatchLoopTimer();match()};
 app.querySelectorAll('[data-left]').forEach(button=>button.onclick=()=>{m.first=button.dataset.left;m.notice='';const word=m.a.find(item=>item.id===m.first);if(word)speak(word.hanzi);match()});
 app.querySelectorAll('[data-right]').forEach(button=>button.onclick=()=>{
  if(!m.first)return;
  const selectedId=m.first,good=selectedId===button.dataset.right,word=m.a.find(item=>item.id===selectedId);
  progress.attempts++;
  if(good){progress.correct++;practiceSession.score++;m.done.push(selectedId);m.notice=''}else{m.mistakes++;progress.difficult[selectedId]=true;m.notice='Chưa khớp, thử chọn nghĩa khác nhé.'}
  progress.history.push({date:new Date().toISOString(),mode:'match',correct:good,word:word?.hanzi});
  progress.history=progress.history.slice(-300);persist();m.first=null;match()
 })
 if(roundComplete){
  $('nextRound')?.addEventListener('click',()=>{practiceSession.offset=completed;matching=null;match()});
  $('chooseAnother').onclick=()=>setPage('match')
  if(canLoop)matchLoopTimer=setTimeout(()=>{matchLoopTimer=null;if(page!=='match'||practiceSession?.mode!=='match'||practiceSession.loopMode!=='loop'||matching!==m)return;practiceSession.wordIds=shuffle(practiceSession.wordIds);practiceSession.offset=0;practiceSession.score=0;matching=null;match()},1400)
 }
}
function saveCustomSentences(next){try{localStorage.setItem(CUSTOM_SENTENCES_KEY,JSON.stringify(next));customSentences=next;return true}catch{alert('Không lưu được câu mới trên trình duyệt. Hãy kiểm tra dung lượng lưu trữ.');return false}}
function saveSentenceWithMeaning(text,meaning){
 const generatedPinyin=segment(text,{format:6}).replace(/\s+([，。！？；：,.!?;:])/g,'$1').replace(/^./,letter=>letter.toLocaleUpperCase('zh-CN')).trim(),createdAt=new Date().toISOString(),sentence={id:`custom-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,hanzi:text,pinyin:generatedPinyin,meaning,category:'Câu tự thêm',createdAt};
 if(!saveCustomSentences([...customSentences,sentence]))return false;
 selectedSentenceSetKey=`day:${localDateKey(new Date(createdAt))}`;search='';sentences();
 const status=$('sentenceStatus');if(status)status.textContent='Đã thêm câu vào bộ câu của ngày hôm nay.';
 $('addSentenceForm')?.elements.hanzi.focus();
 return true
}
function sentences(){
 const query=search.trim().toLowerCase();
 const matches=sentence=>[sentence.hanzi,sentence.pinyin,sentence.meaning].join(' ').toLowerCase().includes(query);
 const datedSentences=[...S.filter(sentence=>sentence.createdAt),...customSentences],predefinedSentences=S.filter(sentence=>!sentence.createdAt);
 const grouped=new Map();
 datedSentences.forEach(sentence=>{
  const date=sentenceCreatedDate(sentence),key=date?localDateKey(date):'undated';
  if(!grouped.has(key))grouped.set(key,{key:`day:${key}`,title:date?`Ngày ${new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}).format(date)}`:'Ngày chưa xác định',date,entries:[]});
  grouped.get(key).entries.push(sentence)
 });
 const groups=[...grouped.values()].sort((a,b)=>(b.date?.getTime()||0)-(a.date?.getTime()||0)||b.key.localeCompare(a.key));
 groups.forEach(group=>group.entries.sort((a,b)=>customSentenceTimestamp(b)-customSentenceTimestamp(a)));
 if(predefinedSentences.length)groups.push({key:'predefined',title:'Câu có sẵn',date:null,entries:predefinedSentences});
 let selected=groups.find(group=>group.key===selectedSentenceSetKey);
 if(selectedSentenceSetKey&&!selected){selectedSentenceSetKey=null;selected=null}
 const sentenceCards=entries=>entries.map(sentence=>`<div class="sentence"><strong>${esc(sentence.hanzi)}</strong><p class="py">${esc(sentence.pinyin||'Chưa thêm pinyin')}</p><p>${esc(sentence.meaning)}</p><div class="controls" style="justify-content:flex-start">${cardButtons(sentence)}${sentence.id.startsWith('custom-')?`<button class="outline small danger" data-delete-sentence="${esc(sentence.id)}" aria-label="Xóa câu ${esc(sentence.hanzi)}">Xóa câu</button>`:''}</div></div>`).join('');
 const addForm=`<div class="notice">${predefinedSentences.length} câu có sẵn · ${datedSentences.length} câu theo ngày. Mỗi ngày có câu mới sẽ tự tạo thành một bộ.</div><section class="panel"><h3>Thêm câu muốn học</h3><form id="addSentenceForm" class="custom-sentence-form"><label>Nhập câu tiếng Trung<input name="hanzi" maxlength="200" required placeholder="例如：请再检查一次。" autocomplete="off"></label><label>Nghĩa tiếng Việt<textarea name="meaning" maxlength="500" required rows="2" placeholder="Nhập nghĩa tiếng Việt của câu"></textarea></label><p class="form-note">Pinyin được tự tạo trong trình duyệt. Hãy tự nhập nghĩa tiếng Việt; câu mới được lưu trong trình duyệt này.</p><button id="submitSentence" type="submit">＋ Thêm câu</button><p id="sentenceStatus" class="form-status" role="status" aria-live="polite"></p></form></section>`;
 const searchBar=`<div class="toolbar"><input id="sentenceSearch" type="search" placeholder="Tìm bộ câu hoặc câu..." value="${esc(search)}" aria-label="Tìm bộ câu hoặc câu luyện tập"></div>`;
 if(selected){
  const entries=selected.entries.filter(matches);
  app.innerHTML=`${addForm}<div class="vocab-set-toolbar"><button id="backToSentenceSets" class="outline">← Tất cả bộ câu</button><div class="vocab-sets-heading"><strong>${esc(selected.title)}</strong><span> · ${selected.entries.length} câu</span></div></div>${searchBar}<section class="panel sentence-day-group">${entries.length?sentenceCards(entries):'<p class="muted">Không tìm thấy câu phù hợp trong bộ này.</p>'}</section>`;
  $('backToSentenceSets').onclick=()=>{selectedSentenceSetKey=null;search='';sentences()}
 }else{
  const visibleGroups=groups.filter(group=>!query||group.title.toLowerCase().includes(query)||group.entries.some(matches));
  app.innerHTML=`${addForm}${searchBar}<div class="vocab-sets-heading"><div><strong>${visibleGroups.length} bộ câu</strong><span> · ${datedSentences.length} câu theo ngày · ${predefinedSentences.length} câu có sẵn</span></div></div>${visibleGroups.length?`<section class="vocab-set-grid sentence-set-grid" aria-label="Các bộ câu">${visibleGroups.map(group=>{const counts={known:group.entries.filter(sentence=>progress.known[sentence.id]).length,hard:group.entries.filter(sentence=>progress.difficult[sentence.id]).length};return `<article class="vocab-set-card sentence-set-card"><button type="button" class="vocab-set-open" data-open-sentence-set="${esc(group.key)}"><span class="vocab-set-icon" aria-hidden="true">句</span><span class="vocab-set-kind">${group.key==='predefined'?'BỘ CÂU CÓ SẴN':'BỘ CÂU THEO NGÀY'}</span><strong>${esc(group.title)}</strong><span class="vocab-set-count">${group.entries.length} câu · ${counts.known} đã thuộc · ${counts.hard} cần ôn</span><span class="vocab-set-link">Mở bộ câu <b aria-hidden="true">→</b></span></button></article>`}).join('')}</section>`:'<section class="vocab-empty"><h3>Chưa có bộ câu phù hợp</h3><p>Thêm một câu mới hoặc thử từ khóa khác.</p></section>'}`;
  app.querySelectorAll('[data-open-sentence-set]').forEach(button=>button.onclick=()=>{selectedSentenceSetKey=button.dataset.openSentenceSet;sentences()})
 }
 $('addSentenceForm').onsubmit=e=>{e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const input=form.elements.hanzi,text=input.value.trim().replace(/\s+/g,' '),meaning=form.elements.meaning.value.trim(),status=$('sentenceStatus');status.classList.remove('form-status--error');if(!/[\u3400-\u9fff]/.test(text)){status.classList.add('form-status--error');status.textContent='Vui lòng nhập câu có chữ Hán.';input.focus();return}saveSentenceWithMeaning(text,meaning)};
 $('sentenceSearch').oninput=e=>{const cursor=e.target.selectionStart;search=e.target.value;sentences();$('sentenceSearch').focus();$('sentenceSearch').setSelectionRange(cursor,cursor)};
 app.querySelectorAll('[data-delete-sentence]').forEach(button=>button.onclick=()=>{const sentence=customSentences.find(item=>item.id===button.dataset.deleteSentence);if(!sentence||!confirm(`Xóa câu “${sentence.hanzi}” khỏi bộ câu?`))return;const next=customSentences.filter(item=>item.id!==sentence.id);if(saveCustomSentences(next)){delete progress.known[sentence.id];delete progress.difficult[sentence.id];persist();sentences()}});
 bindActions()
}
function grammar(){
 const completed=new Set(grammarProgress.completed),accuracy=grammarProgress.attempts?Math.round(grammarProgress.correct/grammarProgress.attempts*100):0;
 const lesson=grammarLessons.find(item=>item.id===selectedGrammarId);
 if(!lesson){
  selectedGrammarId=null;grammarQuiz=null;
  app.innerHTML=`<section class="grammar-page"><header class="grammar-hero"><span class="vocab-eyebrow">HỌC TIẾNG TRUNG · NGỮ PHÁP</span><h2>Luyện ngữ pháp</h2><p>Học cấu trúc qua giải thích ngắn, ví dụ thực tế và câu hỏi trắc nghiệm.</p><div class="grammar-summary"><div><strong>${completed.size}/${grammarLessons.length}</strong><span>chủ điểm đã luyện</span></div><div><strong>${grammarProgress.correct}/${grammarProgress.attempts}</strong><span>câu đúng · ${accuracy}%</span></div></div></header><section class="grammar-grid" aria-label="Các chủ điểm ngữ pháp">${grammarLessons.map(item=>`<button type="button" class="grammar-card" data-open-grammar="${esc(item.id)}"><span class="grammar-card-top"><span class="grammar-level">${esc(item.level)}</span><span class="grammar-card-status">${completed.has(item.id)?'✓ Đã luyện':'Chưa luyện'}</span></span><strong>${esc(item.title)}</strong><span class="grammar-pattern">${esc(item.pattern)}</span><span class="grammar-card-meta">${item.questions.length} câu luyện tập <b aria-hidden="true">→</b></span></button>`).join('')}</section></section>`;
  app.querySelectorAll('[data-open-grammar]').forEach(button=>button.onclick=()=>{selectedGrammarId=button.dataset.openGrammar;grammarQuiz={questionIndex:0,score:0,answered:false,selectedAnswer:null,finished:false};grammar()});
  return
 }
 if(!grammarQuiz)grammarQuiz={questionIndex:0,score:0,answered:false,selectedAnswer:null,finished:false};
 const question=lesson.questions[grammarQuiz.questionIndex];
 const examples=lesson.examples.map(example=>`<article class="grammar-example"><strong>${esc(example.hanzi)}</strong><span class="grammar-example-pinyin">${esc(example.pinyin)}</span><span>${esc(example.meaning)}</span></article>`).join('');
 const quiz=grammarQuiz.finished
  ?`<div class="grammar-result"><span class="grammar-result-icon" aria-hidden="true">✓</span><h3>Hoàn thành chủ điểm</h3><p>Bạn trả lời đúng ${grammarQuiz.score}/${lesson.questions.length} câu trong lượt này.</p><button id="grammarRetry" type="button">Luyện lại chủ điểm</button></div>`
  :`<section class="grammar-quiz"><div class="grammar-quiz-heading"><span>LUYỆN TẬP</span><strong>Câu ${grammarQuiz.questionIndex+1}/${lesson.questions.length}</strong></div><div class="grammar-progress"><span style="width:${100*(grammarQuiz.questionIndex+1)/lesson.questions.length}%"></span></div><p class="grammar-question">${esc(question.prompt)}</p><div class="grammar-options">${question.options.map((option,index)=>{const state=grammarQuiz.answered&&index===question.answer?' is-correct':grammarQuiz.answered&&index===grammarQuiz.selectedAnswer?' is-wrong':'';return `<button type="button" class="grammar-answer${state}" data-grammar-answer="${index}" ${grammarQuiz.answered?'disabled':''}><span class="grammar-answer-key">${String.fromCharCode(65+index)}</span><span>${esc(option)}</span></button>`}).join('')}</div>${grammarQuiz.answered?`<div class="grammar-feedback ${grammarQuiz.selectedAnswer===question.answer?'is-correct':'is-wrong'}"><p><strong>${grammarQuiz.selectedAnswer===question.answer?'Chính xác!':'Chưa đúng.'}</strong> ${esc(question.explanation)}</p><p id="grammarAudioFeedback" class="grammar-audio-feedback" role="status" aria-live="polite">Đang phát âm báo ${grammarQuiz.selectedAnswer===question.answer?'đúng':'sai'} và đọc đáp án đã chọn…</p></div>`:''}<button id="grammarContinue" type="button" ${grammarQuiz.answered?'':'disabled'}>${grammarQuiz.questionIndex===lesson.questions.length-1?'Hoàn thành':'Câu tiếp theo →'}</button>${keyboardHints([['A–D','Chọn đáp án']])}</section>`;
 app.innerHTML=`<section class="grammar-page"><div class="grammar-toolbar"><button id="grammarBack" type="button" class="outline">← Danh sách chủ điểm</button><span>${completed.has(lesson.id)?'✓ Đã luyện trước đây':esc(lesson.level)}</span></div><article class="grammar-lesson"><header class="grammar-lesson-heading"><span class="vocab-eyebrow">CHỦ ĐIỂM NGỮ PHÁP</span><h2>${esc(lesson.title)}</h2><p class="grammar-pattern">${esc(lesson.pattern)}</p><p>${esc(lesson.explanation)}</p></header><section class="grammar-examples"><h3>Ví dụ</h3>${examples}</section>${quiz}</article></section>`;
 $('grammarBack').onclick=()=>{cancelSpeech();selectedGrammarId=null;grammarQuiz=null;grammar()};
 $('grammarRetry')?.addEventListener('click',()=>{cancelSpeech();grammarQuiz={questionIndex:0,score:0,answered:false,selectedAnswer:null,finished:false};grammar()});
 app.querySelectorAll('[data-grammar-answer]').forEach(button=>button.onclick=()=>{if(grammarQuiz.answered)return;const selectedAnswer=Number(button.dataset.grammarAnswer),selectedText=question.options[selectedAnswer],isCorrect=selectedAnswer===question.answer,questionIndex=grammarQuiz.questionIndex;grammarQuiz={...grammarQuiz,answered:true,selectedAnswer,score:grammarQuiz.score+(isCorrect?1:0)};saveGrammarProgress({...grammarProgress,attempts:grammarProgress.attempts+1,correct:grammarProgress.correct+(isCorrect?1:0)});grammar();const audioStatus=$('grammarAudioFeedback'),isCurrent=()=>page==='grammar'&&selectedGrammarId===lesson.id&&grammarQuiz?.questionIndex===questionIndex&&grammarQuiz?.selectedAnswer===selectedAnswer,spokenText=selectedText.replace(/[.…·、，。！？!?;；：:]/g,' ').replace(/\s+/g,' ').trim(),soundTask=playAnswerSound(isCorrect);setTimeout(async()=>{if(!isCurrent())return;if(audioStatus)audioStatus.textContent='Đang đọc đáp án đã chọn…';const speechTask=speak(spokenText),soundMessage=await Promise.race([soundTask,new Promise(resolve=>setTimeout(()=>resolve('Không nhận được xác nhận từ âm báo.'),900))]),spoken=await Promise.race([speechTask,new Promise(resolve=>setTimeout(()=>resolve(false),6000))]);if(isCurrent()&&audioStatus)audioStatus.textContent=`${soundMessage||`Đã phát âm báo ${isCorrect?'đúng':'sai'}.`} ${spoken?'Đã đọc đáp án tiếng Trung đã chọn.':'Không thể xác nhận phần đọc; hãy kiểm tra giọng Mandarin trên thiết bị.'}`},500)});
 $('grammarContinue')?.addEventListener('click',()=>{if(!grammarQuiz.answered)return;cancelSpeech();if(grammarQuiz.questionIndex<lesson.questions.length-1){grammarQuiz={...grammarQuiz,questionIndex:grammarQuiz.questionIndex+1,answered:false,selectedAnswer:null};grammar()}else{saveGrammarProgress({...grammarProgress,completed:[...new Set([...grammarProgress.completed,lesson.id])]});grammarQuiz={...grammarQuiz,finished:true};grammar()}});
}
function review(){const a=allItems().filter(x=>progress.difficult[x.id]);app.innerHTML=`<div class="panel"><h3>Danh sách cần ôn tập (${a.length})</h3><p class="muted">Câu trả lời sai trong bài luyện tập sẽ tự động được thêm vào danh sách này. Bạn cũng có thể đánh dấu thủ công.</p><div class="wordlist">${a.length?a.map(w=>`<div class="word"><div><strong>${esc(w.hanzi)}</strong><small>${esc(w.pinyin)}</small>${esc(w.meaning)}</div><div class="actions">${cardButtons(w)}</div></div>`).join(''):'Chưa có từ khó. Hãy đánh dấu trong phần học từ hoặc làm bài luyện tập.'}</div></div><button id="hardFlash" ${a.length?'':'disabled'}>Ôn Flashcard từ khó</button>`;bindActions();$('hardFlash').onclick=()=>{onlyHard=true;category='all';startPractice('flash',W.filter(word=>progress.difficult[word.id]).map(word=>word.id))}}
function stats(){
 const pct=progress.attempts?Math.round(progress.correct/progress.attempts*100):0;
 app.innerHTML=`<div class="grid"><div class="panel stat"><strong>${W.filter(x=>progress.known[x.id]).length}/${W.length}</strong><span>Từ đã thuộc</span></div><div class="panel stat"><strong>${pct}%</strong><span>Tỉ lệ trả lời đúng</span></div><div class="panel stat"><strong>${progress.attempts}</strong><span>Lượt trả lời</span></div></div><div class="panel"><h3>Sao lưu và khôi phục tiến độ</h3><p class="muted">Dữ liệu chỉ nằm trong trình duyệt hiện tại. Hãy xuất file JSON định kỳ để không mất tiến độ khi xóa dữ liệu trình duyệt.</p><div class="toolbar"><button id="export">⬇ Xuất tiến độ JSON</button><label class="outline" style="padding:11px;border-radius:10px;cursor:pointer">⬆ Nhập tiến độ <input id="import" type="file" accept=".json,application/json" hidden></label><button id="reset" class="outline danger">Xóa toàn bộ tiến độ</button></div></div><div class="panel"><h3>10 lượt làm gần đây</h3>${progress.history.slice(-10).reverse().map(x=>`<p>${x.correct?'✅':'❌'} ${esc(x.word)} · ${esc(x.mode)} · ${new Date(x.date).toLocaleString('vi-VN')}</p>`).join('')||'<p class="muted">Chưa có lịch sử.</p>'}</div>`;
 $('export').onclick=()=>{const blob=new Blob([JSON.stringify(progress,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='te-chinese-tien-do.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 $('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const obj=JSON.parse(await file.text());if(!obj||typeof obj!=='object'||!obj.known||!obj.difficult||!Array.isArray(obj.history))throw Error();if(!confirm('Nhập dữ liệu sẽ ghi đè tiến độ hiện tại. Tiếp tục?'))return;progress={known:obj.known,difficult:obj.difficult,attempts:Number(obj.attempts)||0,correct:Number(obj.correct)||0,history:obj.history.slice(-300),grammar:normalizeGrammarProgress(obj.grammar)};grammarProgress=progress.grammar;persist();stats();alert('Đã nhập tiến độ.')}catch{alert('File JSON không hợp lệ.')}};
 $('reset').onclick=()=>{if(confirm('Bạn chắc chắn muốn xóa TOÀN BỘ tiến độ học?')){grammarProgress={attempts:0,correct:0,completed:[]};progress={known:{},difficult:{},attempts:0,correct:0,history:[],grammar:grammarProgress};persist();stats()}}
}
function handleKeyboard(e){
 if(e.defaultPrevented||e.repeat)return;
 if(e.key==='Control'){controlKeyPressed=true;controlKeyUsed=false;return}
 if(controlKeyPressed&&e.ctrlKey)controlKeyUsed=true;
 const target=e.target instanceof Element?e.target:null;
 if(target?.closest('input,textarea,select,[contenteditable="true"]'))return;
 if(e.ctrlKey||e.altKey||e.metaKey)return;
 const isAnswerKey=/^[a-d1-4]$/i.test(e.key),isAdvanceKey=e.key==='Enter'&&quiz?.answered;
 if(target?.closest('button')&&!isAnswerKey&&!isAdvanceKey)return;
 if(page==='flash'){
  if(e.key===' '||(e.key==='Enter'&&target?.id==='flash')){e.preventDefault();flipped=!flipped;flash()}
  else if(e.key==='ArrowRight'){e.preventDefault();$('next')?.click()}
  else if(e.key==='ArrowLeft'){e.preventDefault();$('prev')?.click()}
  return;
 }
 if(page==='grammar'){
  if(/^[a-d]$/i.test(e.key)&&grammarQuiz&&!grammarQuiz.answered&&!grammarQuiz.finished){const answerIndex=e.key.toLowerCase().charCodeAt(0)-97,option=app.querySelector(`[data-grammar-answer="${answerIndex}"]`);if(option){e.preventDefault();option.click()}}
  return
 }
 if(!quiz||!['listen','choice','type'].includes(page)||quiz.done)return;
 if(page==='type'&&quiz.answered&&(e.key==='Enter'||e.key===' ')){e.preventDefault();$('advance')?.click();return}
 if(['listen','choice'].includes(page)&&isAnswerKey&&!quiz.answered){const answerIndex=/^[a-d]$/i.test(e.key)?e.key.toLowerCase().charCodeAt(0)-97:Number(e.key)-1,option=app.querySelector(`[data-option="${answerIndex}"]`);if(option){e.preventDefault();option.click()}return}
 if(e.key==='Enter'&&quiz.answered){e.preventDefault();$('advance')?.click()}
}
document.addEventListener('keyup',e=>{
 if(e.key!=='Control')return;
 const shouldSpeak=controlKeyPressed&&!controlKeyUsed;
 controlKeyPressed=false;controlKeyUsed=false;
 if(!shouldSpeak)return;
 if(page==='flash'){const w=pool()[index%Math.max(1,pool().length)];if(w)speak(w.hanzi)}
 else if(['listen','choice','type'].includes(page)&&quiz&&!quiz.done)speak(quiz.items[quiz.at].hanzi)
});
function render(){if(page==='home')home();else if(page==='words')words();else if(page==='chooseSet')choosePracticeSet();else if(page==='flash')flash();else if(['listen','choice','type'].includes(page))quizPage(page);else if(page==='match')match();else if(page==='sentences')sentences();else if(page==='grammar')grammar();else if(page==='review')review();else stats()}
document.addEventListener('keydown',handleKeyboard);
$('nav').innerHTML=Object.entries(names).map(([k,v])=>`<button data-page="${k}">${v}</button>`).join('');$('nav').querySelectorAll('button').forEach(b=>b.onclick=()=>{search='';category='all';onlyHard=false;setPage(b.dataset.page)});$('voiceSelect').onchange=e=>{cancelSpeech();voiceURI=e.target.value;try{localStorage.setItem(VOICE_KEY,voiceURI)}catch{alert('Không lưu được lựa chọn giọng đọc trên trình duyệt.')}updateVoices()};$('speechStyleSelect').value=voiceStyle;$('speechStyleSelect').onchange=e=>{const next=e.target.value;if(!voiceStyles[next])return;voiceStyle=next;try{localStorage.setItem(VOICE_STYLE_KEY,voiceStyle)}catch{alert('Không lưu được ngữ điệu đọc trên trình duyệt.')}};$('soundTest').onclick=()=>speak('请确认问题在哪里。');if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=updateVoices;updateVoices();setPage('home');
})();
