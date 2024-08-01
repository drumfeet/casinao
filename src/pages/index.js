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
import { getStakers } from "@/lib/utils"

const FLIP_PID = process.env.NEXT_PUBLIC_PROCESS_ID

export default function Home() {
  const toast = useToast()
  const [quantity, setQuantity] = useState(5)
  const [delay, setDelay] = useState(0)
  const [stakers, setStakers] = useState([])

  const loadStakers = async () => {
    try {
      const _stakers = await getStakers()
      const stakersArray = Object.entries(_stakers).map(([key, item]) => ({
        id: key,
        ...item,
      }))
      console.log("stakersArray", stakersArray)
      setStakers(stakersArray)
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

  const flipMatch = async ({ hostId }) => {
    toast({
      description: "FLIPING...",
      status: "success",
      duration: 5000,
      isClosable: true,
    })

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
          value: "Flip",
        },
        {
          name: "Host",
          value: hostId,
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
        status: "info",
        duration: 5000,
        isClosable: true,
      })
    } catch (e) {
      console.error("hostMatch() error!", e)
    }
  }

  const StakersComponent = ({ stakers }) => {
    return (
      <Flex flexDirection="column" gap={8} padding={8}>
        {stakers.map((staker) => (
          <Flex
            key={staker.id}
            flexDirection="column"
            border="1px solid #999"
            gap={1}
            padding={4}
          >
            <Text>ID: {staker.id}</Text>
            <Text>Amount: {staker.amount}</Text>
            <Button
              variant="outline"
              onClick={() => flipMatch({ hostId: staker.id })}
            >
              Flip
            </Button>
          </Flex>
        ))}
      </Flex>
    )
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
          {stakers.length > 0 && <StakersComponent stakers={stakers} />}
        </Flex>
      </Flex>
    </>
  )
}
