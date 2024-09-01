import { dryrun } from "@permaweb/aoconnect"

const GAME_PROCESS_ID = "PADEZbrkTHafqOtYRsgZRXLvJFv6xrPyxPsYR9KqGic"
const TOKEN_PROCESS_ID = "XIJzo8ooZVGIsxFVhQDYW0ziJBX7Loh9Pi280ro2YU4"

const getGameBalance = async ({ recipient }) => {
  let tags = [
    { name: "Action", value: "Balance" },
    { name: "Recipient", value: recipient },
  ]

  const result = await dryrun({
    process: GAME_PROCESS_ID,
    tags,
  })
  console.log("getGameBalance() result", result)

  return JSON.parse(result.Messages[0].Data)
}

const getWalletBalance = async ({ recipient }) => {
  let tags = [
    { name: "Action", value: "Balance" },
    { name: "Recipient", value: recipient },
  ]

  const result = await dryrun({
    process: TOKEN_PROCESS_ID,
    tags,
  })
  console.log("getWalletBalance() result", result)

  return JSON.parse(result.Messages[0].Data)
}

export { getGameBalance, getWalletBalance }
