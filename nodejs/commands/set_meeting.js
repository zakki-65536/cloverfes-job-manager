const {
  ActionRowBuilder,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  SlashCommandBuilder,
} = require("discord.js");
const axiosBase = require("axios");
const url = process.env.GAS_URL;
const gas_token = process.env.GAS_TOKEN;

module.exports = {
  // スラッシュコマンドの登録
  data: new SlashCommandBuilder()
    .setName("set_meeting")
    .setDescription("面談日時を設定")
    .addStringOption((option) =>
      option
        .setName("shinki_id")
        .setDescription("新規スタッフID（1から始まる5桁の数値）")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("time_id")
        .setDescription("面談希望時間（1～3で指定）")
        .setRequired(true)
        .addChoices(
          { name: "1", value: "1" },
          { name: "2", value: "2" },
          { name: "3", value: "3" }
        )
    ),

  // スラッシュコマンドを受け取ると以下が実行される
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "set_meeting") {
      console.log("set_meeting.js実行中");

      const shinki_id = interaction.options.getString("shinki_id");
      const time_id = interaction.options.getString("time_id");
      const keizoku_name = interaction.member.displayName;
      const user_id = interaction.user.id;

      const data = {
        shinki_id: shinki_id,
        time_id: time_id,
        keizoku_name: keizoku_name,
        token: gas_token,
      };
      const content = "content";

      const axios = axiosBase.create({
        baseURL: url,
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        responseType: "json",
      });
      axios
        .post(url, data)
        .then(async function (response) {
          const responsedata = response.data; // 受け取ったデータ一覧(object)
          console.log(JSON.stringify(responsedata));
          if (responsedata.token == gas_token) {
            if (responsedata.status == "error")
              await interaction.reply({
                content: responsedata.content,
                ephemeral: true,
              });
            else
              await interaction.reply({
                content: "<@" + user_id + "> \n" + responsedata.content,
              });
          }
        })
        .catch(function (error) {
          console.log("ERROR!! occurred in Backend.");
          console.log(error);
        });
    }
  },
};
