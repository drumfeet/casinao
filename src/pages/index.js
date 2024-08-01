import { useState, useEffect, useRef } from "react"
import {
  dryrun,
  message,
  createDataItemSigner,
  result,
} from "@permaweb/aoconnect"
import {
  Button,
  Divider,
  Flex,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
  useToast,
} from "@chakra-ui/react"
import { getStakers, getBalance } from "@/lib/utils"
import AppHeader from "@/components/AppHeader"

const FLIP_PID = process.env.NEXT_PUBLIC_PROCESS_ID

export default function Home() {
  const toast = useToast()
  const [depositQty, setDepositQty] = useState(1)
  const [withdrawQty, setWithdrawQty] = useState(0)
  const [delay, setDelay] = useState(0)
  const [stakers, setStakers] = useState([])
  const [balance, setBalance] = useState(0)
  const [stakeAmount, setStakeAmount] = useState(0)

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

  const depositStake = async () => {
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
          value: depositQty.toString(),
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
        description: `${_result.Messages[0].Data}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      })
    } catch (e) {
      console.error("depositStake() error!", e)
    } finally {
      setStakers([])
    }
  }

  const withdrawStake = async () => {
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
          value: "Unstake",
        },
        {
          name: "Quantity",
          value: withdrawQty.toString(),
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
        description: `${_result.Messages[0].Data}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      })
    } catch (e) {
      console.error("withdrawStake() error!", e)
    } finally {
      setStakers([])
    }
  }

  const fetchUserBalance = async () => {
    try {
      await window.arweaveWallet.connect(["ACCESS_ADDRESS", "SIGN_TRANSACTION"])

      const userAddress = await window.arweaveWallet.getActiveAddress()
      const _balance = await getBalance({ recipient: userAddress })
      setBalance(_balance)
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

    // try {
    //   const _balance = await getBalance()
    //   console.log("_balance", _balance)
    // } catch (e) {
    //   console.log(e)
    // }
  }

  const fetchStakeAmount = async () => {}

  const flipMatch = async ({ hostId }) => {
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

      if (_result.Messages[0].Tags[6].value === true) {
        toast({
          description: `${_result.Messages[0].Data}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        })
      } else {
        toast({
          description: `${_result.Messages[0].Data}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (e) {
      console.error("flipMatch() error!", e)
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

  // useEffect(() => {
  //   fetchUserBalance()
  // }, [])

  return (
    <>
      {/* <AppHeader /> */}
      <Flex minH="100%" direction="column" p={20}>
        <Flex alignItems="center" flexDirection="column" gap={4}>
          <Text>Process ID: {FLIP_PID}</Text>

          <Flex
            flexDirection="column"
            gap={4}
            border="1px solid black"
            padding={8}
          >
            <Flex alignItems="center" gap={4}>
              <Button variant="outline" size={"sm"} onClick={fetchUserBalance}>
                Get
              </Button>
              <Text>Balance: {balance}</Text>
            </Flex>
            <Flex alignItems="center" gap={4}>
              <Button variant="outline" size={"sm"} onClick={fetchStakeAmount}>
                Get
              </Button>
              <Text>Stake: {stakeAmount}</Text>
            </Flex>
          </Flex>

          <Flex flexDirection="column" gap={8} paddingY={8}>
            <Divider />
            <Flex gap={4}>
              <NumberInput
                step={1}
                defaultValue={depositQty}
                min={depositQty}
                onChange={(amount) => setDepositQty(amount)}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Button variant="outline" onClick={depositStake}>
                Stake
              </Button>
            </Flex>
            <Flex gap={4}>
              <NumberInput
                step={1}
                defaultValue={withdrawQty}
                min={withdrawQty}
                onChange={(valueString) => setWithdrawQty(valueString)}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Button variant="outline" onClick={withdrawStake}>
                Withdraw
              </Button>
            </Flex>
            <Divider />
          </Flex>

          {/* <Divider /> */}
          <Button variant="outline" onClick={loadStakers}>
            List Stakers
          </Button>

          {stakers.length > 0 && <StakersComponent stakers={stakers} />}
        </Flex>
      </Flex>
    </>
  )
}
