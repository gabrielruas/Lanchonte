const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const commander = require('commander');
const axios = require('axios');
const fetch = require('node-fetch');

const HOLERITE_COMMAND = "Holerite";

const MediaType = {
  PDF: { contentType: "application/pdf", fileName: "file.pdf" },
};

commander
  .usage('[OPTIONS]...')
  .option('-d, --debug', 'Show debug logs', false)
  .option('-c, --chrome <value>', 'Use an installed Chrome Browser')
  .option('-f, --ffmpeg <value>', 'Use a different ffmpeg')
  .parse(process.argv);

const options = commander.opts();

const logDebug = options.debug ? console.log : () => {};

const puppeteerConfig = !options.chrome ? {} : { executablePath: options.chrome, args: ['--no-sandbox'] };
const ffmpegPath = options.ffmpeg ? options.ffmpeg : undefined;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: puppeteerConfig,
  ffmpegPath,
});

logDebug("Starting...");

const generateHolerite = async (msg, sender) => {
  logDebug("Processing message ", msg.type, JSON.stringify(msg.body, null, 4));
  await msg.reply(
    "⏳ Processando, aguarde...\n" +
    "Olá, sou o Atendente Virtual do setor de Recursos Humanos. Não posso responder a mensagens nem atender ligações. Por favor, digite o número da opção desejada: !!\n" +
    "Escolha uma opção:\n" +
    "1. Baixar Holerite\n" +
    "2. Mudar Senha"
  );

  try {
    const option = await requestInput(client, msg.from, " digite o número da opção desejada:");                                             
    if (option === "1") {
      await baixarHolerite(msg, sender);
    } else if (option === "2") {
      await mudarSenha(msg, sender);
    } else {
      client.sendMessage(sender, "❌ Opção inválida!");
    }
  } catch (error) {
    console.error("Error processing holerite:", error);
    client.sendMessage(sender, "❌ Erro ao processar holerite!");
  }
};

const baixarHolerite = async (msg, sender) => {
  logDebug("Processing message ", msg.type, JSON.stringify(msg.body, null, 4));
  await msg.reply("⏳ Processando, aguarde...");

  try {

    //////////////////////////////////////      enviar imagem inicio ///////////////////////////////////////////

    logDebug("Processing message", msg.type, JSON.stringify(msg.body, null, 4));

    const imageUrl = "https://marketplace.canva.com/EAE4oyNKDGk/1/0/1131w/canva-card%C3%A1pio-e-menu-para-hamburgueria%2C-restaurante%2C-lanchonete-gourmet-bX6NutaLY_c.jpg";

    if (imageUrl) {
      logDebug("URL:", imageUrl);
      try {
        const { data, headers } = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(data, 'binary').toString('base64');

        if (headers['content-type'] && headers['content-type'].includes("image")) {
          const mediaType = MediaType.Image; // Certifique-se de definir `MediaType` conforme necessário.
          const fileName = (msg.body.caption) ? msg.body.caption + ".jpg" : "cardapio.jpg"; // Use a legenda da mensagem se disponível, caso contrário, use um nome padrão.
          
          const media = new MessageMedia(mediaType, imageBuffer, fileName);
          await client.sendMessage(sender, media);
        } else {
          await client.sendMessage(sender, "❌ Erro, o conteúdo da URL não é uma imagem!");
        }
      } catch (error) {
        console.error("Error fetching image:", error);
        await client.sendMessage(sender, "❌ Erro ao obter a imagem da URL!");
      }
    } else {
      await client.sendMessage(sender, "❌ Erro, URL inválida!");
    }


    //////////////////////////////////////      enviar imagem fim ///////////////////////////////////////////

    // Digite o numero do lanche 
    const numero = await requestInput(client, msg.from, "Entre com numero do pedido EX 1 ou 2 ou 3 ou 5 ou 6 ou 7' ");

    // Solicitar nome
    const Nome = await requestInput(client, msg.from, "Informe seu nome ");

    // Solicitar endereço e paghamneto
    const Endereco = await requestInput(client, msg.from, "Informe seu endereço");
    const pagamento  = await requestInput(client, msg.from, "Informe a forma de pafamento 1 cartao 2 pix 3 dinheiro ");
    const cpf = await requestInput(client, msg.from, "Para maior trasparecia poderia entra com seu cpf ");

    console.log('resusltado dos dados de entrada', cpf+numero+Nome+Endereco+pagamento);

 
  } catch (error) {
    console.error("Error processing holerite:", error);
    client.sendMessage(sender, "❌ erro ao processar o pedido.");
  }
};

const mudarSenha = async (msg, sender) => {
  try {
    await msg.reply("⏳ Processando, aguarde...");

   
      console.log('chamar mesa');


    
  } catch (error) {
    console.error("Error processing holerite:", error);
    client.sendMessage(sender, "❌ Erro ao processar holerite!");
  }
};




const sendMediaFilepdf = async (sender, type, data) => {
  if (type.contentType === MediaType.PDF.contentType) {
    const media = new MessageMedia(type.contentType, data, type.fileName);
    await client.sendMessage(sender, media);
  } else {
    console.error("Unsupported media type");
    // Trate outros tipos de mídia (imagem, vídeo) aqui, se necessário
  }
};

// Função para solicitar input do usuário no WhatsApp
const requestInput = async (client, user, prompt) => {
  await client.sendMessage(user, prompt);
  return new Promise(resolve => {
    client.on('message', async message => {
      if (message.from === user) {
        resolve(message.body);
      }
    });
  });
};

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  


  console.log(` ok servidor ON-LINE`);



  
});

client.on('message_create', async msg => {
  if (msg.body.split(" ").includes(HOLERITE_COMMAND)) {
    const sender = msg.from.startsWith(client.info.wid.user) ? msg.to : msg.from;
    await generateHolerite(msg, sender);
  }
});

client.initialize();
