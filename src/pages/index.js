import { useState, useEffect, useRef } from "react"
import {
  dryrun,
  message,
  createDataItemSigner,
  result,
} from "@permaweb/aoconnect"
import {
  Button,
  Flex,
  Heading,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
  useToast,
} from "@chakra-ui/react"
import { getMatches, getStakers } from "@/lib/utils"

const FLIP_PID = process.env.NEXT_PUBLIC_PROCESS_ID
const limit = 10
export default function Home() {
  const toast = useToast()
  const [skip, setSkip] = useState(0)
  const [quantity, setQuantity] = useState(5)
  const [delay, setDelay] = useState(0)

  const loadStakers = async () => {
    try {
      await getStakers({ limit, skip })
    } catch (e) {
      console.log(e)
    }
  }

  const hostMatch = async () => {
    try {
      await window.arweaveWallet.connect(["ACCESS_ADDRESS", "SIGN_TRANSACTION"])
    } catch (e) {
      console.error("Wallet missing!", e)
      toast({
        description: "Install arconnect.io wallet",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
      return
    }

    try {
      let _tags = [
        {
          name: "Action",
          value: "Stake",
        },
        {
          name: "UnstakeDelay",
          value: delay.toString(),
        },
        {
          name: "Quantity",
          value: quantity.toString(),
        },
      ]
      console.log("_tags", _tags)

      const messageId = await message({
        process: FLIP_PID,
        tags: _tags,
        signer: createDataItemSigner(window.arweaveWallet),
      })
      console.log("messageId", messageId)

      const _result = await result({
        message: messageId,
        process: FLIP_PID,
      })
      console.log("_result", _result)
      toast({
        description: `${_result.Output.data}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      })
    } catch (e) {
      console.error("hostMatch() error!", e)
    }
  }

  return (
    <>
      <Flex minH="100%" direction="column" p={4}>
        <Flex alignItems="center" flexDirection="column" gap={4}>
          <Text>{FLIP_PID}</Text>
          <Flex gap={4}>
            <NumberInput
              step={quantity}
              defaultValue={quantity}
              min={quantity}
              onChange={(amount) => setQuantity(amount)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Button variant="outline" onClick={hostMatch}>
              Host Match
            </Button>
          </Flex>
          <Button variant="outline" onClick={loadStakers}>
            Get Stakers
          </Button>
        </Flex>
      </Flex>
    </>
  )
}
