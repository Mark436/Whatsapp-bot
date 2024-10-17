"use strict";
const {programMsg}=require("./programarMensajes.js");
const {ChatsDBError,LoginError,DefinitionError,NameError,AutorizationError}=require("./errores.js");
const buscarVideo=require("./../apis/search.js");
const {watchRoute}=require("./../apis/une.js");
const downloader=require("./../apis/ytdl.js");
//nota: se puede acceder a las propiedades de el objeto privado funciones desde el objeto utilizando la clase
/**
 * manage all the funciones logic inside it
 */
class Funciones {
//password private field
static #password=1234;
static #miniroot=null;
static publicPrograms=new Set(["buscar","descargar","ayuda","ver"]);
static #inProcess=new Map();
//external
static setProtocol({protocol,status}){
  
}
//internal
static async #findVideo(searchTerm, to) {
  let fakeI=0.5;
  console.log("buscando" +searchTerm)
  const searchResults=await buscarVideo(searchTerm);
  
  for (const {title,url} of searchResults){
    const videoInfo=`${title}\n${url}`;
    
   setTimeout(()=>this.#miniroot.sendMsg(videoInfo,to),fakeI*1000);
   fakeI++;
  }
}
static async #descargarYt({searchTerm, to,audio=null }) {
  searchTerm=searchTerm.replace("https://www.youtube.com/watch?v=",'')
  console.log(
      `descargando el ${audio?'audio':'video'} con id ${searchTerm}
    enviandolo a ${to}`);
  try{
    const file=await downloader({videoId:searchTerm,audioOnly:audio})
    this.#miniroot.sendMedia(file,to,{erase:true})
  }
  catch(e){
    this.#miniroot.sendMsg("Probablemente ese video no esté disponible, prueba con otro,\nde no funcionar lo más seguro es que no se pueda descargar videos por el momento",to)

    console.log(e)
  }
}
static async #verRuta(ruta,to){
  let fileName;  
  const cacheDir="./cache/"
  try{
    fileName=await watchRoute(ruta,cacheDir)
    this.#miniroot.sendMedia(cacheDir+fileName,to,{caption:"Viendo la "+ruta,erase:true})
  }catch(e){
    if(e.return)return this.#miniroot.sendMsg(`No se encontró la ruta *${ruta}*\nRecuerda que el formato es:\nver la ruta (numero) (nombre).\nLas rutas disponibles son:\n${e.return}`,to)
    this.#miniroot.sendMsg("Comando ver no encontrado")
    console.log("🚀 ~ file: funcionalidades.js:43 ~ Funciones ~ #verRuta ~ e:", e)
  }
  
}
static #funciones={
  "ayuda": ( { msgTarget, rootAcces}) => {
  rootAcces?//reincorporar los reply cuando funcionen de nuevo (en vez del #miniroot.sendMsg)
  this.#miniroot.sendMsg(`Los comandos disponibles son:\nayuda\nprogramar\nejecutar código\nprotocolo salivación
  Protocolo princess\nbuscar videos en youtube\ndescargar videos de youtube\ncerrar sesión`,msgTarget)
  :this.#miniroot.sendMsg(`Los comandos disponibles son:\nayuda\nbuscar(términos a buscar)\ndescargar(link)\nVer la ruta(opcional) (numero) (nombre) para ver una ruta UNE\n"&" para cerrar sesión`,msgTarget)
  },
  "pruebas": ({rootAcces}) => {
    if (!rootAcces)throw new AutorizationError("No hay permiso de acceso");
    let a=[1, 2];
    let b=[0];
    b.push(...a);
    console.log(b);
    console.log('prueba');
    this.#miniroot.sendMsg("pruebas");
  },
  //searchYt
  "buscar": ({body, msgTarget}) => {
    const searchTerm=body.replace(/(buscar)/i,'')
      if(searchTerm.length==0)throw new DefinitionError("No se encontró el termino a buscar",{visible:true})
      
      this.#findVideo(searchTerm, msgTarget);
  },
  //downloadYt
  "descargar": ({bodyArr, msgTarget}) => {
      let audio=false;
      if (bodyArr[bodyArr.length - 1] === 'audio'){
        audio=true;
        bodyArr.pop();
      }
     const searchTerm=bodyArr[1];
     this.#descargarYt(
        {searchTerm,
          to:msgTarget,
          audio}
     )
  },
  "ver":async({body,msgTarget})=>{
    const ruta=body.replace(/\b(?:(la)?\s+ruta|l[ií]nea)\b/i,'').trim()
    this.#verRuta(ruta,msgTarget)
  },
  //programm Msg
  "programar": ({body,fromMe,from,to,msgTarget}) => {
   console.log('COMANDO PROGRAMAR!!!!')
   const filters={
    "tiempo":/en (\d+)(?: ?)[smhdw]/i,
    "hora":/las \d{1,2}:\d{2}/i,
    "fecha":/el \d{2}?\d{2}(\/)?\d{1,2}?(\/)\d{1,2}?(\/)\d{1,2}?(\/)\d{1,2}?(\/)\d{1,2}?/i,
    "chat":/para (.*?)\./i,
   };
   let mensaje,tiempo,chat,fecha;
   try{
   mensaje=
   (entrada=>{
    const start=entrada.indexOf(";")+1;
    
    if (!(start>0))throw new DefinitionError("mensaje no definido",{visible:true});

    let msgToSend=
    body
    .substring(start)
    .trim();
    
    msgToSend=
    `${
    msgToSend
    .charAt(0)
    .toUpperCase()}${
    msgToSend
    .substring(1)
    }`;
    
    body.replace(msgToSend,'');
    
    return msgToSend;
   })(body);
   tiempo=
   (body=>{
    if (!filters.tiempo.test(body))return null;
    
    const tiempoToSend=body.match(filters.tiempo);
    
    body.replace(tiempoToSend,'');
    
    return tiempoToSend[0].replace("en ",'');
   })(body);
   chat=
   (entrada=>{
     if (!filters.chat.test(entrada))return null;
     
     const chatName=
     entrada
     .match(filters.chat)[0]
     .replace(".",'')
     .replace("para ",'')
     .toLowerCase();
     
     body.replace(chatName,'');

     if (!this.#miniroot.chats.size>0)throw new ChatsDBError("Chats sin definir");
     
     if (!this.#miniroot.chats.has(chatName))throw new NameError(`No se encontró el chat con ${chatName}`,{visible:true});
     
     return this.#miniroot.chats.get(chatName);
   })(body);
   fecha=
   (entrada=>{
     if (tiempo||!filters.fecha.test(entrada))return null;
     
     const date=entrada.match(filters.fecha)[0].replace('el','')
     return date.trim();
   })(body);
  }catch(e){
   if(!e.getId)throw e
   if (e.getId()===0){
    setTimeout(()=>{
     this.#funciones["programar"]({body,fromMe,from,to});
    },1000);
    return;
   }
   throw e
  }
  const bodyToSend= {tiempo,mensaje,chat,fecha};
   
   console.log(bodyToSend);
   programMsg(bodyToSend,(mensaje,chat)=>{
    this.#miniroot.sendMsg(mensaje,chat);
   });
  },
  //protocol salvation y vinculation
  "protocol": ({body,bodyArr,from,msgTarget,rootAcces}) => {
  const protocol=bodyArr[1]??null;
  if (protocol?.startsWith('s')) {
   const clave=bodyArr[bodyArr.length-1];
   
   if (clave==this.#password){
    //codigo para el protocolo
    if (rootAcces)throw new LoginError("Inicio de sesión innecesario",{visible:true});
    
    this.#miniroot.setRoot(from,{protocol:'salvation'})
    return;
   }
   
   this.#miniroot.sendMsg("Contraseña incorrecta",msgTarget);
   this.#miniroot.sendMsg(`Intento fallido de iniciar el protocolo salvación por: ${from}`);
   
   return;
  }
  if(!rootAcces)throw new AutorizationError("No acces")
  //protocol vinculation
  if (protocol?.startsWith('v')&&rootAcces){
    //separar los numeros de los 2 chats
    const [chat1,chat2]=body.filter(str=> /^[0-9]+$/.test(str));
    console.log(`chat 1: ${chat1} chat 2: ${chat2}`)
    // this.#miniroot.sendMsg(`Vinculando con ${chat2}`,chat1)
    // if(bodyArr[2]==='avisar')this.#miniroot.sendMsg(`Vinculando con ${chat1}`,chat2)
   return;
  }
  throw new NameError(`No se reconoció el protocolo ${protocol}`,{visible:true});
  },
  //run code
  "ejecutar": ({body}) => {
  const codigo=`{${body.substring(body.indexOf(":")+1)}}`;
  (()=>{new Function(codigo)();})();
  }
};
static read(msg,miniroot){
  this.#miniroot=miniroot;
  const {msgTarget,rootAcces,comando,userObj}=msg;
  const userHasAcces=comando==="protocol"?true:userObj?.hasAccesTo(comando)??false
  if(!this.#funciones[comando]||(!rootAcces&&!userHasAcces)){
    this.#miniroot.sendMsg(`Comando ${comando} no encontrado`,msgTarget)
    return;
  }
  console.log(msg.body)
  try{
    userObj?.calling(comando)
    this.#funciones[comando](msg);
  }catch(e){
    if(!e.getIsCustom)throw e;
    if(e.getIsVisible()){
      this.#miniroot.sendMsg(e.message,msgTarget)
      console.log(e.getName()+":\n"+e);
      return;
    }
    if(e.return==="No acces")this.#miniroot.sendMsg(`Comando ${comando} no encontrado`,msgTarget);
    
    if(typeof e.getId==='function')console.log(`Error ID: ${e.getId()??"No se encontró el ID"}\n Name: ${e.getName()??"No se encontró el nombre"}`)
  }
  }
static exists(command,{rootAcces}){
  if(!rootAcces)throw new AutorizationError("No se detectó acceso root",{visible:true})
  if(this.#funciones[command]!=undefined)return true 
  return false
}
};
//test input
// Funciones.read(`programar cancion el triste audio`, { fromMe: false, from: "other", to: "other1" }, "other1",(msg)=>{console.log(msg)});
module.exports=Funciones;
