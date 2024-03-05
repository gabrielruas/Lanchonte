const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const commander = require('commander');
const axios = require('axios');
const fs = require('fs').promises; // Importe o módulo fs para manipulação de arquivos

const HOLERITE_COMMAND = "Pedido";

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

const createPdf = async (cpf, numero, Nome, Endereco, pagamento) => {
  console.log('Gerando PDF com os seguintes dados:');
  console.log(`CPF: ${cpf}`);
  console.log(`Número: ${numero}`);
  console.log(`Nome: ${Nome}`);
  console.log(`Endereço: ${Endereco}`);
  console.log(`Pagamento: ${pagamento}`);

  const { PDFDocument } = require('pdf-lib');

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();

  const { width, height } = page.getSize();

  page.drawText(`CPF: ${cpf}`, { x: 50, y: height - 100 });
  page.drawText(`Número: ${numero}`, { x: 50, y: height - 120 });
  page.drawText(`Nome: ${Nome}`, { x: 50, y: height - 140 });
  page.drawText(`Endereço: ${Endereco}`, { x: 50, y: height - 160 });
  page.drawText(`Pagamento: ${pagamento}`, { x: 50, y: height - 180 });

  const pdfBytes = await pdfDoc.save();

  return pdfBytes;
};

const generateHolerite = async (msg, sender) => {
  logDebug("Processing message ", msg.type, JSON.stringify(msg.body, null, 4));
  await msg.reply(
    "⏳ Processando, aguarde...\n" +
    "Olá! Eu sou o Atendente Virtual e estou aqui para registrar o seu pedido. Por favor, digite o número da opção desejada: !\n" +
    "Escolha uma opção:\n" +
    "1. Fazer seu pedido\n" +
    "2. Fazer uma reclamação"
  );

  try {
    const option = await requestInput(client, msg.from, "Digite o número da opção desejada:");
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
    logDebug("Processing message", msg.type, JSON.stringify(msg.body, null, 4));
    const imageUrl = "https://marketplace.canva.com/EAE4oyNKDGk/1/0/1131w/canva-card%C3%A1pio-e-menu-para-hamburgueria%2C-restaurante%2C-lanchonete-gourmet-bX6NutaLY_c.jpg";

    if (imageUrl) {
      logDebug("URL:", imageUrl);
      try {
        const { data, headers } = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(data, 'binary').toString('base64');

        if (headers['content-type'] && headers['content-type'].includes("image")) {
          const mediaType = MediaType.Image; 
          const fileName = (msg.body.caption) ? msg.body.caption + ".jpg" : "cardapio.jpg"; 
          
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

    const numero = await requestInput(client, msg.from, "Entre com número do pedido (Ex: 1, 2, 3, 5, 6, 7): ");
    const Nome = await requestInput(client, msg.from, "Informe seu nome: ");
    const Endereco = await requestInput(client, msg.from, "Informe seu endereço: ");
    const pagamento = await requestInput(client, msg.from, "Informe a forma de pagamento (1 para cartão, 2 para pix, 3 para dinheiro): ");
    const cpf = await requestInput(client, msg.from, "Para maior transparência, por favor, informe seu CPF: ");

    console.log('Resultado dos dados de entrada:', cpf + numero + Nome + Endereco + pagamento);

    const pdfBytes = await createPdf(cpf, numero, Nome, Endereco, pagamento);
    const filePath = `./${cpf}.pdf`;
    await fs.writeFile(filePath, pdfBytes);

    await sendMediaFile(sender, MediaType.PDF, filePath);

    await client.sendMessage(sender, `Seu pedido foi registrado com sucesso!`);

  } catch (error) {
    console.error("Error processing holerite:", error);
    client.sendMessage(sender, "❌ Erro ao processar o pedido.");
  }
};

const mudarSenha = async (msg, sender) => {
  try {
    await msg.reply("⏳ Processando, aguarde...");
    console.log('Chamar mesa');
  } catch (error) {
    console.error("Error processing holerite:", error);
    client.sendMessage(sender, "❌ Erro ao processar holerite!");
  }
};

const sendMediaFile = async (sender, type, filePath) => {
  if (type.contentType === MediaType.PDF.contentType) {
    try {
      const data = await fs.readFile(filePath);
      const base64Data = data.toString('base64'); // Converta os dados para base64
      const media = new MessageMedia(type.contentType, base64Data, type.fileName);
      await client.sendMessage(sender, media);
    } catch (error) {
      console.error("Error reading file:", error);
    }
  } else {
    console.error("Unsupported media type");
  }
};


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
  console.log(`Servidor ONLINE`);
});

client.on('message_create', async msg => {
  if (msg.body.split(" ").includes(HOLERITE_COMMAND)) {
    const sender = msg.from.startsWith(client.info.wid.user) ? msg.to : msg.from;
    await generateHolerite(msg, sender);
  }
});

client.initialize();
