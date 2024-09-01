import { message, createDataItemSigner, result } from "@permaweb/aoconnect"
import { getGameBalance, getWalletBalance } from "@/lib/utils"
import {
  DragHandleIcon,
  HamburgerIcon,
  LinkIcon,
  RepeatIcon,
} from "@chakra-ui/icons"
import {
  Box,
  Button,
  Divider,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
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
  useDisclosure,
  useToast,
} from "@chakra-ui/react"
import { useState } from "react"
import LeftNav from "@/components/LeftNav"
import WalletIcon from "@/components/icons/WalletIcon"
import UserIcon from "@/components/icons/UserIcon"
import ArrowDownIcon from "@/components/icons/ArrowDownIcon"

export default function Home() {
  const TOKEN_PROCESS_ID = "XIJzo8ooZVGIsxFVhQDYW0ziJBX7Loh9Pi280ro2YU4"
  const GAME_PROCESS_ID = "PkV8-8lAbwsfGjcjNV_Qj5OK0zc7YVZ4Gx_VqiymguI"
  const BASE_UNIT = 10
  const DENOMINATION = 12
  const TICKER = "FLIP"

  const SLOPE = -0.96
  const INTERCEPT = 98

  const [gameBalance, setGameBalance] = useState(-1)
  const [walletBalance, setWalletBalance] = useState(-1)
  const [sliderValue, setSliderValue] = useState(50)
  const [betAmount, setBetAmount] = useState(1)

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

  const LoginModal = () => {
    const { isOpen, onOpen, onClose } = useDisclosure()

    const login = async () => {
      const _connected = await connectWallet()
      if (_connected.success === false) {
        return
      }

      toast({
        description: "Fetching account info",
        duration: 1000,
        isClosable: true,
        position: "top",
      })
      await fetchUserBalance()
      toast({
        description: "Account balance updated",
        duration: 2000,
        isClosable: true,
        position: "top",
      })
      onClose()
    }

    const logout = async () => {
      const _connected = await disconnectWallet()
      if (_connected.success === false) {
        return
      }

      setWalletBalance(-1)
      setGameBalance(-1)
      toast({
        description: "Account disconnected",
        duration: 2000,
        isClosable: true,
        position: "top",
      })
      onClose()
    }

    return (
      <>
        <Flex _hover={{ cursor: "pointer" }} onClick={onOpen}>
          {walletBalance >= 0 || gameBalance >= 0 ? (
            <UserIcon />
          ) : (
            <WalletIcon />
          )}
        </Flex>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Wallet Setup</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Flex flexDirection="column" gap={4}>
                <Flex w="100%" gap={4} flexDirection="column">
                  <Text>
                    To enable wallet auto sign, first disconnect your account.
                  </Text>
                  <Text>
                    Then, sign in with ArConnect and select &apos;Always
                    allow&apos;
                  </Text>
                </Flex>
              </Flex>
            </ModalBody>

            <ModalFooter>
              <Flex gap={4}>
                <Button colorScheme="blue" onClick={login}>
                  Connect
                </Button>
                <Button variant="ghost" onClick={logout}>
                  Disconnect
                </Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    )
  }
  const BalanceModal = () => {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [txQuantity, setTxQuantity] = useState(1)

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
            value: GAME_PROCESS_ID,
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

    return (
      <>
        {walletBalance >= 0 || gameBalance >= 0 ? (
          <>
            <Flex
              _hover={{ cursor: "pointer" }}
              bg="#0e212e"
              paddingY={2}
              paddingX={4}
              borderRadius="md"
              onClick={onOpen}
            >
              {gameBalance}
            </Flex>
          </>
        ) : (
          <>
            <Flex
              _hover={{ cursor: "pointer" }}
              bg="#0e212e"
              paddingY={2}
              paddingX={4}
              borderRadius="md"
              onClick={async () => {
                toast({
                  title: (
                    <>
                      <Flex alignItems="center" gap={2}>
                        Connect wallet first
                        <WalletIcon />
                      </Flex>
                    </>
                  ),
                  status: "error",
                  duration: 2000,
                  isClosable: true,
                  position: "top",
                })
              }}
            >
              0.000000000000
            </Flex>
          </>
        )}

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Account</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Flex flexDirection="column" gap={4}>
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
                    {/* <Text>Token Process ID: {TOKEN_PROCESS_ID}</Text>
                    <Text>Game Process ID: {GAME_PROCESS_ID}</Text> */}
                  </>
                ) : (
                  <></>
                )}

                <Flex
                  paddingTop={20}
                  w="100%"
                  justifyContent="flex-end"
                  alignItems="center"
                  gap={4}
                >
                  <Text>Quantity</Text>
                  <NumberInput
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
              </Flex>
            </ModalBody>

            <ModalFooter>
              <Flex gap={4}>
                <Button colorScheme="blue" onClick={depositTokens}>
                  Deposit
                </Button>
                <Button variant="ghost" onClick={withdrawTokens}>
                  Withdraw
                </Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    )
  }

  const playWinSound = () => {
    const audio = new Audio("/win.mp3")
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

  const disconnectWallet = async () => {
    try {
      await window.arweaveWallet.disconnect()
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

      const gameBalance = await getGameBalance({ recipient: userAddress })
      setGameBalance(divideByPower(gameBalance))

      const walletBalance = await getWalletBalance({ recipient: userAddress })
      setWalletBalance(divideByPower(walletBalance))
    } catch (e) {
      console.error("fetchUserBalance() error!", e)
    }
  }

  const flipDice = async () => {
    const _connected = await connectWallet()
    if (_connected.success === false) {
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

      const _result = await result({
        message: messageId,
        process: GAME_PROCESS_ID,
      })
      console.log("_result", _result)

      const errorTag = _result.Messages[0].Tags.find(
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

      const winStatus = _result.Messages[0].Tags[6].value ? "success" : "error"
      const jsonObj = JSON.parse(_result.Messages[0].Data)
      console.log("jsonObj", jsonObj)
      setGameResults((prevResults) => [...prevResults, jsonObj])

      toast({
        description: `${jsonObj.PlayerWon ? "You won!" : "You lost!"}`,
        title: `Random Value is ${jsonObj.RandomValue}`,
        status: winStatus,
        duration: 2000,
        isClosable: true,
        position: "top-right",
      })

      if (jsonObj.PlayerWon) playWinSound()
      setRandomValue(jsonObj.RandomValue)
    } catch (e) {
      console.error("flipDice() error!", e)
    } finally {
      await fetchUserBalance()
    }
  }

  const labelStyles = {
    mt: "8",
    ml: "-2.5",
    fontSize: "sm",
  }
  return (
    <>
      <Flex minH="100vh" backgroundColor="#0e2229">
        <Flex w="100%">
          {/* Left */}
          <LeftNav />

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
              <Flex
                display={{ base: "flex", md: "none" }}
                onClick={() => {
                  toast({
                    title: "This feature is not available yet",
                    duration: 1000,
                    isClosable: true,
                    position: "top",
                  })
                }}
              >
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

              <Flex display={{ base: "none", md: "flex" }}>
                <BalanceModal />
              </Flex>

              {/* Wallet */}
              <Flex alignItems="center" gap={2}>
                <Flex display={{ base: "flex", md: "none" }}>
                  <BalanceModal />
                </Flex>
                <LoginModal />
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
                    <Button
                      borderRadius="3xl"
                      px={8}
                      bg="#304553"
                      color="gray.200"
                      _hover={{}}
                    >
                      Manual
                    </Button>
                    <Button
                      borderRadius="3xl"
                      px={8}
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
                  <Button
                    bg="#00e700"
                    paddingY={8}
                    _hover={{}}
                    onClick={flipDice}
                  >
                    Bet
                  </Button>
                </Flex>

                {/* Right */}
                <Flex
                  padding={4}
                  w="100%"
                  bg="#0e212e"
                  marginBottom={[0, 1]}
                  flexDirection="column"
                >
                  <Flex w="100%" flexDirection="column">
                    {/* Game Results Row */}
                    <Flex gap={4} flexWrap="wrap">
                      {[...gameResults].reverse().map((item, index) => (
                        <>
                          <Flex key={index}>
                            <Text
                              key={index}
                              borderRadius={"3xl"}
                              paddingX={2}
                              paddingY={1}
                              bg={item.PlayerWon ? "green" : "red.500"}
                            >
                              {item.RandomValue}
                            </Text>
                          </Flex>
                        </>
                      ))}
                    </Flex>

                    {/* Top */}
                    <Flex paddingY={[8, 250]} paddingX={[0, 12]}>
                      <Flex padding={4} flexDirection="column" w="100%">
                        <Slider
                          flex="1"
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
                            <SliderMark
                              value={randomValue}
                              marginTop="-58px"
                              ml={-5}
                            >
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
                            <Box as={DragHandleIcon} color="gray.200" />
                            {/* {sliderValue} */}
                          </SliderThumb>
                        </Slider>
                      </Flex>
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
                          {rollOver} <RepeatIcon />
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
