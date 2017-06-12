"use strict"
import EventEmitter from '../EventEmitter'
import MinecraftServer from './Server'
import MinecraftChatCommand from './ChatCommand'
import MinecraftEntityPlayer from './Entity/Player'

export default class MinecraftClient extends EventEmitter {
  inited: boolean = false
  latency: number = 1
  health: number = 1
  food: number = 0
  gm: number = 0
  pos = {x: 0, y: 0, z: 0}
  look = {yaw: 0, pitch: 0}
  onGround: boolean = false
  entity = null

  constructor(public rawClient, public server: MinecraftServer) {
    super()
  }

  others = this.server.clients.others(this)
  all = this.server.clients.all
  id = this.rawClient.id
  userName = this.rawClient.username
  displayName = {text: this.rawClient.username}
  uuid = this.rawClient.uuid

  clientEvents() {
    this.rawClient.on('end', () => this.emit('disconnected'))
    this.rawClient.on('error', err => console.log(err, err.stack))
    this.rawClient.on('chat', this.receiveChat.bind(this))
    this.rawClient.on('position', this.updatePos.bind(this))
    this.rawClient.on('look', this.updateLook.bind(this))
    this.rawClient.on('position_look', this.updatePosLook.bind(this))
    this.rawClient.on('keep_alive', this.keepAlive.bind(this))
  }

  init() {
    if(this.inited)
      throw new Error('Cannot init twice')
    this.inited = true
    this.clientEvents()
    this.server.clients.add(this)
    this.send('login', {
      entityId: this.id,
      levelType: 'default',
      gameMode: this.gameMode,
      dimension: 0,
      difficulty: 2,
      maxPlayers: this.server.maxPlayers,
      reducedDebugInfo: false
    })
    this.sendPosition()
    this.send('spawn_position', {
      location: '0.0.0'
    })
    this.updateHealth()
    this.updateTime()
    this.sendAbilities()
    this.others((cl: MinecraftClient) => {
      cl.sendMessage({color: 'yellow', translate: 'multiplayer.player.joined', 'with': [this.userName]})
      cl.infoPlayerJoined([this])
      cl.updateTime()
    })
    this.infoPlayerJoined(this.server.clients.array)
    this.entity = new MinecraftEntityPlayer(this)
    this.server.updatePlayerCount()
    this.emit('initiated')
  }

  send(packetName: string, packetInfo) {
    return this.rawClient.write(packetName, packetInfo)
  }

  sendMessage(message) {
    this.send('chat', {message: JSON.stringify(message), position: 0})
  }

  tick() {

  }

  kick(message) {
    this.send('kick_disconnect', {reason: JSON.stringify(message)})
  }

  keepAlive() {
    this.latency = this.rawClient.latency
    this.all(cl => cl.infoPlayerPing(this))
  }

  receiveChat(data) {
    if(data.message.startsWith('/'))
      this.emit('command', new MinecraftChatCommand(data.message))
    else
      this.emit('chat', data)
  }

  updatePos(data) {
    if(this.onGround !== data.onGround)
      this.emit('onGround', data.onGround)
    this.emit('position', {
      x: data.x, dx: data.x - this.pos.x,
      y: data.y, dy: data.y - this.pos.y,
      z: data.z, dz: data.z - this.pos.z
    })
    this.pos.x = data.x
    this.pos.y = data.y
    this.pos.z = data.z
    this.onGround = data.onGround
  }

  updateLook(data) {
    if(this.onGround !== data.onGround)
      this.emit('onGround', data.onGround)
    this.emit('look', {
      yaw: data.yaw, dyaw: data.yaw - this.look.yaw,
      pitch: data.pitch, dpitch: data.pitch - this.look.pitch
    })
    this.look.pitch = data.pitch
    this.look.yaw = data.yaw
    this.onGround = data.onGround
  }

  updatePosLook(data) {
    if(this.onGround != data.onGround)
      this.emit('onGround', data.onGround)
    this.rawClient.emit('look', {yaw: data.yaw, pitch: data.pitch, onGround: data.onGround})
    this.rawClient.emit('position', {x: data.x, y: data.y, z: data.z, onGround: data.onGround})
  }

  updateHealth(health: number = this.health, food: number = this.food, foodSaturation: number = 0) {
    this.send('update_health', {
      health: health,
      food: food,
      foodSaturation: foodSaturation
    })
    this.health = health
    this.food = food
  }

  updateTime() {
    const time: number = Date.now() - this.server.startTime.getTime()
    const ticks: number = Math.round(time / 50) % 24000
    this.send('update_time', {
      age: [0, 0],
      time: [0, ticks]
    })

  }

  get gameMode(): number {
    return this.gm
  }

  set gameMode(newGameMode: number) {
    const oldGameMode = this.gm
    this.gm = newGameMode
    this.send('game_state_change', {
      reason: 3,
      gameMode: newGameMode
    })
    this.all(cl => cl.infoPlayerGamemode(this))
    this.sendAbilities()
    this.emit('gameModeChange', newGameMode, oldGameMode)
  }

  get flags(): number {
    const creative = +(this.gameMode === 1)
    const isFlying = 0 // TODO
    const canFly = +(this.gameMode === 1 || this.gameMode === 3)
    const godmode = 0
    return creative + isFlying * 2 + canFly * 4 + godmode * 8
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

  infoPlayerJoined(clients: Array<MinecraftClient>) {
    const data: Array<object> = clients.map((cl: MinecraftClient) => ({
      UUID: cl.uuid,
      name: cl.userName,
      properties: [],
      gamemode: cl.gameMode,
      ping: cl.latency,
      displayName: JSON.stringify(cl.displayName)
    }))
    this.send('player_info', {
      action: 0,
      data: data
    })
  }

  infoPlayerLeft(clients: Array<MinecraftClient>) {
    const data: Array<object> = clients.map((cl: MinecraftClient) => ({UUID: cl.uuid}))
    this.send('player_info', {
      action: 4,
      data: data
    })
  }

  infoPlayerPing(clients: Array<MinecraftClient>) {
    const data: Array<object> = clients.map((cl: MinecraftClient) => ({
      UUID: cl.uuid,
      ping: cl.latency
    }))
    this.send('player_info', {
      action: 2,
      data: data
    })
  }

  infoPlayerGamemode(clients: Array<MinecraftClient>) {
    const data: Array<object> = clients.map((cl: MinecraftClient) => ({
      UUID: cl.uuid,
      gamemode: cl.gameMode
    }))
    this.send('player_info', {
      action: 1,
      data: data
    })
  }
}
