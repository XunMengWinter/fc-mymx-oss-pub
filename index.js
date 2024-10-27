const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const moment = require('moment');

const mysql = require('mysql2/promise');
const config = require('./config');
const key = require('./key');


const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

const port = 9000

// Create a connection pool
const pool = mysql.createPool({
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.database
});

const transporter = nodemailer.createTransport({
  host: "smtp.163.com",
  port: 465,
  secure: true, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: "aichongshe_oss@163.com",
    pass: config.mailKey,
  },
});

let bingDay = 0
const weekSortBgGroups = ['illusion']
const weekImagesDict = {
  'illusion': [
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/pixel-cat-garden.jpg',
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/denis-istomin-the-beauty-around-us-3.jpg',
    'https://6963-icemono-1giecaaj02676f6a-1304448608.tcb.qcloud.la/images/calendar/img-crow.jpg?sign=64f8b17e5e0a54e774cd5fba30997a52&t=1703106221',
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/img-hill-house.jpg',
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/antique-glass.jpg',
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/denis-istomin-kaspa2.jpg',
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/original-5e0d9cbc45cae71d0a22f8822a78156c.jpg',
  ],
  'landscape': [
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/landscape/img_hill_beach.jpeg', // ok2
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/landscape/img_hill_cloud.jpeg',  // ok
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/landscape/img_plane.jpeg',  // ok2
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/landscape/img_sea_tower.jpg',
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/landscape/img_fuji.jpeg',  // ok
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/landscape/img_yellow_sea.jpg',
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/landscape/img_white_beach.jpg',  // ok
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/landscape/img_wesk_dawn.jpg',  // ok
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/landscape/img_mist_valley.jpg', // ok
  ].sort(() => 0.5 - Math.random()),
  'cat': [
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/cat/img_ragdoll_yynr.jpg',  // ok
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/cat/img_cat_car.jpg',  // ok
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/cat/img_cat_paofu2.JPG',
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/cat/img_cat_snow.jpg',  // ok
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/cat/img_cat_wood.jpg',  //great
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/cat/img_cat_glass.jpeg',  // ok
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/cat/img_cat_sea.jpeg',  // ok
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/cat/img_west_lake_cats.jpg', // ok
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/cat/img_cat_2glass.jpg',  // ok
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/cat/img_cat_fly.jpg',  // ok
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/cat/img_cat_hunt.jpg',  //
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/cat/img_cat_little_sad.jpg',  // ok
    'https://icemono.oss-cn-hangzhou.aliyuncs.com/images/cat/img_cat_watch.jpg',

  ].sort(() => 0.5 - Math.random()),
  // 'bing': []
}

let poetries = [
  '五月渔郎相忆否？\n 小楫轻舟 \n 梦入芙蓉浦',
  '红豆生南国 \n 春来发几枝 \n 愿君多采撷 \n 此物最相思',
  '好雨知时节 \n 当春乃发生 \n 随风潜入夜 \n 润物细无声',
  '霓为衣兮风为马 \n 云之君兮纷纷而来下',
  '日出江花红胜火 \n 春来江水绿如蓝 \n 能不忆江南？',
  '春眠不觉晓 \n 处处闻啼鸟 \n 夜来风雨声 \n 花落知多少',
  // '千山鸟飞绝 \n 万径人踪灭 \n 孤舟蓑笠翁 \n 独钓寒江雪',
  '小楼一夜听春雨 \n 深巷明朝卖杏花',
  '墙角数枝梅 \n凝寒独自开 \n遥知不是雪 \n为有暗香来',
  '问君能有几多愁 \n 恰似一江春水向东流',
  '寄蜉蝣于天地 \n 渺沧海之一粟',
  '桂棹兮兰桨 \n 击空明兮溯流光 \n 渺渺兮予怀 \n 望美人兮天一方',
  '孤帆远影碧空尽 \n 唯见长江天际流',
  '青青子衿悠悠我心 \n 但为君故沉吟至今',
  '几只早莺争暖树 \n 谁家新燕啄春泥',
  '天街小雨润如酥 \n 草色遥看近却无',
  '千里莺啼绿映红 \n 水村山郭酒旗风',
  '人间四月芳菲尽 \n 山寺桃花始盛开',
  '众里寻他千百度\n蓦然回首\n那人却在\n灯火阑珊处',
  '海上生明月 \n 天涯共此时',
  '关关雎鸠 \n在河之洲 \n窈窕淑女 \n君子好逑',
  '蒹葭苍苍 \n白露为霜 \n所谓伊人 \n在水一方',
  '竹外桃花三两枝 \n 春江水暖鸭先知',
  '羌笛何须怨杨柳\n春风不度玉门关',
  '远上寒山石径斜\n 白云深处有人家',
  '云中谁寄锦书来\n 雁字回时\n 月满西楼',
  '山重水复疑无路\n 柳暗花明又一村',
  '采菊东篱下\n 悠然见南山',
  '长风破浪会有时\n 直挂云帆济沧海\n',
  '海内存知己\n 天涯若比邻',
  '水光潋滟晴方好\n 山色空蒙雨亦奇',
  '忽如一夜春风来\n 千树万树梨花开',
  '沅有芷兮澧有兰\n 思公子兮未敢言',
  '乱花渐欲迷人眼\n 浅草才能没马蹄',
  '西塞山前白鹭飞\n 桃花流水鳜鱼肥',
  '欲买桂花同载酒\n 终不似、少年游',
  '东风夜放花千树\n 更吹落、星如雨',
  '白日依山尽\n 黄河入海流\n 欲穷千里目\n 更上一层楼',
  '朝辞白帝彩云间 \n千里江陵一日还 \n两岸猿声啼不住 \n轻舟已过万重山',
  '庄生晓梦迷蝴蝶\n 望帝春心托杜鹃\n 沧海月明珠有泪\n 蓝田日暖玉生烟',
  '空山新雨后\n天气晚来秋\n明月松间照\n清泉石上流',
  '泉眼无声惜细流\n树阴照水爱晴柔\n小荷才露尖尖角\n早有蜻蜓立上头',
  '薰风自南至\n吹我池上林',
  '稻花香里说丰年\n听取蛙声一片',
  '携扙来追柳外凉\n画桥南畔倚胡床',
  '梅子黄时日日晴\n小溪泛尽却山行',
  '乐彼之园，爰有树檀，\n其下维榖。\n它山之石，可以攻玉。'
].sort(() => 0.5 - Math.random())

const defaultCityId = "101210113" //杭州市西湖区
const defaultBgGroupName = "illusion"
app.get('/poetryWeather', async (req, res) => {
  const params = req.query;
  console.log(params)
  if (params.methodType == "getWeeks") {
    let cityId = defaultCityId
    let bgGroupName = defaultBgGroupName
    if (params.cityId) {
      cityId = params.cityId
    }
    if (params.bgGroupName) {
      bgGroupName = params.bgGroupName
    }


    // Define the URLs and parameters
    const url1 = `https://devapi.qweather.com/v7/weather/now?location=${cityId}&key=${config.weatherKey}`;
    const url2 = `https://devapi.qweather.com/v7/weather/7d?location=${cityId}&key=${config.weatherKey}`;

    // Fetch the current weather
    const response1 = await fetch(url1, {
      method: 'GET',
      headers: {
        'Accept-Encoding': 'gzip',
        'Content-Type': 'application/json'
      }
    });

    // Fetch the weather for the next 7 days
    const response2 = await fetch(url2, {
      method: 'GET',
      headers: {
        'Accept-Encoding': 'gzip',
        'Content-Type': 'application/json'
      }
    });

    // Parse the responses as JSON
    const weather = await response1.json();
    const nextDays = await response2.json();

    const today = new Date().getDate()
    if (bgGroupName == 'bing') {
      await initBing()
    }
    let weekImages = weekImagesDict[bgGroupName]

    let poetryWeatherList = []
    for (let i = 0; i < Math.min(7, nextDays.daily.length); i++) {
      let item = {
        poem: poetries[i],
        weather: nextDays.daily[i]
      }
      item.weather.dayEmoji = getWeatherIcon(item.weather.textDay) ?? ""
      item.weather.dateStr = moment(item.weather.fxDate, "YYYY-MM-DD").format("MMM Do dddd")
      if (weekSortBgGroups.includes(bgGroupName)) {
        const dayOfWeek = moment(item.weather.fxDate, "YYYY-MM-DD").format("d")
        item.bgImage = weekImages[parseInt(dayOfWeek)]
      } else if (weekImages && weekImages[i]) {
        item.bgImage = weekImages[i]
      } else {

      }
      poetryWeatherList.push(item)
    }
    weather.now.dayEmoji = getWeatherIcon(weather.now.text) ?? ""

    return res.send({
      statusCode: 200,
      'nowWeather': weather.now,
      'updateTime': weather.updateTime,
      'poetryWeatherList': poetryWeatherList
    })
  }
  if (params.methodType == 'getBgImages') {
    await initBing()
    res.send(
      weekImagesDict
    )
  }
})

function getWeatherIcon(text) {
  const wIcon = {
    '晴': '☀️',
    '阴': '☁️',
    '雨': '🌧️',
    '小雨': '🌧️',
    '中雨': '🌧️',
    '大雨': '🌧️',
    '暴雨': '🌧️🌧️',
    '大暴雨': '🌧️🌧️',
    '特大暴雨': '🌧️🌧️🌧️',
    '雷': '🌩️',
    '雷阵雨': '⛈️',
    '强雷阵雨': '⛈️',
    '雨夹雪': '🌨️',
    '雪': '❄️',
    '小雪': '❄️',
    '中雪': '❄️',
    '大雪': '❄️',
    '暴雪': '❄️❄️',
    '阵雪': '🌨️',
    '雾': '🌁',
    '薄雾': '🌁',
    '霾': '🌫️',
    '阵雪': '🌨️',
    '多云': '⛅',
    '晴间多云': '🌤️',
    '晴转多云': '🌤️',
    '晴转阴': '🌤️',
    '多云转晴': '⛅',
    '龙卷风': '🌪️',
  }
  return wIcon[text]
}

async function initBing() {
  const today = new Date().getDate()
  if (bingDay != today || !weekImagesDict['bing']) {
    const bingImages = await fetchBingImages()
    console.log(bingImages)
    if (bingImages && bingImages.length >= 7) {
      weekImagesDict.bing = bingImages
      bingDay = today
    }
  }
}

async function fetchBingImages() {
  const baseUrl = 'https://bing.biturl.top/?format=json&mkt=zh-CN&index=';
  const promises = [];

  // Create promises for fetch requests
  promises.push(fetch(`${baseUrl}0`)); // For the first request
  for (let i = 6; i > 0; i--) { // For the next 6 requests
    promises.push(fetch(`${baseUrl}${i}`));
  }

  try {
    // Wait for all fetch requests to complete
    const responses = await Promise.all(promises);

    // Parse all responses as JSON
    const jsonResponses = await Promise.all(responses.map(response => response.json()));

    // Extract the 'url' from each response
    const urls = jsonResponses.map(response => response.url);

    // Log and return the URLs
    console.log(urls);
    return urls;
  } catch (error) {
    console.error('Error fetching URLs:', error);
  }
}

app.get('/getRandomImage', async (req, res) => {
  console.log("fetchRandomImage");

  // Generate a random page number between 1 and 365
  const page = Math.floor(Math.random() * 365) + 1;

  // Build the URL for the API request
  const url = `https://huaban.com/v3/search/file?text=%E7%8C%AB%E5%92%AA&sort=all&limit=1&page=${page}&position=search_pin&fields=pins:PIN%7Ctotal`;

  try {
    // Make the API request
    const response = await fetch(url);

    // Validate the response
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    // Parse the JSON response
    const data = await response.json();

    // Extract the key from the first pin
    const pins = data.pins;
    const key = pins[0].file.key;
    const imageUrl = `https://gd-hbimg.huaban.com/${key}_fw480webp`;
    res.send({
      success: true,
      'imageUrl': imageUrl
    })
    return
  } catch (error) {
    console.error(`Request failed with error: ${error.message}`);
  }
  res.send({
    success: false,
    code: 211,
    error: '获取失败。'
  })
})


app.post('/getAuthCode', async (req, res) => {
  const body = req.body;
  const headers = req.headers
  // const userAgent = headers['user-agent']
  const userAgent = "unknown"
  console.log(body)
  const mail = body.mail;
  if (!mail || mail.split('@').length != 2) {
    return res.send({
      success: false,
      code: 212,
      error: '邮箱格式不正确。'
    });
  }
  // 查看5分钟以内是否有验证码发送
  const [rows] = await pool.query(
    'SELECT * FROM authcode WHERE mail = ? AND createTime > ?',
    [mail, new Date().getTime() / 1000 - 60 * 2]
  );
  console.log(rows)
  if (rows.length > 0) {
    return res.send({
      success: false,
      code: 213,
      error: '2分钟内有发送验证码，请查看邮件。'
    });
  }

  let authCode = parseInt(Math.random() * 900000) + 100000

  try {

    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: '"爱宠社oss" <aichongshe_oss@163.com>', // sender address
      to: mail, // list of receivers
      subject: "爱宠社oss auth code", // Subject line
      text: "Your auth code is: " + authCode + " \nPlease don't replay this email. ", // plain text body
    });

    console.log("Message sent: %s", info.messageId);
    let authData = {
      mail: mail,
      code: authCode,
      userAgent: userAgent,
      createTime: parseInt(new Date().getTime() / 1000)
    }

    insertAuthCode(authData)
    return res.send({
      success: true
    });
  } catch (error) {
    console.log(error)
  }
  res.send({
    success: false
  });
})

app.post('/login', async (req, res) => {
  console.log(req.body)
  const body = req.body;
  const authCode = body.authCode
  const mail = body.mail
  if (authCode && mail) {
    // Check if user exists
    const [rows] = await pool.query(
      'SELECT * FROM authcode WHERE mail = ? AND code = ?',
      [mail, authCode]
    );
    console.log(rows)
    if (rows.length > 0) {
      const codeTime = rows[0].createTime;
      if (new Date().getTime() / 1000 - codeTime < 60 * 10) {
        // 验证码是10分钟以内的
        if (rows[0].used) {
          res.send({
            code: 214,
            error: "该验证码已使用，请获取新的验证码。",
            token: "",
            tokenExpires: 0,
          });
          return
        }
        const user = await insertUserIfNone(body.mail);
        if (user && user.id) {
          const payload = { userId: user.id, mail: user.mail };
          const options = { algorithm: 'RS256', keyid: key.kid, expiresIn: '168h' };
          const token = jwt.sign(payload, key.privateKey, options);
          const tokenExpires = Math.floor(Date.now() / 1000) + 168 * 60 * 60;
          console.log(token); // JWT 令牌 🎉
          await pool.query(
            'UPDATE authcode SET used = 1 WHERE mail = ? AND code = ?',
            [mail, authCode]
          );
          res.send({
            token: token,
            tokenExpires: tokenExpires,
            user: user
          });
          return
        }
      } else {
        res.send({
          code: 213,
          error: "验证码已过期",
          token: "",
          tokenExpires: 0,
        });
        return
      }
    }
  }
  res.send({
    code: 212,
    error: "验证码错误",
    token: "",
    tokenExpires: 0,
  });
})


// return user
async function insertUserIfNone(mail) {
  try {
    // Check if user exists
    const [rows] = await pool.query(
      'SELECT * FROM user WHERE mail = ?',
      [mail]
    );
    const now = parseInt(new Date().getTime() / 1000)

    console.log(rows)

    if (rows.length > 0) {
      rows[0].joinRanking = rows[0].id;
      rows[0].lastLoginTime = now;
      return rows[0];
    }
    // User does not exist, insert new user
    const newUser = {
      mail: mail,
      joinTime: now,
      lastLoginTime: now,
    };

    const [insertResult] = await pool.query(
      'INSERT INTO user SET ?',
      newUser
    );
    console.log('New user inserted successfully:', insertResult);
    newUser.id = insertResult.insertId;
    newUser.joinRanking = newUser.id;
    return newUser
  } catch (error) {
    console.error('Error querying/inserting into database:', error);
    throw error;
  }
}

// return user
async function insertAuthCode(authData) {
  try {
    const [insertResult] = await pool.query(
      'INSERT INTO authcode SET ?',
      authData
    );
    console.log('New authData inserted successfully:', insertResult);
    authData.id = insertResult.insertId;
  } catch (error) {
    console.error('Error querying/inserting into database:', error);
    throw error;
  }
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})