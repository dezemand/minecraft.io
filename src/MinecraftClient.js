"use strict"
const EventEmitter = require('events').EventEmitter
const MinecraftChatCommand = require('./MinecraftChatCommand')

class MinecraftClient extends EventEmitter {
  // Private
  constructor(rawClient, server) {
    super()
    var self = this
    this._client = rawClient
    this._server = server
    this._store = server.clients
    this._init = false
    this.others = server.clients.others(this)
    this.all = server.clients.forEach
    this.id = rawClient.id
    this.userName = this.displayName = rawClient.username
    this.uuid = rawClient.uuid
    this.latency = 1
    this.health = 20
    this.food = 20
    this._gameMode = 1
    this.pos = {x: 0, y: 0, z: 0}

    rawClient.on('chat', chatMessage => {
      if(chatMessage.message.startsWith('/'))
        self.emit('command', new MinecraftChatCommand(chatMessage.message))
      else
        self.emit('chat', chatMessage)
    })
    rawClient.on('end', () => {
      self.emit('disconnected')
    })
    rawClient.on('error', err => console.log(err, err.stack))
    rawClient.on('position', (position) => {
      self.pos.x = position.x
      self.pos.y = position.y
      self.pos.z = position.z
    })
    rawClient.on('keep_alive', () => {
      self.latency = rawClient.latency
      self.all(cl => cl.infoPlayerPing(self))
    })
  }

  // Public
  init() {
    var self = this
    if(self._init) throw new Error('cannot init twice')
    self._store.add(self.id, self)
    self.send('login', {
      entityId: self._client.id,
      levelType: 'default',
      gameMode: self.gameMode,
      dimension: 0,
      difficulty: 2,
      maxPlayers: self._server.server.maxPlayers,
      reducedDebugInfo: false
    })
    self.send('position', {
      x: this.pos.x,
      y: this.pos.y,
      z: this.pos.z,
      yaw: 0,
      pitch: 0,
      flags: 0x00
    })
    self.others(cl => {
      cl.sendMessage({color: 'yellow', translate: 'multiplayer.player.joined', 'with': [self.userName]})
      cl.infoPlayerJoined(self)
    })
    self.infoPlayerJoined(self._store.array)
    self._server.updatePlayerCount()
    self._init = true
    self.emit('initiated')
  }
  get gameMode() {
    return this._gameMode
  }
  set gameMode(gameModeId) {
    this._gameMode = gameModeId
    this.send('game_state_change', {
      reason: 3,
      gameMode: gameModeId
    })
    this.sendMessage({
      text: 'Your gamemode has been changed',
      italic: true,
      color: 'gray'
    })
  }
  kick(message) {
    this.send('kick_disconnect', {reason: JSON.stringify(message)});
  }
  infoPlayerJoined(clientsJoining) {
    var data = [];
    if(!(clientsJoining instanceof Array)) clientsJoining = [clientsJoining]
    clientsJoining.forEach(cl => data.push({
      UUID: cl.uuid,
      name: cl.userName,
      properties: [],
      gamemode: cl.gameMode,
      ping: cl.ping,
      displayName: cl.displayName
    }))
    this.send('player_info', {
      action: 0,
      data: data
    })
  }
  infoPlayerLeft(clientsLeaving) {
    var data = [];
    if(!(clientsLeaving instanceof Array)) clientsLeaving = [clientsLeaving]
    clientsLeaving.forEach(cl => data.push({UUID: cl.uuid}))
    this.send('player_info', {
      action: 0,
      data: data
    })
  }
  infoPlayerPing(clientsPinging) {
    var data = [];
    if(!(clientsPinging instanceof Array)) clientsPinging = [clientsPinging]
    clientsPinging.forEach(cl => data.push({
      UUID: cl.uuid,
      ping: cl.latency
    }))
    this.send('player_info', {
      action: 2,
      data: data
    })
  }
  send(packetName, packetInfo) {
    return this._client.write(packetName, packetInfo)
  }

  // Test
  sendMessage(message) {
    this.send('chat', {message: JSON.stringify(message), position: 0})
  }
}

module.exports = MinecraftClient