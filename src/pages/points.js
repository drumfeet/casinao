import { message, createDataItemSigner, result } from "@permaweb/aoconnect"
import {
  getLongOrder,
  getPerpBalance,
  getShortOrder,
  getWalletBalance,
} from "@/lib/points-utils"
import {
  Button,
  Flex,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
  useToast,
} from "@chakra-ui/react"
import { useState } from "react"

export default function PointsSwap() {
  const TOKEN_PROCESS_ID = "XIJzo8ooZVGIsxFVhQDYW0ziJBX7Loh9Pi280ro2YU4"
  const PERP_PROCESS_ID = "FeIvV_BwLcm3qM31Rc4E_S4Q-e6F3bTz01dYqHoq5HQ"
  const BASE_UNIT = 10
  const DENOMINATION = 12
  const TICKER = "USD"
  const SLOPE = -0.96
  const INTERCEPT = 98

  const [perpBalance, setPerpBalance] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [txQuantity, setTxQuantity] = useState(1)
  const [tradeQuantity, setTradeQuantity] = useState(1)
  const [shortPos, setShortPos] = useState(0)
  const [longPos, setLongPos] = useState(0)

  const toast = useToast()

  const multiplyByPower = (v) => {
    return v * Math.pow(BASE_UNIT, DENOMINATION)
  }

  const divideByPower = (v) => {
    return (v / Math.pow(BASE_UNIT, DENOMINATION)).toFixed(12)
  }

  const connectWallet = async () => {
    try {
      await globalThis.arweaveWallet.connect([
        "ACCESS_ADDRESS",
        "SIGN_TRANSACTION",
      ])
      return { success: true }
    } catch (e) {
      console.error("Wallet missing!", e)
      toast({
        description: "Install arconnect.io wallet",
        status: "error",
        duration: 2000,
        isClosable: true,
      })
      return { success: false, error: e }
    }
  }

  const fetchUserBalance = async () => {
    const _connected = await connectWallet()
    if (_connected.success === false) {
      return
    }

    try {
      const userAddress = await globalThis.arweaveWallet.getActiveAddress()

      const _perpBalance = await getPerpBalance({ recipient: userAddress })
      setPerpBalance(divideByPower(_perpBalance))

      const _walletBalance = await getWalletBalance({ recipient: userAddress })
      setWalletBalance(divideByPower(_walletBalance))
    } catch (e) {
      console.error("fetchUserBalance() error!", e)
    }
  }

  const requestAirdrop = async () => {
    const _connected = await connectWallet()
    if (_connected.success === false) {
      return
    }

    try {
      const messageId = await message({
        process: PERP_PROCESS_ID,
        tags: [
          {
            name: "Action",
            value: "Airdrop",
          },
        ],
        signer: createDataItemSigner(globalThis.arweaveWallet),
      })
      console.log("messageId", messageId)

      const _result = await result({
        message: messageId,
        process: PERP_PROCESS_ID,
      })
      console.log("_result", _result)

      _result.Messages[0].Tags.find((tag) => {
        if (tag.name === "Error") {
          const errorStatus = tag.value ? "error" : "success"
          toast({
            description: `${_result.Messages[0].Data}`,
            status: errorStatus,
            duration: 2000,
            isClosable: true,
            position: "top",
          })
          return true
        }
      })
    } catch (e) {
      console.error("requestAirdrop() error!", e)
    } finally {
      await fetchUserBalance()
    }
  }

  const withdrawTokens = async () => {
    const _connected = await connectWallet()
    if (_connected.success === false) {
      return
    }

    try {
      const _txQuantity = multiplyByPower(txQuantity)
      console.log("_txQuantity", _txQuantity)

      let _tags = [
        {
          name: "Action",
          value: "Withdraw",
        },
        {
          name: "Quantity",
          value: _txQuantity.toString(),
        },
      ]
      console.log("_tags", _tags)

      const messageId = await message({
        process: PERP_PROCESS_ID,
        tags: _tags,
        signer: createDataItemSigner(globalThis.arweaveWallet),
      })
      console.log("messageId", messageId)

      const _result = await result({
        message: messageId,
        process: PERP_PROCESS_ID,
      })
      console.log("_result", _result)

      _result.Messages[0].Tags.find((tag) => {
        if (tag.name === "Error") {
          const errorStatus = tag.value ? "error" : "success"
          toast({
            description: `${_result.Messages[0].Data}`,
            status: errorStatus,
            duration: 2000,
            isClosable: true,
            position: "top",
          })
          return true
        }
      })
    } catch (e) {
      console.error("withdrawTokens() error!", e)
    } finally {
      await fetchUserBalance()
    }
  }

  const depositTokens = async () => {
    const _connected = await connectWallet()
    if (_connected.success === false) {
      return
    }

    try {
      const _txQuantity = multiplyByPower(txQuantity)
      console.log("_txQuantity", _txQuantity)

      let _tags = [
        {
          name: "Action",
          value: "Transfer",
        },
        {
          name: "Recipient",
          value: PERP_PROCESS_ID,
        },
        {
          name: "Quantity",
          value: _txQuantity.toString(),
        },
      ]
      console.log("_tags", _tags)

      const messageId = await message({
        process: TOKEN_PROCESS_ID,
        tags: _tags,
        signer: createDataItemSigner(globalThis.arweaveWallet),
      })
      console.log("messageId", messageId)

      const _result = await result({
        message: messageId,
        process: TOKEN_PROCESS_ID,
      })
      console.log("_result", _result)

      const error = _result.Messages[0].Tags[6].value
      if (error === "Transfer-Error") {
        toast({
          title: "Deposit Failed",
          description: `${_result.Messages[0].Tags[7].value}`,
          status: "error",
          duration: 2000,
          isClosable: true,
          position: "top",
        })
      } else {
        const amountDebit = _result.Messages[0].Tags[8].value
        const amountCredit = _result.Messages[1].Tags[8].value

        if (Number(amountDebit) > 0 && Number(amountCredit) > 0) {
          toast({
            description: "Deposit Successful",
            status: "info",
            duration: 2000,
            isClosable: true,
            position: "top",
          })
        }
      }
    } catch (e) {
      console.error("depositTokens() error!", e)
    } finally {
      await fetchUserBalance()
    }
  }

  const fetchOrderBalance = async () => {
    const _connected = await connectWallet()
    if (_connected.success === false) {
      return
    }

    try {
      const userAddress = await globalThis.arweaveWallet.getActiveAddress()

      const _longOrder = await getLongOrder({ recipient: userAddress })
      setLongPos(divideByPower(_longOrder))

      const _shortOrder = await getShortOrder({ recipient: userAddress })
      setShortPos(divideByPower(_shortOrder))
    } catch (e) {
      console.error("fetchOrderBalance() error!", e)
    }
  }
  const placeLong = async () => {
    const _connected = await connectWallet()
    if (_connected.success === false) {
      return
    }

    try {
      const _tradeQuantity = multiplyByPower(tradeQuantity)
      console.log("_tradeQuantity", _tradeQuantity)

      let _tags = [
        {
          name: "Action",
          value: "PlaceLong",
        },
        {
          name: "Quantity",
          value: _tradeQuantity.toString(),
        },
      ]
      console.log("_tags", _tags)

      const messageId = await message({
        process: PERP_PROCESS_ID,
        tags: _tags,
        signer: createDataItemSigner(globalThis.arweaveWallet),
      })
      console.log("messageId", messageId)

      const _result = await result({
        message: messageId,
        process: PERP_PROCESS_ID,
      })
      console.log("_result", _result)
    } catch (e) {
      console.error("orderLong() error!", e)
    } finally {
      await fetchOrderBalance()
      await fetchUserBalance()
    }
  }

  const placeShort = async () => {
    const _connected = await connectWallet()
    if (_connected.success === false) {
      return
    }

    try {
      const _tradeQuantity = multiplyByPower(tradeQuantity)
      console.log("_tradeQuantity", _tradeQuantity)

      let _tags = [
        {
          name: "Action",
          value: "PlaceShort",
        },
        {
          name: "Quantity",
          value: _tradeQuantity.toString(),
        },
      ]
      console.log("_tags", _tags)

      const messageId = await message({
        process: PERP_PROCESS_ID,
        tags: _tags,
        signer: createDataItemSigner(globalThis.arweaveWallet),
      })
      console.log("messageId", messageId)

      const _result = await result({
        message: messageId,
        process: PERP_PROCESS_ID,
      })
      console.log("_result", _result)
    } catch (e) {
      console.error("orderShort() error!", e)
    } finally {
      await fetchOrderBalance()
      await fetchUserBalance()
    }
  }

  return (
    <>
      <Flex
        minH="100vh"
        //   backgroundColor="#0e2229"
      >
        <Flex w="100%" justifyContent="center">
          <Flex flexDirection="column" gap={4} padding={4}>
            <Button onClick={requestAirdrop}>Airdrop</Button>

            <Button variant="outline" onClick={fetchUserBalance}>
              Connect
            </Button>
            <Text>Wallet Balance: {walletBalance} ${TICKER}</Text>
            <Text>Perp Balance: {perpBalance} ${TICKER}</Text>

            <Flex alignItems="center" paddingTop={12}>
              <Text>Quantity</Text>
              <NumberInput
                precision={0}
                step={1}
                defaultValue={txQuantity}
                min={1}
                onChange={(e) => {
                  setTxQuantity(e)
                }}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Flex>
            <Button variant="outline" onClick={depositTokens}>
              Deposit
            </Button>
            <Button variant="outline" onClick={withdrawTokens}>
              Withdraw
            </Button>

            <Flex alignItems="center" paddingTop={12}>
              <Text>Quantity</Text>
              <NumberInput
                precision={0}
                step={1}
                defaultValue={tradeQuantity}
                min={1}
                onChange={(e) => {
                  setTradeQuantity(e)
                }}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Flex>
            <Button variant="outline" onClick={placeLong}>
              Buy / Long
            </Button>
            <Button variant="outline" onClick={placeShort}>
              Sell / Short
            </Button>

            <Flex paddingY={12} flexDirection="column" gap={4}>
              <Text>Long: {longPos} ${TICKER}</Text>
              <Text>Short: {shortPos} ${TICKER}</Text>
              <Button variant="outline" onClick={fetchOrderBalance}>
                Fetch Order Balance
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
