import { dryrun } from "@permaweb/aoconnect"

const getPerpBalance = async ({ recipient }) => {
  let tags = [
    { name: "Action", value: "Balance" },
    { name: "Recipient", value: recipient },
  ]

  const result = await dryrun({
    process: "FeIvV_BwLcm3qM31Rc4E_S4Q-e6F3bTz01dYqHoq5HQ",
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
    process: "XIJzo8ooZVGIsxFVhQDYW0ziJBX7Loh9Pi280ro2YU4",
    tags,
  })
  console.log("getWalletBalance() result", result)

  return JSON.parse(result.Messages[0].Data)
}

export { getPerpBalance, getWalletBalance }
