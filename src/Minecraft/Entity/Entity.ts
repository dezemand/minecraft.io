"use strict"
import Events from '../../EventEmitter'
import MinecraftClient from '../Client'
import MinecraftServer from '../Server'
import MinecraftWorld from '../World'
import {Look, Position} from '../../Interfaces'

export default class MinecraftEntity extends Events {
  protected inited: boolean = false
  public clientsInRange: Array<MinecraftClient> = []
  readonly startTime = new Date()
  protected isVisible: boolean = true
  private _world: MinecraftWorld

  constructor (public server: MinecraftServer, public id: string, public type, world: MinecraftWorld, public pos: Position, public look: Look, public onGround: boolean = false) {
    super()
    this.server.clients.inRange(pos, 10 * 16, cl => this.clientsInRange.push(cl))
    this.server.entities.addEntity(this)
    this._world = world
  }

  init() {
    if(this.inited)
      throw new Error('Cannot init MinecraftEntity twice')
    this.inited = true
  }

  tick() {

  }

  get spawnPacketName (): string {
    switch (this.type) {
      case 'player':
        return 'named_entity_spawn'
      case 'object':
        return 'spawn_entity'
      case 'mob':
        return 'spawn_entity_living'
    }
  }

  get spawnPacket (): any {
    return {
      entityId: this.id,
      x: this.pos.x,
      y: this.pos.y,
      z: this.pos.z,
      yaw: this.look.yaw,
      pitch: this.look.pitch
    }
  }

  spawn () {

  }

  destroy () {

  }

  public set world (world: MinecraftWorld) {
    this._world = world
  }

  public get world (): MinecraftWorld {
    return this._world
  }
}
