import { getGameBalance, getWalletBalance } from "@/lib/utils"
import { HamburgerIcon, LinkIcon, RepeatIcon } from "@chakra-ui/icons"
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

  const login = async () => {
    const _connected = await connectWallet()
    if (_connected.success === false) {
      return
    }

    try {
    } catch (e) {
      console.error("login() error!", e)
    }
  }

  const fetchUserBalance = async () => {
    const _connected = await connectWallet()
    if (_connected.success === false) {
      return
    }

    try {
      const userAddress = await globalThis.arweaveWallet.getActiveAddress()

      const gameBalance = await getGameBalance({ recipient: userAddress })
      setGameBalance(divideByPower(gameBalance))

      const walletBalance = await getWalletBalance({ recipient: userAddress })
      setWalletBalance(divideByPower(walletBalance))
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

  const shortcutItems = [
    { text: "Shortcut 1", icon: <LinkIcon /> },
    { text: "Shortcut 2", icon: <LinkIcon /> },
    { text: "Shortcut 3", icon: <LinkIcon /> },
    { text: "Shortcut 4", icon: <LinkIcon /> },
    { text: "Shortcut 5", icon: <LinkIcon /> },
  ]

  const gameItems = [
    { text: "Game 1", icon: <LinkIcon /> },
    { text: "Game 2", icon: <LinkIcon /> },
    { text: "Game 3", icon: <LinkIcon /> },
    { text: "Game 4", icon: <LinkIcon /> },
    { text: "Game 5", icon: <LinkIcon /> },
  ]

  const ShortcutMenu = ({ icon, text }) => (
    <Flex alignItems="center" gap={2}>
      {icon}
      <Text>{text}</Text>
    </Flex>
  )
  return (
    <>
      <Flex minH="100vh" backgroundColor="#0e2229">
        <Flex w="100%">
          {/* Left */}
          <Flex
            minW="240px"
            flexDirection="column"
            display={{ base: "none", md: "flex" }}
            boxShadow="0px 4px 4px rgba(0, 0, 0, 0.25)"
          >
            {/* Left Header */}
            <Flex
              padding={4}
              gap={2}
              justifyContent="flex-end"
              alignItems="center"
              w="100%"
              boxShadow="0px 4px 0px rgba(0, 0, 0, 0.25)"
            >
              <Flex paddingX={3}>
                <HamburgerIcon color="gray.200" fontSize={"2xl"} />
              </Flex>
              <Button
                paddingX={8}
                bg="#1a2c38"
                color="gray.200"
                _hover={{
                  bgGradient: "linear(to-r, green.200, green.500)",
                }}
              >
                CASINO
              </Button>
              <Button
                bg="#1a2c38"
                color="gray.200"
                _hover={{
                  bgGradient: "linear(to-r, blue.200, blue.500)",
                }}
                paddingX={8}
              >
                SPORTS
              </Button>
            </Flex>

            {/* Shortcuts */}
            <Flex padding={4} flexDirection="column">
              <Flex
                backgroundColor="#1a2c38"
                borderRadius="md"
                flexDirection="column"
                gap={2}
                padding={4}
                color="gray.200"
              >
                {shortcutItems.map((item, index) => (
                  <ShortcutMenu key={index} icon={item.icon} text={item.text} />
                ))}
              </Flex>
            </Flex>

            {/* Games */}
            <Flex padding={4} flexDirection="column">
              <Flex
                backgroundColor="#1a2c38"
                borderRadius="md"
                flexDirection="column"
                gap={2}
                padding={4}
                color="gray.200"
              >
                {gameItems.map((item, index) => (
                  <ShortcutMenu key={index} icon={item.icon} text={item.text} />
                ))}
              </Flex>
            </Flex>

            {/* Socials */}
            <Flex padding={4} alignItems="center" gap={2}>
              <Flex paddingX={4}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-brand-x"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="#E2E8F0"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                  <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
                </svg>
              </Flex>
              <Flex>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-brand-discord"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="#E2E8F0"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M8 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
                  <path d="M14 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
                  <path d="M15.5 17c0 1 1.5 3 2 3c1.5 0 2.833 -1.667 3.5 -3c.667 -1.667 .5 -5.833 -1.5 -11.5c-1.457 -1.015 -3 -1.34 -4.5 -1.5l-.972 1.923a11.913 11.913 0 0 0 -4.053 0l-.975 -1.923c-1.5 .16 -3.043 .485 -4.5 1.5c-2 5.667 -2.167 9.833 -1.5 11.5c.667 1.333 2 3 3.5 3c.5 0 2 -2 2 -3" />
                  <path d="M7 16.5c3.5 1 6.5 1 10 0" />
                </svg>
              </Flex>
            </Flex>
          </Flex>

          {/* Right */}
          <Flex w="100%" flexDirection="column" gap={1} color="gray.200">
            {/* Right Header */}
            <Flex
              paddingY={4}
              paddingX={{ base: 4, md: 20 }}
              alignItems="center"
              w="100%"
              bg="#1a2c38"
              boxShadow="0px 4px 0px rgba(0, 0, 0, 0.25)"
              justifyContent="space-between"
              color="gray.200"
            >
              <Flex display={{ base: "flex", md: "none" }}>
                <HamburgerIcon color="gray.200" fontSize={"2xl"} />
              </Flex>
              <Flex paddingLeft={{ base: 0, md: 20 }}>
                <Text
                  color="white"
                  fontSize={"2xl"}
                  fontFamily={"Comic Sans MS, cursive, sans-serif"}
                  fontWeight="bold"
                  letterSpacing="wide"
                >
                  FLIP
                </Text>
              </Flex>

              {walletBalance >= 0 || gameBalance >= 0 ? (
                <>
                  <Box
                    bg="#0e212e"
                    paddingY={2}
                    paddingX={4}
                    borderRadius="md"
                    display={{ base: "none", md: "flex" }}
                  >
                    {gameBalance}
                  </Box>
                </>
              ) : (
                <>
                  <Box
                    bg="#0e212e"
                    paddingY={2}
                    paddingX={4}
                    borderRadius="md"
                    display={{ base: "none", md: "flex" }}
                  >
                    0.000000000000
                  </Box>
                </>
              )}

              {/* Wallet */}
              <Flex alignItems="center" gap={2}>
                {walletBalance >= 0 || gameBalance >= 0 ? (
                  <>
                    <Box
                      bg="#0e212e"
                      paddingY={2}
                      paddingX={4}
                      borderRadius="md"
                      display={{ base: "flex", md: "none" }}
                    >
                      {gameBalance}
                    </Box>
                  </>
                ) : (
                  <>
                    <Box
                      bg="#0e212e"
                      paddingY={2}
                      paddingX={4}
                      borderRadius="md"
                      display={{ base: "flex", md: "none" }}
                    >
                      0.000000000000
                    </Box>
                  </>
                )}
                <Button
                  variant={"outline"}
                  _hover={{ bg: "none" }}
                  onClick={fetchUserBalance}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="icon icon-tabler icon-tabler-wallet"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="#E2E8F0"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12" />
                    <path d="M20 12v4h-4a2 2 0 0 1 0 -4h4" />
                  </svg>
                </Button>
              </Flex>
            </Flex>

            {/* Right Body */}
            <Flex bg="#1a2c38" padding={[2, 12]}>
              <Flex
                bg="#213743"
                borderRadius="md"
                w="100%"
                flexDirection={["column", "row"]}
              >
                {/* Left */}
                <Flex padding={4} flexDirection="column" gap={4}>
                  <Flex
                    bg="#0e212e"
                    borderRadius="3xl"
                    padding={2}
                    gap={4}
                    color="gray.200"
                    alignItems="center"
                    flexDirection={["column", "row"]}
                  >
                    <Button borderRadius="3xl" px={8}>
                      Manual
                    </Button>
                    <Button borderRadius="3xl" px={8} variant="link">
                      Auto
                    </Button>
                    <RepeatIcon />
                  </Flex>
                  <Flex flexDirection="column">
                    <Text>Bet Amount</Text>
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
                  </Flex>

                  <Flex flexDirection="column">
                    <Text>Profit on Win</Text>
                    <Box paddingY={2} paddingX={4} bg="#304553">
                      {profitOnWin}
                    </Box>
                  </Flex>
                  <Button bg="#00e700" paddingY={8} _hover={{}}>
                    Bet
                  </Button>
                </Flex>

                {/* Right */}
                <Flex padding={4} w="100%" bg="#0e212e" marginBottom={1}>
                  <Flex w="100%" flexDirection="column">
                    {/* Top */}
                    <Flex paddingY={[8, 250]} paddingX={[0, 12]}>
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
                          bg={sliderValue <= 50 ? "green" : "red"}
                        >
                          {sliderValue}
                        </SliderThumb>
                      </Slider>
                    </Flex>

                    {/* Bottom */}
                    <Flex
                      bg="#213743"
                      padding={4}
                      gap={4}
                      w="100%"
                      flexDirection={["column", "row"]}
                      borderRadius="md"
                    >
                      <Flex flexDirection="column" w="100%">
                        <Text>Multiplier</Text>
                        <Flex
                          bg="#0e212e"
                          padding={2}
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          {multiplier} <Text>X</Text>
                        </Flex>
                      </Flex>
                      <Flex flexDirection="column" w="100%">
                        <Text>Roll Over</Text>

                        <Flex
                          bg="#0e212e"
                          padding={2}
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          - <RepeatIcon />
                        </Flex>
                      </Flex>
                      <Flex flexDirection="column" w="100%">
                        <Text>Win Chance</Text>
                        <Flex
                          bg="#0e212e"
                          padding={2}
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          {winChance}
                          <Text>%</Text>
                        </Flex>
                      </Flex>
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
