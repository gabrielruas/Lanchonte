const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const commander = require('commander');
const axios = require('axios');
const fetch = require('node-fetch');

const HOLERITE_COMMAND = "/holerite";

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
  await msg.reply("⏳ Processando, aguarde...");

  try {
    // Solicitar CPF
    const cpf = await requestInput(client, msg.from, "Informe o CPF:");

    // Informar que a próxima mensagem será a senha
    await client.sendMessage(msg.from, "A próxima mensagem será a senha. Digite-a com segurança.");

    // Solicitar senha
    const senha = await requestInput(client, msg.from, "Informe a senha:");

    // Solicitar mês e ano
    const mes = await requestInput(client, msg.from, "Informe o mês:");
    const ano = await requestInput(client, msg.from, "Informe o ano:");

    // Realizar o login
    const token = await login(cpf, senha);

    // Processar URL
    const pdfDownloadUrl = "http://144.22.129.72:80/api/file/v1/downloadFile/"+ano+mes+cpf+".pdf";
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token}`);
    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow'
    };
    const pdfData = await fetch(pdfDownloadUrl, requestOptions).then(response => response.buffer());
    const pdfBase64 = Buffer.from(pdfData).toString('base64');
    await sendMediaFilepdf(sender, MediaType.PDF, pdfBase64);

  } catch (error) {
    console.error("Error processing holerite:", error);
    client.sendMessage(sender, "❌ Erro ao processar holerite!");
  }
};

///////////////////////////////////////// Login /////////////////////////////////////////

const login = async (cpf, senha) => {
  try {
    const result = await axios.post("http://144.22.129.72:80/auth/signin", {
      username: cpf,
      password: senha
    });

    const accessToken = result.data.accessToken;
    console.log("Access Token:", accessToken);
    return accessToken;
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

///////////////////////////////////////////////////////////////////////////////////////

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
  console.log('Wpp-Holerite is ready!');
});

client.on('message_create', async msg => {
  if (msg.body.split(" ").includes(HOLERITE_COMMAND)) {
    const sender = msg.from.startsWith(client.info.wid.user) ? msg.to : msg.from;
    await generateHolerite(msg, sender);
  }
});

client.initialize();
