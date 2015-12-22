"use strict"
const EventEmitter = require('events').EventEmitter
const MinecraftChatCommand = require('./MinecraftChatCommand')
const Vec3 = require('vec3')

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
    this.health = 1
    this.food = 0
    this._gameMode = 0
    this.pos = {x: 0, y: 0, z: 0}
    this.look = {yaw: 0, pitch: 0}
    this.onGround = false

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
    rawClient.on('position', position => {
      self.pos.x = position.x
      self.pos.y = position.y
      self.pos.z = position.z
      self.onGround = position.onGround
    })
    rawClient.on('look', look => {
      self.look.pitch = look.pitch
      self.look.yaw = look.yaw
      self.onGround = look.onGround
    })
    rawClient.on('position_look', lookpos => {
      var look = {yaw: lookpos.yaw, pitch: lookpos.pitch, onGround: lookpos.onGround}
      var pos = {x: lookpos.x, y: lookpos.y, z: lookpos.z, onGround: lookpos.onGround}
      rawClient.emit('look', look)
      rawClient.emit('position', pos)
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
      x: self.pos.x,
      y: self.pos.y,
      z: self.pos.z,
      yaw: self.look.yaw,
      pitch: self.look.pitch,
      flags: self.flags
    })
    self.send('spawn_position', {
      location: '0.0.0'
    })
    self.updateHealth()
    self.updateTime()
    self.sendAbilities()
    self.others(cl => {
      cl.sendMessage({color: 'yellow', translate: 'multiplayer.player.joined', 'with': [self.userName]})
      cl.infoPlayerJoined(self)
      cl.updateTime()
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
    var self = this
    var oldGameMode = this._gameMode
    this._gameMode = gameModeId
    this.send('game_state_change', {
      reason: 3,
      gameMode: gameModeId
    })
    this.sendAbilities()
    this.all(cl => cl.infoPlayerGamemode(self))
    this.emit('gameModeChange', gameModeId, oldGameMode)
  }
  get flags() {
    var creative = +(this.gameMode === 1)
    var isFlying = 0
    var canFly = +(this.gameMode === 1 || this.gameMode === 3)
    var godmode = 0
    return creative + isFlying * 2 + canFly * 4 + godmode * 8
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
  infoPlayerGamemode(clientsChanging) {
    var data = [];
    if(!(clientsChanging instanceof Array)) clientsChanging = [clientsChanging]
    clientsChanging.forEach(cl => data.push({
      UUID: cl.uuid,
      gamemode: cl.gameMode
    }))
    this.send('player_info', {
      action: 1,
      data: data
    })
  }
  updateHealth(health = this.health, food = this.food, foodSaturation = 0) {
    this.send('update_health', {
      health: health,
      food: food,
      foodSaturation: foodSaturation
    })
    this.health = health
    this.food = food
  }
  updateTime() {
    var time = (new Date()) - this._server.startTime
    var ticks = Math.round(time / 50) % 24000
    this.send('update_time', {
      age: [0, 0],
      time: [0, ticks]
    })
  }
  sendAbilities() {
    this.send('abilities', {
      flags: this.flags,
      flyingSpeed: 0.1,
      walkingSpeed: 0.2
    })
  }
  send(packetName, packetInfo) {
    return this._client.write(packetName, packetInfo)
  }
  sendMessage(message) {
    this.send('chat', {message: JSON.stringify(message), position: 0})
  }
}

module.exports = MinecraftClient