import { dryrun } from "@permaweb/aoconnect"

const getStakers = async () => {
  let tags = [{ name: "Action", value: "Stakers" }]

  const result = await dryrun({
    process: process.env.NEXT_PUBLIC_PROCESS_ID,
    tags,
  })
  console.log("getStakers result", result)

  return JSON.parse(result.Messages[0].Data)
}

const getBalance = async ({ recipient }) => {
  let tags = [
    { name: "Action", value: "Balance" },
    { name: "Recipient", value: recipient },
  ]

  const result = await dryrun({
    process: process.env.NEXT_PUBLIC_PROCESS_ID,
    tags,
  })
  console.log("getBalance result", result)

  return JSON.parse(result.Messages[0].Data)
}

export { getStakers, getBalance }
