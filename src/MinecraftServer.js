"use strict"
const EventEmitter = require('events').EventEmitter
const debug = require('debug')('mc:server')
const mcProtocol = require('minecraft-protocol')
const MinecraftClient = require('./MinecraftClient')
const MinecraftClientStore = require('./MinecraftClientStore')
const MinecraftEntityStore = require('./MinecraftEntityStore')
const NanoTimer = require('nanotimer')

class MinecraftServer extends EventEmitter {
  constructor(options) {
    super()
    this.server = null
    this.clients = new MinecraftClientStore()
    this.entities = new MinecraftEntityStore()
    this.options = options
    this.startTime = new Date()
    this.timer = new NanoTimer()
    this.tickInterval = 1000 / 20
  }
  listen(port = 25565, host = '0.0.0.0', callback = () => {}) {
    if(this.server !== null) throw new Error('Cannot `listen` MinecraftServer twice')
    this.options.port = port
    this.options.host = host
    this.server = mcProtocol.createServer(this.options)
    this._initEvents()
    this.timer.setInterval(this.tick, [this], this.tickInterval + 'u')
  }
  _initEvents() {
    var self = this
    var store = this.clients
    self.server.on('login', rawClient => {
      var client = new MinecraftClient(rawClient, self)
      store.all(cl => console.log('Connected UUID: %s', cl.uuid))
      console.log('Connecting UUID: %s', client.uuid)
      if(store.find({uuid: client.uuid}).length !== 0) return client.kick({text: 'Your UUID is already registered'})
      client.init()
    })
    store.on('chat', (client, message) => {
      store.all(cl => cl.sendMessage({text: '<' + client.userName + '> ' + message.message}))
      console.log('<' + client.userName + '> ' + message.message)
    })
    store.on('command', (client, cmd) => {
      if(cmd.name == 'gamemode')
        client.gameMode = parseInt(cmd.getArgs(2)[0])
      else if(cmd.name == 'latency')
        client.sendMessage({text: 'Latency: ' + client.latency + 'ms'})
      else if(cmd.name == 'heal')
        client.updateHealth(20, 20)
      else
        client.sendMessage({text: 'Command not found', italic: true, color: 'gray'})
    })
    store.on('disconnected', (client) => {
      store.all(cl => {
        cl.infoPlayerLeft(client)
        cl.sendMessage({color: 'yellow', translate: 'multiplayer.player.left', 'with': [client.userName]})
      })
      console.log('%s left the game', client.userName)
      self.updatePlayerCount()
    })
    store.on('initiated', (client) => {
      client.sendMessage({text: 'Welcome, ' + client.userName + '!'})
    })
    store.on('gameModeChange', client => {
      client.sendMessage({
        text: 'Your gamemode has been changed',
        italic: true,
        color: 'gray'
      })
    })
  }
  updatePlayerCount() {
    this.server.playerCount = this.clients.length
  }
  tick(self) {
    self.clients.all(client => client.tick())
    self.entities.all(entity => entity.tick())
  }
}

module.exports = MinecraftServer
