const mongoose = require("mongoose")
const { Account, Char, Item } = require("./data.js")
const conf = require("./config.json")

//vk api connect
const VkBot = require("node-vk-bot-api")
const Markup = require("node-vk-bot-api/lib/markup")
const Session = require("node-vk-bot-api/lib/session")
const Stage = require("node-vk-bot-api/lib/stage")
const Scene = require("node-vk-bot-api/lib/scene")
const bot = new VkBot({
  token: conf.TOKEN,
  group_id: conf.GROUP_ID,
  execute_timeout: 50, // in ms   (50 by default)
  polling_timeout: 25, // in secs (25 by default)

  // webhooks options only
  secret: conf.SECRETHOOK, // secret key (optional)
  confirmation: conf.CONFIRMATION, // confirmation string
})

//utils
function getLocale(ctx, string, ...vars) {
  const ulang = ctx.account
    ? ctx.account.lang
    : ctx.clientInfo.lang_id == 0
    ? "ru"
    : "ru" // "en"
  let lang = require(`./lang/${ulang}.json`)

  lang = lang[string] || lang["noTranslateOrError"]

  vars.forEach((v, i) => {
    if (typeof lang == "object") {
      for (let key in lang) {
        lang[key] = lang[key].replace(/%VAR%/, v)
      }
    } else {
      lang = lang.replace(/%VAR%/, v)
    }
  })
  return lang
}

bot.use(async (ctx, next) => {
  if (
    !ctx.message ||
    ctx.message.date < Math.floor(Date.now() / 1000) ||
    ctx.message.type != "message_new"
  )
    return

  if (ctx.message.from_id > 0 && ctx.message.id > 0) {
    ctx.account = await Account.findOne({ vkid: ctx.message.from_id })
    ctx.message.timestamp = new Date().getTime()
    const lang = ctx.clientInfo.lang_id == 0 ? "ru" : "ru" // "en"
    if (!ctx.account) {
      await Account.create({
        vkid: ctx.message.from_id,
        lang,
        lastActivity: ctx.message.timestamp,
      })
      ctx.account = await Account.findOne({ vkid: ctx.message.from_id })
      await next()
    } else {
      await Account.findOneAndUpdate(
        { uid: ctx.account.uid },
        { lastActivity: ctx.message.timestamp }
      )
      await next()
    }
  }
})

const session = new Session()
const scene = new Scene(
  "createChar",
  async (ctx) => {
    ctx.scene.next()
    
    await ctx.reply('0')
    await ctx.reply(
      getLocale(ctx, "start"),
      "https://sun1-90.userapi.com/impg/zX10__3RRK-5p8yTDoK2sBJz9V9L3dIIzEzHNg/EtkR0kjuuPg.jpg",
      Markup.keyboard([
        Markup.button(getLocale(ctx, "gender").male, "default", "male"),
        Markup.button(getLocale(ctx, "gender").female, "default", "female"),
      ]).inline()
    )
  },
  (ctx) => {
    ctx.session.gender = ctx.message.payload

    ctx.scene.next()
    ctx.reply(
      getLocale(ctx, "raceSelect"),
      null,
      Markup.keyboard([
        Markup.button(getLocale(ctx, "race").elf, "default", "elf"),
        Markup.button(getLocale(ctx, "race").dwarf, "default", "dwarf"),
        Markup.button(getLocale(ctx, "race").human, "default", "human"),
        Markup.button(getLocale(ctx, "race").ork, "default", "ork"),
      ]).inline()
    )
  },
  (ctx) => {
    ctx.session.race = ctx.message.payload

    ctx.scene.next()
    ctx.reply(getLocale(ctx, "nameSelect"))
  },
  async (ctx) => {
    ctx.session.name = ctx.message.text

    ctx.scene.leave()
    await ctx.reply(`${ctx.session.name}, ${ctx.session.race}, ${ctx.session.gender}`)
    await ctx.reply('Уважаемый путник, в это мгновенье, когда мир еще обретает свои очертания, словно нежное ткацкое полотно, прошу терпеливо пребывать в ожидании...')
  }
)
const stage = new Stage(scene)

bot.use(session.middleware())
bot.use(stage.middleware())

bot.command(["start", "начать"], (ctx) => {
  if (!ctx.account.char[0]) {
    ctx.scene.enter("createChar")
  }
  // ctx.reply(
  //   "Приветствую тебя, уважаемый путник, в это мгновенье, когда мир еще обретает свои очертания, словно нежное ткацкое полотно, прошу терпеливо пребывать в ожидании...",
  //   null,
  //   Markup.keyboard([Markup.button("Начать", "default", "start")])
  // )
})

bot.on((ctx) => {
  const text_cmd = ctx.message.text
  if (text_cmd == "hui") {
    ctx.reply("hui")
  } else return
})

bot.startPolling((err) => {
  err ? console.error(err) : console.log("Bot Started")
})

//error handlers
bot.on("error", (err) => {
  console.error(err)
})

process.on("uncaughtException", function (err) {
  console.error(err)
})

process.on("unhandledRejection", function (err) {
  console.error(err)
})

//Connect of DB
mongoose
  .connect(
    `mongodb://${conf.DBUSER}:${conf.DBPASS}@${conf.SERVER}/${conf.DB}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("MongoDB connected!!")
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err)
  })
