import { message, createDataItemSigner, result } from "@permaweb/aoconnect"
import { Button, Divider, Flex, Link, Text, useToast } from "@chakra-ui/react"
import TwitterIcon from "./icons/TwitterIcon"
import DiscordIcon from "./icons/DiscordIcon"
import AirdropIcon from "./icons/AirdropIcon"
import { LinkIcon } from "@chakra-ui/icons"

const casinoItems = [
  { text: "Dice", icon: <LinkIcon />, link: "/" },
  { text: "Roulette", icon: <LinkIcon />, link: "/roulette" },
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

const GAME_PROCESS_ID = "VcBNAf6TWi7_B5WnQa5EXEVMy214jh0ADlEGiyA2-cg"

export default function LeftNav() {
  const toast = useToast()

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
    }
  }
  return (
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
            <AirdropIcon />
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
            <TwitterIcon />
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
            <DiscordIcon />
          </Button>
        </Flex>
      </Flex>

      <Flex paddingX={8} alignItems="center">
        <Text color="gray.200" fontSize="xs">
          Flip it till you make it
        </Text>
      </Flex>
    </Flex>
  )
}
