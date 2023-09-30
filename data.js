const mongoose = require("mongoose")
const AutoIncrement = require("mongoose-sequence")(mongoose)

const accountSchem = new mongoose.Schema({
  vkid: { type: String, unique: true, require: true },
  uid: { type: Number, unique: true },
  acclvl: { type: Number, default: 0 },
  lang: { type: String, default: 'ru' },
  char: [{ type: mongoose.Schema.Types.ObjectId, ref: "characters" }],
  lastActivity: { type: Date },
})

const charSchem = new mongoose.Schema({
  nickname: { type: String },
  race: { type: String },
  lvl: { type: Number, default: 1 },
  charname: { type: String, unique: true, require: true },
  inventory: [{ type: mongoose.Schema.Types.ObjectId, ref: "items" }],
})

accountSchem.plugin(AutoIncrement, { inc_field: "uid", start_seq: 527100 })
const Account = mongoose.model("accounts", accountSchem)
const Char = mongoose.model("characters", charSchem)

const itemSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  desc: { type: String, required: true },
  img: { type: String, required: true },
  weight: { type: Number, required: true },
  stack: { type: Number, required: true },
  type: { type: Number, required: true },
  char: {
    hpMax: { type: Number },
    mpMax: { type: Number },
    f_atk: { type: Number },
    m_atk: { type: Number },
    f_def: { type: Number },
    m_def: { type: Number },
    acc: { type: Number },
    ev: { type: Number },
  },
  stat: {
    str: { type: Number },
    int: { type: Number },
    con: { type: Number },
    luc: { type: Number },
    chr: { type: Number },
  },
})

const Item = mongoose.model("items", itemSchema)

module.exports = { Account, Char, Item }
