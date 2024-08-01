import { useState, useEffect, useRef } from "react"
import {
  dryrun,
  message,
  createDataItemSigner,
  result,
} from "@permaweb/aoconnect"
import { Button, Flex, Heading, Text, useToast } from "@chakra-ui/react"
import { getStakers } from "@/lib/utils"

const FLIP_PID = process.env.NEXT_PUBLIC_PROCESS_ID
const limit = 10
export default function Home() {
  const [skip, setSkip] = useState(0)

  const loadStakers = async () => {
    try {
      await getStakers({ limit, skip })
    } catch (e) {
      console.log(e)
    }
  }

  const loadMatches = async () => {
    try {
      await getMatches({ limit, skip })
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <>
      <Flex minH="100%" direction="column" p={4}>
        <Flex alignItems="center" flexDirection="column" gap={4}>
          <Text>{FLIP_PID}</Text>
          <Button variant="outline" onClick={loadStakers}>
            Get Stakers
          </Button>
          <Button variant="outline" onClick={loadMatches}>
            Get Matches
          </Button>
        </Flex>
      </Flex>
    </>
  )
}
