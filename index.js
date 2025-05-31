require('dotenv').config();


const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const MessagingResponse = twilio.twiml.MessagingResponse;
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

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

    {mediaUrl: 'https://res.cloudinary.com/daim1whzg/video/upload/v1748670327/oxdts8ozpij1ialvff6w.mp4'},

    { body: 'En *Cursalia*,  también te mando estas OTRAS *Plantillas* 💅'},

    {
      mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748675525/ljndiglpx2jpfndcvpnc.jpg'
    },

    {
      body: '🚨Y te mando ESTOS 2 CURSOS PREMIUM📽',
      mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748670566/buju7kmonlpdgaotrtqk.jpg'
    },

    // Imágenes sueltas
    { mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748675726/mslqxiutii6h8xgxbihx.jpg' },
    { mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748675726/aud7bj5prqkxphgkgnpt.jpg' },
    { mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748675727/lamwp5ggodqmmplihvzd.jpg' },
    { mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748675727/dg0ypiwawuykz5vjnz1f.jpg' },
    { mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748675727/hjkx0mscbtyvdbfbyble.jpg' },
    { mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748675727/eyx89zrmvxw83kvnpbcf.jpg' },

    {
      body: '🎁 Estos son los bonos EXTRAS AL COMPRAR CON NOSOTROS',
      mediaUrl: 'https://res.cloudinary.com/daim1whzg/image/upload/v1748675882/sguhjze6c8fcy5irqftk.jpg'
    },

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

      // Espera dinámica: 6s si es video, 3s si es imagen, 1.5s si es solo texto
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

  const twiml = new MessagingResponse();

  if (esMensajeInicial(msg)) {
    twiml.message('⏳ Enviando información detallada, por favor espera un momento...');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());

    await enviarMensajesEnOrden(to);
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
