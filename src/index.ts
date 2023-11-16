import { Context, Schema, Service, $ } from 'koishi'

declare module 'koishi' {
  interface Context {
    scoreboard: Scoreboard
  }

  interface Tables {
    scoreboardData: ScoreboardData
  }
}

export interface ScoreboardData {
  guildId: string;
  playerId: string;
  score: number;
  id: number;
  playerName: string;
  groupName: string;
}

export const name = 'scoreboard-service'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export default class Scoreboard extends Service {
  static inject = ["database"]
  constructor(ctx: Context, config: Config) {
    super(ctx, "scoreboard", true)
  }

  async set(guildId: string, groupName: string, userId: string, score: number, userName?: string) {
    let data = await this.ctx.database.get("scoreboardData", {groupName, guildId, playerId: userId})
    if (data.length === 0) {
      await this.ctx.database.create("scoreboardData", {groupName, guildId, playerId: userId, score, playerName: userName ?? ""})
    } else {
      await this.ctx.database.set("scoreboardData", {groupName, guildId, playerId: userId}, {score, playerName: userName ?? data[0].playerName})
    }
    return true
  }

  async get(guildId: string, groupName: string, userId?: string) {
    let data = await this.ctx.database.get("scoreboardData", {groupName, guildId, playerId: userId})
    return data
  }

  async remove(guildId: string, groupName: string, userId: string) {
    if (this.get(guildId, groupName, userId) !== undefined) {
      await this.ctx.database.remove("scoreboardData", {groupName, guildId, playerId: userId})
      return true
    }
    return false

  }

  async clear(groupName: string, guildId?: string) {
    if (this.get(guildId, groupName) !== undefined) {
      await this.ctx.database.remove("scoreboardData", {groupName, guildId})
      return true
    }
    return false
  }

  async getBySort(guildId: string, groupName: string, limit = 100, offset = 0, reversed = false) {
    let scoreData = await this.ctx.database
        .select("scoreboardData")
        .where({groupName: groupName, guildId: guildId})
        .orderBy("score", reversed?"asc":"desc")
        .limit(limit)
        .offset(offset)
        .execute()
    return scoreData
  }
}

export function apply(ctx: Context) {
  extendTable(ctx)
}

function extendTable(ctx: Context) {
  ctx.database.extend("scoreboardData", {
    id: "unsigned",
    guildId: "text",
    playerId: "text",
    playerName: "text",
    groupName: "string",
    score: "double",
  }, {primary: 'id', autoInc: true})
}
