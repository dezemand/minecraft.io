"use strict"
import EventEmitter from '../EventEmitter'
import MinecraftServer from './Server'
import MinecraftChatCommand from './ChatCommand'
import MinecraftEntity from './Entity/Entity'
import MinecraftEntityPlayer from './Entity/Player'
import {Chat, Look, Position} from '../Interfaces'
import Debug from '../Debug'
import MinecraftWorld from './World'
import {Event} from '../Enums'
import MinecraftChunk from './Chunk'
import * as SpiralLoop from 'spiralloop'
declare const Buffer

const debug: Debug = new Debug('MinecraftClient')

export default class MinecraftClient extends EventEmitter {
  private inited: boolean = false
  public latency: number = 1
  public health: number = 1
  public food: number = 0
  private gm: number = 0
  public pos: Position = {x: 0, y: 60, z: 0}
  public look: Look = {yaw: 0, pitch: 0}
  public onGround: boolean = false
  private entity: MinecraftEntityPlayer
  private spawnedEntities: Set<MinecraftEntity> = new Set()
  private loadedChunks: Set<MinecraftChunk> = new Set()

  constructor (public rawClient, public server: MinecraftServer) {
    super()
    debug.log('Constructed')
  }

  private others = this.server.clients.others(this)
  private all = this.server.clients.all
  public id: string = this.rawClient.id
  readonly userName: string = this.rawClient.username
  public displayName = {text: this.rawClient.username}
  readonly uuid: string = this.rawClient.uuid
  private _world: MinecraftWorld

  private clientEvents (): void {
    this.rawClient.on('end', this.disconnect.bind(this))
    this.rawClient.on('error', this.error.bind(this))
    this.rawClient.on('chat', this.receiveChat.bind(this))
    this.rawClient.on('position', this.updatePos.bind(this))
    this.rawClient.on('look', this.updateLook.bind(this))
    this.rawClient.on('position_look', this.updatePosLook.bind(this))
    this.rawClient.on('keep_alive', this.keepAlive.bind(this))
  }

  public init (): void {
    if (this.inited)
      throw new Error('Cannot init twice')
    this.inited = true
    this.clientEvents()
    this.server.clients.addClient(this)
    this.send('login', {
      entityId: this.id,
      levelType: 'default',
      gameMode: this.gameMode,
      dimension: 0,
      difficulty: 2,
      maxPlayers: this.server.maxPlayers,
      reducedDebugInfo: false
    })
    this.sendChunks()
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
    this.entity.init()
    this.server.updatePlayerCount()
    this.updateSpawnedEntites()
    this.emit(Event.ClientInitiated)
  }

  public send (packetName: string, packetInfo): void {
    return this.rawClient.write(packetName, packetInfo)
  }

  public sendMessage (message: Chat): void {
    this.send('chat', {message: JSON.stringify(message), position: 0})
  }

  public tick (): void {

  }

  public kick (message: Chat): void {
    this.send('kick_disconnect', {reason: JSON.stringify(message)})
    this.destroy(null)
  }

  private keepAlive (): void {
    this.latency = this.rawClient.latency
    this.all(cl => cl.infoPlayerPing(this))
  }

  private receiveChat (data): void {
    if (data.message.startsWith('/'))
      this.emit(Event.ClientSentCommand, new MinecraftChatCommand(data.message))
    else
      this.emit(Event.ClientSentChat, data)
  }

  private updatePos (data): void {
    if (this.onGround !== data.onGround)
      this.emit(Event.ClientOnGround, data.onGround)
    this.emit(Event.ClientPosition, {
      x: data.x, dx: data.x - this.pos.x,
      y: data.y, dy: data.y - this.pos.y,
      z: data.z, dz: data.z - this.pos.z
    })
    this.pos.x = data.x
    this.pos.y = data.y
    this.pos.z = data.z
    this.onGround = data.onGround
    this.entity.updatePos(this.pos)
    // this.sendMessage({text: 'updatePos ' + JSON.stringify(data)})
  }

  private updateLook (data): void {
    if (this.onGround !== data.onGround)
      this.emit(Event.ClientOnGround, data.onGround)
    this.emit(Event.ClientLook, {
      yaw: data.yaw, dyaw: data.yaw - this.look.yaw,
      pitch: data.pitch, dpitch: data.pitch - this.look.pitch
    })
    this.look.pitch = data.pitch
    this.look.yaw = data.yaw
    this.onGround = data.onGround
    this.fixYaw()
    this.entity.updateLook(this.look)
    // this.sendMessage({text: 'updateLook ' + JSON.stringify(data)})
  }

  private fixYaw (): void {
    if (this.look.yaw < 0)
      this.look.yaw += 360
    if (this.look.yaw > 360)
      this.look.yaw -= 360
  }

  private updatePosLook (data): void {
    if (this.onGround != data.onGround)
      this.emit(Event.ClientOnGround, data.onGround)
    this.rawClient.emit('look', {yaw: data.yaw, pitch: data.pitch, onGround: data.onGround})
    this.rawClient.emit('position', {x: data.x, y: data.y, z: data.z, onGround: data.onGround})
  }

  public updateHealth (health: number = this.health, food: number = this.food, foodSaturation: number = 0): void {
    this.send('update_health', {
      health: health,
      food: food,
      foodSaturation: foodSaturation
    })
    this.health = health
    this.food = food
  }

  public updateTime (): void {
    const time: number = Date.now() - this.server.startTime.getTime()
    const ticks: number = Math.round(time / 50) % 24000
    this.send('update_time', {
      age: [0, 0],
      time: [0, ticks]
    })

  }

  public get gameMode (): number {
    return this.gm
  }

  public set gameMode (newGameMode: number) {
    const oldGameMode = this.gm
    this.gm = newGameMode
    this.send('game_state_change', {
      reason: 3,
      gameMode: newGameMode
    })
    this.all(cl => cl.infoPlayerGamemode(this))
    this.sendAbilities()
    this.emit(Event.ClientChangeGamemode, newGameMode, oldGameMode)
  }

  public get flags (): number {
    const creative = +(this.gameMode === 1)
    const isFlying = 0 // TODO
    const canFly = +(this.gameMode === 1 || this.gameMode === 3)
    const godmode = 0
    return creative + isFlying * 2 + canFly * 4 + godmode * 8
  }

  public sendAbilities (): void {
    this.send('abilities', {
      flags: this.flags,
      flyingSpeed: 0.1,
      walkingSpeed: 0.2
    })
  }

  public sendPosition (): void {
    this.send('position', {
      x: this.pos.x,
      y: this.pos.y,
      z: this.pos.z,
      yaw: this.look.yaw,
      pitch: this.look.pitch,
      flags: this.flags
    })
  }

  public infoPlayerJoined (clients: Array<MinecraftClient>): void {
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

  public infoPlayerLeft (clients: Array<MinecraftClient>): void {
    const data: Array<object> = clients.map((cl: MinecraftClient) => ({UUID: cl.uuid}))
    this.send('player_info', {
      action: 4,
      data: data
    })
  }

  public infoPlayerPing (clients: Array<MinecraftClient>): void {
    const data: Array<object> = clients.map((cl: MinecraftClient) => ({
      UUID: cl.uuid,
      ping: cl.latency
    }))
    this.send('player_info', {
      action: 2,
      data: data
    })
  }

  public infoPlayerGamemode (clients: Array<MinecraftClient>): void {
    const data: Array<object> = clients.map((cl: MinecraftClient) => ({
      UUID: cl.uuid,
      gamemode: cl.gameMode
    }))
    this.send('player_info', {
      action: 1,
      data: data
    })
  }

  public spawnEntity (entity: MinecraftEntity): void {
    this.send(entity.spawnPacketName, entity.spawnPacket)
  }

  public despawnEntities (entities: Set<MinecraftEntity>): void {
    this.send('entity_destroy', {entityIds: Array.from(entities).map(entity => entity.id)})
  }

  public updateSpawnedEntites (): void {
    const entitiesInRange: Set<MinecraftEntity> = new Set()
    this.server.entities.inRange(this.pos, 16 * 10, entity => entitiesInRange.add(entity))
    entitiesInRange.delete(this.entity)

    const spawnEntities = new Set(Array.from(entitiesInRange).filter(e => !this.spawnedEntities.has(e)))
    const despawnEntities = new Set(Array.from(this.spawnedEntities).filter(e => !entitiesInRange.has(e)))

    this.despawnEntities(despawnEntities)
    for (let entity of spawnEntities)
      this.spawnEntity(entity)
  }

  public set world (world: MinecraftWorld) {
    this._world = world
    if (this.inited)
      this.entity.world = world
  }

  public get world (): MinecraftWorld {
    return this._world
  }

  private disconnect (): void {
    this.emit(Event.ClientDisconnect)
    this.destroy(null)
  }

  private error (err: Error): void {
    console.log(err, err.stack)
    this.destroy(null)
  }

  public destroy (kick: Chat = {text: 'destroyed'}): void {
    if (kick)
      this.kick(kick)
    this.server.clients.del(this)
    debug.log(`Client ${this.id} destroyed`)
  }

  public sendChunk (chunk: MinecraftChunk): void {
    if (this.loadedChunks.has(chunk))
      return
    this.loadedChunks.add(chunk)
    this.send('map_chunk', {
      x: chunk.pos.x,
      z: chunk.pos.z,
      groundUp: true,
      bitMap: 0xffff,
      chunkData: chunk.data,
      blockEntities: []
    })
  }

  public unloadChunks (): void {
    for (let chunk of this.loadedChunks)
      this.send('map_chunk', {
        x: chunk.pos.x,
        z: chunk.pos.z,
        groundUp: true,
        bitMap: 0x0000,
        chunkData: Buffer.alloc(1),
        blockEntities: []
      })
  }

  private get chunkSpiral (): Array<Array<number>> {
    const viewDistance = 2
    const centerX: number = Math.floor(this.pos.x / 16 / 32)
    const centerZ: number = Math.floor(this.pos.z / 16 / 32)
    const arr: Array<Array<number>> = []
    SpiralLoop([viewDistance * 2, viewDistance * 2], (x, z) => {
      arr.push([x + centerX - viewDistance, z + centerZ - viewDistance])
    })
    return arr
  }

  public sendChunks (): void {
    this.chunkSpiral
      .map((pos: Array<number>) => this.world.getChunk(pos[0], pos[1]))
      .forEach((chunk: MinecraftChunk) => this.sendChunk(chunk))
  }
}
