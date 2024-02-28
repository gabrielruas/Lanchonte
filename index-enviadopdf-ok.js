const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const commander = require('commander');
const axios = require('axios');
const urlRegex = require('url-regex');
const fetch = require('node-fetch');

const STICKER_COMMAND = "/sticker";

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
  ffmpegPath,
  puppeteer: puppeteerConfig,
});

logDebug("Starting...");

const generateFile = async (msg, sender) => {
  logDebug("Processing message ", msg.type, JSON.stringify(msg.body, null, 4));
  await msg.reply("⏳ Processando, aguarde...");

  try {
    if (msg.type === "image" || msg.type === "video" || msg.type === "chat") {
      const url = msg.body.split(" ").find(elem => urlRegex().test(elem));

      if (url) {
        await processURL(sender, url);
      } else {
        msg.reply("❌ Erro, URL inválida!");
      }
    }
  } catch (error) {
    console.error("Error processing message:", error);
    msg.reply("❌ Erro ao gerar Sticker!");
  }
};

///////////////////////////////////////// Login /////////////////////////////////////////

const login = async () => {
  try {
    const result = await axios.post("http://144.22.129.72:80/auth/signin", {
      username: "leandro",
      password: "admin123"
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

const processURL = async (sender, url) => {
  try {
    const token = await login();
    const pdfDownloadUrl = "http://144.22.129.72:80/api/file/v1/downloadFile/20231108781122608.pdf";

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
    console.error("Error processing URL:", error);
    throw error;
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

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Wpp-Sticker is ready!');
});

client.on('message_create', async msg => {
  if (msg.body.split(" ").includes(STICKER_COMMAND)) {
    const sender = msg.from.startsWith(client.info.wid.user) ? msg.to : msg.from;
    await generateFile(msg, sender);
  }
});

client.initialize();
