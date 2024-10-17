const {readTime} = require("./tiempo.js");
const DB=require('../apis/DBLogic.js');
/**
 * @param {string} fecha time in a string formatted year/month/day/hour/minutes/seconds all have the default value
 * @param {string} tiempo time in a string like in "10 seconds"
 * @return the time left until the message have to be sent
 */
function timeDif({fecha,tiempo}){
  let tiempoRestante;
  if (tiempo){
    tiempoRestante=readTime(tiempo);
  }
  else if (fecha){
  //los meses son como un array en js por eso se resta 1 al index para bajarlos al rango de 0 a 11
  const [year,monthIndex,day,hour,minutes,seconds]=fecha.split("/").map(numb=>parseInt(numb));  
    tiempoRestante=(new Date(year?year:0,(monthIndex&&monthIndex<13?monthIndex-1:0),day?day:0,hour?hour:0,minutes?minutes:0,seconds?seconds:0)-new Date());

  }
  return tiempoRestante;
}
/**
 * makes a unique id to store a msg in the DB
 * @param {Object} timeToSend is the date object of the sending date
 * @param {string} mensaje message to send 
 * @param {string} chat name of the chat to send the message
 */
function getMsgID({timeToSend,mensaje,chat}){
  let numeroRandom=Math.floor(Math.random()*10000);
  let id =`${numeroRandom}${new Date().getTime()}`;
  return id;
}

/**
 * store the message in the pending database and starts the timeout to send it
 * @param {number} tiempoRestante the milliseconds left to send the msg
 * @param {string} mensaje message to send
 * @param {string} chat chat to send the message to
 */
function program({tiempoRestante,mensaje,chat},sendMsg){
  const timeToSend = new Date();
  timeToSend
  .setMilliseconds(new Date().getMilliseconds()+tiempoRestante);
  const id = getMsgID({timeToSend,mensaje,chat});
  const msg = {
    timeToSend,
    body:mensaje,
    chat,
    id
  };
  addToDB(msg);
  setTimeout(()=>{
   sendMsg(mensaje,chat);
   removeFromDB(id);
  },tiempoRestante);
  console.log('mensaje programado para: '+timeToSend.toLocaleString())
  return `programado:${tiempoRestante},chat:${chat}`
}
/**
 * depura la informacion del mensaje para establecer el timeout y guardar en base de datos
 * 
 */
function programMsg({fecha,tiempo,mensaje,chat,id,timeToSend,body},sendMsg){
  //en caso de estar pendiente por un reinicio verifica si tiene id y lo programa para su hora original
  if (id&&timeToSend&&body){
    const tiempoRestante = timeToSend-new Date();
    const mensaje=body;
    //ya está pendiente el mensaje asi que se verifica que no haya pasado la fecha
    if (tiempoRestante<0){
      timeToSend=new Date(timeToSend)
      sendMsg(`el mensaje: ${mensaje} ya se venció, era para: ${chat} el ${timeToSend.toLocaleDateString()} a las ${timeToSend.toLocaleTimeString()} `)
      return;
    }
    //se elimina de la base de datos y se vuelve a programar como si fuera un mensaje nuevo
    removeFromDB(id);
    console.log("Renovando mensaje" + id)
    sendMsg(program({tiempoRestante,mensaje,chat},sendMsg))
    return;
  }
  const tiempoRestante=timeDif({fecha,tiempo});
  console.log("tiempo restante: "+tiempoRestante)
  if (tiempoRestante<0)throw new Error("La fecha ya pasó");
  return program({tiempoRestante,mensaje,chat},sendMsg);
}
/**
 * check the messages database 
 * ask to send, and send, the pending messages which weren't send
 */
function setupMsgStorage(){
  //revisar si la base de datos tiene mensajes pendientes o atrasados
  if (mensajesPendientes){
    const pendingMsg =[];
    for (const msg of pendingMsg)programMsg(msg);
  }

}
/**
 * adds the msg to the messages data base
 * @param {pendingMsg} msg is the message to add
 */
function addToDB(msg){
console.log(`adding ${JSON.stringify(msg)} to the DB`)
}
/**
 * remove the msg to the messages data base
 * @param {pendingMsg} msg is the message to remove
 */
function removeFromDB(msgID){
  console.log(`removing this ID:${msgID} from the DB`)
}
//agregar default en codigo final
module.exports={ programMsg ,setupMsgStorage };
//JSON example
/*
const json={
   "messages":{
    "msg1":{
      "body":"hola",
      "date":"july 1st 2024 13:10",
      "chat":"joseph",
      "status":"pending",
    },
   },
};
*/