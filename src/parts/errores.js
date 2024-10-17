//PENDING REWORK
class selfErrors extends Error{
  constructor(message,options){
    super(message);
    this.setIsVisible(options.visible??false);
    this.setId(options.id);
    this.setName(options.name);
    this.return=options.return??null;
  }
  #visible=null;
  #id;
  #name;
  setIsVisible(show){
    if (this.#visible!=null){
      console.log("Visibility is already defined");
      return;
    }
    this.#visible=show;
  }
  setId(id){
    if (this.#id){
      console.log("Id already defined");
      return;
    }
    this.#id=id;

  }
  setName(name){
    if(this.#name){
      console.log("Name already defined");
      return;
    }
    this.#name=name;
  }
  getIsVisible(){
    return this.#visible;
  }
  getId(){
    return this.#id;
  }
  getName(){
    return this.#name;
  }
  get getIsCustom(){
    return true;
  }
}
class ChatsDBError extends selfErrors{
  constructor(message,options={}){
    options.visible=false
   super(message,{name:"ChatsError",id:0,...options});
  }
}
class LoginError extends selfErrors{
  constructor(message,options){
    super(message,{...options,name:"LoginError",id:1})
  }
}
class DefinitionError extends selfErrors{
  constructor(message,options){
    super(message,{...options,name:"DefinitionError",id:2})
  }
}
class NameError extends selfErrors{
  constructor(message,options){
    super(message,{name:"NameError",id:3,...options})
  }
}
class AutorizationError extends selfErrors{
  constructor(message,options){
    super(message,{name:"AutorizationError",id:4,...options})
  }
}
class InputError extends selfErrors{
  constructor(message,options){
    super(message,{name:"InputError",id:5,...options})
  }
}


module.exports={ChatsDBError,LoginError,DefinitionError,NameError,AutorizationError,InputError};