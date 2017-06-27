"use strict"
import MinecraftEntity from './Entity'
import MinecraftServer from '../Server'
import MinecraftWorld from '../World/World'
import {EntityMovement, Look, Position} from '../../Interfaces'
import MinecraftClient from '../Client'
import {EntityMovementType} from '../../Enums'

export default class MinecraftEntityLiving extends MinecraftEntity {
  constructor (readonly server: MinecraftServer,
               readonly id: number,
               readonly type: string,
               world: MinecraftWorld,
               public pos: Position,
               public look: Look,
               public onGround: boolean = false) {
    super(server, id, type, world, pos, look, onGround)
  }

  private lastPos: Position = JSON.parse(JSON.stringify(this.pos))
  private updatedPos: boolean = true
  private updatedLook: boolean = true
  public ignoringClients: Set<MinecraftClient> = new Set()

  public init (): void {
    super.init()
  }

  protected updatePos (pos: Position): void {
    this.pos.x = pos.x
    this.pos.y = pos.y
    this.pos.z = pos.z
    this.updatedPos = true
  }

  protected updateLook (look: Look): void {
    this.look.yaw = look.yaw
    this.look.pitch = look.pitch
    this.updatedLook = true
  }

  private get clientsInRange (): Set<MinecraftClient> {
    const clients: Set<MinecraftClient> = new Set()
    this.server.clients.inRange(this.pos, 16 * 10,
      (cl: MinecraftClient) => !this.ignoringClients.has(cl) && clients.add(cl))
    return clients
  }

  private get dPos (): Position {
    return {
      x: this.pos.x - this.lastPos.x,
      y: this.pos.y - this.lastPos.y,
      z: this.pos.z - this.lastPos.z
    }
  }

  private get movementType (): EntityMovementType {
    if (this.updatedPos && this.updatedLook)
      return EntityMovementType.Both
    if (this.updatedPos)
      return EntityMovementType.Position
    if (this.updatedLook)
      return EntityMovementType.Look
    return EntityMovementType.Nothing
  }

  private get movementPacketName (): string {
    switch (this.movementType) {
      case EntityMovementType.Both:
        return 'entity_move_look'
      case EntityMovementType.Look:
        return 'entity_look'
      case EntityMovementType.Position:
        return 'entity_move'
    }
  }

  private sendMovement (client: MinecraftClient, sendNothing: boolean = false): void {
    let packetName: string = this.movementPacketName
    let packet: EntityMovement = {
      entityId: this.id
    }
    if (this.movementType === EntityMovementType.Both || this.movementType === EntityMovementType.Position) {
      packet.dX = this.dPos.x
      packet.dY = this.dPos.y
      packet.dZ = this.dPos.z
    }
    if (this.movementType === EntityMovementType.Both || this.movementType === EntityMovementType.Look) {
      packet.yaw = this.look.yaw
      packet.pitch = this.look.pitch
    }
    if (this.movementType !== EntityMovementType.Nothing)
      packet.onGround = this.onGround
    if (this.movementType !== EntityMovementType.Nothing || sendNothing)
      client.send(packetName, packet)
  }

  public tick (): void {
    super.tick()
    if (!this.inited)
      return

    for (let client of this.clientsInRange)
      this.sendMovement(client, this.type === 'player')

    this.updatedPos = false
    this.updatedLook = false
  }
}
