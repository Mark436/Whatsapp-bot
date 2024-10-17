"use strict";
const Funciones = require("./funcionalidades");
const {User}=require("./User")
const WAWebJS = require("whatsapp-web.js");

class RootUser extends User{
    #id;
    constructor(identifier){
      this.#id=identifier;
    }
    getId(){return this.#id}
    verify(idToVerify){
      return this.#id===idToVerify
    }
}
class Root{
  #data=null;
  #reader;
  constructor(client,mainChat){
    if(!client||!mainChat)throw new Error(`${!mainChat?'mainchat':'client'} undefined`)
    if((client instanceof WAWebJS.Client)&&typeof mainChat!="string")throw new Error("You have to define client and mainchat properly")

      this.#data=new Data({
      mainChat,
      client,
    })

    this.#reader=new Reader(this.#data);
  }
  #setRootUser(identifier){
    //rootUser no existe
    if(!this.#data.rootUser){
      this.#data.rootUser=new RootUser(identifier)
    }
    //rootUser existe
    if(this.#data.isRoot(identifier))return 'Ya es root el usuario'//se quiere cambiar por el mismo usuario
    
    this.#data.usersManager.replaceRoot(this.#data.rootUser.getId())
  }

  /**
   * every message goes through here
   * @param {WAWebJS.Message} msgObj message representation as object
   */
  read(msgObj){
    msgObj=this.#reader.readMsg(msgObj)
    if(!msgObj)return

    Funciones.read(msgObj,this.#data)
  }
}

class Data{
  isData=true;
  constructor({mainChat,protocols,client}){
    this.protocols=protocols
    this.usersManager=new UsersManager(null)
    this.chatsManager=new ChatsManager(client,mainChat)
  }
  isRoot(idToVerify){
    if(!this.usersManager.rootUser)return false //rootUser no existe
    return this.usersManager.rootUser.verify(idToVerify)
  }
  replaceRootUser(newRootId){
    if(this.isRoot(newRootId))return//se quiere reemplazar por el mismo usuario que ya esta definido
    
    this.usersManager.rootUser=newRootId
    this.chatsManager.sendMsg(`Root ha sido cambiado a${newRootId}`)
    this.chatsManager.sendMsg(`Root ha sido cambiado a${newRootId}`,newRootId)
  }
  
}
class Reader{
  #dataObj;
  #usersManagerCommands={ADD:true,REMOVE:true,GACCES:true,RACCES:true}
  constructor(dataObj){
    this.#dataObj=dataObj
  }
  #msgFormater(msg){
    const {fromMe,from,to}=msg
    const rootAcces=this.#dataObj.isRoot(from)
    const msgTarget=fromMe?to:from
    const userName=this.#dataObj.chatsManager.getChatById(from)??null
    const userObj=this.#dataObj.usersManager.getUserById(from)??null

    let bodyArr=msg.body.trim().replace("\n"," ").split(" ")
    
    // if(!msg.body.endsWith(";"))return msg.comando=this.#symbolComands(msg,true)?'symbol':null;
    msg.body=msg.body.replace(/(quiero)/i,'').slice(0,-1)
    msg.bodyArr=msg.body.trim().replace("\n"," ").split(" ")
    
    const comando=msg.bodyArr[0].toLowerCase()
    msg.body=msg.body.replace(msg.comando,'')
    return {...msg,bodyArr,rootAcces,msgTarget,userObj,userName,bodyArr,comando}
  }
  readMsg(msg){
    if(msg.fromMe&&msg.body=='&$')return {...msg,comando:'login'}
    if(msg.body=='&$?')return {...msg,comando:'login'}
    
    msg=this.#msgFormater(msg)
    if(!msg.rootAcces||!msg.userObj)return null
    return msg
  }
}
class UsersManager{
  #users={}
  #usersById={}
  constructor(rootUser){
    this.rootUser=rootUser
  }
  /**
   * @param {String} userName user Name to find
   * @returns {User} user object from the users list
   */
  getUser(userName){
    return this.#users[userName]??null
  }
  /**
   * @param {String} userId user Id to find
   * @returns {User} user object from the users list
   */
  getUserById(userId){
    return this.#usersById[userId]??null
  }
  /**
   * @param {String} name user name 
   * @param {String} id user id 
   */
  addUser(name,id){
    if(this.getUserById(id))throw new Error(`El usuario ${name} ya existe`)
    if(this.getUser(name)){
      const usersSize=(this.#users.keys()).length
      let i;
      for(i=1;i<=usersSize;i++){
        if(this.#users[`${name}${i}`]??false)break
      }
      name=`${name}${i}`
    }
    const current=new User(name,id)
    this.#users[name]=current
    this.#usersById[id]=current
  }
  /**
   * @param {String} user The user to remove 
   */
  removeUser(user){
    if(!(this.getUserById(user)&&this.getUser(user)))throw new Error(`El usuario que se intenta remover no existe`)
    
    if(this.getUser(user)){
      delete this.#usersById[this.#users[user].id]
      delete this.#users[user]
      return
    }
    delete this.#users[this.#usersById[user].name]
    delete this.#usersById[user]
  }

}
class ChatsManager{
  #chats={}
  #chatsById={}
  mainChat=''
  #online=false
  constructor(client,mainChat){
    this.#setup(client)
    this.mainChat=mainChat
    this.client=client
  }
  async #setup(client){
    const chats = await client.getChats();
    for (const chat of chats){
      this.#chats[chat.name.toLowerCase()]=chat.id._serialized
      this.#chatsById[chat.id._serialized]=chat.name.toLowerCase()
    }
  }
  getChatById(id){
    return this.#chatsById[id]
  }
  getChat(name){
    return this.#chats[name]
  }
  sendMsg(message,chat=mainChat,options){
    if(!this.#online)setTimeout(()=>this.sendMsg(message,chat))
    else{
      this.sendMsg=()=>{
        this.client.sendMessage(chat,message,options)
      }
    }  
  }
}
module.exports= Root;

//pendientes:/Agregar la opción de agregar permisos temporales a los usuarios