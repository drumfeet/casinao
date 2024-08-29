import { message, createDataItemSigner, result } from "@permaweb/aoconnect"
import { getGameBalance, getWalletBalance } from "@/lib/utils"
import { HamburgerIcon, RepeatIcon } from "@chakra-ui/icons"
import {
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
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react"
import { useEffect, useState } from "react"
import ChipIcon from "@/components/icons/ChipIcon"
import RouletteBoard from "@/components/RouletteBoard"
import UserIcon from "@/components/icons/UserIcon"
import WalletIcon from "@/components/icons/WalletIcon"
import LeftNav from "@/components/LeftNav"

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
    <Button
      variant="outline"
      color={color || "white"}
      borderColor={borderColor || "#304553"}
      bg={bg || "transparent"}
      flex={["auto", "1"]}
      borderRadius="0"
      _hover={{
        filter: bg ? "brightness(.5)" : "invert(20%)",
      }}
      onClick={handleClick}
      {...props}
    >
      {isClicked ? clickedChildren : initialChildren}
    </Button>
  )
}

export default function Home() {
  const TOKEN_PROCESS_ID = "XIJzo8ooZVGIsxFVhQDYW0ziJBX7Loh9Pi280ro2YU4"
  const GAME_PROCESS_ID = "PADEZbrkTHafqOtYRsgZRXLvJFv6xrPyxPsYR9KqGic"
  const BASE_UNIT = 10
  const DENOMINATION = 12
  const TICKER = "FLIP"

  const SLOPE = -0.96
  const INTERCEPT = 98

  const [gameBalance, setGameBalance] = useState(-1)
  const [walletBalance, setWalletBalance] = useState(-1)
  const [betAmount, setBetAmount] = useState(0)

  const [selectedChip, setSelectedChip] = useState(10)
  const handleChipSelected = (value) => {
    setSelectedChip(value)
  }
  const [bets, setBets] = useState({})
  const [gameResults, setGameResults] = useState([])
  const toast = useToast()

  const handleButtonClick = (numArray) => {
    console.log("numArray: ", numArray)
    console.log("selectedChip: ", selectedChip)
    const newBets = { ...bets }
    numArray.forEach((num) => {
      newBets[num] = (newBets[num] || 0) + selectedChip
      setBetAmount((prev) => prev + selectedChip)
    })
    setBets(newBets)
  }
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
            <>
              <UserIcon />
            </>
          ) : (
            <>
              <WalletIcon />
            </>
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

  const flipBet = async () => {
    const _connected = await connectWallet()
    if (_connected.success === false) {
      return
    }

    try {
      const _betAmount = multiplyByPower(betAmount)
      console.log("_betAmount", _betAmount)
      console.log("bets", bets)
      return
      const messageId = await message({
        process: GAME_PROCESS_ID,
        tags: [
          {
            name: "Action",
            value: "Bet",
          },
          {
            name: "Quantity",
            value: _betAmount.toString(),
          },
          {
            name: "Bets",
            value: JSON.stringify({ result: true, count: 42, 1: 1, 2: 2 }),
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
    } catch (e) {
      console.error("flipBet() error!", e)
    } finally {
      // await fetchUserBalance()
    }
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
                              toast({
                                title: "This feature is not available yet",
                                duration: 1000,
                                isClosable: true,
                                position: "top",
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
                            bg="#283e4b"
                            color="gray.200"
                            fontSize={12}
                            _hover={{ bg: "#4A6B72" }}
                            onClick={() => {
                              toast({
                                title: "This feature is not available yet",
                                duration: 1000,
                                isClosable: true,
                                position: "top",
                              })
                            }}
                          >
                            2x
                          </Button>
                        </Flex>
                      </Flex>
                    </Flex>
                  </Flex>
                  <Button
                    bg="#00e700"
                    paddingY={8}
                    _hover={{}}
                    onClick={flipBet}
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
                      {gameResults.map((item, index) => (
                        <>
                          <Flex>
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
                        <Text>WIP</Text>
                      </Flex>
                    </Flex>

                    {/* Bottom */}
                    <Flex
                      padding={4}
                      gap={4}
                      w="100%"
                      flexDirection="column"
                      borderRadius="md"
                    >
                      {/* <RouletteBoard /> */}
                      <Flex flexDirection="column" gap={1}>
                        <Flex flexDirection={["column", "row"]} gap={1}>
                          <Flex flexDirection={["row", "column"]} gap={1}>
                            <RouletteButton
                              {...getColorStyles(0)}
                              flex="1"
                              initialChildren="0"
                              clickedChildren={<ChipIcon text={bets[0]} />}
                              resetClicked={!bets[0]}
                              onClick={() => handleButtonClick([0])}
                            ></RouletteButton>
                          </Flex>

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
                                  clickedChildren={
                                    <ChipIcon text={bets[number]} />
                                  }
                                  resetClicked={!bets[number]}
                                  onClick={() => handleButtonClick([number])}
                                  paddingY={[0, 4]}
                                ></RouletteButton>
                              ))}
                            </Flex>
                          ))}

                          <Flex
                            flexDirection={["row", "column"]}
                            gap={1}
                            flex="1"
                          >
                            <RouletteButton
                              flex="1"
                              initialChildren="2:1"
                              resetClicked={
                                ![
                                  bets[1],
                                  bets[4],
                                  bets[7],
                                  bets[10],
                                  bets[13],
                                  bets[16],
                                  bets[19],
                                  bets[22],
                                  bets[25],
                                  bets[28],
                                  bets[31],
                                  bets[34],
                                ].some(Boolean)
                              }
                              clickedChildren={
                                <ChipIcon
                                  text={[
                                    bets[1],
                                    bets[4],
                                    bets[7],
                                    bets[10],
                                    bets[13],
                                    bets[16],
                                    bets[19],
                                    bets[22],
                                    bets[25],
                                    bets[28],
                                    bets[31],
                                    bets[34],
                                  ]
                                    .reduce((acc, curr) => acc + curr, 0)
                                    .toString()}
                                />
                              }
                              onClick={() =>
                                handleButtonClick([
                                  1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34,
                                ])
                              }
                            />

                            <RouletteButton
                              flex="1"
                              initialChildren="2:1"
                              clickedChildren={
                                <ChipIcon
                                  text={[
                                    bets[2],
                                    bets[5],
                                    bets[8],
                                    bets[11],
                                    bets[14],
                                    bets[17],
                                    bets[20],
                                    bets[23],
                                    bets[26],
                                    bets[29],
                                    bets[32],
                                    bets[35],
                                  ]
                                    .reduce((acc, curr) => acc + curr, 0)
                                    .toString()}
                                />
                              }
                              resetClicked={
                                ![
                                  bets[2],
                                  bets[5],
                                  bets[8],
                                  bets[11],
                                  bets[14],
                                  bets[17],
                                  bets[20],
                                  bets[23],
                                  bets[26],
                                  bets[29],
                                  bets[32],
                                  bets[35],
                                ].some(Boolean)
                              }
                              onClick={() =>
                                handleButtonClick([
                                  2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35,
                                ])
                              }
                            ></RouletteButton>
                            <RouletteButton
                              flex="1"
                              initialChildren="2:1"
                              resetClicked={
                                ![
                                  bets[3],
                                  bets[6],
                                  bets[9],
                                  bets[12],
                                  bets[15],
                                  bets[18],
                                  bets[21],
                                  bets[24],
                                  bets[27],
                                  bets[30],
                                  bets[33],
                                  bets[36],
                                ].some(Boolean)
                              }
                              clickedChildren={
                                <ChipIcon
                                  text={[
                                    bets[3],
                                    bets[6],
                                    bets[9],
                                    bets[12],
                                    bets[15],
                                    bets[18],
                                    bets[21],
                                    bets[24],
                                    bets[27],
                                    bets[30],
                                    bets[33],
                                    bets[36],
                                  ]
                                    .reduce((acc, curr) => acc + curr, 0)
                                    .toString()}
                                />
                              }
                              onClick={() =>
                                handleButtonClick([
                                  3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36,
                                ])
                              }
                            ></RouletteButton>
                          </Flex>
                        </Flex>

                        <Flex
                          flexDirection={["row", "column"]}
                          gap={1}
                          paddingX={[0, 28]}
                        >
                          <Flex flexDirection={["column", "row"]} gap={1}>
                            <RouletteButton
                              initialChildren="1 to 12"
                              resetClicked={
                                ![
                                  bets[1],
                                  bets[2],
                                  bets[3],
                                  bets[4],
                                  bets[5],
                                  bets[6],
                                  bets[7],
                                  bets[8],
                                  bets[9],
                                  bets[10],
                                  bets[11],
                                  bets[12],
                                ].some(Boolean)
                              }
                              clickedChildren={
                                <ChipIcon
                                  text={[
                                    bets[1],
                                    bets[2],
                                    bets[3],
                                    bets[4],
                                    bets[5],
                                    bets[6],
                                    bets[7],
                                    bets[8],
                                    bets[9],
                                    bets[10],
                                    bets[11],
                                    bets[12],
                                  ]
                                    .reduce((acc, curr) => acc + curr, 0)
                                    .toString()}
                                />
                              }
                              onClick={() =>
                                handleButtonClick(getNumberRange(1, 12))
                              }
                            >
                              1 to 12
                            </RouletteButton>
                            <RouletteButton
                              initialChildren="13 to 24"
                              resetClicked={
                                ![
                                  bets[13],
                                  bets[14],
                                  bets[15],
                                  bets[16],
                                  bets[17],
                                  bets[18],
                                  bets[19],
                                  bets[20],
                                  bets[21],
                                  bets[22],
                                  bets[23],
                                  bets[24],
                                ].some(Boolean)
                              }
                              clickedChildren={
                                <ChipIcon
                                  text={[
                                    bets[13],
                                    bets[14],
                                    bets[15],
                                    bets[16],
                                    bets[17],
                                    bets[18],
                                    bets[19],
                                    bets[20],
                                    bets[21],
                                    bets[22],
                                    bets[23],
                                    bets[24],
                                  ]
                                    .reduce((acc, curr) => acc + curr, 0)
                                    .toString()}
                                />
                              }
                              onClick={() =>
                                handleButtonClick(getNumberRange(13, 24))
                              }
                            ></RouletteButton>
                            <RouletteButton
                              initialChildren="25 to 36"
                              resetClicked={
                                ![
                                  bets[25],
                                  bets[26],
                                  bets[27],
                                  bets[28],
                                  bets[29],
                                  bets[30],
                                  bets[31],
                                  bets[32],
                                  bets[33],
                                  bets[34],
                                  bets[35],
                                  bets[36],
                                ].some(Boolean)
                              }
                              clickedChildren={
                                <ChipIcon
                                  text={[
                                    bets[25],
                                    bets[26],
                                    bets[27],
                                    bets[28],
                                    bets[29],
                                    bets[30],
                                    bets[31],
                                    bets[32],
                                    bets[33],
                                    bets[34],
                                    bets[35],
                                    bets[36],
                                  ]
                                    .reduce((acc, curr) => acc + curr, 0)
                                    .toString()}
                                />
                              }
                              onClick={() =>
                                handleButtonClick(getNumberRange(25, 36))
                              }
                            ></RouletteButton>
                          </Flex>

                          <Flex flexDirection={["column", "row"]} gap={1}>
                            <RouletteButton
                              initialChildren="1 to 18"
                              resetClicked={
                                ![
                                  bets[1],
                                  bets[2],
                                  bets[3],
                                  bets[4],
                                  bets[5],
                                  bets[6],
                                  bets[7],
                                  bets[8],
                                  bets[9],
                                  bets[10],
                                  bets[11],
                                  bets[12],
                                  bets[13],
                                  bets[14],
                                  bets[15],
                                  bets[16],
                                  bets[17],
                                  bets[18],
                                ].some(Boolean)
                              }
                              clickedChildren={
                                <ChipIcon
                                  text={[
                                    bets[1],
                                    bets[2],
                                    bets[3],
                                    bets[4],
                                    bets[5],
                                    bets[6],
                                    bets[7],
                                    bets[8],
                                    bets[9],
                                    bets[10],
                                    bets[11],
                                    bets[12],
                                    bets[13],
                                    bets[14],
                                    bets[15],
                                    bets[16],
                                    bets[17],
                                    bets[18],
                                  ]
                                    .reduce((acc, curr) => acc + curr, 0)
                                    .toString()}
                                />
                              }
                              onClick={() =>
                                handleButtonClick(getNumberRange(1, 18))
                              }
                            ></RouletteButton>
                            <RouletteButton
                              initialChildren="Even"
                              resetClicked={
                                ![
                                  bets[2],
                                  bets[4],
                                  bets[6],
                                  bets[8],
                                  bets[10],
                                  bets[12],
                                  bets[14],
                                  bets[16],
                                  bets[18],
                                  bets[20],
                                  bets[22],
                                  bets[24],
                                  bets[26],
                                  bets[28],
                                  bets[30],
                                  bets[32],
                                  bets[34],
                                  bets[36],
                                ].some(Boolean)
                              }
                              clickedChildren={
                                <ChipIcon
                                  text={[
                                    bets[2],
                                    bets[4],
                                    bets[6],
                                    bets[8],
                                    bets[10],
                                    bets[12],
                                    bets[14],
                                    bets[16],
                                    bets[18],
                                    bets[20],
                                    bets[22],
                                    bets[24],
                                    bets[26],
                                    bets[28],
                                    bets[30],
                                    bets[32],
                                    bets[34],
                                    bets[36],
                                  ]
                                    .reduce((acc, curr) => acc + curr, 0)
                                    .toString()}
                                />
                              }
                              onClick={() =>
                                handleButtonClick([
                                  2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24,
                                  26, 28, 30, 32, 34, 36,
                                ])
                              }
                            ></RouletteButton>
                            <RouletteButton
                              {...getColorStyles(redNumbers[0])}
                              initialChildren="Red"
                              resetClicked={
                                ![
                                  bets[1],
                                  bets[3],
                                  bets[5],
                                  bets[7],
                                  bets[9],
                                  bets[12],
                                  bets[14],
                                  bets[16],
                                  bets[18],
                                  bets[19],
                                  bets[21],
                                  bets[23],
                                  bets[25],
                                  bets[27],
                                  bets[30],
                                  bets[32],
                                  bets[34],
                                  bets[36],
                                ].some(Boolean)
                              }
                              clickedChildren={
                                <ChipIcon
                                  text={[
                                    bets[1],
                                    bets[3],
                                    bets[5],
                                    bets[7],
                                    bets[9],
                                    bets[12],
                                    bets[14],
                                    bets[16],
                                    bets[18],
                                    bets[19],
                                    bets[21],
                                    bets[23],
                                    bets[25],
                                    bets[27],
                                    bets[30],
                                    bets[32],
                                    bets[34],
                                    bets[36],
                                  ]
                                    .reduce((acc, curr) => acc + curr, 0)
                                    .toString()}
                                />
                              }
                              onClick={() => handleButtonClick(redNumbers)}
                            ></RouletteButton>
                            <RouletteButton
                              {...getColorStyles(2)}
                              initialChildren="Black"
                              resetClicked={
                                ![
                                  bets[2],
                                  bets[4],
                                  bets[6],
                                  bets[8],
                                  bets[10],
                                  bets[11],
                                  bets[13],
                                  bets[15],
                                  bets[17],
                                  bets[20],
                                  bets[22],
                                  bets[24],
                                  bets[26],
                                  bets[28],
                                  bets[29],
                                  bets[31],
                                  bets[33],
                                  bets[35],
                                ].some(Boolean)
                              }
                              clickedChildren={
                                <ChipIcon
                                  text={[
                                    bets[2],
                                    bets[4],
                                    bets[6],
                                    bets[8],
                                    bets[10],
                                    bets[11],
                                    bets[13],
                                    bets[15],
                                    bets[17],
                                    bets[20],
                                    bets[22],
                                    bets[24],
                                    bets[26],
                                    bets[28],
                                    bets[29],
                                    bets[31],
                                    bets[33],
                                    bets[35],
                                  ]
                                    .reduce((acc, curr) => acc + curr, 0)
                                    .toString()}
                                />
                              }
                              onClick={() => handleButtonClick(blackNumbers)}
                            ></RouletteButton>
                            <RouletteButton
                              initialChildren="Odd"
                              resetClicked={
                                ![
                                  bets[1],
                                  bets[3],
                                  bets[5],
                                  bets[7],
                                  bets[9],
                                  bets[11],
                                  bets[13],
                                  bets[15],
                                  bets[17],
                                  bets[19],
                                  bets[21],
                                  bets[23],
                                  bets[25],
                                  bets[27],
                                  bets[29],
                                  bets[31],
                                  bets[33],
                                  bets[35],
                                ].some(Boolean)
                              }
                              clickedChildren={
                                <ChipIcon
                                  text={[
                                    bets[1],
                                    bets[3],
                                    bets[5],
                                    bets[7],
                                    bets[9],
                                    bets[11],
                                    bets[13],
                                    bets[15],
                                    bets[17],
                                    bets[19],
                                    bets[21],
                                    bets[23],
                                    bets[25],
                                    bets[27],
                                    bets[29],
                                    bets[31],
                                    bets[33],
                                    bets[35],
                                  ]
                                    .reduce((acc, curr) => acc + curr, 0)
                                    .toString()}
                                />
                              }
                              onClick={() =>
                                handleButtonClick([
                                  1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25,
                                  27, 29, 31, 33, 35,
                                ])
                              }
                            ></RouletteButton>
                            <RouletteButton
                              initialChildren="19 to 36"
                              resetClicked={
                                ![
                                  bets[19],
                                  bets[20],
                                  bets[21],
                                  bets[22],
                                  bets[23],
                                  bets[24],
                                  bets[25],
                                  bets[26],
                                  bets[27],
                                  bets[28],
                                  bets[29],
                                  bets[30],
                                  bets[31],
                                  bets[32],
                                  bets[33],
                                  bets[34],
                                  bets[35],
                                  bets[36],
                                ].some(Boolean)
                              }
                              clickedChildren={
                                <ChipIcon
                                  text={[
                                    bets[19],
                                    bets[20],
                                    bets[21],
                                    bets[22],
                                    bets[23],
                                    bets[24],
                                    bets[25],
                                    bets[26],
                                    bets[27],
                                    bets[28],
                                    bets[29],
                                    bets[30],
                                    bets[31],
                                    bets[32],
                                    bets[33],
                                    bets[34],
                                    bets[35],
                                    bets[36],
                                  ]
                                    .reduce((acc, curr) => acc + curr, 0)
                                    .toString()}
                                />
                              }
                              onClick={() =>
                                handleButtonClick(getNumberRange(19, 36))
                              }
                            ></RouletteButton>
                          </Flex>
                        </Flex>
                      </Flex>

                      {/* Undo / Clear */}
                      <Flex justifyContent="space-between" alignItems="center">
                        <Button
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
                        </Button>
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
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
