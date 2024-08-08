import { getGameBalance, getWalletBalance } from "@/lib/utils"
import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Spacer,
  Text,
} from "@chakra-ui/react"
import { useState } from "react"

export default function Home() {
  const TOKEN_PROCESS_ID = ""
  const GAME_PROCESS_ID = ""
  const BASE_UNIT = 10
  const DENOMINATION = 12
  const TICKER = "FLIP"

  const SLOPE = -0.96
  const INTERCEPT = 98

  const [gameBalance, setGameBalance] = useState(-1)
  const [walletBalance, setWalletBalance] = useState(-1)
  const [depositQty, setDepositQty] = useState(21)
  const [withdrawQty, setWithdrawQty] = useState(1)
  const [sliderValue, setSliderValue] = useState(50)
  const [betAmount, setBetAmount] = useState(1)
  const [winChance, setWinChance] = useState(50)
  const [multiplier, setMultiplier] = useState(2)
  const [profitOnWin, setProfitOnWin] = useState(1)
  const [results, setResults] = useState("You win!")

  const handleChange = (v) => {
    setSliderValue(v)
    const _winChance = getWinChance(v)
    setWinChance(_winChance)
    const _multiplier = getMultiplier(_winChance)
    setMultiplier(_multiplier)
    const _profitOnWin = getProfitOnWin(_multiplier)
    setProfitOnWin(_profitOnWin)
  }

  const getWinChance = (v) => {
    return (SLOPE * v + INTERCEPT).toFixed(2)
  }

  const getMultiplier = (_winChance) => {
    return (1 / (_winChance / 100)).toFixed(2)
  }

  const getProfitOnWin = (_multiplier) => {
    return (betAmount * (_multiplier - 1)).toFixed(2)
  }

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
        duration: 5000,
        isClosable: true,
      })
      return { success: false, error: e }
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

      const walletBalance = await getWalletBalance({ recipient: userAddress })
      setWalletBalance(divideByPower(walletBalance))

      const gameBalance = await getGameBalance({ recipient: userAddress })
      setGameBalance(divideByPower(gameBalance))
    } catch (e) {
      console.error("fetchUserBalance() error!", e)
    }
  }

  const depositTokens = async () => {}

  const withdrawTokens = async () => {}

  const flipBet = async () => {
    setResults("")

    const _connected = await connectWallet()
    if (_connected.success === false) {
      return
    }

    try {
      const _betAmount = multiplyByPower(betAmount)
      const messageId = await message({
        process: GAME_PROCESS_ID,
        tags: [
          {
            name: "Action",
            value: "FlipBet",
          },
          {
            name: "Quantity",
            value: _betAmount.toString(),
          },
          {
            name: "WinChance",
            value: sliderValue.toString(),
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
      console.error("flipBet() error!", e)
    } finally {
      await fetchUserBalance()
    }
  }
  return (
    <>
      <Flex
        minH="100vh"
        paddingY={20}
        bgGradient={[
          "linear(to-tr, teal.300, yellow.400)",
          "linear(to-t, blue.200, teal.500)",
          "linear(to-b, orange.100, purple.300)",
        ]}
      >
        <Flex w="100%" justifyContent="center">
          <Flex w="100%" maxW="760px" flexDirection="column" paddingX={4}>
            <Flex
              flexDirection="column"
              gap={4}
              padding={4}
              borderWidth={1}
              borderColor="gray.500"
              borderStyle="dashed"
              borderRadius="xl"
            >
              <Text>
                {walletBalance >= 0 || gameBalance >= 0 ? (
                  <>
                    <Text>
                      Wallet Balance :{" "}
                      {walletBalance >= 0
                        ? `${walletBalance} $${TICKER}`
                        : "loading...."}{" "}
                    </Text>
                    <Text>
                      Game Balance :{" "}
                      {gameBalance >= 0
                        ? `${gameBalance} $${TICKER}`
                        : "loading...."}{" "}
                    </Text>
                  </>
                ) : (
                  <></>
                )}
              </Text>

              <Flex flexDirection="column">
                {walletBalance >= 0 || gameBalance >= 0 ? (
                  <>
                    <Button variant="solid" onClick={fetchUserBalance}>
                      Show me the money
                    </Button>
                  </>
                ) : (
                  <>
                    <Flex flexDirection="column" paddingBottom={4}>
                      <Text fontSize="2xs">fetch game balance</Text>
                      <Button variant="solid" onClick={fetchUserBalance}>
                        Show me the money
                      </Button>
                    </Flex>
                  </>
                )}
              </Flex>
            </Flex>

            <Flex flexDirection="column" paddingX={4} paddingTop={12}>
              <Flex
                gap={4}
                flexDirection={["column", "row"]}
                justifyContent="space-around"
              >
                <NumberInput
                  step={1}
                  defaultValue={depositQty}
                  min={1}
                  onChange={(e) => {
                    setBetAmount(e)
                  }}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Button variant="outline" paddingX={28} onClick={flipBet}>
                  Bet
                </Button>
              </Flex>

              <Flex paddingTop={8}>
                <NumberInput
                  maxW="100px"
                  mr="2rem"
                  value={sliderValue}
                  onChange={handleChange}
                  display="none"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Slider
                  flex="1"
                  focusThumbOnChange={false}
                  value={sliderValue}
                  onChange={handleChange}
                >
                  <SliderTrack bg="green">
                    <SliderFilledTrack bg="red" />
                  </SliderTrack>
                  <SliderThumb fontSize="sm" boxSize="32px">
                    {sliderValue}
                  </SliderThumb>
                </Slider>
              </Flex>

              <Flex flexDirection="column" paddingTop={8} gap={2}>
                <Text>Win Chance: {winChance}%</Text>
                <Text>Multiplier: {multiplier}</Text>
                <Text>Profit On Win: {profitOnWin} $FLIP</Text>
              </Flex>

              <Flex paddingTop={8} justifyContent="center">
                {results && <Heading>{results}</Heading>}
              </Flex>
            </Flex>

            <Flex flexDirection="column" paddingX={4} paddingTop={12}>
              <Flex
                borderTop={1}
                borderColor="gray.500"
                borderStyle="dashed"
              >
                <Text>TOP 10</Text>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
