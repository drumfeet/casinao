import { getGameBalance, getWalletBalance } from "@/lib/utils"
import { useToast } from "@chakra-ui/react"
import { createContext, useEffect, useState } from "react"

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

  useEffect(() => {
    console.log("useEffect() gameBalance", gameBalance)
  }, [gameBalance])

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
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
