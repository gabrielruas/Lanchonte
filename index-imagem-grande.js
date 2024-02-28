const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const commander = require('commander');
const axios = require('axios');

const HOLERITE_COMMAND = "Pedido";

const MediaType = {
  Image: { contentType: "image/jpeg", fileName: "holerite.jpg" },
  Video: { contentType: "video/mp4", fileName: "holerite.mp4" }
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

const sendMediaFile = async (sender, type, data) => {
  const media = new MessageMedia(type.contentType, data, type.fileName);
  await client.sendMessage(sender, media);
};

// Function to check if a string is a valid image URL
const isImageUrl = (url) => {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
};

const generateMediaFile = async (msg, sender) => {
  logDebug("Processing message ", msg.type, JSON.stringify(msg.body, null, 4));

  let url = "https://img.freepik.com/fotos-gratis/hamburguer-grelhado-e-batatas-fritas-ia-geradora-de-alimentos_188544-8516.jpg";
  if (url) {
    logDebug("URL:", url);
    try {
      let { data, headers } = await axios.get(url, { responseType: 'arraybuffer' });
      data = Buffer.from(data).toString('base64');
      let mediaType;
      if (headers['content-type'].includes("image")) {
        mediaType = MediaType.Image;
        await sendMediaFile(sender, mediaType, data);
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
};

const pedido = async (msg, sender) => {
  logDebug("Processing message ", msg.type, JSON.stringify(msg.body, null, 4));
  await msg.reply("⏳ Processando, aguarde...");

  try {
    // Solicitar CPF
    const cpf = await requestInput(client, msg.from, "Informe o CPF: Ex '88877766601 ' ");

    // Informar que a próxima mensagem será a senha
    await client.sendMessage(msg.from, "A próxima mensagem será a senha. Se não alterou ainda e 🔐 Senha Padrão: admin123 🔐 , mas mude para segurança de seus Dados ");

    // Solicitar senha
    const senha = await requestInput(client, msg.from, "Informe a senha:");


    // Solicitar mês e ano
    const mes = await requestInput(client, msg.from, "Informe o mês: EX 01 ou 02 ou 03 ou 04 ou 05 ou 06 ou 07 ou 08 ou 09 ou 10 ou 11 ou 12 ou 13");
    const ano = await requestInput(client, msg.from, "Informe o ano: EX 2023");
    let cargo = await requestInput(client, msg.from, "Digite 1 para selecionar apenas um cargo e 2 para aqueles que possuem mais de um Cargo: Ex 1 ou 2 ");

    if (cargo !== '2') {
      // Se o usuário não digitou '2', atribuir uma string vazia a cargo
      cargo = '';
    }



   
    client.sendMessage(sender, "🔐 Para obter o holerite do próximo mês, Envie a mensagem 'Holerite' com 'H' maiúsculo e tente novamente.");
 
  } catch (error) {
    console.error("Error processing holerite:", error);
    client.sendMessage(sender, "❌ Erro ao processar holerite! Certifique-se de que sua senha está correta para começar o processo novamente. Envie a mensagem 'Holerite' com 'H' maiúsculo e tente de novo.");
  }
};

const mudarSenha = async (msg, sender) => {
  // Adicione a lógica para mudar a senha aqui
  await client.sendMessage(sender, "Lógica para mudar a senha vai aqui.");
};

const generatepedido = async (msg, sender) => {
  logDebug("Processing message ", msg.type, JSON.stringify(msg.body, null, 4));
  await msg.reply(
    "⏳ Processando, aguarde...\n" +
    "Olá, sou o Atendente Virtual do vol fazer seu pedido para melhora atwnswlo com rapides !!\n" +
    "Escolha uma opção:\n" +
    "1. Fazer pedido \n" +
    "2. Chamar Atendente"
  );

  try {
    const option = await requestInput(client, msg.from, "Digite o número da opção desejada:");                                             
    if (option === "1") {
      await generateMediaFile(msg, sender);
      await pedido(msg, sender);
    } else if (option === "2") {
      await mudarSenha(msg, sender);
    } else {
      await client.sendMessage(sender, "❌ Opção inválida!");
    }
  } catch (error) {
    console.error("Error processing holerite:", error);
    await client.sendMessage(sender, "❌ Erro ao processar holerite!");
  }
};

// Adicione a função requestInput aqui
const requestInput = async (client, from, message) => {
  // Adicione a lógica para solicitar a entrada do usuário aqui
  return "1";  // Simulando uma entrada de usuário para fins de exemplo
};

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Wpp-Sticker is ready!');
});

client.on('message_create', async msg => {
  if (msg.body.split(" ").includes(HOLERITE_COMMAND)) {
    logDebug("User:", client.info.wid.user, "To:", msg.to, "From:", msg.from);
    try {
      const sender = msg.from.startsWith(client.info.wid.user) ? msg.to : msg.from;
      await generatepedido(msg, sender);
    } catch (e) {
      console.error("Error processing holerite:", e);
      msg.reply("❌ Erro ao processar holerite!");
    }
  }
});

client.initialize();
