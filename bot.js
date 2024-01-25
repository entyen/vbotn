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

/**
 * Localisation Utill
 * @param {String} ctx language check from user context
 * @param {String} string localisation value
 * @param  {...any} vars any vars inside localisation
 * @returns 
 */
function getLocale(ctx, string, ...vars) {
  const ulang = ctx.account
    ? ctx.account.lang
    : ctx.clientInfo.lang_id == 0
      ? "ru"
      : "ru" // "en" // TODO
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

/**
 * Timeout Promise
 * @param {Number} ms 
 * @returns 
 */
function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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

    await ctx.reply('', "photo-206762312_457239120", Markup.keyboard([]))
    await ctx.reply(
      getLocale(ctx, "start"),
      null,
      Markup.keyboard([
        Markup.button(getLocale(ctx, "gender").male, "default", "male"),
        Markup.button(getLocale(ctx, "gender").female, "default", "female"),
      ]).inline()
    )
  },
  (ctx) => {
    ctx.session.gender = ctx.message.payload.replaceAll("\"", "")

    const regExp = /male|female/
    if (!regExp.test(ctx.session.gender)) {
      console.log(ctx.scene.step)
    } else {
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
    }
  },
  (ctx) => {
    ctx.session.race = ctx.message.payload.replaceAll("\"", "")

    const regExp = /elf|dwarf|human|ork/
    if (!regExp.test(ctx.session.race)) {
      console.log(ctx.scene.step)
    } else {
      ctx.scene.next()
      ctx.reply(getLocale(ctx, "nameSelect"))
    }
  },
  async (ctx) => {
    ctx.session.name = ctx.message.text

    const badwords = require("./lang/badwords.json")
    const checkBadword = !!badwords.find((c) => c == ctx.session.name) || ctx.session.name.length < 3
    if (checkBadword) ctx.session.name = undefined

    const nameUnavaible = await Char.findOne({ name: ctx.session.name })
    if (nameUnavaible) ctx.session.name = undefined

    const nicknameRegEx = /^[a-zA-Zа-яА-Я]+$/;
    if (!nicknameRegEx.test(ctx.session.name) || !ctx.session.name) {
      await ctx.reply('Неверное имя')
    } else {
      ctx.scene.next()
      const race = getLocale(ctx, "race")[ctx.session.race]
      const gender = getLocale(ctx, "gender")[ctx.session.gender + "R"]
      await ctx.reply(getLocale(ctx, "selectLore", race, gender, ctx.session.name), null,
        Markup.keyboard([
          Markup.button(getLocale(ctx, "approve").yes, "default", "yes"),
          Markup.button(getLocale(ctx, "approve").no, "default", "no"),
        ]).inline())
    }
  },
  async (ctx) => {
    ctx.session.selectedApprove = ctx.message.payload.replaceAll("\"", "")
    if (ctx.session.selectedApprove == "yes") {
      ctx.scene.next()
      await ctx.reply(getLocale(ctx, "selectLore1"), "photo-206762312_457239120")
      await timeout(4000)
      await ctx.reply(getLocale(ctx, "selectTravel"), "photo-206762312_457239120")
      await ctx.reply(getLocale(ctx, "selectTravel1"))
      await timeout(4000)
      ctx.reply(getLocale(ctx, "selectTravel2"), null, Markup.keyboard([Markup.button("Отдохнуть", "default", "relax"), Markup.button("Не отдыхать", "default", "norelax")]).inline())
    } else {
      ctx.scene.leave()
      await ctx.reply(getLocale(ctx, "selectNo"), null, Markup.keyboard([Markup.button("Начать", "default", "start")]))
    }
  },
  async (ctx) => {
    ctx.session.relaxed = ctx.message.payload == "\"relax\"" ? 'yes' : ctx.message.payload == "\"norelax\"" ? 'no' : false

    if (ctx.session.relaxed) {
      ctx.scene.next()
      await ctx.reply(getLocale(ctx, ctx.session.relaxed == "yes" ? "selectRelaxed" : "selectNoRelaxed"))
      await timeout(4000)
      await ctx.reply(getLocale(ctx, "selectSearchBTN"), null, Markup.keyboard([Markup.button("Отправится на поиски", "default", "searching"), Markup.button("Бежать дальше", "default", "nosearching")]).inline())
    }
  },
  async (ctx) => {
    ctx.session.searching = ctx.message.payload == "\"searching\"" ? "yes" : ctx.message.payload == "\"nosearching\"" ? "no" : false

    if (ctx.session.searching) {
      ctx.scene.leave()
      await ctx.reply(getLocale(ctx, "selectFind"))
      await timeout(4000)
      await Char.create({
        name: ctx.session.name,
        race: ctx.session.race,
        gender: ctx.session.gender,
        energy: ctx.session.relaxed == "yes" ? 100 : 0,
        maxEnergy: ctx.session.relaxed == "yes" ? 100 : 110
      }).then(async (x) => {
        ctx.account.char.unshift({ _id: x._id, equiped: true })
        await ctx.account.save()
      })
      await ctx.reply(getLocale(ctx, ctx.session.searching == "yes" ? "selectEnd" : "selectEndAlt"), null, Markup.keyboard([Markup.button("Начать", "default", "start")]))
    }
  }
)

const stage = new Stage(scene)

bot.use(session.middleware())
bot.use(stage.middleware())

bot.command(["start", "начать"], async (ctx) => {
  if (!ctx.account.char[0]) {
    ctx.scene.enter("createChar")
  } else if (ctx.account.char[0]) {
    const eqChar = ctx.account.char.filter((x) => x.equiped == true)
    const char = await Char.findById(eqChar[0]._id)
    ctx.reply(
      `Персонаж: ${char.name}\nУровень: ${char.lvl}\nЭнергии: ${char.energy}`,
      null,
      Markup.keyboard([Markup.button("Начать", "default", "start")])
    )
    console.log(char)
  } else {
    ctx.reply(
      "Приветствую тебя, уважаемый путник, в это мгновенье, когда мир еще обретает свои очертания, словно нежное ткацкое полотно, прошу терпеливо пребывать в ожидании...",
      null,
      Markup.keyboard([Markup.button("Начать", "default", "start")])
    )
  }
})

bot.on(async (ctx) => {
  const textCmd = ctx.message.text.split(' ')[0].toLowerCase()
  if (textCmd == "mob") {
    const vars = ctx.message.text.split(' ').slice(1)
    const mobLvl = +vars[0] || 1
    let iteration = 0
    userstat = {
      hp: 100,
      dmg: 1,
      def: 6
    }
    mobstat = {
      hp: 40 * mobLvl,
      dmg: 1 * mobLvl,
      def: 1 * mobLvl
    }
    const dmgCalc = (dmg, def) => {
      if ((dmg - def) < 0) return 0
      return (dmg - def)
    }
    let userDmg = dmgCalc(userstat.dmg, mobstat.def)
    let mobDmg = dmgCalc(mobstat.dmg, userstat.def)
    while (userstat.hp > 0 && mobstat.hp > 0) {
      iteration++
      if (userDmg <= 0 && mobDmg <= 0) break;
      mobstat.hp -= userDmg
      userstat.hp -= mobDmg
      if (mobstat.hp < 0) mobstat.hp = 0
      if (userstat.hp < 0) userstat.hp = 0
    }
    const fightState = userstat.hp > 0 ? "WON" : "LOOSE"
    ctx.reply(`Test Fight u ${fightState}\nUser: HP ${userstat.hp}\nMob ${mobLvl}: HP ${mobstat.hp}\nFight Stat: ${iteration} iterasion`)
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
