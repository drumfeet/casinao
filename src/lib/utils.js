import { dryrun } from "@permaweb/aoconnect"

const getStakers = async ({ limit, skip } = {}) => {
  let tags = [{ name: "Action", value: "Stakers" }]
  if (limit) tags.push({ name: "limit", value: limit.toString() })
  if (skip) tags.push({ name: "skip", value: skip.toString() })

  const result = await dryrun({
    process: process.env.NEXT_PUBLIC_PROCESS_ID,
    tags,
  })
  console.log("getStakers result", result)

  return JSON.parse(result.Messages[0].Data)
}

const getMatches = async ({ limit, skip } = {}) => {
    let tags = [{ name: "Action", value: "Matches" }]
    if (limit) tags.push({ name: "limit", value: limit.toString() })
    if (skip) tags.push({ name: "skip", value: skip.toString() })

    const result = await dryrun({
      process: process.env.NEXT_PUBLIC_PROCESS_ID,
      tags,
    })
    console.log("getMatches result", result)
  
    return JSON.parse(result.Messages[0].Data)
  }

export { getStakers, getMatches }
