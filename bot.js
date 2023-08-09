const conf = require("./config.json")

//vk api connect
const axios = require("axios")
const api = require("node-vk-bot-api/lib/api")
const Markup = require("node-vk-bot-api/lib/markup")
const VkBot = require("node-vk-bot-api")
const bot = new VkBot({
  token: conf.TOKEN,
  group_id: conf.GROUP_ID,
  execute_timeout: 50, // in ms   (50 by default)
  polling_timeout: 25, // in secs (25 by default)

  // webhooks options only
  secret: conf.SECRETHOOK, // secret key (optional)
  confirmation: conf.CONFIRMATION, // confirmation string
})

bot.on(async (ctx) => {
  if (!ctx.message || ctx.message.date < Math.floor(Date.now() / 1000)) return
  const cmd = ctx.message.text.toLowerCase().split(" ")
  if (cmd == "start") {
    await ctx.reply('Тестовый режим!')
  }
})

bot.startPolling((err) => {
  !!err ? console.error(err) : console.log("Bot Started")
})
