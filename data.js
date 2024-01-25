const mongoose = require("mongoose")
const AutoIncrement = require("mongoose-sequence")(mongoose)

const accountSchem = new mongoose.Schema({
  vkid: { type: String, unique: true, require: true },
  uid: { type: Number, unique: true },
  acclvl: { type: Number, default: 0 },
  lang: { type: String, default: 'ru' },
  char: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'characters',
        required: true,
      },
      equiped: { type: Boolean, default: false },
    }],
  lastActivity: { type: Date },
})

const charSchem = new mongoose.Schema({
  name: { type: String, unique: true, require: true },
  race: { type: String, require: true },
  gender: { type: String, require: true },
  lvl: { type: Number, default: 1 },
  exp: { type: Number, default: 0 },
  hp: { type: Number, default: 100 },
  mp: { type: Number, default: 100 },
  energy: { type: Number, default: 100 },
  maxEnergy: { type: Number, default: 100 },
  char: {
    hpMax: { type: Number, default: 100 },
    mpMax: { type: Number, default: 100 },
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
  inventory: [
    {
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'items',
        required: true,
      },
      quantity: { type: Number, default: 0 },
      ench: { type: Number, default: 0, min: -1, max: 20 },
      equiped: { type: Boolean, default: false },
    },
  ],
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
