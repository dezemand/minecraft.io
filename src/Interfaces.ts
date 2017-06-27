"use strict"
import {BlockDigStatus, BlockFace, Event, HotbarButton, MouseButton, WindowClickMode, WorldType} from './Enums'
import MinecraftWorld from './Minecraft/World/World'
import MinecraftServer from './Minecraft/Server'

export interface WorldOptions {
  type: WorldType,
  name: string,
  server?: MinecraftServer
}

export interface StoreQuery {
  id?: string,
  uuid?: string,
  userName?: string,
  world?: MinecraftWorld,
  inRange?: number
}

export interface Position {
  x: number,
  y: number,
  z: number
}

export interface Look {
  yaw: number,
  pitch: number
}

export interface Chat {
  extra?: Array<Chat>,
  bold?: boolean,
  italic?: boolean,
  underlined?: boolean,
  strikethrough?: boolean,
  obfuscated?: boolean,
  color?: string,
  insertion?: string,
  clickEvent?: {
    action: string,
    value: string
  },
  hoverEvent?: {
    action: string,
    value: string
  },

  // One of these: Normal text
  text?: string,

  // Translate by client
  translate?: string,
  with?: Array<Chat | string>,

  // Keybind name
  keybind?: string,

  // Score
  score?: {
    name: string,
    objective: string,
    value: any
  }
}

export interface ChunkPosition {
  x: number,
  z: number
}

export interface BlockDigData {
  status: BlockDigStatus,
  location: Position,
  face: BlockFace
}

export interface Listener {
  on: (event: string | Event, callback: (any) => any) => void
}

export interface SlotData {
  blockId: number,
  itemCount?: number,
  itemDamage?: number,
  nbtData?: any
}

export interface WindowClickData {
  windowId: number,
  slot: number,
  mouseButton: MouseButton | HotbarButton,
  action: number,
  mode: WindowClickMode,
  item: SlotData
}

export interface SetCreativeSlotData {
  slot: number,
  item: SlotData
}

export interface EntityMovement {
  entityId: number,
  dX?: number,
  dY?: number,
  dZ?: number,
  yaw?: number,
  pitch?: number,
  onGround?: boolean
}

export interface SpawnPacket {
  entityId: number,
  x: number,
  y: number,
  z: number,
  yaw: number,
  pitch: number
}

export interface SpawnPlayerPacket extends SpawnPacket {
  playerUUID: string,
  currentItem: number,
  metadata: any
}
