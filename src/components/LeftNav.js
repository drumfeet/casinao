import { message, createDataItemSigner, result } from "@permaweb/aoconnect"
import { Button, Divider, Flex, Text, useToast } from "@chakra-ui/react"
import Link from "next/link"
import TwitterIcon from "./icons/TwitterIcon"
import DiscordIcon from "./icons/DiscordIcon"
import AirdropIcon from "./icons/AirdropIcon"
import { LinkIcon } from "@chakra-ui/icons"
import GithubIcon from "./icons/GithubIcon"
import { useContext } from "react"
import { AppContext } from "@/context/AppContext"

const casinoItems = [
  { text: "Dice", icon: <LinkIcon />, link: "/" },
  { text: "Roulette", icon: <LinkIcon />, link: "/roulette" },
]

const cryptoItems = [
  { text: "Coming Soon", icon: <LinkIcon /> }, //Points Swap
  { text: "Coming Soon", icon: <LinkIcon />, link: "" }, //Prediction Game
  { text: "Coming Soon", icon: <LinkIcon />, link: "" }, //1000x Leverage
]

export default function LeftNav() {
  const { requestAirdrop } = useContext(AppContext)
  const toast = useToast()

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
            <Link href="#">{text}</Link>
          </>
        )}
      </Button>
    </Flex>
  )

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

  return (
    <Flex
      minW="270px"
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
          <Button
            as="a"
            href="https://github.com/drumfeet/aoflip"
            target="_blank"
            variant="ghost"
            _hover={{}}
          >
            <GithubIcon />
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
