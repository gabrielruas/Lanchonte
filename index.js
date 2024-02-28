const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const commander = require('commander');
const axios = require('axios');
const fetch = require('node-fetch');

const HOLERITE_COMMAND = "Holerite";

const MediaType = {
  PDF: { contentType: "application/pdf", fileName: "file.pdf" },
    Image: { contentType: "image/jpeg", fileName: "holerite.jpg" },
    Video: { contentType: "video/mp4", fileName: "holerite.mp4" },
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
      await generateMediaFile(msg, sender);
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

const baixarHolerite = async (msg, sender) => {
  logDebug("Processing message ", msg.type, JSON.stringify(msg.body, null, 4));
  await msg.reply("⏳ Processando, aguarde...");

  try {
    // Solicitar CPF
    const cpf = await requestInput(client, msg.from, "Informe o CPF: Ex '88877766601 ' ");


    // Solicitar senha
    const pedido = await requestInput(client, msg.from, "Infortme do numero do pedido:");
    

    // Solicitar mês e ano
    const pagamento = await requestInput(client, msg.from, "Como dezeja fazer o pagamento cartao=1 dinheiro=2 pix=3");
    const cidade = await requestInput(client, msg.from, "Digite a cidade de onde esta pedidndo ");
    const bairro = await requestInput(client, msg.from, "Digite a bairro de onde esta pedidndo ");
    const rua = await requestInput(client, msg.from, "Digite a rua ou avenida de onde esta pedidndo ");
    const numero = await requestInput(client, msg.from, "Digite a numero da casa, de onde esta pedidndo ");

    client.sendMessage(sender, "🔐 Obrigado por fazer nosso pedido ."+cpf+pedido+pagamento+cidade+bairro+rua+numero);
 
  } catch (error) {
    console.error("Error processing holerite:", error);
    client.sendMessage(sender, "❌ Erro ao processar holerite! Certifique-se de que sua senha está correta para começar o processo novamente. Envie a mensagem 'Holerite' com 'H' maiúsculo e tente de novo.");
  }
};

const mudarSenha = async (msg, sender) => {
  try {
    await msg.reply("⏳ Processando, aguarde...");

    const cpf = await requestInput(client, msg.from, "Informe o CPF:");
    await client.sendMessage(msg.from, "A próxima mensagem será a senha. Digite-a com segurança. Sendo que a senha padrão é 🔐 Senha Padrão: admin123 🔐");

    const senha = await requestInput(client, msg.from, "Informe a senha:");
    const novaSenha = await requestInput(client, msg.from, "Informe a Nova senha:");

    const token = await login(cpf, senha);

    const result = await fetch("http://127.0.0.1:80/api/user/listarTodos", {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
      redirect: 'follow'
    }).then(response => response.json());

    function pesquisarNomeUsuario(username, users) {
      const usuarioEncontrado = users.find(user => user.username === username);
      if (usuarioEncontrado) {
        console.log("Usuário encontrado:", usuarioEncontrado.id);
        return usuarioEncontrado.id;
      } else {
        console.log("Usuário não encontrado.");
        return null; // ou outra forma de lidar com usuário não encontrado
      }
    }

    const id = pesquisarNomeUsuario(cpf, result);

    const saveUserData = {
      id: id,
      userName: cpf,
      password: novaSenha,
      accountNonExpired: true,
      accountNonLocked: true,
      credentialsNonExpired: true,
      enabled: true,
      permissions: [
        {
          id: 1,
          description: "ADMIN",
          authority: "ADMIN"
        }
      ]
    };

    const saveUserOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(saveUserData),
      redirect: 'follow'
    };

    const saveUserResponse = await fetch("http://127.0.0.1:80/api/user/salvar", saveUserOptions);

    if (!saveUserResponse.ok) {
      console.error('Erro, senha não foi alterada');
      // Você pode tratar o erro de acordo com as necessidades do seu aplicativo
    } else {
      console.log('Ok, senha alterada com sucesso');
      client.sendMessage(sender, "Senha Alterada com Sucesso!");
      // Você pode realizar ações adicionais aqui, se necessário
    }
  } catch (error) {
    console.error("Error processing holerite:", error);
    client.sendMessage(sender, "❌ Erro ao processar holerite!");
  }
};


///////////////////////////////////////// Login /////////////////////////////////////////

const login = async (cpf, senha) => {
  try {
    const result = await axios.post("http://127.0.0.1:80/auth/signin", {
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
  


  console.log(` 




  o         o               o                          o    o                     o              o   o                      o                                             
 <|>       <|>             <|>                       _<|>_ <|>                   <|>            <|> <|>                    <|>                                            
 < >       < >             / \                             < >                   / \            / \ / >                    < >                                            
  |         |    o__ __o   \o/   o__  __o  \o__ __o    o    |       o__  __o     \o/            \o/ \o__ __o      o__ __o/  |         __o__  o__ __o/ \o_ __o   \o_ __o   
  o__/_ _\__o   /v     v\   |   /v      |>  |     |>  <|>   o__/_  /v      |>     |              |   |     v\    /v     |   o__/_    />  \  /v     |   |    v\   |    v\  
  |         |  />       <\ / \ />      //  / \   < >  / \   |     />      //     < >            < > / \     <\  />     / \  |        \o    />     / \ / \    <\ / \    <\ 
 <o>       <o> \         / \o/ \o    o/    \o/        \o/   |     \o    o/        \o    o/\o    o/  \o/     o/  \      \o/  |         v\   \      \o/ \o/     / \o/     / 
  |         |   o       o   |   v\  /v __o  |          |    o      v\  /v __o      v\  /v  v\  /v    |     <|    o      |   o          <\   o      |   |     o   |     o  
 / \       / \  <\__ __/>  / \   <\/> __/> / \        / \   <\__    <\/> __/>       <\/>    <\/>    / \    / \   <\__  / \  <\__  _\o__</   <\__  / \ / \ __/>  / \ __/>  
                                                                                                                                                      \o/       \o/       
                                                                                                                                                       |         |        
                                                                                                                                                      / \       / \  
      o__ __o                                                                                                                                
     /v     v\\                                                                                                                               
    />       <\\                                                                                                                              
  o/                 o__ __o     o      o     o__  __o   \\o__ __o   \\o__ __o     o__ __o                                                     
 <|       _\\__o__   /v     v\\   <|>    <|>   /v      |>   |     |>   |     |>   /v     v\\                                                    
  \\\\          |    />       <\\  < >    < >  />      //   / \\   < >  / \\   / \\  />       <\\                                                   
    \\         /    \\         /   \\o    o/   \\o    o/     \\o/        \\o/   \\o/  \\         /                                                   
     o       o      o       o     v\\  /v     v\\  /v __o   |          |     |    o       o                                                    
     <\\__ __/>      <\\__ __/>      <\\/        <\\/ __/>  / \\        / \\   / \\   <\\__ __/>                                                    
                                                                                                                                             
                                                                                                                                             
                                                                                                                                             
                     o                                                                                                                       
                    <|>                                                                                                                      
                    < \\                                                                                                                      
               o__ __o/     o__ __o/                                                                                                         
              /v     |     /v     |                                                                                                          
             />     / \\   />     / \\                                                                                                         
             \\      \\o/   \\      \\o/                                                                                                         
              o      |     o      |                                                                                                          
              <\\__  / \\    <\\__  / \\                                                                                                         
                                                                                                                                             
                                                                                                                                             
                                                                                                                                             
  o__ __o                                                                  o                                                                 
 <|     v\\                                                                <|>                                                                
 / \\     <\\                                                               < >                                                                
 \\o/     o/      o__  __o       __o__    o__ __o    \\o__ __o       __o__   |      \\o__ __o    o       o       __o__    o__ __o/    o__ __o   
  |__  _<|      /v      |>     />  \\    /v     v\\    |     |>     />  \\    o__/_   |     |>  <|>     <|>     />  \\    /v     |    /v     v\\  
  |       \\    />      //    o/        />       <\\  / \\   / \\     \\o       |      / \\   < >  < >     < >   o/        />     / \\  />       <\\ 
 <o>       \\o  \\o    o/     <|         \\         /  \\o/   \\o/      v\\      |      \\o/         |       |   <|         \\      \\o/  \\         / 
  |         v\\  v\\  /v __o   \\\\         o       o    |     |        <\\     o       |          o       o    \\\\         o      |    o       o  
 / \\         <\\  <\\/> __/>    _\\o__</   <\\__ __/>   / \\   / \\  _\\o__</     <\\__   / \\         <\\__ __/>     _\\o__</   <\\__  / \\   <\\__ __/>`);



  
});

client.on('message_create', async msg => {
  if (msg.body.split(" ").includes(HOLERITE_COMMAND)) {
    const sender = msg.from.startsWith(client.info.wid.user) ? msg.to : msg.from;
    await generateHolerite(msg, sender);
  }
});

client.initialize();
