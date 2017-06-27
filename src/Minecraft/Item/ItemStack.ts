"use strict"
import MinecraftItem from './Item'
import {SlotData} from '../../Interfaces'
import {Writer} from 'nbt'

export default class MinecraftItemStack {
  readonly item: MinecraftItem

  constructor (_item: MinecraftItem | number, readonly amount: number = 1, readonly damage: number = 0, readonly nbt?) {
    this.item = (_item instanceof MinecraftItem) ? _item : new MinecraftItem(_item, damage)
    if (this.amount < 1) this.amount = 1
    if (this.damage < 0) this.damage = 0
    if (this.item.hasVariations && this.item.getVariation(this.damage) !== this.item.variation)
      this.item = new MinecraftItem(this.item.id, this.damage)
    if (this.amount > this.stackSize)
      this.amount = this.stackSize
  }

  public get data (): SlotData {
    return {
      blockId: this.item.id,
      itemCount: this.amount,
      itemDamage: this.damage,
      // nbtData: NBT // TODO
      nbtData: undefined
    }
  }

  static get emptyData (): SlotData {
    return {
      blockId: -1
    }
  }

  public get stackSize (): number {
    return this.item.data.stackSize
  }

  public changeAmount (amount: number, delta: boolean = false): MinecraftItemStack {
    if (amount === 0) return null
    if (delta) return this.changeAmount(this.amount + amount, false)
    return new MinecraftItemStack(this.item, amount, this.damage, this.nbt)
  }

  public canCombineStacks (items: MinecraftItemStack): boolean {
    if (!this.itemEquals(items)) return false
    return !((this.amount + items.amount) > this.stackSize)
  }

  public itemEquals (items: MinecraftItemStack) {
    if (this.damage !== items.damage) return false
    return this.item.equals(items.item)
  }

  static fromData (data: SlotData): MinecraftItemStack {
    return new MinecraftItemStack(data.blockId, data.itemCount, data.itemDamage, data.nbtData)
  }
}
