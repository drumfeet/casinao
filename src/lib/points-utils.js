import { dryrun } from "@permaweb/aoconnect"

const PERP_PROCESS_ID = "FeIvV_BwLcm3qM31Rc4E_S4Q-e6F3bTz01dYqHoq5HQ"
const TOKEN_PROCESS_ID = "XIJzo8ooZVGIsxFVhQDYW0ziJBX7Loh9Pi280ro2YU4"

const getPerpBalance = async ({ recipient }) => {
  let tags = [
    { name: "Action", value: "Balance" },
    { name: "Recipient", value: recipient },
  ]

  const result = await dryrun({
    process: PERP_PROCESS_ID,
    tags,
  })
  console.log("getPerpBalance() result", result)

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

const getLongOrder = async ({ recipient }) => {
  let tags = [
    { name: "Action", value: "LongOrder" },
    { name: "Recipient", value: recipient },
  ]

  const result = await dryrun({
    process: PERP_PROCESS_ID,
    tags,
  })
  console.log("getLongOrder() result", result)

  return JSON.parse(result.Messages[0].Data)
}

const getShortOrder = async ({ recipient }) => {
  let tags = [
    { name: "Action", value: "ShortOrder" },
    { name: "Recipient", value: recipient },
  ]

  const result = await dryrun({
    process: PERP_PROCESS_ID,
    tags,
  })
  console.log("getShortOrder() result", result)

  return JSON.parse(result.Messages[0].Data)
}

export { getPerpBalance, getWalletBalance, getLongOrder, getShortOrder }
