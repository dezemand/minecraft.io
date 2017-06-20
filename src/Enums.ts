"use strict"

export enum WorldType {
  Normal,
  Nether,
  End
}

export enum Event {
  ClientDisconnect,
  ClientInitiated,
  ClientSentCommand,
  ClientSentChat,
  ClientOnGround,
  ClientPosition,
  ClientLook,
  ClientChangeGamemode
}