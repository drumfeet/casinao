import { HamburgerIcon } from "@chakra-ui/icons"
import BalanceModal from "./BalanceModal"
import LoginModal from "./LoginModal"

const { Flex, Text } = require("@chakra-ui/react")

const AppHeader = () => {
  return (
    <>
      <Flex
        flex="1" //fill the available space
        paddingY={4}
        paddingX={{ base: 2, md: 20 }}
        alignItems="center"
        bg="#1a2c38"
        boxShadow="0px 4px 0px rgba(0, 0, 0, 0.25)"
        justifyContent="space-between"
        color="gray.200"
        flexWrap="wrap"
      >
        {/* HamburgerIcon Container */}
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

        {/* Logo */}
          <Text
            color="white"
            fontSize={"2xl"}
            fontFamily={"Comic Sans MS, cursive, sans-serif"}
            fontWeight="bold"
            letterSpacing="wide"
            noOfLines={1}
          >
            CasinAO
          </Text>

        {/* BalanceModal Container */}
        <Flex>
          <BalanceModal />
        </Flex>

        {/* LoginModal Container */}
        <Flex alignItems="center" gap={2}>
          <LoginModal />
        </Flex>
      </Flex>
    </>
  )
}
export default AppHeader
