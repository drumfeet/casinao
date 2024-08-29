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
import { useState } from "react"
import ChipIcon from "@/components/icons/ChipIcon"
import RouletteBoard from "@/components/RouletteBoard"
import UserIcon from "@/components/icons/UserIcon"
import WalletIcon from "@/components/icons/WalletIcon"
import LeftNav from "@/components/LeftNav"

export default function Home() {
  const TOKEN_PROCESS_ID = "XIJzo8ooZVGIsxFVhQDYW0ziJBX7Loh9Pi280ro2YU4"
  const GAME_PROCESS_ID = "VcBNAf6TWi7_B5WnQa5EXEVMy214jh0ADlEGiyA2-cg"
  const BASE_UNIT = 10
  const DENOMINATION = 12
  const TICKER = "FLIP"

  const SLOPE = -0.96
  const INTERCEPT = 98

  const [gameBalance, setGameBalance] = useState(-1)
  const [walletBalance, setWalletBalance] = useState(-1)
  const [betAmount, setBetAmount] = useState(1)

  const [selectedChip, setSelectedChip] = useState(0)
  const handleChipClick = (value) => {
    setSelectedChip(value)
  }

  const [gameResults, setGameResults] = useState([])

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
                            handleChipClick(value)
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
                            bg="#283e4b"
                            color="gray.200"
                            fontSize={12}
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
                    </Flex>
                  </Flex>
                  <Button bg="#00e700" paddingY={8} _hover={{}}>
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
                        <Text>Slider was here</Text>
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
                      <RouletteBoard />

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
                            toast({
                              title: "This feature is not available yet",
                              duration: 1000,
                              isClosable: true,
                              position: "top",
                            })
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
