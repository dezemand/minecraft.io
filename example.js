"use strict"
const MinecraftServer = require('./dist/Minecraft/Server').default

const server = new MinecraftServer({
  motd: 'A Javascript server!',
  version: '1.12'
})

server.listen(25565)
