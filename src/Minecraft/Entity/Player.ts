"use strict"
import MinecraftEntity from './Entity'
import MinecraftClient from '../Client'

export default class MinecraftEntityPlayer extends MinecraftEntity {
  constructor(public client: MinecraftClient) {
    super(client.server, client.id, 'player', client.pos, client.look, client.onGround)
    this.events()
  }

  events() {
    this.client.on('position', this.updatePos.bind(this))
    this.client.on('look', this.updateLook.bind(this))
  }

  updatePos(pos) {
    this.pos.x = pos.x
    this.pos.y = pos.y
    this.pos.z = pos.z
    if(this.inited)
      this.clientsInRange.forEach(cl => this.sendPosition(cl, pos))
  }

  updateLook(look) {
    this.look.yaw = look.yaw
    this.look.pitch = look.pitch
    if(this.inited)
      this.clientsInRange.forEach((cl: MinecraftClient) => this.sendLook(cl))
  }

  sendPosition(cl: MinecraftClient, dPos) {
    cl.send('rel_entity_move', {
      entityId: this.id,
      dX: dPos.x,
      dY: dPos.y,
      dZ: dPos.z,
      onGround: this.client.onGround
    })
  }

  sendLook(cl: MinecraftClient) {
    cl.send('entity_look', {
      entityId: this.id,
      yaw: this.look.yaw,
      pitch: this.look.pitch,
      onGround: this.client.onGround
    })
  }

  spawn(cl: MinecraftClient) {
    cl.send('named_entity_spawn', {
      entityId: this.id,
      playerUUID: this.client.uuid,
      x: this.pos.x,
      y: this.pos.y,
      z: this.pos.z,
      yaw: this.look.yaw,
      pitch: this.look.pitch,
      currentItem: 0,
      metadata: []
    })
  }
}