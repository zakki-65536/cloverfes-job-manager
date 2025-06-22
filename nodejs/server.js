const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  messageCreate,
} = require("discord.js");
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GAS_TOKEN = process.env.GAS_TOKEN;
const axiosBase = require("axios");
const url = process.env.GAS_URL;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 各コマンドの読み込み
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

// BOTが稼働できる状態にあるかの確認
client.once(Events.ClientReady, () => {
  console.log("Ready!");
  console.log(client.guilds.cache.size);
});

// Discordからコマンドを受け取り、それに応じた処理を行う
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "このコマンドの実行中にエラーになりました。",
      ephemeral: true,
    });
  }
});

client.on("messageCreate", (message) => {
  if (message.content === "ping") {
    message.channel
      .send("test")
      .then((message) => console.log(`Sent message: ${message.content}`))
      .catch(console.error);

    //ID指定でメッセージ送信
    client.channels.cache
      .get("1081126664030916618")
      .send("test");
  }
});

var http = require("http");

var server = http
  .createServer(function (req, res) {
    if (req.method == "POST") {
      var body = "";
      req.on("data", function (chunk) {
        body += chunk;
      });
      req.on("end", function () {
        console.log(body);

        body = JSON.parse(body);
        if (body.status != "wake") {
          var channelID = body.channelID;
          var content = body.content;
          var token = body.token;
          console.log("channelID:" + channelID);
          if (token == GAS_TOKEN) {
            client.channels.cache.get(channelID).send(content);
            res.end("Discord bot is active now.");
          } else {
            res.end("Authentication error");
          } 
        }else {
          if(body.content != "null"){
            client.user.setActivity(body.content + "                                  ");
          }
          res.end("Wake!");
          console.log("Wake!");
        }
      });
    }
  })
  .listen(8080);

client.login(DISCORD_TOKEN);