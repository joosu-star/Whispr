const firebaseConfig={
  apiKey:"AIzaSyAh7...",
  authDomain:"icg-slp.firebaseapp.com",
  projectId:"icg-slp"
};

firebase.initializeApp(firebaseConfig);
const db=firebase.firestore();

let currentTab="general";
let lastTime=0;
let isAdmin=false;

// ADMIN
const A="MzAxOTE1MzE=";
function activarAdmin(){
  let p=prompt("Ingresa código");
  if(p===atob(A)){
    isAdmin=true;
    localStorage.setItem("owner",getUserId());
    alert("Admin activado");
    render();
  }
}

// USER
function getUserId(){
  let id=localStorage.getItem("uid");
  if(!id){
    id="u_"+Math.random().toString(36).substr(2,9);
    localStorage.setItem("uid",id);
  }
  return id;
}

function getOwner(){ return localStorage.getItem("owner"); }

// MODAL
function openModal(){
  if(currentTab==="info" || currentTab==="fama"){
    alert("No puedes publicar aquí");
    return;
  }
  document.getElementById("modal").classList.remove("hidden");
}
function closeModal(){ document.getElementById("modal").classList.add("hidden"); }

// TIEMPO
function timeAgo(t){
  let d=(Date.now()-t)/1000;
  if(d<60) return Math.floor(d)+"s";
  if(d<3600) return Math.floor(d/60)+"m";
  if(d<86400) return Math.floor(d/3600)+"h";
  return Math.floor(d/86400)+"d";
}

// SCORE
function score(m){ return (m.likes||0)+(m.pinned?1000:0); }

// ADD
async function addMessage(){
  let text=document.getElementById("newMsg").value.trim();
  if(!text) return;
  if(Date.now()-lastTime<4000){ alert("Espera unos segundos"); return; }

  await db.collection("mensajes").add({
    text,
    user:getUserId(),
    likes:0,
    likedBy:[],
    pinned:false,
    timestamp:Date.now(),
    categoria:currentTab
  });

  lastTime=Date.now();
  document.getElementById("newMsg").value="";
  closeModal();
}

// LIKE
async function like(id){
  let ref=db.collection("mensajes").doc(id);
  let doc=await ref.get();
  let data=doc.data();
  let user=getUserId();
  if(data.likedBy?.includes(user)) return;
  await ref.update({
    likes:(data.likes||0)+1,
    likedBy:[...(data.likedBy||[]),user]
  });
}

// DELETE
async function deleteMessage(id){ await db.collection("mensajes").doc(id).delete(); }

// CHANNELS DROPDOWN
function toggleChannels(){
  let dropdown=document.getElementById("channels-dropdown");
  dropdown.classList.toggle("show");
}

// SWITCH TAB
function switchTab(tab){
  currentTab=tab;
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  // Color del borde y nombre del tab principal
  let mainTab;
  if(tab==="trending") mainTab=document.getElementById("tab-trending");
  else if(["general","profesores","experiencias","quejas"].includes(tab)) mainTab=document.getElementById("tab-channels");
  else if(tab==="fama") mainTab=document.getElementById("tab-fame");
  else if(tab==="info") mainTab=document.getElementById("tab-info");
  if(mainTab) mainTab.classList.add("active");

  // Cerrar dropdown
  document.getElementById("channels-dropdown").classList.remove("show");

  // Actualizar texto y color canal
  const display=document.getElementById("current-channel");
  let colorClass="";
  let icon="";
  switch(tab){
    case "general": colorClass="general-color"; icon="💬"; break;
    case "profesores": colorClass="profesores-color"; icon="👨‍🏫"; break;
    case "experiencias": colorClass="experiencias-color"; icon="🧠"; break;
    case "quejas": colorClass="quejas-color"; icon="⚠️"; break;
    case "trending": colorClass=""; icon="🔥"; break;
    case "fama": colorClass=""; icon="🏆"; break;
    case "info": colorClass=""; icon="ℹ️"; break;
  }
  display.textContent=`${icon} Canal activo: ${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
  display.className="current-channel "+colorClass;

  render();
}

// RENDER
function render(){
  let c=document.getElementById("content");
  let search=document.getElementById("searchInput").value.toLowerCase();
  db.collection("mensajes").onSnapshot(snap=>{
    c.innerHTML="";
    let arr=[];
    snap.forEach(d=>arr.push({id:d.id,...d.data()}));

    arr=arr.filter(m=>m.text.toLowerCase().includes(search));

    if(currentTab==="info"){ c.innerHTML=`<div class="info-box">🕶️ Whispr\nPlataforma digital anónima.\n🎯 Misión: expresión libre.\n🔒 Privacidad garantizada.\n⚖️ Normas de uso.\n📌 Nota: app independiente.</div>`; return; }

    if(currentTab==="fama"){
      let hoy=Date.now()-86400000;
      let semana=Date.now()-604800000;

      let topDia=arr.filter(m=>m.timestamp>hoy).sort((a,b)=>score(b)-score(a)).slice(0,6);
      let topSemana=arr.filter(m=>m.timestamp>semana).sort((a,b)=>score(b)-score(a)).slice(0,6);
      let topGlobal=arr.sort((a,b)=>score(b)-score(a)).slice(0,6);

      c.innerHTML+=crearSeccion("🔥 Hoy",topDia);
      c.innerHTML+=crearSeccion("🏆 Semana",topSemana);
      c.innerHTML+=crearSeccion("💎 Historia",topGlobal);
      return;
    }

    if(!["trending","fama","info"].includes(currentTab)){
      arr=arr.filter(m=>m.categoria===currentTab);
    }

    if(currentTab==="trending") arr.sort((a,b)=>score(b)-score(a));
    else arr.sort((a,b)=>b.timestamp-a.timestamp);

    arr.forEach(createMessage);
  });
}

// SALON
function crearSeccion(titulo,data){
  if(data.length===0){ return `<div class="info-box">Sin mensajes aún</div>`; }
  let html=`<div class="fame-section"><div class="fame-title">${titulo}</div><div class="fame-grid">`;
  data.forEach((m,i)=>{
    let colorClass="";
    switch(m.categoria){
      case "general": colorClass="general-color"; break;
      case "profesores": colorClass="profesores-color"; break;
      case "experiencias": colorClass="experiencias-color"; break;
      case "quejas": colorClass="quejas-color"; break;
    }
    html+=`
      <div class="fame-card ${i===0?"fame-top":""} ${colorClass}">
        ${i===0?"👑":""}
        <div>${m.text}</div>
        <div>❤️ ${m.likes}</div>
        <div>${m.categoria}</div>
      </div>
    `;
  });
  html+="</div></div>";
  return html;
}

// UI
function createMessage(m){
  let div=document.createElement("div");
  let isOwner=m.user===getOwner();
  div.className="message "+(isOwner?"owner":"");

  let colorClass="";
  switch(m.categoria){
    case "general": colorClass="general-color"; break;
    case "profesores": colorClass="profesores-color"; break;
    case "experiencias": colorClass="experiencias-color"; break;
    case "quejas": colorClass="quejas-color"; break;
  }

  div.innerHTML=`
    ${isOwner?`<span class="owner-name">👑 Owner</span>`:""}
    <br>${m.text}
    <br><small>${timeAgo(m.timestamp)}</small>
    <br>${m.categoria!=="trending"?`<span class="${colorClass}">${m.categoria}</span>`:""}
    <br>❤️ ${m.likes}
    <br>
    <button onclick="like('${m.id}')">❤️</button>
    ${(m.user===getUserId()||isAdmin)?`<button onclick="deleteMessage('${m.id}')">🗑️</button>`:""}
  `;
  document.getElementById("content").appendChild(div);

  // Bordes con oleaje según canal
  if(["general","profesores","experiencias","quejas"].includes(m.categoria)){
    div.style.border="2px solid";
    switch(m.categoria){
      case "general": div.style.borderColor="#00c0ff"; break;
      case "profesores": div.style.borderColor="#00ff80"; break;
      case "experiencias": div.style.borderColor="#aa00ff"; break;
      case "quejas": div.style.borderColor="#ff4040"; break;
    }
    div.style.animation="waveBorder 3s infinite";
  }
}

render();
