require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Programar para que se borre todos los días a las 00:00
cron.schedule('0 0 * * *', () => {
  fs.writeFile('usuarios.json', '{}', err => {
    if (err) {
      console.error('❌ Error al limpiar usuarios.json:', err.message);
    } else {
      console.log('✅ usuarios.json reiniciado automáticamente a medianoche.');
    }
  });
});

const MessagingResponse = twilio.twiml.MessagingResponse;
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// 📂 Archivo de usuarios atendidos
const archivoUsuarios = path.join(__dirname, 'usuarios.json');
let usuariosAtendidos = {};

try {
  if (fs.existsSync(archivoUsuarios)) {
    usuariosAtendidos = JSON.parse(fs.readFileSync(archivoUsuarios, 'utf8'));
  }
} catch (err) {
  console.error('Error leyendo usuarios.json:', err);
}

// Detecta intención
function esMensajeInicial(msg) {
  return (
    msg.includes('plantilla') &&
    (msg.includes('info') || msg.includes('interesa') || msg.includes('nailart') || msg.includes('ver'))
  );
}

// Enviar mensajes en orden
async function enviarMensajesEnOrden(to) {
  const from = 'whatsapp:' + process.env.TWILIO_PHONE_NUMBER;

  const mensajes = [
    { body: '👋 ¡Hola! ¿Qué tal? Le mando info:' },
    { mediaUrl: 'https://res.cloudinary.com/daim1whzg/video/upload/v1748675074/xwv8qflpobudqhx585oy.mp4' },
    { body: '🎁 Mira, si te llevas las plantillas *HOY*, te REGALAMOS *9 plantillas más* y *2 CURSOS GRATIS* 🎓💅' },
    { mediaUrl: 'https://res.cloudinary.com/daim1whzg/video/upload/v1748670327/oxdts8ozpij1ialvff6w.mp4' },
    { body: 'En *Cursalia*,  también te mando estas OTRAS *Plantillas* 💅' },
    { mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748675525/ljndiglpx2jpfndcvpnc.jpg' },
    {
      body: '🚨Y te mando ESTOS 2 CURSOS PREMIUM📽',
      mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748670566/buju7kmonlpdgaotrtqk.jpg'
    },
    { mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748675726/mslqxiutii6h8xgxbihx.jpg' },
    { mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748675726/aud7bj5prqkxphgkgnpt.jpg' },
    { mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748675727/lamwp5ggodqmmplihvzd.jpg' },
    { mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748675727/dg0ypiwawuykz5vjnz1f.jpg' },
    { mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748675727/hjkx0mscbtyvdbfbyble.jpg' },
    { mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748675727/eyx89zrmvxw83kvnpbcf.jpg' },
    {mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748675882/sguhjze6c8fcy5irqftk.jpg'},
    
    {body: '🎁 Estos son los bonos EXTRAS AL COMPRAR CON NOSOTROS'},

    {
      body: `👀 El costo es de *75 pesos mexicanos*, te llevarías:\n
EN TOTAL SON *20 PLANTILLAS* DE MÁS DE *200 HOJAS DE PRÁCTICA*\n
⭐ Plantillas nailart *inicial*  
⭐ Plantillas nailart *intermedio*  
⭐ Plantillas *avanzado*  
⭐ *Tutoriales* para que veas cómo se usan las plantillas 📽  
🎁 *CURSO UÑAS ACRÍLICO*  
🎁 *CURSO POLYGEL*`
    }
  ];

  for (let msg of mensajes) {
    try {
      await client.messages.create({
        from,
        to,
        body: msg.body,
        mediaUrl: msg.mediaUrl
      });

      const delay = msg.mediaUrl
        ? msg.mediaUrl.endsWith('.mp4') ? 6000 : 3000
        : 1500;
      await new Promise(res => setTimeout(res, delay));

    } catch (error) {
      console.error('Error enviando mensaje:', error.message);
    }
  }
}

// Ruta webhook
app.post('/webhook', async (req, res) => {
  const msg = req.body.Body.trim().toLowerCase();
  const to = req.body.From;
  const hoy = new Date().toISOString().split('T')[0];

  const twiml = new MessagingResponse();

  if (usuariosAtendidos[to] === hoy) {
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    return res.end(twiml.toString());
  }

  if (esMensajeInicial(msg)) {
    twiml.message('⏳ Enviando información detallada, por favor espera un momento...');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());

    await enviarMensajesEnOrden(to);

    usuariosAtendidos[to] = hoy;
    fs.writeFileSync(archivoUsuarios, JSON.stringify(usuariosAtendidos, null, 2));
  } else {
    twiml.message('🤖 Usa la palabra *plantilla info* o *ver plantillas* para ver la info completa.');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});

// Servidor
app.listen(3000, () => {
  console.log('Bot escuchando en http://localhost:3000');
});
