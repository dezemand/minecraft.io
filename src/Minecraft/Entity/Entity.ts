"use strict"
import Events from '../../EventEmitter'
import MinecraftServer from '../Server'
import MinecraftWorld from '../World/World'
import {Look, Position, SpawnPacket} from '../../Interfaces'

export default class MinecraftEntity extends Events {
  protected inited: boolean = false
  readonly startTime = new Date()
  protected isVisible: boolean = true
  private _world: MinecraftWorld

  constructor (readonly server: MinecraftServer,
               readonly id: number,
               readonly type,
               world: MinecraftWorld,
               public pos: Position,
               public look: Look,
               public onGround: boolean = false) {
    super()
    this.server.entities.addEntity(this)
    this._world = world
  }

  public init (): void {
    if(this.inited)
      throw new Error('Cannot init MinecraftEntity twice')
    this.inited = true
  }

  public tick (): void {

  }

  public get spawnPacketName (): string {
    switch (this.type) {
      case 'player':
        return 'named_entity_spawn'
      case 'object':
        return 'spawn_entity'
      case 'mob':
        return 'spawn_entity_living'
    }
  }

  public get spawnPacket (): SpawnPacket {
    return {
      entityId: this.id,
      x: this.pos.x,
      y: this.pos.y,
      z: this.pos.z,
      yaw: this.look.yaw,
      pitch: this.look.pitch
    }
  }

  public set world (world: MinecraftWorld) {
    this._world = world
  }

  public get world (): MinecraftWorld {
    return this._world
  }
}
