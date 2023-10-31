function doPost(e) {
  const contents = JSON.parse(e.postData.contents);
  let cache = CacheService.getScriptCache();
  if (cache.get(contents.event.client_msg_id) == 'done') {
    return ContentService.createTextOutput();
  } else {
    cache.put(contents.event.client_msg_id, 'done', 600);
  }
  var text = contents.event.text;

  if (text.includes('chan-in-conv&gt;')) {
    writeToSpreadsheet(contents); 
  }
  
}

function writeToSpreadsheet(data) {
  const token = "";//招待用ユーザートークン
  texts = data.event.text.replace('chan-in-conv&gt;', ''); 
  const [channelId, emailText] = texts.split("$"); 
 var emailorg = emailText.match(/<mailto:([^|>]+)\|([^>]+)>/g);

 if (emailorg) {
  var emailList = emailorg.map(function (email) {
    var match = email.match(/<mailto:([^|>]+)\|([^>]+)>/);
    if (match) {
      return match[1]; // 1番目のキャプチャグループにメールアドレスが格納されています
    } else {
      return email; // マッチしない場合はそのまま返します
    }
  });
    var emailString = emailList.join(' ');
    const emailArray = emailString.split(' ')

    const masa = `[INFO] 全 ${emailArray.length} 件の処理を channelId: ${channelId} に開始します。`;
    postInviteResultToUser(masa);
    let successfulInvites = 0; 
    
   emailList.forEach(email => {
    const options = {
      "method": "GET",
      "headers": {
        "Authorization": `Bearer ${token}`
      }
    };

    const url = `https://slack.com/api/users.lookupByEmail?email=${email}`;
    const response = UrlFetchApp.fetch(url, options);
    const content = JSON.parse(response.getContentText());

    if (content.ok) {
      const userId = content.user.id;
      const img = content.user.profile.image_512
      const mad ="`"
     
      var method_url = 'https://slack.com/api/conversations.invite';
      var payload = {
        "token": `${token}`,
        "channel": `${channelId}`,
        "users": `${userId}`,
      };
      var option = {
        "method": "POST",
        "payload": payload,
      };

      const inviteResponse = UrlFetchApp.fetch(method_url, option);;
      const inviteContent = JSON.parse(inviteResponse.getContentText());

  
      if (inviteContent.ok) {
        successfulInvites++; 
         const user = content.user;
        const inviteInfo = `[INFO] email: ${email} user.name: ${user.name} channelId: ${channelId} の招待を行いました`;
        postInviteResultToUser(inviteInfo);
      } else {
        const errorInfo = `[ERROR] APIの実行エラー email: ${email} err: Error: An API error occurred: ${mad}${inviteContent.error}${mad}`;
        postInviteResultToUser(errorInfo);
      }
    } else {
      const mmd ="`"
      const errorInfo = `[ERROR] APIの実行エラー email: ${email} err: Error: An API error occurred: ${mmd}${content.error}${mmd}`;
      postInviteResultToUser(errorInfo);
    }
  });

  const masaSuccess = `[INFO] 全 ${successfulInvites} 件の処理を終えました。`;
  postInviteResultToUser(masaSuccess);
 }
}


function postInviteResultToUser(masa) {
  try {
    const postUrl = "https://slack.com/api/chat.postMessage";
     var payload = {
    "token" : "",//招待結果通知用ボットトークン
    "channel" : "",//招待結果通知用チャンネルID
    "text" :masa
    };
    var params = {
    "method" : "post",
    "payload" : payload
   };
   UrlFetchApp.fetch(postUrl,params);
  } catch (error) {
    Logger.log("エラーが発生しました : " + error.toString());
  }
}
