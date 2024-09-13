import { message, createDataItemSigner, result } from "@permaweb/aoconnect"
import { Button, Divider, Flex, Spacer, Text, useToast } from "@chakra-ui/react"
import { useEffect, useState, useRef } from "react"
import ChipIcon from "../components/icons/ChipIcon"
import LeftNav from "../components/LeftNav"
import RouletteWheel from "../components/icons/RouletteWheel"
import { useAppContext } from "../AppContext"
import AppHeader from "../components/AppHeader"
import RepeatIcon from "../components/icons/RepeatIcon"

const numberGroups = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [10, 11, 12],
  [13, 14, 15],
  [16, 17, 18],
  [19, 20, 21],
  [22, 23, 24],
  [25, 26, 27],
  [28, 29, 30],
  [31, 32, 33],
  [34, 35, 36],
]

const redNumbers = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]

const blackNumbers = [
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
]

const getColorStyles = (number) => {
  if (number === 0) return { bg: "green.500", borderColor: "green.500" }
  if (redNumbers.includes(number))
    return { bg: "red.500", borderColor: "red.500" }
  if (blackNumbers.includes(number))
    return { bg: "#304553", borderColor: "#304553" }
  return { bg: "#304553", borderColor: "#304553" }
}

const getNumberRange = (start, end) => {
  const range = []
  for (let i = start; i <= end; i++) {
    range.push(i)
  }
  return range
}

const RouletteButton = ({
  initialChildren,
  clickedChildren,
  color,
  borderColor,
  bg,
  onClick,
  resetClicked,
  ...props
}) => {
  const [isClicked, setIsClicked] = useState(false)

  useEffect(() => {
    if (resetClicked) {
      setIsClicked(false)
    }
  }, [resetClicked])

  const handleClick = (e) => {
    setIsClicked(true)
    if (onClick) onClick(e)
  }

  return (
    <Flex
      variant="outline"
      color={color || "white"}
      border={1}
      borderStyle="solid"
      borderColor={borderColor || "transparent"}
      bg={bg || "transparent"}
      borderRadius="0"
      _hover={{
        filter: bg ? "brightness(.5)" : "invert(20%)",
      }}
      onClick={handleClick}
      {...props}
      alignItems="center"
      justifyContent="center"
      minH="42px"
      minW="42px"
    >
      {isClicked ? clickedChildren : initialChildren}
    </Flex>
  )
}

export default function Roulette() {
  const {
    multiplyByPower,
    divideByPower,
    connectWallet,
    gameBalance,
    setGameBalance,
    walletBalance,
    setWalletBalance,
    fetchUserBalance,
    fetchGameBalance,
    fetchWalletBalance,
  } = useAppContext()
  const GAME_PROCESS_ID = "PkV8-8lAbwsfGjcjNV_Qj5OK0zc7YVZ4Gx_VqiymguI"
  const [betAmount, setBetAmount] = useState(0)

  const [selectedChip, setSelectedChip] = useState(10)
  const handleChipSelected = (value) => {
    setSelectedChip(value)
  }
  const [bets, setBets] = useState({})
  const [gameResults, setGameResults] = useState([])
  const toast = useToast()

  const [autoBet, setAutoBet] = useState(false)
  const isAutoPlayingRef = useRef(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)

  const startAutoPlaying = () => {
    isAutoPlayingRef.current = true
    setIsAutoPlaying(true)
  }

  const stopAutoPlaying = () => {
    isAutoPlayingRef.current = false
    setIsAutoPlaying(false)
  }

  const handleButtonClick = (betTypeOrNumbers) => {
    console.log("betTypeOrNumbers: ", betTypeOrNumbers)
    console.log("selectedChip: ", selectedChip)

    const newBets = { ...bets }
    if (typeof betTypeOrNumbers === "string") {
      // This is a bet type like "Red", "Black", etc.
      newBets[betTypeOrNumbers] =
        (newBets[betTypeOrNumbers] || 0) + selectedChip
    } else if (Array.isArray(betTypeOrNumbers)) {
      // This is an array of numbers
      betTypeOrNumbers.forEach((num) => {
        newBets[num] = (newBets[num] || 0) + selectedChip
      })
    }
    setBetAmount((prev) => prev + selectedChip)
    setBets(newBets)
  }

  const playWinSound = () => {
    const audio = new Audio("https://arweave.net/3GSTZEFF1hJkqAZIOIvmLuBwMNQ6_vbtIKkMG0K_aAU")
    audio.play().catch((error) => {
      console.error("Error playing the sound:", error)
    })
  }

  const adjustBet = (adjustmentType) => {
    setBets((prevBets) => {
      const updatedBets = {}
      let totalBetAmount = 0

      for (let key in prevBets) {
        let currentBet = prevBets[key]

        if (adjustmentType === "double") {
          currentBet *= 2 // Double the bet
        } else if (adjustmentType === "half" && currentBet > 1) {
          currentBet = Math.floor(currentBet / 2) // Half the bet, but don't go below 1 chip
        }

        updatedBets[key] = currentBet
        totalBetAmount += currentBet
      }

      setBetAmount(totalBetAmount) // Update total bet amount
      return updatedBets
    })
  }

  const flipRoulette = async () => {
    const _connected = await connectWallet()
    if (_connected.success === false) {
      stopAutoPlaying()
      return
    }

    try {
      const _gameBalance = multiplyByPower(gameBalance)
      const _betAmount = multiplyByPower(betAmount)
      console.log("gameBalance", gameBalance)
      console.log("betAmount", betAmount)
      console.log("bets", bets)

      // if (_gameBalance < _betAmount) {
      //   toast({
      //     title: (
      //       <>
      //         <Flex alignItems="center" gap={2}>
      //           Insufficient funds
      //           <WalletIcon />
      //         </Flex>
      //       </>
      //     ),
      //     status: "error",
      //     duration: 2000,
      //     isClosable: true,
      //     position: "top",
      //   })
      //   return
      // }

      const messageId = await message({
        process: GAME_PROCESS_ID,
        tags: [
          {
            name: "Action",
            value: "Roulette",
          },
          {
            name: "Quantity",
            value: _betAmount.toString(),
          },
          {
            name: "Bets",
            value: JSON.stringify(bets),
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
        stopAutoPlaying()
        return
      }

      const jsonObj = JSON.parse(_result.Messages[0].Data)
      console.log("jsonObj", jsonObj)
      if (jsonObj?.PayoutNum > 0) {
        toast({
          description: "Payout: " + jsonObj?.PayoutNum + " $FLIP",
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "top-right",
        })

        playWinSound()
      }

      setGameResults((prevResults) => [...prevResults, jsonObj])

      if (autoBet) {
        await fetchGameBalance()
        if (isAutoPlayingRef.current) setTimeout(flipRoulette, 1000)
      }
    } catch (e) {
      stopAutoPlaying()
      console.error("flipRoulette() error!", e)
    } finally {
      if (autoBet) {
        if (!isAutoPlayingRef.current) {
          await fetchUserBalance()
        }
      } else {
        await fetchGameBalance()
      }
    }
  }

  return (
    <>
      <Flex minH="100vh" backgroundColor="#0e2229">
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
                      await fetchGameBalance()
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
                  <Text color="#b1bad3">Chip Value : 1 $FLIP</Text>

                  <Flex gap={2}>
                    {[1, 10, 100, 1000].map((value) => (
                      <ChipIcon
                        key={value}
                        text={value}
                        isSelected={selectedChip === value}
                        onClick={() => {
                          handleChipSelected(value)
                        }}
                      />
                    ))}
                  </Flex>

                  <Flex justifyContent="space-between" paddingY={2}>
                    <Text color="#b1bad3">Total Bet</Text>
                    <Text color="#b1bad3">{betAmount} $FLIP</Text>
                  </Flex>

                  <Flex
                    padding={1}
                    bg="#304553"
                    borderRadius="md"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Text color="white" paddingLeft={3}>
                      {betAmount}
                    </Text>
                    <Flex>
                      <Flex gap={1}>
                        <Button
                          w={12}
                          bg="#283e4b"
                          color="gray.200"
                          fontSize={10}
                          _hover={{ bg: "#4A6B72" }}
                          onClick={() => {
                            adjustBet("half")
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
                          bg="#283e4b"
                          color="gray.200"
                          fontSize={12}
                          _hover={{ bg: "#4A6B72" }}
                          onClick={() => {
                            adjustBet("double")
                          }}
                        >
                          2x
                        </Button>
                      </Flex>
                    </Flex>
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
                        await flipRoulette()
                      } finally {
                        button.disabled = false
                        button.innerText = "Bet"
                        if (!autoBet) {
                          setBets({})
                          setBetAmount(0)
                        }
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
                padding={4}
                w="100%"
                bg="#0e212e"
                marginBottom={[0, 1]}
                flexDirection="column"
                gap={1}
              >
                {/* Game Results Row */}
                <Flex gap={4} flexWrap="wrap">
                  {gameResults.map((item, index) => (
                    <Flex key={index}>
                      <Text
                        textAlign="center"
                        minW="40px"
                        maxW="40px"
                        borderRadius={"3xl"}
                        paddingX={2}
                        paddingY={1}
                        bg={
                          redNumbers.includes(item.WinningNumber)
                            ? "red.500"
                            : blackNumbers.includes(item.WinningNumber)
                            ? "#304553"
                            : "green.500" // for 0
                        }
                      >
                        {item.WinningNumber}
                      </Text>
                    </Flex>
                  ))}
                </Flex>

                {/* Roulette Wheel Container */}
                <Flex
                  paddingY={[8, 10]}
                  paddingX={[0, 12]}
                  justifyContent="space-between"
                >
                  <Flex alignItems="center">
                    <Text
                      bg="#213743"
                      padding={5}
                      borderRadius="md"
                      fontSize="x-large"
                      minH={76}
                      minW={70}
                      textAlign="center"
                    >
                      {gameResults.length > 0
                        ? `${gameResults[gameResults.length - 1].WinningNumber}`
                        : ""}
                    </Text>
                  </Flex>
                  <Spacer display={["none", "flex"]} />
                  <RouletteWheel />
                  <Spacer display={["none", "flex"]} />
                </Flex>

                {/* Roulette Board Upper Container */}
                <Flex flexDirection={["column", "row"]} gap={1}>
                  {/* Number 0 */}
                  <RouletteButton
                    flexDirection={["row", "column"]}
                    {...getColorStyles(0)}
                    flex="1"
                    initialChildren="0"
                    clickedChildren={<ChipIcon text={bets[0]} />}
                    resetClicked={!bets[0]}
                    onClick={() => handleButtonClick([0])}
                  ></RouletteButton>

                  {/* Numbers 1-36 */}
                  {numberGroups.map((group, idx) => (
                    <Flex
                      key={idx}
                      flexDirection={["row", "column"]}
                      gap={1}
                      flex="1"
                    >
                      {group.map((number) => (
                        <RouletteButton
                          key={number}
                          {...getColorStyles(number)}
                          flex="1"
                          initialChildren={number}
                          clickedChildren={<ChipIcon text={bets[number]} />}
                          resetClicked={!bets[number]}
                          onClick={() => handleButtonClick([number])}
                        ></RouletteButton>
                      ))}
                    </Flex>
                  ))}

                  {/* 2:1 Container */}
                  <Flex flexDirection={["row", "column"]} gap={1} flex="1">
                    <RouletteButton
                      flex="1"
                      borderColor="#304553"
                      initialChildren="2:1"
                      resetClicked={!bets["2:1_1"]}
                      clickedChildren={
                        <ChipIcon text={bets["2:1_1"]?.toString()} />
                      }
                      onClick={() => handleButtonClick("2:1_1")}
                    />
                    <RouletteButton
                      flex="1"
                      borderColor="#304553"
                      initialChildren="2:1"
                      resetClicked={!bets["2:1_2"]}
                      clickedChildren={
                        <ChipIcon text={bets["2:1_2"]?.toString()} />
                      }
                      onClick={() => handleButtonClick("2:1_2")}
                    ></RouletteButton>
                    <RouletteButton
                      flex="1"
                      borderColor="#304553"
                      initialChildren="2:1"
                      resetClicked={!bets["2:1_3"]}
                      clickedChildren={
                        <ChipIcon text={bets["2:1_3"]?.toString()} />
                      }
                      onClick={() => handleButtonClick("2:1_3")}
                    ></RouletteButton>
                  </Flex>
                </Flex>

                {/* Roulette Board Bottom Container */}
                <Flex
                  flexDirection={["row", "column"]}
                  gap={1}
                  paddingX={[0, 28]}
                >
                  {/* 1 to 12, 13 to 24, 25 to 36 */}
                  <Flex flex="1" flexDirection={["column", "row"]} gap={1}>
                    <RouletteButton
                      flex="1"
                      borderColor="#304553"
                      initialChildren="1 to 12"
                      resetClicked={!bets["1to12"]}
                      clickedChildren={
                        <ChipIcon text={bets["1to12"]?.toString()} />
                      }
                      onClick={() => handleButtonClick("1to12")}
                    ></RouletteButton>
                    <RouletteButton
                      flex="1"
                      borderColor="#304553"
                      initialChildren="13 to 24"
                      resetClicked={!bets["13to24"]}
                      clickedChildren={
                        <ChipIcon text={bets["13to24"]?.toString()} />
                      }
                      onClick={() => handleButtonClick("13to24")}
                    ></RouletteButton>
                    <RouletteButton
                      flex="1"
                      borderColor="#304553"
                      initialChildren="25 to 36"
                      resetClicked={!bets["25to36"]}
                      clickedChildren={
                        <ChipIcon text={bets["25to36"]?.toString()} />
                      }
                      onClick={() => handleButtonClick("25to36")}
                    ></RouletteButton>
                  </Flex>

                  {/* 1 to 18, 19 to 36, even, odd, red, black */}
                  <Flex flex="1" flexDirection={["column", "row"]} gap={1}>
                    <RouletteButton
                      flex="1"
                      borderColor="#304553"
                      initialChildren="1 to 18"
                      resetClicked={!bets["1to18"]}
                      clickedChildren={
                        <ChipIcon text={bets["1to18"]?.toString()} />
                      }
                      onClick={() => handleButtonClick("1to18")}
                    ></RouletteButton>
                    <RouletteButton
                      flex="1"
                      borderColor="#304553"
                      initialChildren="Even"
                      resetClicked={!bets["even"]}
                      clickedChildren={
                        <ChipIcon text={bets["even"]?.toString()} />
                      }
                      onClick={() => handleButtonClick("even")}
                    ></RouletteButton>
                    <RouletteButton
                      flex="1"
                      borderColor="#304553"
                      {...getColorStyles(redNumbers[0])}
                      initialChildren="Red"
                      resetClicked={!bets["red"]}
                      clickedChildren={
                        <ChipIcon text={bets["red"]?.toString()} />
                      }
                      onClick={() => handleButtonClick("red")}
                    ></RouletteButton>
                    <RouletteButton
                      flex="1"
                      {...getColorStyles(2)}
                      initialChildren="Black"
                      resetClicked={!bets["black"]}
                      clickedChildren={
                        <ChipIcon text={bets["black"]?.toString()} />
                      }
                      onClick={() => handleButtonClick("black")}
                    ></RouletteButton>
                    <RouletteButton
                      flex="1"
                      borderColor="#304553"
                      initialChildren="Odd"
                      resetClicked={!bets["odd"]}
                      clickedChildren={
                        <ChipIcon text={bets["odd"]?.toString()} />
                      }
                      onClick={() => handleButtonClick("odd")}
                    ></RouletteButton>
                    <RouletteButton
                      flex="1"
                      borderColor="#304553"
                      initialChildren="19 to 36"
                      resetClicked={!bets["19to36"]}
                      clickedChildren={
                        <ChipIcon text={bets["19to36"]?.toString()} />
                      }
                      onClick={() => handleButtonClick("19to36")}
                    ></RouletteButton>
                  </Flex>
                </Flex>

                {/* Undo / Clear Container */}
                <Flex
                  justifyContent="space-between"
                  alignItems="center"
                  paddingTop={8}
                >
                  {/* <Button
                    leftIcon={<RepeatIcon />}
                    variant="link"
                    color="gray.200"
                    onClick={() => {
                      toast({
                        title: "This feature is not available yet",
                        duration: 1000,
                        isClosable: true,
                        position: "top",
                      })
                    }}
                  >
                    Undo
                  </Button> */}
                  <Button
                    rightIcon={<RepeatIcon />}
                    variant="link"
                    color="gray.200"
                    onClick={() => {
                      setBets({})
                      setBetAmount(0)
                    }}
                  >
                    Clear
                  </Button>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
