"use strict"
import {WorldType} from './Enums'
import MinecraftWorld from './Minecraft/World'
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