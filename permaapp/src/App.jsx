import GripIcon from "./components/icons/GripIcon"
import RepeatIcon from "./components/icons/RepeatIcon"
import { message, createDataItemSigner, result } from "@permaweb/aoconnect"
import LeftNav from "./components/LeftNav"
import {
  Box,
  Button,
  Divider,
  Flex,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Text,
  useToast,
} from "@chakra-ui/react"
import { useContext, useState, useRef } from "react"
import ArrowDownIcon from "./components/icons/ArrowDownIcon"
import { AppContext } from "./AppContext"
import AppHeader from "./components/AppHeader"

function App() {
  const {
    multiplyByPower,
    divideByPower,
    connectWallet,
    gameBalance,
    setGameBalance,
    walletBalance,
    setWalletBalance,
    fetchUserBalance,
  } = useContext(AppContext)

  const GAME_PROCESS_ID = "PkV8-8lAbwsfGjcjNV_Qj5OK0zc7YVZ4Gx_VqiymguI"
  const SLOPE = -0.96
  const INTERCEPT = 98

  const [sliderValue, setSliderValue] = useState(50)
  const [betAmount, setBetAmount] = useState(1)
  const [autoBet, setAutoBet] = useState(false)
  const isAutoPlayingRef = useRef(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)

  const getWinChance = (_sliderValue) => {
    return Math.floor(SLOPE * Number(_sliderValue) + INTERCEPT)
  }
  const [winChance, setWinChance] = useState(getWinChance(sliderValue))

  const getMultiplier = (_winChance) => {
    // console.log("sliderValue", sliderValue)

    // const houseEdge = (100 - sliderValue) / 10000 // 0.0099 or 0.99%
    const houseEdge = 0
    // console.log("houseEdge", houseEdge)

    const _multiplier = (1 / (Number(_winChance) / 100 + houseEdge)).toFixed(3)
    // console.log("_multiplier", _multiplier)
    const _multiplierFixed = parseFloat(_multiplier.slice(0, -1))
    // console.log("_multiplierFixed", _multiplierFixed)
    return _multiplierFixed
  }
  const [multiplier, setMultiplier] = useState(getMultiplier(winChance))

  const getProfitOnWin = (_multiplier, _betAmount) => {
    const _profitOnWin = (_betAmount * (_multiplier - 1)).toFixed(3)
    // console.log("_profitOnWin", _profitOnWin)
    const _profitOnWinFixed = parseFloat(_profitOnWin.slice(0, -1))
    // console.log("_profitOnWinFixed", _profitOnWinFixed)
    return _profitOnWinFixed
  }
  const [profitOnWin, setProfitOnWin] = useState(
    getProfitOnWin(multiplier, betAmount)
  )

  const [rollOver, setRollOver] = useState(100 - winChance)
  const [gameResults, setGameResults] = useState([])
  const [randomValue, setRandomValue] = useState(-1)

  const toast = useToast()

  const playWinSound = () => {
    const audio = new Audio("https://arweave.net/3GSTZEFF1hJkqAZIOIvmLuBwMNQ6_vbtIKkMG0K_aAU")
    audio.play().catch((error) => {
      console.error("Error playing the sound:", error)
    })
  }

  const sliderChanged = (_sliderValue) => {
    // console.log("_sliderValue", _sliderValue)
    setSliderValue(_sliderValue)
    const _winChance = getWinChance(_sliderValue)
    setWinChance(_winChance)
    setRollOver(100 - _winChance)

    const _multiplier = getMultiplier(_winChance)
    setMultiplier(_multiplier)

    setProfitOnWin(getProfitOnWin(_multiplier, betAmount))
  }

  const startAutoPlaying = () => {
    isAutoPlayingRef.current = true
    setIsAutoPlaying(true)
  }

  const stopAutoPlaying = () => {
    isAutoPlayingRef.current = false
    setIsAutoPlaying(false)
  }

  const flipDice = async () => {
    const _connected = await connectWallet()
    if (_connected.success === false) {
      stopAutoPlaying()
      return
    }

    try {
      const _gameBalance = multiplyByPower(gameBalance)
      const _betAmount = multiplyByPower(betAmount)
      console.log("gameBalance", gameBalance)
      console.log("_betAmount", _betAmount)
      console.log("sliderValue", sliderValue)

      const messageId = await message({
        process: GAME_PROCESS_ID,
        tags: [
          {
            name: "Action",
            value: "Dice",
          },
          {
            name: "Quantity",
            value: _betAmount.toString(),
          },
          {
            name: "Slider",
            value: sliderValue.toString(),
          },
        ],
        signer: createDataItemSigner(globalThis.arweaveWallet),
      })
      console.log("messageId", messageId)

      if (!autoBet) setGameBalance(divideByPower(_gameBalance - _betAmount))

      const _result = await result({
        message: messageId,
        process: GAME_PROCESS_ID,
      })
      console.log("_result", _result)

      const errorTag = _result?.Messages?.[0]?.Tags.find(
        (tag) => tag.name === "Error"
      )
      console.log("errorTag", errorTag)
      if (errorTag) {
        toast({
          description: _result.Messages[0].Data,
          status: "error",
          duration: 2000,
          isClosable: true,
          position: "top",
        })
        stopAutoPlaying() // Stop auto-play on error
        return
      }

      const { value: winStatusTag } = _result.Messages[0].Tags[6]
      const winStatus = winStatusTag ? "success" : "error"
      const jsonObj = JSON.parse(_result.Messages[0].Data)
      console.log("jsonObj", jsonObj)
      setGameResults((prevResults) => [...prevResults, jsonObj])

      toast({
        description: `${jsonObj.PlayerWon ? "You won!" : "You lost!"}`,
        title: `Random Value is ${jsonObj.WinningNumber}`,
        status: winStatus,
        duration: 2000,
        isClosable: true,
        position: "top-right",
      })

      if (jsonObj.PlayerWon) playWinSound()
      setRandomValue(jsonObj.WinningNumber)

      if (autoBet) {
        // await fetchUserBalance()
        if (isAutoPlayingRef.current) setTimeout(flipDice, 0)
      }
    } catch (e) {
      stopAutoPlaying() // Stop auto-play on error
      console.error("flipDice() error!", e)
    } finally {
      if (autoBet) {
        if (!isAutoPlayingRef.current) {
          await fetchUserBalance()
        }
      } else {
        await fetchUserBalance()
      }
    }
  }

  const labelStyles = {
    mt: "8",
    ml: "-2.5",
    fontSize: "sm",
  }

  return (
    <>
      <Flex minH="100vh" bg="#0e2229">
        <LeftNav />

        {/* Main Body Container */}
        <Flex
          flexDirection="column"
          flex="1" //fill available width horizontally
          gap={1}
          color="gray.200"
        >
          {/* AppHeader Container */}
          <Flex>
            <AppHeader />
          </Flex>

          {/* Main Content Container */}
          <Flex
            flex="1" //fill available height vertically
            bg="#1a2c38"
            padding={[2, 12]}
          >
            {/* Left & Right Section Container */}
            <Flex
              bg="#213743"
              borderRadius="md"
              flex="1" //fill available width horizontally
              flexDirection={["column", "row"]}
            >
              {/* Left Section */}
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
                  <Button
                    borderRadius="3xl"
                    px={8}
                    bg={autoBet ? "#0e212e" : "#304553"}
                    color="gray.200"
                    _hover={{}}
                    onClick={() => {
                      setAutoBet(false)
                    }}
                  >
                    Manual
                  </Button>
                  <Button
                    borderRadius="3xl"
                    px={8}
                    bg={autoBet ? "#304553" : "#0e212e"}
                    color="gray.200"
                    _hover={{}}
                    onClick={async (event) => {
                      const button = event.target
                      button.disabled = true

                      const _connected = await connectWallet()
                      if (_connected.success === false) {
                        button.disabled = false
                        return
                      }
                      setAutoBet(true)

                      toast({
                        description: "Fetching account info",
                        duration: 1000,
                        isClosable: true,
                        position: "top",
                      })
                      await fetchUserBalance()
                      toast({
                        title: "Wallet Setup",
                        description:
                          "Click the user icon to set up wallet auto-sign.",
                        duration: 2000,
                        isClosable: true,
                        position: "top",
                      })

                      button.disabled = false
                    }}
                  >
                    Auto
                  </Button>
                </Flex>
                <Flex flexDirection="column">
                  <Text color="#b1bad3">Bet Amount</Text>
                  <Flex padding={1} bg="#304553" borderRadius="md" gap={2}>
                    <NumberInput
                      precision={2}
                      value={betAmount}
                      min={1}
                      onChange={(e) => {
                        setBetAmount(e)
                        setProfitOnWin(getProfitOnWin(multiplier, e))
                      }}
                    >
                      <NumberInputField
                        bg="#0e212e"
                        borderColor="#0e212e"
                        borderRadius="none"
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper
                          borderColor="#0e212e"
                          color="gray.200"
                        />
                        <NumberDecrementStepper
                          borderColor="#0e212e"
                          color="gray.200"
                        />
                      </NumberInputStepper>
                    </NumberInput>
                    <Button
                      w={12}
                      bg="#304553"
                      color="gray.200"
                      fontSize={12}
                      _hover={{ bg: "#4A6B72" }}
                      onClick={() => {
                        setBetAmount((prev) => {
                          let v = prev / 2
                          if (v < 1) v = 1
                          setProfitOnWin(getProfitOnWin(multiplier, v))
                          return v
                        })
                      }}
                    >
                      1/2
                    </Button>
                    <Divider
                      orientation="vertical"
                      borderColor="#1a2c38"
                      borderWidth={1}
                    />
                    <Button
                      w={12}
                      bg="#304553"
                      color="gray.200"
                      _hover={{ bg: "#4A6B72" }}
                      onClick={() => {
                        setBetAmount((prev) => {
                          const v = prev * 2
                          setProfitOnWin(getProfitOnWin(multiplier, v))
                          return v
                        })
                      }}
                    >
                      2x
                    </Button>
                  </Flex>
                </Flex>
                <Flex flexDirection="column">
                  <Text color="#b1bad3">Profit on Win</Text>
                  <Flex
                    borderRadius="md"
                    paddingY={2}
                    paddingX={4}
                    bg="#304553"
                  >
                    {profitOnWin}
                  </Flex>
                </Flex>
                {!isAutoPlayingRef.current && (
                  <Button
                    bg="#00e700"
                    paddingY={8}
                    _hover={{}}
                    onClick={async (event) => {
                      const button = event.currentTarget
                      button.disabled = true
                      button.innerText = "Processing..."
                      try {
                        if (autoBet) {
                          startAutoPlaying()
                        }
                        await flipDice()
                      } finally {
                        button.disabled = false
                        button.innerText = "Bet"
                      }
                    }}
                  >
                    Bet
                  </Button>
                )}

                {isAutoPlayingRef.current && (
                  <Button
                    bg="red.400"
                    variant="outline"
                    border="none"
                    paddingY={8}
                    _hover={{}}
                    onClick={async (event) => {
                      const button = event.currentTarget
                      button.disabled = true
                      button.innerText = "Stopping..."
                      try {
                        stopAutoPlaying()
                      } finally {
                        button.disabled = false
                        button.innerText = "Stop"
                      }
                    }}
                  >
                    Stop
                  </Button>
                )}
              </Flex>

              {/* Right Section */}
              <Flex
                w="100%"
                padding={4}
                bg="#0e212e"
                marginBottom={[0, 1]}
                flexDirection="column"
              >
                {/* Game Results Row */}
                <Flex gap={4} flexWrap="wrap">
                  {gameResults.map((item, index) => (
                    <Flex key={index}>
                      <Text
                        textAlign="center"
                        minW="44px"
                        maxW="44px"
                        borderRadius={"3xl"}
                        paddingX={2}
                        paddingY={1}
                        bg={item.PlayerWon ? "green" : "red.500"}
                      >
                        {item.WinningNumber}
                      </Text>
                    </Flex>
                  ))}
                </Flex>

                {/* Slider Container */}
                <Flex paddingY={[20, 250]} paddingX={[0, 8]}>
                  <Slider
                    focusThumbOnChange={false}
                    value={sliderValue}
                    onChange={(val) => {
                      sliderChanged(val)
                    }}
                    min={0}
                    max={100}
                    step={1}
                  >
                    <SliderMark value={0} {...labelStyles}>
                      0
                    </SliderMark>
                    <SliderMark value={25} {...labelStyles}>
                      25
                    </SliderMark>
                    <SliderMark value={50} {...labelStyles}>
                      50
                    </SliderMark>
                    <SliderMark value={75} {...labelStyles}>
                      75
                    </SliderMark>
                    <SliderMark value={100} {...labelStyles}>
                      100
                    </SliderMark>
                    {/* <SliderMark
                            value={sliderValue}
                            textAlign="center"
                            bg="blue.500"
                            color="white"
                            mt="-10"
                            ml="-5"
                            w="12"
                          >
                            {sliderValue}%
                          </SliderMark> */}

                    {randomValue >= 0 && randomValue <= 100 && (
                      <SliderMark value={randomValue} marginTop="-58px" ml={-5}>
                        <Flex flexDirection="column" alignItems="center">
                          {randomValue}
                          <ArrowDownIcon />
                        </Flex>
                      </SliderMark>
                    )}

                    <SliderTrack bg="green">
                      <SliderFilledTrack bg="red" />
                    </SliderTrack>
                    <SliderThumb
                      // fontSize="sm"
                      boxSize="28px"
                      bg="blue.400"
                      borderRadius="none"
                      // bg={sliderValue <= 50 ? "green" : "red"}
                    >
                      <Box as={GripIcon} color="gray.200" />
                      {/* {sliderValue} */}
                    </SliderThumb>
                  </Slider>
                </Flex>

                {/* Bottom Container */}
                <Flex
                  bg="#213743"
                  padding={4}
                  gap={4}
                  flexDirection={["column", "row"]}
                  borderRadius="md"
                >
                  {/* Multiplier Container */}
                  <Flex
                    flex="1" //fill available width horizontally
                    flexDirection="column"
                    justifyContent="space-between"
                  >
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
                  {/* Roll Over Container */}
                  <Flex
                    flex="1" //fill available width horizontally
                    flexDirection="column"
                    justifyContent="space-between"
                  >
                    <Text>Roll Over</Text>

                    <Flex
                      bg="#0e212e"
                      padding={2}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      {rollOver} <RepeatIcon />
                    </Flex>
                  </Flex>
                  {/* Win Chance Container */}
                  <Flex
                    flex="1" //fill available width horizontally
                    flexDirection="column"
                    justifyContent="space-between"
                  >
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
    </>
  )
}

export default App
