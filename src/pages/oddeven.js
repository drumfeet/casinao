import {
  dryrun,
  message,
  createDataItemSigner,
  result,
  results,
} from "@permaweb/aoconnect"
import { Button, Flex, useToast } from "@chakra-ui/react"

const WAR_PROCESS_ID = "_JZTfLS-ssyKKNn-qMb7PSifdo_1SZ14UlI_RRg-nfo" // xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10
const GAME_PROCESS_ID = "Wu7s2PCoBt1-38dgtCwiGfCtK5V1DtxHpgK1KcYxQiQ"

export default function OddEven() {
  const toast = useToast()
  const flipOdd = async () => {
    try {
      await window.arweaveWallet.connect(["ACCESS_ADDRESS", "SIGN_TRANSACTION"])
    } catch (e) {
      console.error("Wallet missing!", e)
      toast({
        description: "Install arconnect.io wallet",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
      return
    }

    try {
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
          value: "2",
        },
      ]
      console.log("_tags", _tags)

      const messageId = await message({
        process: WAR_PROCESS_ID,
        tags: _tags,
        signer: createDataItemSigner(window.arweaveWallet),
      })
      console.log("messageId", messageId)

      const _result = await result({
        message: messageId,
        process: WAR_PROCESS_ID,
      })
      console.log("_result", _result)

      const amountDebit = _result.Messages[0].Tags[8].value
      const amountCredit = _result.Messages[1].Tags[8].value

      if (Number(amountDebit) > 0 && Number(amountCredit) > 0) {
        toast({
          description: `${amountCredit} tokens were sent to the game ${GAME_PROCESS_ID}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        })

        const messageId = await message({
          process: GAME_PROCESS_ID,
          tags: [
            {
              name: "Action",
              value: "FlipOdd",
            },
            {
              name: "Quantity",
              value: amountCredit.toString(),
            },
          ],
          signer: createDataItemSigner(window.arweaveWallet),
        })
        console.log("messageId", messageId)

        const _resultFlip = await result({
          message: messageId,
          process: GAME_PROCESS_ID,
        })
        console.log("_resultFlip", _resultFlip)

        if (_resultFlip.Messages[0].Tags[6].value === true) {
          toast({
            description: `${_resultFlip.Messages[0].Data}`,
            status: "success",
            duration: 5000,
            isClosable: true,
          })
        } else {
          console.log("LOSELOSE", _resultFlip.Messages[0].Data.toString())
          toast({
            description: `${_resultFlip.Messages[0].Data}`,
            status: "error",
            duration: 5000,
            isClosable: true,
          })
        }
      } else {
        toast({
          description: `0 tokens were sent`,
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (e) {
      console.error("flipMatch() error!", e)
    }
  }

  const flipEven = async () => {
    try {
      await window.arweaveWallet.connect(["ACCESS_ADDRESS", "SIGN_TRANSACTION"])
    } catch (e) {
      console.error("Wallet missing!", e)
      toast({
        description: "Install arconnect.io wallet",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
      return
    }

    try {
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
          value: "2",
        },
      ]
      console.log("_tags", _tags)

      const messageId = await message({
        process: WAR_PROCESS_ID,
        tags: _tags,
        signer: createDataItemSigner(window.arweaveWallet),
      })
      console.log("messageId", messageId)

      const _result = await result({
        message: messageId,
        process: WAR_PROCESS_ID,
      })
      console.log("_result", _result)

      const amountDebit = _result.Messages[0].Tags[8].value
      const amountCredit = _result.Messages[1].Tags[8].value

      if (Number(amountDebit) > 0 && Number(amountCredit) > 0) {
        toast({
          description: `${amountCredit} tokens were sent to the game ${GAME_PROCESS_ID}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        })

        const messageId = await message({
          process: GAME_PROCESS_ID,
          tags: [
            {
              name: "Action",
              value: "FlipEven",
            },
            {
              name: "Quantity",
              value: amountCredit.toString(),
            },
          ],
          signer: createDataItemSigner(window.arweaveWallet),
        })
        console.log("messageId", messageId)

        const _resultFlip = await result({
          message: messageId,
          process: GAME_PROCESS_ID,
        })
        console.log("_resultFlip", _resultFlip)

        if (_resultFlip.Messages[0].Tags[6].value === true) {
          toast({
            description: `${_resultFlip.Messages[0].Data}`,
            status: "success",
            duration: 5000,
            isClosable: true,
          })
        } else {
          console.log("LOSELOSE", _resultFlip.Messages[0].Data.toString())
          toast({
            description: `${_resultFlip.Messages[0].Data}`,
            status: "error",
            duration: 5000,
            isClosable: true,
          })
        }
      } else {
        toast({
          description: `0 tokens were sent`,
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (e) {
      console.error("flipMatch() error!", e)
    }
  }
  return (
    <>
      <Flex minH="100%" direction="column" padding={20}>
        <Flex alignItems="center" flexDirection="column" gap={4}>
          <Flex gap={4}>
            <Button variant="outline" onClick={flipOdd}>
              ODD
            </Button>
            <Button variant="outline" onClick={flipEven}>
              EVEN
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
