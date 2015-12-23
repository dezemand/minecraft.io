"use strict"
const EventEmitter = require('events').EventEmitter
const MinecraftChatCommand = require('./MinecraftChatCommand')
const MinecraftEntityPlayer = require('./MinecraftEntityPlayer')
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
    this.all = server.clients.all
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
    this.entity = null

    rawClient.on('chat', data => {
      if(data.message.startsWith('/'))
        self.emit('command', new MinecraftChatCommand(data.message))
      else
        self.emit('chat', data)
    })
    rawClient.on('end', () => {
      self.emit('disconnected')
    })
    rawClient.on('error', err => console.log(err, err.stack))
    rawClient.on('position', data => {
      if(self.onGround != data.onGround) self.emit('onGround', data.onGround)
      self.emit('position', {
        x: data.x, dx: data.x - self.pos.x,
        y: data.y, dy: data.y - self.pos.y,
        z: data.z, dz: data.z - self.pos.z
      })
      self.pos.x = data.x
      self.pos.y = data.y
      self.pos.z = data.z
      self.onGround = data.onGround
    })
    rawClient.on('look', data => {
      if(self.onGround != data.onGround) self.emit('onGround', data.onGround)
      self.emit('look', {
        yaw: data.yaw, dyaw: data.yaw - self.look.yaw,
        pitch: data.pitch, dpitch: data.pitch - self.look.pitch
      })
      self.look.pitch = data.pitch
      self.look.yaw = data.yaw
      self.onGround = data.onGround
    })
    rawClient.on('position_look', data => {
      if(self.onGround != data.onGround) self.emit('onGround', data.onGround)
      var look = {yaw: data.yaw, pitch: data.pitch, onGround: data.onGround}
      var pos = {x: data.x, y: data.y, z: data.z, onGround: data.onGround}
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
    if(self._init) throw new Error('Cannot `init` MinecraftClient twice')
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
    self.sendPosition()
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
    self.entity = new MinecraftEntityPlayer(self)
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
    this.all(cl => cl.infoPlayerGamemode(self))
    this.sendAbilities()
    this.emit('gameModeChange', gameModeId, oldGameMode)
  }
  get flags() {
    var creative = +(this.gameMode === 1)
    var isFlying = 0 // TODO
    var canFly = +(this.gameMode === 1 || this.gameMode === 3)
    var godmode = 0 // TODO, but low priority
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
  sendPosition() {
    this.send('position', {
      x: this.pos.x,
      y: this.pos.y,
      z: this.pos.z,
      yaw: this.look.yaw,
      pitch: this.look.pitch,
      flags: this.flags
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