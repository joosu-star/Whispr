const firebaseConfig={
  apiKey:"AIzaSyAh7...",
  authDomain:"icg-slp.firebaseapp.com",
  projectId:"icg-slp"
};

firebase.initializeApp(firebaseConfig);
const db=firebase.firestore();

let currentTab="ranking";
let lastTime=0;

// 🔐 ADMIN
const A="MzAxOTE1MzE=";
let isAdmin=false;

function activarAdmin(){
  let p=prompt("...");
  if(p===atob(A)){
    isAdmin=true;
    localStorage.setItem("owner",getUserId());
    alert("Admin activo");
  }
}

function getUserId(){
  let id=localStorage.getItem("uid");
  if(!id){
    id="u_"+Math.random().toString(36).substr(2,9);
    localStorage.setItem("uid",id);
  }
  return id;
}

// TERMS
function acceptTerms(){
  localStorage.setItem("terms","yes");
  document.getElementById("terms").style.display="none";
}

if(localStorage.getItem("terms")){
  document.getElementById("terms").style.display="none";
}

// MODAL
function openModal(){modal.classList.remove("hidden");}
function closeModal(){modal.classList.add("hidden");}

// MENSAJE
async function addMessage(){
  let text=newMsg.value.trim();
  if(!text)return;

  if(Date.now()-lastTime<4000)return alert("Espera");

  await db.collection("mensajes").add({
    text,
    user:getUserId(),
    likes:0,
    replies:[],
    timestamp:Date.now()
  });

  newMsg.value="";
  closeModal();
}

// RENDER
function render(){
  let c=document.getElementById("content");
  let search=searchInput.value.toLowerCase();

  db.collection("mensajes").onSnapshot(snap=>{
    c.innerHTML="";
    let arr=[];
    snap.forEach(d=>arr.push({id:d.id,...d.data()}));

    arr=arr.filter(m=>m.text.toLowerCase().includes(search));

    arr.sort((a,b)=>b.likes-a.likes);

    arr.forEach(m=>{
      let div=document.createElement("div");
      div.className="message";

      div.innerHTML=`
      ${m.text}<br>
      ❤️ ${m.likes}
      `;

      c.appendChild(div);
    });
  });
}

render();
