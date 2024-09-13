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
import LeftNav from "../components/LeftNav"
import AppHeader from "../components/AppHeader"
import { useState } from "react"
import { message, createDataItemSigner, result } from "@permaweb/aoconnect"
import { useAppContext } from "../AppContext"

export default function Blackjack() {
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

  const toast = useToast()

  const [betAmount, setBetAmount] = useState(0)
  const [insuranceOption, setInsuranceOption] = useState(false)
  const [gameState, setGameState] = useState(null)

  const deal = async () => {
    const _connected = await connectWallet()
    if (_connected.success === false) {
      return
    }

    try {
      const _gameBalance = multiplyByPower(gameBalance)
      const _betAmount = multiplyByPower(betAmount)
      console.log("gameBalance", gameBalance)
      console.log("_betAmount", _betAmount)

      const messageId = await message({
        process: GAME_PROCESS_ID,
        tags: [
          {
            name: "Action",
            value: "Deal",
          },
          {
            name: "Quantity",
            value: _betAmount.toString(),
          },
        ],
        signer: createDataItemSigner(globalThis.arweaveWallet),
      })
      console.log("messageId", messageId)

      // setGameBalance(divideByPower(_gameBalance - _betAmount))

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
        return
      }

      const jsonObj = JSON.parse(_result.Messages[0].Data)
      console.log("jsonObj", jsonObj)
      setGameState(jsonObj)

      if (jsonObj.Result === "Push") {
        toast({
          description: "Push! Your bet has been returned.",
          status: "info",
          duration: 2000,
          isClosable: true,
          position: "top",
        })
      } else if (jsonObj.Result === "PlayerWinsBlackjack") {
        toast({
          description: "Blackjack! You win 1.5x your bet.",
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "top",
        })
      } else {
        // Continue the game with normal flow if no immediate Blackjack outcome

        setInsuranceOption(jsonObj.InsuranceOption)
        console.log("InsuranceOption", jsonObj.InsuranceOption)
      }
    } catch (e) {
      console.error("deal() error!", e)
    } finally {
      await fetchGameBalance()
    }
  }

  const hit = async () => {}
  const stand = async () => {}
  const split = async () => {}
  const double = async () => {}

  const acceptInsurance = async () => {
    const _connected = await connectWallet()
    if (_connected.success === false) {
      return
    }

    try {
      console.log("insuranceOption", insuranceOption)

      const messageId = await message({
        process: GAME_PROCESS_ID,
        tags: [
          {
            name: "Action",
            value: "Insurance",
          },
          {
            name: "InsuranceAccepted",
            value: "true",
          },
        ],
        signer: createDataItemSigner(globalThis.arweaveWallet),
      })
      console.log("messageId", messageId)

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
        return
      }

      const jsonObj = JSON.parse(_result.Messages[0].Data)
      console.log("jsonObj", jsonObj)
      setGameState(jsonObj)

      if (jsonObj.Result === "DealerWinsBlackjack") {
        toast({
          description: "DealerWinsBlackjack",
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "top",
        })
      } else if (jsonObj.Result === "GameContinues") {
        toast({
          description: "GameContinues",
          status: "info",
          duration: 2000,
          isClosable: true,
          position: "top",
        })
      } else {
        // Continue the game with normal flow if no immediate Blackjack outcome

        setInsuranceOption(jsonObj.InsuranceOption)
        console.log("InsuranceOption", jsonObj.InsuranceOption)
      }
    } catch (e) {
      console.error("acceptInsurance() error!", e)
    }
  }

  const rejectInsurance = async () => {
    const _connected = await connectWallet()
    if (_connected.success === false) {
      return
    }

    try {
      console.log("insuranceOption", insuranceOption)

      const messageId = await message({
        process: GAME_PROCESS_ID,
        tags: [
          {
            name: "Action",
            value: "Insurance",
          },
          {
            name: "InsuranceAccepted",
            value: "false",
          },
        ],
        signer: createDataItemSigner(globalThis.arweaveWallet),
      })
      console.log("messageId", messageId)

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
        return
      }

      const jsonObj = JSON.parse(_result.Messages[0].Data)
      console.log("jsonObj", jsonObj)
    } catch (e) {
      console.error("rejectInsurance() error!", e)
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
                <Flex flexDirection="column">
                  <Text color="#b1bad3">Bet Amount</Text>
                  <Flex padding={1} bg="#304553" borderRadius="md" gap={2}>
                    <NumberInput
                      precision={2}
                      value={betAmount}
                      min={0}
                      onChange={(e) => {
                        setBetAmount(e)
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
                          return v
                        })
                      }}
                    >
                      2x
                    </Button>
                  </Flex>
                </Flex>

                {insuranceOption && (
                  <>
                    <Flex gap={2}>
                      <Button
                        variant="outline"
                        color="gray.200"
                        flex={1}
                        _hover={{}}
                        bg="#283e4b"
                        border="none"
                        isDisabled={!insuranceOption}
                        onClick={async (event) => {
                          const button = event.currentTarget
                          button.innerText = "Processing..."
                          try {
                            setInsuranceOption(false)
                            await acceptInsurance()
                          } finally {
                            button.innerText = "Accept Insurance"
                          }
                        }}
                      >
                        Accept Insurance
                      </Button>
                      <Button
                        variant="outline"
                        color="gray.200"
                        flex={1}
                        _hover={{}}
                        bg="#283e4b"
                        border="none"
                        isDisabled={!insuranceOption}
                        onClick={async (event) => {
                          const button = event.currentTarget
                          button.innerText = "Processing..."
                          try {
                            setInsuranceOption(false)
                            await rejectInsurance()
                          } finally {
                            button.innerText = "No Insurance"
                          }
                        }}
                      >
                        No Insurance
                      </Button>
                    </Flex>
                  </>
                )}

                {!insuranceOption && (
                  <>
                    <Flex gap={2}>
                      <Button
                        variant="outline"
                        color="gray.200"
                        flex={1}
                        _hover={{}}
                        bg="#283e4b"
                        border="none"
                        isDisabled={true}
                      >
                        Hit
                      </Button>
                      <Button
                        variant="outline"
                        color="gray.200"
                        flex={1}
                        _hover={{}}
                        bg="#283e4b"
                        border="none"
                        isDisabled={true}
                      >
                        Stand
                      </Button>
                    </Flex>

                    <Flex gap={2}>
                      <Button
                        variant="outline"
                        color="gray.200"
                        flex={1}
                        _hover={{}}
                        bg="#283e4b"
                        border="none"
                        isDisabled={true}
                      >
                        Split
                      </Button>
                      <Button
                        variant="outline"
                        color="gray.200"
                        flex={1}
                        _hover={{}}
                        bg="#283e4b"
                        border="none"
                        isDisabled={true}
                      >
                        Double
                      </Button>
                    </Flex>
                  </>
                )}

                <Button
                  bg="#00e700"
                  paddingY={8}
                  _hover={{}}
                  onClick={async (event) => {
                    const button = event.currentTarget
                    button.disabled = true
                    button.innerText = "Processing..."
                    try {
                      // await deal()
                      toast({
                        title: "This game is not available yet",
                        duration: 1000,
                        isClosable: true,
                        position: "top",
                      })
                    } finally {
                      button.disabled = false
                      button.innerText = "Bet"
                    }
                  }}
                >
                  Bet
                </Button>
              </Flex>

              {/* Right Section */}
              <Flex
                w="100%"
                padding={4}
                bg="#0e212e"
                marginBottom={[0, 1]}
                flexDirection="column"
              >
                <Flex
                  justifyContent="center"
                  flexDirection="column"
                  alignItems="center"
                  //   bg="red.500"
                  flex={1}
                >
                  {/* Upper Section */}
                  <Flex gap={2} justifyContent="center">
                    {/* Upper Cards Section */}
                  </Flex>

                  {/* Center Section */}
                  <Flex
                    flexDirection="column"
                    color="gray.500"
                    alignItems="center"
                    paddingY={100}
                    gap={2}
                  >
                    <Text
                      bg="#162c39"
                      fontWeight="bold"
                      paddingX={28}
                      paddingY={2}
                    >
                      BLACKJACK PAYS 3 TO 2
                    </Text>

                    <Text fontWeight="bold">INSURANCE PAYS 2 TO 1</Text>
                  </Flex>

                  {/* Lower Section */}
                  <Flex gap={2} justifyContent="center">
                    {/* Lower Cards Section */}
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
