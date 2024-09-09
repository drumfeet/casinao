import { message, createDataItemSigner, result } from "@permaweb/aoconnect"
import { getGameBalance, getWalletBalance } from "@/lib/utils"
import { useToast } from "@chakra-ui/react"
import { createContext, useEffect, useState } from "react"

const GAME_PROCESS_ID = "PkV8-8lAbwsfGjcjNV_Qj5OK0zc7YVZ4Gx_VqiymguI"

export const AppContext = createContext()

export const AppContextProvider = ({ children }) => {
  const BASE_UNIT = 10
  const DENOMINATION = 12

  const toast = useToast()

  const [gameBalance, setGameBalance] = useState(-1)
  const [walletBalance, setWalletBalance] = useState(-1)

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
      console.error("connectWallet() error!", e)
      toast({
        description: "Something went wrong with your wallet. Please try again.",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top",
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

  return (
    <AppContext.Provider
      value={{
        multiplyByPower,
        divideByPower,
        connectWallet,
        gameBalance,
        setGameBalance,
        walletBalance,
        setWalletBalance,
        fetchUserBalance,
        requestAirdrop,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
