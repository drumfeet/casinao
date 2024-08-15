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
  Link,
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
  const [sliderValue, setSliderValue] = useState(50)
  const [betAmount, setBetAmount] = useState(1)
  const [winChance, setWinChance] = useState(50)
  const [rollOver, setRollOver] = useState(100 - winChance)
  const [multiplier, setMultiplier] = useState(2)
  const [profitOnWin, setProfitOnWin] = useState(1)
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
        <Flex
          _hover={{ cursor: "pointer" }}
          // bg="#0e212e"
          // paddingY={2}
          // paddingX={4}
          // borderRadius="md"
          onClick={onOpen}
        >
          {walletBalance >= 0 || gameBalance >= 0 ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-user-square-rounded"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="#E2E8F0"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 13a3 3 0 1 0 0 -6a3 3 0 0 0 0 6z" />
                <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9 -9 9s-9 -1.8 -9 -9s1.8 -9 9 -9z" />
                <path d="M6 20.05v-.05a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v.05" />
              </svg>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-wallet"
                width="28"
                height="28"
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

        const errorTag = _result.Messages[0].Tags.find(
          (tag) => tag.name === "Error"
        )
        console.log("errorTag", errorTag)
        if (errorTag) {
          const errorStatus = errorTag.value ? "error" : "success"
          toast({
            description: `${_result.Messages[0].Data}`,
            status: errorStatus,
            duration: 2000,
            isClosable: true,
            position: "top",
          })
        } else {
          // Error tag is not found
          toast({
            description: "Withdrawal successful",
            status: "success",
            duration: 2000,
            isClosable: true,
            position: "top",
          })
        }
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

  const handleChange = (v) => {
    setSliderValue(v)
    const _winChance = getWinChance(v)
    setWinChance(_winChance)
    setRollOver((100 - _winChance).toFixed(2))
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

  const requestAirdrop = async () => {
    const _connected = await connectWallet()
    if (_connected.success === false) {
      return
    }

    try {
      const messageId = await message({
        process: GAME_PROCESS_ID,
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
          return true // Exit the find loop after finding the Valid tag
        }
      })
    } catch (e) {
      console.error("requestAirdrop() error!", e)
    } finally {
      await fetchUserBalance()
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
      console.log("sliderValue", sliderValue)
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
      setRandomValue(jsonObj.RandomValue)
    } catch (e) {
      console.error("flipBet() error!", e)
    } finally {
      await fetchUserBalance()
    }
  }

  const casinoItems = [
    { text: "Dice", icon: <LinkIcon />, link: "/" },
    { text: "Roulette", icon: <LinkIcon />, link: "" },
  ]

  const cryptoItems = [
    { text: "Points Swap", icon: <LinkIcon /> },
    { text: "Prediction Game", icon: <LinkIcon />, link: "" },
    { text: "1000x Leverage", icon: <LinkIcon />, link: "" },
  ]

  const GameMenuItem = ({ icon, text, link }) => (
    <Flex alignItems="center">
      <Button
        leftIcon={icon}
        variant="ghost"
        _hover={{}}
        color="gray.200"
        fontWeight="normal"
        onClick={
          link
            ? () => {}
            : () =>
                toast({
                  title: "This feature is not available yet",
                  duration: 1000,
                  isClosable: true,
                  position: "top",
                })
        }
      >
        {link ? (
          <>
            <Link href={link}>{text}</Link>
          </>
        ) : (
          <>
            <Link>{text}</Link>
          </>
        )}
      </Button>
    </Flex>
  )

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
          <Flex
            minW="288px"
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
              <Button
                w={"100%"}
                paddingX={8}
                bg="#1a2c38"
                color="gray.200"
                _hover={{}}
                onClick={requestAirdrop}
              >
                <Flex gap={4}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="icon icon-tabler icon-tabler-parachute"
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
                    <path d="M22 12a10 10 0 1 0 -20 0" />
                    <path d="M22 12c0 -1.66 -1.46 -3 -3.25 -3c-1.8 0 -3.25 1.34 -3.25 3c0 -1.66 -1.57 -3 -3.5 -3s-3.5 1.34 -3.5 3c0 -1.66 -1.46 -3 -3.25 -3c-1.8 0 -3.25 1.34 -3.25 3" />
                    <path d="M2 12l10 10l-3.5 -10" />
                    <path d="M15.5 12l-3.5 10l10 -10" />
                  </svg>
                  <Text>Airdrop</Text>
                </Flex>
              </Button>
            </Flex>

            {/* Casino Games */}
            <Flex padding={4} flexDirection="column">
              <Flex
                backgroundColor="#1a2c38"
                borderRadius="md"
                flexDirection="column"
                gap={2}
                padding={4}
                color="gray.200"
              >
                <Text fontWeight="bold">Casino</Text>
                <Divider />
                {casinoItems.map((item, index) => (
                  <GameMenuItem
                    key={index}
                    icon={item.icon}
                    text={item.text}
                    link={item.link}
                  />
                ))}
              </Flex>
            </Flex>

            {/* Crypto Games */}
            <Flex padding={4} flexDirection="column">
              <Flex
                backgroundColor="#1a2c38"
                borderRadius="md"
                flexDirection="column"
                gap={2}
                padding={4}
                color="gray.200"
              >
                <Text fontWeight="bold">Crypto</Text>
                <Divider />
                {cryptoItems.map((item, index) => (
                  <GameMenuItem
                    key={index}
                    icon={item.icon}
                    text={item.text}
                    link={item.link}
                  />
                ))}
              </Flex>
            </Flex>

            {/* Socials */}
            <Flex padding={4} alignItems="center">
              <Flex w="100%" backgroundColor="#1a2c38" borderRadius="md">
                <Button
                  variant="ghost"
                  _hover={{}}
                  // paddingX={4}
                  onClick={() => {
                    toast({
                      title: "This feature is not available yet",
                      duration: 1000,
                      isClosable: true,
                      position: "top",
                    })
                  }}
                >
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
                </Button>
                <Button
                  variant="ghost"
                  _hover={{}}
                  onClick={() => {
                    toast({
                      title: "This feature is not available yet",
                      duration: 1000,
                      isClosable: true,
                      position: "top",
                    })
                  }}
                >
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
                </Button>
              </Flex>
            </Flex>

            <Flex paddingX={8} alignItems="center">
              <Text color="gray.200" fontSize="xs">
                Flip it till you make it
              </Text>
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
                      onClick={() => {
                        toast({
                          title: "This feature is not available yet",
                          duration: 1000,
                          isClosable: true,
                          position: "top",
                        })
                      }}
                    >
                      Manual
                    </Button>
                    <Button
                      borderRadius="3xl"
                      px={8}
                      variant="link"
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
                    <Text>Bet Amount</Text>
                    <NumberInput
                      step={1}
                      defaultValue={betAmount}
                      min={1}
                      onChange={(e) => {
                        setBetAmount(e)
                      }}
                    >
                      <NumberInputField bg="#0e212e" borderColor="#0e212e" />
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
                  </Flex>

                  <Flex flexDirection="column">
                    <Text>Profit on Win</Text>
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
                        <Slider
                          flex="1"
                          focusThumbOnChange={false}
                          value={sliderValue}
                          onChange={handleChange}
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
                            <SliderMark value={randomValue} marginTop="-58px">
                              <Flex flexDirection="column" alignItems="center">
                                {randomValue}
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  class="icon icon-tabler icon-tabler-arrow-big-down"
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  stroke-width="1.5"
                                  stroke="#E2E8F0"
                                  fill="none"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                >
                                  <path
                                    stroke="none"
                                    d="M0 0h24v24H0z"
                                    fill="none"
                                  />
                                  <path d="M15 4v8h3.586a1 1 0 0 1 .707 1.707l-6.586 6.586a1 1 0 0 1 -1.414 0l-6.586 -6.586a1 1 0 0 1 .707 -1.707h3.586v-8a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1z" />
                                </svg>
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
