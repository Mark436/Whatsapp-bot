/**
 * convert every time you enter (seconds,minutes,hours,days and weeks) to miliseconds, this is for manipulating date objects in Js
 * @param {number} time is the cuantity to convert ex. 2 in '2 days'
 * @param {string} unit is tye unit you are converting from ex. days in '2 days'
 */
const convertToMilisec = (time, unit)=>{
  const units ={
    "s":()=>time*1000,
    "m":()=>time*60000,
    "h":()=>time*3600000,
    "d":()=>time*86400000,
    "w":()=>time*604800000
  };
  if (!units[unit])return "error:unidad invalida";
  return units[unit]();
};
/**
 * this function converts an string input "1 day" in 2 values 1 and 'd' and return them
 * @param {String} str string to separate in 2 inputs number and unit 
 * @returns Array<[Number,String]> how many and what unit in time
 */
const readStr = str => {
  const num = parseInt(str);
  const unit = str.replace(num,'').trim();
  return {num,unit};
};
/**
 * this functions pics an input like "1 day" and return the equivalent in miliseconds
 * @param {String} time description
 * @returns time converted to miliseconds
 */
function readTime(time){
  if (!time)return null;
  const {num,unit} = readStr(time);
  return convertToMilisec(num,unit);
}
//agregar default al codigo final
module.exports={readTime};