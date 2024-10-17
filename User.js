const {readTime}=require("./tiempo")
const {InputError, AutorizationError}=require("./errores")
class User{
    #active=true;
    #activityTimer;
    #accesiblePrograms=new Set(["ayuda","buscar","descargar","ver"]);
    #temporallyInactive=new Set();
    user=true
    static #noTimeoutPrograms=new Set(["ayuda","buscar"]);
    static isTimeoutProgram(programName){
      return !this.#noTimeoutPrograms.has(programName)
    }
    /**
     * 
     * @param {String} userName sets name value
     * @param {String} userId sets id value
     */
    constructor(userName,userId){
      this.name=userName
      this.id=userId
    }
    /**
     * @param {String} programName is the program to know if is accesible
     * @returns if the user has acces to that program
     */
    hasAccesTo(programName=''){
      programName.toLowerCase()
      if(programName.length>0)return this.#accesiblePrograms.has(programName)
      let available="";
      for(const program of this.#accesiblePrograms)available+=`-${program}\n`; 
      return available
    }
    /**
     * 
     * @param {String} programName is the program to get acces
     * @param {msg} msg reads rootAcces prop
     * @param {Number} time is the minutes with acces to the program if not defined it's forever 
     * @returns void
     */
    giveAccesTo(programName,time){
      programName=programName.toLowerCase()
      if(this.hasAccesTo(programName))throw new InputError("El usuario ya tiene acceso al comando "+programName,{visible:true});
      if(time)setTimeout(()=>{
        this.#accesiblePrograms.delete(programName)
      },readTime(time))

      this.#accesiblePrograms.add(programName)
      return this.#accesiblePrograms
    }
    /**
     * 
     * @param {String} programName 
     * @param {msg} msg reads rootAcces prop
     * @returns void
     */
    removeAccesTo(programName){
      programName=programName.toLowerCase()
      if(!this.hasAccesTo(programName))throw new InputError("El usuario no tiene acceso al comando "+programName,{visible:true});
      this.#accesiblePrograms.delete(programName)
      return this.#accesiblePrograms
    }
    getActive(){
      return this.#active
    }
    #setActive(state){
      this.#active=state
      if (!state)return clearTimeout(this.#activityTimer);
      
      clearTimeout(this.#activityTimer);
      this.#activityTimer=setTimeout(
          ()=>this.#setActive(false)
        ,120000)
    }
    calling(programName){
      programName=programName.toLowerCase()
      if(this.#temporallyInactive.has(programName))throw new AutorizationError(`El programa ${programName} está inactivo por el momento`,{visible:true})
      if(!this.hasAccesTo(programName))throw new AutorizationError(`${this.name} has no acces to ${programName}`,{return:"No access"})
      this.#setActive(true)
      if(!User.isTimeoutProgram(programName))return 'noTimeoutProgram'

      this.#accesiblePrograms.delete(programName)
      this.#temporallyInactive.add(programName)
      setTimeout(()=>{
        this.#temporallyInactive.delete(programName)
        this.#accesiblePrograms.add(programName)
      },900000)
      return 'timeoutProgram'
    }
    shutDown(){
      clearTimeout(this.#activityTimer)
      this.#activityTimer=null
      this.#setActive(false)
      return{active:this.#active,timer:this.#activityTimer}
    }
  }
module.exports={User,tests:new User("Tester0","0Tester")}
