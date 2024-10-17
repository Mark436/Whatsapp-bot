console.log('hola')
//modules from nodejs
require('dotenv').config();
const { Client, LocalAuth  } = require('whatsapp-web.js');

const Root = require("./src/parts/root");//root

let root;
console.log(1)
//client definition, events and initialization
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      headless:false
      },
}); 
//client events
client.on('qr', qr => {console.clear();require("qrcode-terminal").generate(qr,{small:true});});
client.on('ready', () => {
  console.clear();
root = new Root(client,process.env.grupo);

  client.sendMessage(process.env.grupo,'Iniciado.');
  console.log("Iniciado.")
});

client.on("message_create",(msg)=>{root.read(msg)})
//initialization
client.initialize();

//programa