"use strict"
import MinecraftClient from '../Client'
import {Event} from '../../Enums'
import MinecraftEntityLiving from './Living'
import {SpawnPlayerPacket} from '../../Interfaces'

export default class MinecraftEntityPlayer extends MinecraftEntityLiving {
  constructor (public client: MinecraftClient) {
    super(client.server, client.id, 'player', client.world, client.pos, client.look, client.onGround)
    super.ignore(this.client)
  }

  public init (): void {
    super.init()
    this.listen()
  }

  private listen (): void {
    this.client.on(Event.ClientPosition, this.updatePos.bind(this))
    this.client.on(Event.ClientLook, this.updateLook.bind(this))
  }

  public get spawnPacket (): SpawnPlayerPacket {
    return Object.assign(super.spawnPacket, {
      playerUUID: this.client.uuid,
      currentItem: 0,
      metadata: []
    })
  }

  public tick (): void {
    super.tick()
    if (!this.inited)
      return
  }
}
