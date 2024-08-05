import {
  dryrun,
  message,
  createDataItemSigner,
  result,
  results,
} from "@permaweb/aoconnect"
import {
  Button,
  Flex,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  useToast,
} from "@chakra-ui/react"
import {
  getStakers,
  getBalance,
  getGameBalance,
  getWalletBalance,
} from "@/lib/utils"
import { useEffect, useState } from "react"
import { ArrowDownIcon } from "@chakra-ui/icons"
import { FLIGHT_PARAMETERS } from "next/dist/client/components/app-router-headers"

const WAR_PROCESS_ID = "_JZTfLS-ssyKKNn-qMb7PSifdo_1SZ14UlI_RRg-nfo" // xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10
const GAME_PROCESS_ID = "Wu7s2PCoBt1-38dgtCwiGfCtK5V1DtxHpgK1KcYxQiQ"

export default function OddEven() {
  const toast = useToast()
  const [wallet, setWallet] = useState("")
  const [gameBalance, setGameBalance] = useState(-1)
  const [walletBalance, setWalletBalance] = useState(-1)
  const [results, setResults] = useState()
  const [betAmount, setBetAmount] = useState(1)
  const [depositQty, setDepositQty] = useState(1)
  const [withdrawQty, setWithdrawQty] = useState(1)

  const flipOdd = async () => {
    try {
      setResults("")
      await globalThis.arweaveWallet.connect([
        "ACCESS_ADDRESS",
        "SIGN_TRANSACTION",
      ])
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
      const messageId = await message({
        process: GAME_PROCESS_ID,
        tags: [
          {
            name: "Action",
            value: "FlipOdd",
          },
          {
            name: "Quantity",
            value: betAmount.toString(),
          },
        ],
        signer: createDataItemSigner(globalThis.arweaveWallet),
      })
      console.log("messageId", messageId)

      const _resultFlip = await result({
        message: messageId,
        process: GAME_PROCESS_ID,
      })
      console.log("_resultFlip", _resultFlip)

      if (_resultFlip.Messages[0].Tags[6].value === true) {
        toast({
          description: `${_resultFlip.Messages[0].Data}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        })
        setResults(_resultFlip.Messages[0].Data)
      } else {
        setResults(_resultFlip.Messages[0].Data)
        toast({
          description: `${_resultFlip.Messages[0].Data}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (e) {
      console.error("flipOdd() error!", e)
    } finally {
      await fetchUserBalance()
    }
  }

  const flipEven = async () => {
    try {
      setResults("")
      await globalThis.arweaveWallet.connect([
        "ACCESS_ADDRESS",
        "SIGN_TRANSACTION",
      ])
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
      const messageId = await message({
        process: GAME_PROCESS_ID,
        tags: [
          {
            name: "Action",
            value: "FlipEven",
          },
          {
            name: "Quantity",
            value: betAmount.toString(),
          },
        ],
        signer: createDataItemSigner(globalThis.arweaveWallet),
      })
      console.log("messageId", messageId)

      const _resultFlip = await result({
        message: messageId,
        process: GAME_PROCESS_ID,
      })
      console.log("_resultFlip", _resultFlip)

      if (_resultFlip.Messages[0].Tags[6].value === true) {
        toast({
          description: `${_resultFlip.Messages[0].Data}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        })
        setResults(_resultFlip.Messages[0].Data)
      } else {
        setResults(_resultFlip.Messages[0].Data)
        toast({
          description: `${_resultFlip.Messages[0].Data}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (e) {
      console.error("flipEven() error!", e)
    } finally {
      await fetchUserBalance()
    }
  }

  const fetchUserBalance = async () => {
    try {
      const _wallet = await globalThis.arweaveWallet
      _wallet.connect(["ACCESS_ADDRESS", "SIGN_TRANSACTION"])
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
      const userAddress = await globalThis.arweaveWallet.getActiveAddress()
      setWallet(userAddress)

      const walletBalance = await getWalletBalance({ recipient: userAddress })
      setWalletBalance(walletBalance)
      const gameBalance = await getGameBalance({ recipient: userAddress })
      setGameBalance(gameBalance)
    } catch (e) {
      console.error("fetchUserBalance() error!", e)
    }
  }

  const withdrawTokens = async () => {
    try {
      await globalThis.arweaveWallet.connect([
        "ACCESS_ADDRESS",
        "SIGN_TRANSACTION",
      ])
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
          value: "Withdraw",
        },
        {
          name: "Quantity",
          value: withdrawQty.toString(),
        },
      ]
      console.log("_tags", _tags)

      const messageId = await message({
        process: GAME_PROCESS_ID,
        tags: _tags,
        signer: createDataItemSigner(globalThis.arweaveWallet),
      })
      console.log("messageId", messageId)

      const _result = await result({
        message: messageId,
        process: GAME_PROCESS_ID,
      })
      console.log("_result", _result)

      const amountDebit = _result.Messages[0].Tags[8].value
      const amountCredit = _result.Messages[1].Tags[8].value

      if (Number(amountDebit) > 0 && Number(amountCredit) > 0) {
        toast({
          description: `${amountDebit} tokens were withdrawn from the game ${GAME_PROCESS_ID}`,
          status: "info",
          duration: 5000,
          isClosable: true,
        })
      } else {
        toast({
          description: `0 tokens were sent`,
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (e) {
      console.error("withdrawTokens() error!", e)
    } finally {
      await fetchUserBalance()
    }
  }

  const depositTokens = async () => {
    try {
      await globalThis.arweaveWallet.connect([
        "ACCESS_ADDRESS",
        "SIGN_TRANSACTION",
      ])
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
          value: "Transfer",
        },
        {
          name: "Recipient",
          value: GAME_PROCESS_ID,
        },
        {
          name: "Quantity",
          value: depositQty.toString(),
        },
      ]
      console.log("_tags", _tags)

      const messageId = await message({
        process: WAR_PROCESS_ID,
        tags: _tags,
        signer: createDataItemSigner(globalThis.arweaveWallet),
      })
      console.log("messageId", messageId)

      const _result = await result({
        message: messageId,
        process: WAR_PROCESS_ID,
      })
      console.log("_result", _result)

      const amountDebit = _result.Messages[0].Tags[8].value
      const amountCredit = _result.Messages[1].Tags[8].value

      if (Number(amountDebit) > 0 && Number(amountCredit) > 0) {
        toast({
          description: `${amountCredit} tokens were sent to the game ${GAME_PROCESS_ID}`,
          status: "info",
          duration: 5000,
          isClosable: true,
        })
      } else {
        toast({
          description: `0 tokens were sent`,
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (e) {
      console.error("depositTokens() error!", e)
    } finally {
      await fetchUserBalance()
    }
  }

  return (
    <>
      <Flex minH="100%" direction="column" padding={20}>
        <Flex alignItems="center" flexDirection="column" gap={8}>
          <Flex
            flexDirection="column"
            gap={4}
            border="1px solid black"
            padding={8}
            minWidth={550}
          >
            {
              <Text>
                {walletBalance >= 0 || gameBalance >= 0 ? (
                  <>
                    <Text>
                      Wallet Balance :{" "}
                      {walletBalance >= 0
                        ? `${walletBalance} $FLIP`
                        : "loading...."}{" "}
                    </Text>
                    <Text>
                      Game Balance :{" "}
                      {gameBalance >= 0
                        ? `${gameBalance} $FLIP`
                        : "loading...."}{" "}
                    </Text>
                  </>
                ) : (
                  `Click "Get Wallet" to fetch wallet balance.`
                )}
              </Text>
            }

            <Button variant="outline" onClick={fetchUserBalance}>
              Get Wallet
            </Button>

            <Flex flexDirection="column" gap={4}>
              <Flex gap={4}>
                <NumberInput
                  step={1}
                  defaultValue={depositQty}
                  min={1}
                  onChange={(e) => setDepositQty(e)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Button variant="outline" onClick={depositTokens}>
                  Deposit
                </Button>
              </Flex>
              <Flex gap={4}>
                <NumberInput
                  step={1}
                  defaultValue={withdrawQty}
                  min={1}
                  onChange={(e) => setWithdrawQty(e)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Button variant="outline" onClick={withdrawTokens}>
                  Withdraw
                </Button>
              </Flex>
            </Flex>
          </Flex>

          <Flex
            flexDirection="column"
            gap={4}
            // border="1px solid black"
            padding={8}
            minWidth={550}
          >
            <Flex gap={4}>
              <NumberInput
                step={1}
                defaultValue={depositQty}
                min={1}
                onChange={(e) => setBetAmount(e)}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Button variant="outline" onClick={flipOdd}>
                ODD
              </Button>
              <Button variant="outline" onClick={flipEven}>
                EVEN
              </Button>
            </Flex>
            <Flex>{results && <Text>{results}</Text>}</Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
