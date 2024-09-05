import { message, createDataItemSigner, result } from "@permaweb/aoconnect"
import {
  Button,
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
import WalletIcon from "./icons/WalletIcon"
import { useContext, useState } from "react"
import { AppContext } from "@/context/AppContext"
import CoinsIcon from "./icons/CoinsIcon"

const BalanceModal = () => {
  const TICKER = "FLIP"
  const TOKEN_PROCESS_ID = "XIJzo8ooZVGIsxFVhQDYW0ziJBX7Loh9Pi280ro2YU4"
  const GAME_PROCESS_ID = "PkV8-8lAbwsfGjcjNV_Qj5OK0zc7YVZ4Gx_VqiymguI"
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
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [txQuantity, setTxQuantity] = useState(1)
  const toast = useToast()

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
          toast({
            description: `${_result.Messages[0].Data}`,
            status: "error",
            duration: 2000,
            isClosable: true,
            position: "top",
          })
          return
        }
      })

      toast({
        description: "Withdraw Successful",
        status: "info",
        duration: 2000,
        isClosable: true,
        position: "top",
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
        <ModalContent bg="#1a2c38" color="gray.200">
          <ModalHeader>
            <Flex alignItems="center" gap={2}>
              <CoinsIcon />
              Account
            </Flex>
          </ModalHeader>
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
                  <NumberInputField
                    _focus={{ borderColor: "white", boxShadow: "none" }}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper color="white" />
                    <NumberDecrementStepper color="white" />
                  </NumberInputStepper>
                </NumberInput>
              </Flex>
            </Flex>
          </ModalBody>

          <ModalFooter>
            <Flex gap={4}>
              <Button
                bg="#213743"
                color="white"
                _hover={{ bg: "#213743" }}
                onClick={async (event) => {
                  const button = event.currentTarget
                  button.disabled = true
                  button.innerText = "Loading..."
                  try {
                    await depositTokens()
                  } finally {
                    button.disabled = false
                    button.innerText = "Deposit"
                  }
                }}
              >
                Deposit
              </Button>
              <Button
                variant="ghost"
                color="white"
                _hover={{}}
                onClick={async (event) => {
                  const button = event.currentTarget
                  button.disabled = true
                  button.innerText = "Loading..."
                  try {
                    await withdrawTokens()
                  } finally {
                    button.disabled = false
                    button.innerText = "Withdraw"
                  }
                }}
              >
                Withdraw
              </Button>
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default BalanceModal
