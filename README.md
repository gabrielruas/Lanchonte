# wpp-sticker
 
A integração permitirá que os usuários mandem imagens/vídeos/gifs, links de imagens/vídeos/gifs no Whatsapp e o bot irá transformar-los em Sticker.

## Demo

![Gif Aplicação](https://victor-harry.s3.sa-east-1.amazonaws.com/V%C3%ADdeo+do+WhatsApp+de+2023-01-23+%C3%A0(s)+22.47.05.gif)

## Tecnologias

- [whatsapp-web.js](https://wwebjs.dev/)
- [qrcode-terminal](https://www.npmjs.com/package/qrcode-terminal)
- [axios](https://axios-http.com/ptbr/docs/intro)

## Rodar o projeto

Clone este projeto com o comando:

```bash
  git clone https://github.com/victorharry/wpp-sticker.git
```

Instale agora as dependencias do projeto com o comando:

```bash
  npm install
```

Por fim rode o comando abaixo para iniciar o projeto e leia o QR Code com o seu Whasapp para se conectar com o serviço.

```bash
  node .
```

### Opções

É possível modificar alguns parâmetros do projeto pela linha de comando:

```bash
  node . --help
Usage: wpp-sticker [OPTIONS]...

Options:
  -d, --debug           Show debug logs (default: false)
  -c, --chrome <value>  Use a installed Chrome Browser
  -f, --ffmpeg <value>  Use a different ffmpeg
  -h, --help            display help for command
```

* Debug: Exibe mensagens de debug no terminal
* Chrome: Permite utilizar um Google Chrome instalado, isso permite a conversão de formatos que dependem de licença, que não estão disponíveis no Chromiun.
* ffmpeg: Permite utilizar um outro ffmpeg. É fornecido um script(`ffmpeg-docker`) que utiliza uma imagem em Docker, sem precisar instalar o ffmpeg.

#### Exemplo MacOS

```bash
node . -c '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' -f ffmpeg-docker
```
### Whatsapp-servidor

node .
  108  sudo apt-get install libatk-1.0-0
  109  npm install puppeteer@latest
  111  sudo apt-get install libatk-1.0-0
  112  sudo apt-get update
  113  sudo apt-get install libatk-1.0-0
  114  sudo apt-get install libatk-bridge2.0-0
  116  npm install 
  117  npm audit fix --force
  119  sudo apt-get update
  120  sudo apt-get install libcups2
  123  sudo apt-get update
  124  sudo apt-get upgrade
  131  sudo apt-get install libatk-1.0-0
  133  sudo apt-get install chromium-browser
  134  chromium-browser --version
  136  sudo apt-get install libxkbcommon0
  139  sudo apt-get install libcups2
  140  sudo apt-get install libx11-xcb1 libxcomposite1 libxdamage1 libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 libasound2 libpangocairo-1.0-0 libatk1.0-0 libatk-bridge2.0-0 libgtk-3-0
  144  npm install @babel/core @babel/preset-env --save-dev
146  npm install puppeteer --unsafe-perm=true --allow-root
  149  sudo apt-get install libatk-bridge2.0-0
  151  sudo apt-get install libatk-bridge2.0-0
  153  sudo apt-get install libcups2
  159  sudo apt-get update
  160  sudo apt-get install -y libgbm-dev libxss1 libnss3 libatk-bridge2.0-0 libgtk-3-0
  161  sudo apt-get upgrade

###Servidor pm2 

 npm install -g pm2 
 pm2 status 
 pm2 start index.js 
 sudo pm2 startup
// comando que vai aparecer no final do comando anterior 
  sudo env PATH=$PATH:/home/server/.nvm/versions/node/v20.5.0/bin /home/server/.nvm/versions/node/v20.5.0/lib/node_modules/pm2/bin/pm2 startup systemd -u server --hp /home/server
  pm2 save
