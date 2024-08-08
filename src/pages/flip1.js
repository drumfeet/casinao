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
  const TOKEN_PROCESS_ID = "0efiFdNJH-8ocj4PhzYT9CZ2eVZFr5U-rCc_liOjRnU"
  const GAME_PROCESS_ID = "0efiFdNJH-8ocj4PhzYT9CZ2eVZFr5U-rCc_liOjRnU"
  const BASE_UNIT = 10
  const DENOMINATION = 12
  const TICKER = "FLIP"

  const SLOPE = -0.96
  const INTERCEPT = 98

  const [gameBalance, setGameBalance] = useState(-1)
  const [walletBalance, setWalletBalance] = useState(-1)
  const [depositQty, setDepositQty] = useState(1)
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
        backgroundColor="#0e2229"
        // bgGradient={[
        //   "linear(to-tr, teal.300, yellow.400)",
        //   "linear(to-t, blue.200, teal.500)",
        //   "linear(to-b, orange.100, purple.300)",
        // ]}
      >
        <Flex w="100%">
          {/* Left */}
          <Flex
            minW="300px"
            // borderRight="1px solid #999"
            flexDirection="column"
            display={{ base: "none", md: "flex" }}
          >
            {/* Left Header */}
            <Flex
              gap={4}
              padding={4}
              justifyContent="flex-end"
              w="100%"
              //   backgroundColor="#21393e"
            >
              <Button
                bgGradient="linear(to-r, blue.200, blue.500)"
                color="white"
                ml={4}
                _hover={{
                  bgGradient: "linear(to-r, blue.200, blue.500)",
                  cursor: "default",
                }}
              >
                PLAY NOW
              </Button>
              <Button
                bgGradient="linear(to-r, green.200, green.500)"
                color="white"
                _hover={{
                  bgGradient: "linear(to-r, green.200, green.500)",
                  cursor: "default",
                }}
              >
                CASINO
              </Button>
            </Flex>

            {/* Shortcuts */}
            <Flex padding={4} flexDirection="column">
              <Flex
                backgroundColor="#21393e"
                // borderRadius="md"
                flexDirection="column"
                gap={4}
                padding={4}
                color="gray.200"
              >
                <Text>Top 10</Text>
                <Text>Favorites</Text>
                <Text>Recent</Text>
                <Text>Challenges</Text>
                <Text>My Bets</Text>
              </Flex>
            </Flex>

            {/* Games */}
            <Flex padding={4} flexDirection="column">
              <Flex
                borderBottom="1px solid #999"
                paddingBottom={4}
                backgroundColor="#21393e"
                color="gray.200"
                padding={4}
              >
                <Text>Games</Text>
              </Flex>
              <Flex
                backgroundColor="#21393e"
                // borderRadius="md"
                flexDirection="column"
                gap={4}
                padding={4}
                color="gray.200"
              >
                <Text>Flip</Text>
                <Text>Points Swap</Text>
                <Text>Dice</Text>
                <Text>Mines</Text>
                <Text>Odd Even</Text>
                <Text>Rooster</Text>
              </Flex>
            </Flex>
          </Flex>

          {/* Right */}
          <Flex
            w="100%"
            flexDirection="column"
            // display={{ base: "none", md: "flex" }}
          >
            {/* Right Header */}
            <Flex
              color="gray.200"
              padding={4}
              backgroundColor="#21393e"
              alignItems="center"
              justifyContent="center"
            >
              <Flex alignItems="center">
                <Button
                  _hover={{ bg: "none", cursor: "default" }}
                  variant="ghost"
                  display={{ base: "none", md: "flex" }}
                ></Button>
                <Flex gap={4}>
                  <Text
                    bgGradient="linear(to-l, #7928CA, #FF0080)"
                    bgClip="text"
                    fontSize="2xl"
                    fontWeight="extrabold"
                  >
                    F
                  </Text>
                  <Text
                    bgGradient="linear(to-l, #7928CA, #FF0080)"
                    bgClip="text"
                    fontSize="2xl"
                    fontWeight="extrabold"
                  >
                    L
                  </Text>
                  <Text
                    bgGradient="linear(to-l, #7928CA, #FF0080)"
                    bgClip="text"
                    fontSize="2xl"
                    fontWeight="extrabold"
                  >
                    I
                  </Text>
                  <Text
                    bgGradient="linear(to-l, #7928CA, #FF0080)"
                    bgClip="text"
                    fontSize="2xl"
                    fontWeight="extrabold"
                  >
                    P
                  </Text>
                </Flex>
              </Flex>
            </Flex>

            {/* Right Body */}
            <Flex paddingTop={[0, 4]}>
              <Flex
                backgroundColor="#21393e"
                w="100%"
                //   h="100vh"
                justifyContent="center"
                alignItems="center"
              >
                <Flex
                  maxW="760px"
                  flexDirection="column"
                  w="100%"
                  paddingX={4}
                  paddingY={20}
                  color="gray.300"
                >
                  <Flex
                    flexDirection="column"
                    gap={4}
                    paddingX={4}
                    paddingTop={4}
                    paddingBottom={12}
                    borderWidth={1}
                    borderColor="gray.500"
                    borderStyle="dashed"
                    borderRadius="xl"
                  >
                    <Text>Token Process ID: {TOKEN_PROCESS_ID}</Text>
                    <Text>Game Process ID: {GAME_PROCESS_ID}</Text>

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

                    <Flex flexDirection="column" paddingTop={12} gap={12}>
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
                            setDepositQty(e)
                          }}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper color="gray.200" />
                            <NumberDecrementStepper color={"gray.200"} />
                          </NumberInputStepper>
                        </NumberInput>
                        <Button
                          variant="outline"
                          _hover={{
                            bgGradient: "linear(to-l, #7928CA, #FF0080)",
                          }}
                          paddingX={28}
                          onClick={depositTokens}
                          w={["100%", "280px"]}
                          color={"gray.200"}
                        >
                          D e p o s i t
                        </Button>
                      </Flex>
                      <Flex
                        gap={4}
                        flexDirection={["column", "row"]}
                        justifyContent="space-around"
                      >
                        <NumberInput
                          step={1}
                          defaultValue={withdrawQty}
                          min={1}
                          onChange={(e) => {
                            setWithdrawQty(e)
                          }}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper color="gray.200" />
                            <NumberDecrementStepper color={"gray.200"} />
                          </NumberInputStepper>
                        </NumberInput>
                        <Button
                          variant="outline"
                          _hover={{
                            bgGradient: "linear(to-l, #7928CA, #FF0080)",
                          }}
                          paddingX={28}
                          onClick={withdrawTokens}
                          w={["100%", "280px"]}
                          color={"gray.200"}
                        >
                          W i t h d r a w
                        </Button>
                      </Flex>
                    </Flex>
                  </Flex>

                  <Flex flexDirection="column" paddingX={4} paddingTop={12}>
                    <Flex
                      paddingTop={12}
                      gap={4}
                      flexDirection={["column", "row"]}
                      justifyContent="space-around"
                    >
                      <NumberInput
                        step={1}
                        defaultValue={betAmount}
                        min={1}
                        onChange={(e) => {
                          setBetAmount(e)
                        }}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper color="gray.200" />
                          <NumberDecrementStepper color={"gray.200"} />
                        </NumberInputStepper>
                      </NumberInput>
                      <Button
                        variant="solid"
                        _hover={{
                          bgGradient: "linear(to-l, #7928CA, #FF0080)",
                        }}
                        paddingX={28}
                        onClick={flipBet}
                        bgGradient="linear(to-r, red.400, green.400)"
                        w={["100%", "280px"]}
                      >
                        B E T
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
                        <SliderThumb
                          fontSize="sm"
                          boxSize="32px"
                          bg={sliderValue < 50 ? "red" : "green"}
                        >
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
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
