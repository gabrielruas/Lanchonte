const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const commander = require('commander');
const axios = require('axios');
const urlRegex = require('url-regex');
const fetch = require('node-fetch');

const STICKER_COMMAND = "/sticker";

const MediaType = {
  Image: { contentType: "image/jpeg", fileName: "image.jpg" },
  Video: { contentType: "video/mp4", fileName: "image.mp4" },
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

const generateSticker = async (msg, sender) => {
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

const processURL = async (sender, url) => {
  const pdfDownloadUrl = "http://144.22.129.72:80/api/file/v1/downloadFile/20231108781122608.pdf";
  const authToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJsZWFuZHJvIiwicm9sZXMiOlsiQURNSU4iLCJNQU5BR0VSIl0sImlzcyI6Imh0dHA6Ly8xNDQuMjIuMTI5LjcyIiwiZXhwIjoxNzAxOTc4OTYyLCJpYXQiOjE3MDE5NzUzNjJ9.bNee-IjhAilTgTwI8S66xRGmVwUqXmPFgZaTaIj0W2U";  // Substitua com o seu token de autenticação

  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${authToken}`);

  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };

  try {
    const pdfData = await fetch(pdfDownloadUrl, requestOptions).then(response => response.buffer());
    const pdfBase64 = Buffer.from(pdfData).toString('base64');
    
    await sendMediaFilepdf(sender, MediaType.PDF, pdfBase64);

    const { data, headers } = await axios.get(url, { responseType: 'arraybuffer' });
    const mediaType = getMediaType(headers['content-type']);
    const mediaBase64 = Buffer.from(data).toString('base64');
    
    await sendMediaFile(sender, mediaType, mediaBase64);

  } catch (error) {
    console.error("Error processing URL:", error);
    throw error;
  }
};

const getMediaType = (contentType) => {
  if (contentType.includes("image")) {
    return MediaType.Image;
  } else if (contentType.includes("video")) {
    return MediaType.Video;
  } else if (contentType.includes("application/pdf")) {
    return MediaType.PDF;
  } else {
    throw new Error("Unsupported media type");
  }
};

const sendMediaSticker = async (sender, type, data) => {
  const mediaType = type.contentType;

  if (mediaType === MediaType.PDF.contentType) {
    const media = new MessageMedia(mediaType, data, type.fileName);
    await client.sendMessage(sender, media);
  } else {
    const media = new MessageMedia(mediaType, data, type.fileName);
    await client.sendMessage(sender, media, { sendMediaAsSticker: true });
  }
};

const sendMediaFile = async (sender, type, data) => {
  const media = new MessageMedia(type.contentType, data, type.fileName);
  await client.sendMessage(sender, media);
};

const sendMediaFilepdf = async (sender, type, data) => {
  if (type.contentType === MediaType.PDF.contentType) {
    const media = new MessageMedia(type.contentType, data, type.fileName);
    await client.sendMessage(sender, media);
  } else {
    // Trate outros tipos de mídia (imagem, vídeo) aqui, se necessário
    console.error("Unsupported media type");
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
    await generateSticker(msg, sender);
  }
});

client.initialize();
