"use strict"
import MinecraftEntity from './Entity'
import MinecraftClient from '../Client'
import {Event} from '../../Enums'
import {Position} from '../../Interfaces'

export default class MinecraftEntityPlayer extends MinecraftEntity {
  constructor(public client: MinecraftClient) {
    super(client.server, client.id, 'player', client.world, client.pos, client.look, client.onGround)
    this.events()
  }

  private lastPos: Position = JSON.parse(JSON.stringify(this.client.pos))
  private updatedPos: boolean = false
  private updatedLook: boolean = false

  private events () {
    this.client.on(Event.ClientPosition, this.updatePos.bind(this))
    this.client.on(Event.ClientLook, this.updateLook.bind(this))
  }

  public init () {
    super.init()
  }

  public tick () {
    if (!this.inited)
      return

    const clients = new Set()
    this.server.clients.inRange(this.pos, 16 * 10, (cl: MinecraftClient) => clients.add(cl))
    const dPos = {
      x: this.pos.x - this.lastPos.x,
      y: this.pos.y - this.lastPos.y,
      z: this.pos.z - this.lastPos.z
    }

    for (let client of clients) {
      if (client === this.client)
        continue
      if (this.updatedPos && this.updatedLook)
        this.sendPosLook(client, dPos)
      else if (this.updatedPos)
        this.sendPos(client, dPos)
      else if (this.updatedLook)
        this.sendLook(client)
      // else
      //   this.sendNothing(client)
    }

    this.updatedPos = false
    this.updatedLook = false
  }

  public updatePos (pos) {
    this.pos.x = pos.x
    this.pos.y = pos.y
    this.pos.z = pos.z
    this.updatedPos = true
  }

  public updateLook (look) {
    this.look.yaw = look.yaw
    this.look.pitch = look.pitch
    this.updatedLook = true
  }

  sendPosLook (cl: MinecraftClient, dPos) {
    this.client.sendMessage({text: `sendPosLook from entity ${this.id}`})
    cl.send('entity_move_look', {
      entityId: this.id,
      dX: dPos.x,
      dY: dPos.y,
      dZ: dPos.z,
      yaw: this.look.yaw,
      pitch: this.look.pitch,
      onGround: this.client.onGround
    })
  }

  sendPos (cl: MinecraftClient, dPos) {
    this.client.sendMessage({text: `sendPos from entity ${this.id}`})
    cl.send('rel_entity_move', {
      entityId: this.id,
      dX: dPos.x,
      dY: dPos.y,
      dZ: dPos.z,
      onGround: this.client.onGround
    })
  }

  sendLook(cl: MinecraftClient) {
    this.client.sendMessage({text: `sendLook from entity ${this.id}`})
    cl.send('entity_look', {
      entityId: this.id,
      yaw: this.look.yaw,
      pitch: this.look.pitch,
      onGround: this.client.onGround
    })
  }

  sendNothing (cl: MinecraftClient) {
    // this.client.sendMessage({text: `sendNothing from entity ${this.id}`})
    cl.send('entity', {
      entityId: this.id
    })
  }

  public get spawnPacket (): any {
    const packet = super.spawnPacket
    packet.playerUUID = this.client.id
    packet.currentItem = 0
    packet.metadata = []
    return packet
  }
}