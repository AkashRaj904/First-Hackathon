const STORAGE_KEY = 'petcare:data:v1';
const defaultData = { pets: [], reminders: [], chats: [] };

function readData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultData);
    return JSON.parse(raw);
  } catch {
    return structuredClone(defaultData);
  }
}
function writeData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  renderAll();
}

function genId() { return 'id_' + Math.random().toString(36).slice(2, 9); }
function fmtDate(iso) { return new Date(iso).toLocaleString(); }
function escapeHtml(str="") {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

// DOM references
const petsList = document.getElementById('petsList');
const totalPets = document.getElementById('totalPets');
const upcomingRem = document.getElementById('upcomingRem');
const addPetBtn = document.getElementById('addPetBtn');
const modal = document.getElementById('modal');
const savePet = document.getElementById('savePet');
const cancelModal = document.getElementById('cancelModal');
const petName = document.getElementById('petName');
const petAge = document.getElementById('petAge');
const petBreed = document.getElementById('petBreed');
const petType = document.getElementById('petType');
const petNotes = document.getElementById('petNotes');

const remModal = document.getElementById('remModal');
const addReminderBtn = document.getElementById('addReminderBtn');
const remPet = document.getElementById('remPet');
const remTitle = document.getElementById('remTitle');
const remDate = document.getElementById('remDate');
const remFreq = document.getElementById('remFreq');
const saveRem = document.getElementById('saveRem');
const cancelRem = document.getElementById('cancelRem');

const petSelector = document.getElementById('petSelector');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChat = document.getElementById('sendChat');
const clearChat = document.getElementById('clearChat');
const reminderList = document.getElementById('reminderList');

// Seed sample data
(function seed() {
  const data = readData();
  if (data.pets.length === 0) {
    data.pets.push({ id: genId(), name: 'Mochi', age: 3, breed: 'Beagle', type: 'Dog', notes: 'Allergic to treats' });
    data.pets.push({ id: genId(), name: 'Pixel', age: 2, breed: 'Siamese', type: 'Cat', notes: 'Neutered' });
    data.reminders.push({ id: genId(), petId: data.pets[0].id, title: 'Vaccination', datetime: new Date(Date.now()+86400000).toISOString(), freq: 'once' });
    writeData(data);
  }
})();

function renderAll() {
  const data = readData();
  // Pets
  petsList.innerHTML = '';
  data.pets.forEach(p => {
    const div = document.createElement('div'); div.className = 'pet-item';
    div.innerHTML = `
      <div class="pet-avatar">${p.name.charAt(0).toUpperCase()}</div>
      <div class="pet-meta"><h4>${escapeHtml(p.name)}</h4>
      <p>${p.type} · ${p.breed} · ${p.age} yrs</p></div>
      <div class="actions">
        <button class="ghost" onclick="deletePet('${p.id}')">Delete</button>
      </div>`;
    petsList.appendChild(div);
  });
  totalPets.textContent = `${data.pets.length} Pets`;

  // Reminders
  reminderList.innerHTML = '';
  let upcoming = 0;
  data.reminders.forEach(r => {
    const pet = data.pets.find(x=>x.id===r.petId) || {name:'Unknown'};
    const row = document.createElement('div'); row.className = 'reminder';
    row.innerHTML = `<div><strong>${escapeHtml(r.title)}</strong>
      <div style="font-size:12px;color:var(--muted)">${pet.name} · ${fmtDate(r.datetime)} · ${r.freq}</div></div>
      <button class="ghost" onclick="deleteRem('${r.id}')">Remove</button>`;
    reminderList.appendChild(row);
    if(new Date(r.datetime).getTime() > Date.now()) upcoming++;
  });
  upcomingRem.textContent = `${upcoming} Reminders`;

  // Dropdowns
  petSelector.innerHTML = '<option value="">— Select pet —</option>';
  remPet.innerHTML = '';
  data.pets.forEach(p=>{
    let o1=document.createElement('option'); o1.value=p.id; o1.textContent=p.name; petSelector.appendChild(o1);
    let o2=document.createElement('option'); o2.value=p.id; o2.textContent=p.name; remPet.appendChild(o2);
  });

  // Chat messages
  chatMessages.innerHTML = '';
  data.chats.forEach(m=>{
    const el=document.createElement('div'); el.className='msg '+(m.role==='user'?'user':'bot'); el.textContent=m.text; chatMessages.appendChild(el);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Global helpers
window.deletePet = id => { const d=readData(); d.pets=d.pets.filter(x=>x.id!==id); writeData(d); };
window.deleteRem = id => { const d=readData(); d.reminders=d.reminders.filter(x=>x.id!==id); writeData(d); };

// Events
addPetBtn.onclick = ()=> modal.style.display='flex';
cancelModal.onclick = ()=> modal.style.display='none';
savePet.onclick = ()=>{
  const d=readData();
  d.pets.push({id:genId(),name:petName.value,age:+petAge.value||0,breed:petBreed.value,type:petType.value,notes:petNotes.value});
  writeData(d);
  modal.style.display='none'; petName.value=petAge.value=petBreed.value=petNotes.value='';
};

addReminderBtn.onclick = ()=> remModal.style.display='flex';
cancelRem.onclick = ()=> remModal.style.display='none';
saveRem.onclick = ()=>{
  const d=readData();
  d.reminders.push({id:genId(),petId:remPet.value,title:remTitle.value,datetime:remDate.value,freq:remFreq.value});
  writeData(d);
  remModal.style.display='none'; remTitle.value=remDate.value='';
};

sendChat.onclick = ()=>sendMsg();
chatInput.addEventListener('keypress',e=>{ if(e.key==='Enter'){e.preventDefault();sendMsg();} });
function sendMsg(){
  if(!chatInput.value) return;
  const d=readData();
  d.chats.push({role:'user',text:chatInput.value});
  d.chats.push({role:'bot',text:'🤖 Bot reply to: '+chatInput.value});
  chatInput.value=''; writeData(d);
}
clearChat.onclick=()=>{ if(confirm('Clear chat?')){const d=readData();d.chats=[];writeData(d);} };

document.getElementById('exportBtn').onclick=()=>{
  const blob=new Blob([JSON.stringify(readData(),null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='petcare.json'; a.click();
};
document.getElementById('importBtn').onclick=()=>{
  const i=document.createElement('input'); i.type='file'; i.accept='.json';
  i.onchange=e=>{
    const f=e.target.files[0]; if(!f)return;
    const r=new FileReader(); r.onload=ev=>{
      try{ writeData(JSON.parse(ev.target.result)); }catch{ alert('Invalid file'); }
    }; r.readAsText(f);
  }; i.click();
};

renderAll();
