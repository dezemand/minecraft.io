"use strict"
import MinecraftItem from './Item'
import {SlotData} from '../../Interfaces'
import {Writer} from 'nbt'

// TODO: Check out how minecraft itself does it and try to follow that
export default class MinecraftItemStack {
  constructor (readonly item: MinecraftItem, readonly amount: number) {
  }

  public get data (): SlotData {
    return {
      blockId: this.item.id,
      itemCount: this.amount,
      itemDamage: 0,
      //nbtData: NBT // TODO
      nbtData: undefined
    }
  }

  static get emptyData (): SlotData {
    return {
      blockId: -1
    }
  }
}
