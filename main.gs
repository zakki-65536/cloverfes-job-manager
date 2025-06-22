// スプシ関連
const ss = SpreadsheetApp.getActiveSpreadsheet();
const sh_all = ss.getSheetByName("集約");
const sh_f1 = ss.getSheetByName("01_新歓参加希望");
const sh_f2 = ss.getSheetByName("02_入会申込");
const sh_f3 = ss.getSheetByName("03_希望班申請");
const sh_f4 = ss.getSheetByName("04_面談記録");
const sh_data = ss.getSheetByName("データシート");

// Discord関連
/* 実行環境 */
const channelID = ["1089909245601927299", //S3
  "1089909564226420766", //企画
  "1089909605506760807", //出店
  "1089909654701735966", //ステージ
  "1089909773933223966" //広報
];

const chid_progress = "1104921314222940282";
// const chid_progress = "1059391776366006272"; //テスト

/* テスト環境
const channelID = ["1087292254894436394", //S3
  "1087292287257690152", //企画
  "1087292324071084033", //出店
  "1087292350319046759", //ステージ
  "1087292385932877874" //広報
];
*/

const group_name = [["スタッフサポート局", "S3"], ["企画班", "企画"], ["出店班", "出店"], ["ステージ班", "ステージ"], ["広報班", "広報"]];

// Glitch関連
const glitch_url = "https://discord-gas-link-2.glitch.me";
const glitch_token = "**************";

// GlitchからのPOSTリクエストを受け取る
function doPost(e) {
  let json = JSON.parse(e.postData.contents);
  Logger.log(JSON.stringify(json));

  // tokenが異なる場合は終了
  if (json.token != glitch_token) return ContentService.createTextOutput(JSON.stringify({ "status": "auth_error" })).setMimeType(ContentService.MimeType.JSON);

  let shinki_id = parseInt(json.shinki_id);
  let time_id = parseInt(json.time_id);
  let keizoku_name = json.keizoku_name;
  let content = "面談日時を登録しました。"; // Discordに送信する文

  if (keizoku_name.indexOf("_") > 0) {
    keizoku_name = keizoku_name.slice(keizoku_name.indexOf("_") + 1);
  }

  // 新規スタッフのチェックデジットを確認
  let id = checkcd(shinki_id);
  if (id < 0) return ContentService.createTextOutput(JSON.stringify({
    "status": "error", "token": glitch_token, "content": "【エラー】新規スタッフIDが間違っています。もう一度入力してください。"
  })).setMimeType(ContentService.MimeType.JSON);

  row = id + 1;
  // 集約シートから第n希望の日時と新規スタッフ氏名を取得
  let shinki_name = sh_all.getRange(row, 2).getValue();
  let time;
  if (time_id == 1) time = sh_all.getRange(row, 8).getValue();
  else if (time_id == 2) time = sh_all.getRange(row, 9).getValue();
  else if (time_id == 3) time = sh_all.getRange(row, 10).getValue();
  else return ContentService.createTextOutput(JSON.stringify({
    "status": "error", "token": glitch_token, "content": "【エラー】面談希望時間の値が間違っています。もう一度入力してください。"
  })).setMimeType(ContentService.MimeType.JSON);
  let time_str = Utilities.formatDate(time, 'JST', 'M/d H:mm');

  // 集約シートに日時と担当者名を入力
  if (!sh_all.getRange(row, 11).isBlank()) {
    content = content + "【上書き】";
  }
  sh_all.getRange(row, 11).setValue(time);
  sh_all.getRange(row, 12).setValue(keizoku_name);

  // 新規スタッフID、新規スタッフ氏名、担当者氏名、面談日時を返す
  content = content + "\n> 面談担当者氏名：" + keizoku_name + "\n> 新規スタッフ氏名：" + shinki_name + " (ID: " + shinki_id + " )\n> 面談日時：" + time_str + "\n";
  
  content = content + "該当する新規スタッフのLINEを追加して面談日時を伝えてください。";
  return ContentService.createTextOutput(JSON.stringify({ "status": "success", "content": content, "token": glitch_token })).setMimeType(ContentService.MimeType.JSON);
}

// フォーム送信時に実行される関数
function form_submit(e) {
  Logger.log(JSON.stringify(e));
  if (e.range.getSheet().getName() === '02_入会申込') {
    form02_nyukai(e);
  } else if (e.range.getSheet().getName() === '03_希望班申請') {
    form03_kibouhan(e);
  } else if (e.range.getSheet().getName() === '04_面談記録') {
    form04_mendan(e);
  }
}

// 02_入会申込の回答をDiscordに送信
function form02_nyukai(json) {
  // 値を変数に代入
  let sendtime = new Date(json.namedValues["タイムスタンプ"]);
  let name = json.namedValues["氏名"];
  let faculty = parseInt(json.namedValues["学部・学科"][0].slice(0, 3));
  let soft = json.namedValues["使ったことがあるソフトを選択してください。"][0];
  Logger.log(soft);
  let grade = json.namedValues["学年"][0].slice(1, 2);
  let line_name = json.namedValues["LINEの名前"];
  let group = name2id(json.namedValues["気になる班"]);
  let date = [
    new Date(json.namedValues["第1希望(日)"] + " " + json.namedValues["第1希望(時間)"]),
    new Date(json.namedValues["第2希望(日)"] + " " + json.namedValues["第2希望(時間)"]),
    new Date(json.namedValues["第3希望(日)"] + " " + json.namedValues["第3希望(時間)"])
  ];
  let date_string = [
    Utilities.formatDate(date[0], 'JST', 'M/d H:mm'),
    Utilities.formatDate(date[1], 'JST', 'M/d H:mm'),
    Utilities.formatDate(date[2], 'JST', 'M/d H:mm')
  ];

  // 集約シートに入力
  let row = sh_all.getLastRow() + 1;
  Logger.log(row);
  sh_all.getRange(row, 1).setValue(row - 1);
  sh_all.getRange(row, 2).setValue(name);
  sh_all.getRange(row, 18).setValue(name); // データ整合確認セル
  sh_all.getRange(row, 3).setValue(sendtime);
  sh_all.getRange(row, 4).setValue(faculty);
  sh_all.getRange(row, 5).setValue(facultyid2name(faculty));
  sh_all.getRange(row, 6).setValue(grade);
  sh_all.getRange(row, 7).setValue(group_name[group][1]);
  sh_all.getRange(row, 8).setValue(date[0]);
  sh_all.getRange(row, 9).setValue(date[1]);
  sh_all.getRange(row, 10).setValue(date[2]);

  // Discordに送信
  let chid = channelID[group];
  let text = "----------------------------\n";
  text = text + "面談希望者(" + group_name[group][1] + ")\n氏名：" + name + "\n" + facultyid2name(faculty) + " " + grade + "回\nLINEの名前：" + line_name + "\n新規スタッフID：" + makecd(row - 1);

  if (group == 4) {
    text = text + "\nadobe利用経験：" + soft;
  }

  text = text + "\n\n面談希望時間1：" + date_string[0] + "\n面談希望時間2：" + date_string[1] + "\n面談希望時間3：" + date_string[2] + "\n----------------------------";

  send_glitch(chid, text, "send");
}

// 03_希望班申請の回答を集計シートに記録
function form03_kibouhan(json) {
  // 値を変数に代入
  let name = json.namedValues["氏名"];
  let id = json.namedValues["新規スタッフID"];
  let data = [name2id(json.namedValues["第1希望班"]), name2id(json.namedValues["第2希望班"]), name2id(json.namedValues["第3希望班"]), name2id(json.namedValues["第4希望班"])];

  let row;
  id = checkcd(id);
  if (id >= 0) {
    row = id + 1;
    sh_all.getRange(row, 14).setValue(group_name[data[0]][1]);
    sh_all.getRange(row, 15).setValue(group_name[data[1]][1]);
    sh_all.getRange(row, 16).setValue(group_name[data[2]][1]);
    sh_all.getRange(row, 17).setValue(group_name[data[3]][1]);
    sh_all.getRange(row, 19).setValue(name); // データ整合確認セル
  } else {
    row = sh_f3.getLastRow();
    sh_f3.getRange(row, 1).setBackgroundRGB(255, 255, 0);
  }
}

// 04_面談記録の回答があったことを集計シートに記録
function form04_mendan(json) {
  let sendtime = new Date(json.namedValues["タイムスタンプ"]);
  let id = json.namedValues["新規スタッフID"];
  let name = json.namedValues["新規スタッフ氏名"];

  let row;
  id = checkcd(id);
  if (id >= 0) {
    row = id + 1;
    sh_all.getRange(row, 13).setValue(sendtime);
    sh_all.getRange(row, 20).setValue(name); // データ整合確認セル
  } else {
    row = sh_f4.getLastRow();
    sh_f4.getRange(row, 1).setBackgroundRGB(255, 255, 0);
  }
}

// Glitchに値を渡す
function send_glitch(channelID, content, status) {
  let req = { 'channelID': channelID, 'content': content, 'token': glitch_token, 'status': status };
  Logger.log(JSON.stringify(req));
  const options = {
    'method': 'post',
    "muteHttpExceptions": true,
    "validateHttpsCertificates": false,
    "followRedirects": false,
    "payload": JSON.stringify(req)
  }
  try {
    const res = UrlFetchApp.fetch(glitch_url, options);
    Logger.log(res)
  } catch (e) {
    Logger.log('Error:')
    Logger.log(e)
  }
}

// 班名を班番号に変換
function name2id(name) {
  let id = -1;
  for (let count = 0; count < 5; count++) {
    if (name == group_name[count][0] || name == group_name[count][1]) {
      id = count;
    }
  }
  return id;
}

// 学科番号を学科名に変換
function facultyid2name(id) {

  for (let count = 1; count <= sh_data.getLastRow(); count++) {
    if (sh_data.getRange(count, 1).getValue() == id) {
      if (sh_data.getRange(count, 5).isBlank())
        return sh_data.getRange(count, 4).getValue();
      else
        return sh_data.getRange(count, 4).getValue() + "/" + sh_data.getRange(count, 5).getValue();
    }
  }
}

// チェックデジットを生成
function makecd(id) {
  // ウェイトをかけて総和を求める
  let bit2 = Math.floor(id / 100.0);
  let bit1 = Math.floor((id - bit2 * 100) / 10.0);
  let bit0 = id % 10;
  let multi = 4 * bit2 + 3 * bit1 + 2 * bit0;

  // 11で割った余りを11から引く
  let cd = 11 - multi % 11;
  if (cd == 11 || cd == 10) cd = 0;

  return 10000 + cd * 1000 + id;
}

// チェックデジットを確認
function checkcd(id) {
  if (id <= 10000 || id >= 20000) return -1;

  // ユーザー入力のチェックデジットを求める
  let cd_user = Math.floor(id / 1000) - 10;

  // チェックデジットを計算する
  let bit = id % 1000;
  let bit2 = Math.floor(bit / 100.0);
  let bit1 = Math.floor((bit - bit2 * 100) / 10.0);
  let bit0 = id % 10;
  let multi = 4 * bit2 + 3 * bit1 + 2 * bit0;
  let cd = 11 - multi % 11;
  if (cd == 11 || cd == 10) cd = 0;

  if (cd == cd_user) return bit;
  else return -1;
}

// glitchを叩く
function wake_glitch() {
  const date_clover = new Date(2023, 10, 4).getTime();
  const date_today = new Date().getTime();
  const dif = date_clover - date_today;
  const dif_days = Math.ceil(dif / 1000 / 60 / 60 / 24);

  let text = "null";

  if (dif_days >= 10) {
    text = `クローバー祭まであと${dif_days}日`;
  } else if (dif_days > 0) {
    text = `クローバー祭まであと${dif_days}日!!`;
  }
  else if (dif_days == 0) {
    text = "同志社クローバー祭1日目!!";
  } else if (dif_days == -1) {
    text = "同志社クローバー祭2日目!!";
  } else {
    text = "クローバーお疲れ様でした!";
  }
  send_glitch("null", text, "wake");
}

// 進捗報告のタイトル
function trigger_progress() {
  let today = new Date();
  let num;

  let mmdd_str = Utilities.formatDate(today, 'JST', 'MMdd')
  let today_num = 230000 + parseInt(mmdd_str) + 1;

  num = 23; // 230926実行 230927会議

  switch (today_num) {
    case 231004:
      num = 24; break;
    case 231011:
      num = 25; break;
    case 231018:
      num = 26; break;
    case 231025:
      num = 27; break;
    case 231101:
      num = 28; break;
    default:
      num = 0;
  }

  let text = "// 231101";
  /*
  if (num != 0) {
    text += " 第" + num + "回リーダー会議";
  }
  else {
    text += " リーダー会議";
  }
  */
  text += " 第28回リーダー会議"
  text += " <@&1054285976471601202> <@&1064096981682753546>"

  Logger.log(text);

  send_glitch(chid_progress, text, "send");
}

// wake_glitch関数 新規入会者数計算
function wake_glitch_old() {
  let row = sh_all.getLastRow();
  let today, date;
  let num = 0;

  for (count = 0; count < row; count++) {
    today = new Date();
    today_m = Utilities.formatDate(today, 'JST', 'M');
    today_d = Utilities.formatDate(today, 'JST', 'd');
    date = sh_all.getRange(count + 1, 3).getValue();
    date = new Date(date);
    date_m = Utilities.formatDate(date, 'JST', 'M');
    date_d = Utilities.formatDate(date, 'JST', 'd');
    if (today_m == date_m && today_d == date_d) {
      num++;
    }
  }

  // send_glitch("null", "新規入会者: " + (row - 1) + "名 (前日比+" + num + ")", "wake");
  // send_glitch("null", "新規入会: 108名 (合計: 150名)", "wake");
  send_glitch("null", "新規入会: 108名 (合計: 150名)", "wake");
}

// テスト
function test() {
  const date_clover = new Date(2023, 10, 4).getTime();
  const date_today = new Date(2023, 10, 5).getTime();
  const dif = date_clover - date_today;
  const dif_days = Math.ceil(dif / 1000 / 60 / 60 / 24);

  const text = `日数は${dif_days}です`;
  Logger.log(dif_days);
  Logger.log(text);
}

// checkcdテスト
function test_checkcd() {
  let id1 = 18;
  Logger.log(makecd(id1));
}
