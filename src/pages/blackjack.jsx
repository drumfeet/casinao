import {
  Button,
  Divider,
  Flex,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
} from "@chakra-ui/react"
import LeftNav from "../components/LeftNav"
import AppHeader from "../components/AppHeader"
import { useState } from "react"

export default function Blackjack() {
  const [betAmount, setBetAmount] = useState(1)
  return (
    <>
      <Flex minH="100vh" backgroundColor="#0e2229">
        <LeftNav />

        {/* Main Body Container */}
        <Flex
          flexDirection="column"
          flex="1" //fill available width horizontally
          gap={1}
          color="gray.200"
        >
          {/* AppHeader Container */}
          <Flex>
            <AppHeader />
          </Flex>

          {/* Main Content Container */}
          <Flex
            flex="1" //fill available height vertically
            bg="#1a2c38"
            padding={[2, 12]}
          >
            {/* Left & Right Section Container */}
            <Flex
              bg="#213743"
              borderRadius="md"
              flex="1" //fill available width horizontally
              flexDirection={["column", "row"]}
            >
              {/* Left Section */}
              <Flex padding={4} flexDirection="column" gap={4}>
                <Flex flexDirection="column">
                  <Text color="#b1bad3">Bet Amount</Text>
                  <Flex padding={1} bg="#304553" borderRadius="md" gap={2}>
                    <NumberInput
                      precision={2}
                      value={betAmount}
                      min={1}
                      onChange={(e) => {
                        setBetAmount(e)
                      }}
                    >
                      <NumberInputField
                        bg="#0e212e"
                        borderColor="#0e212e"
                        borderRadius="none"
                      />
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
                    <Button
                      w={12}
                      bg="#304553"
                      color="gray.200"
                      fontSize={12}
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
                      bg="#304553"
                      color="gray.200"
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

                <Button
                  bg="#00e700"
                  paddingY={8}
                  _hover={{}}
                  onClick={async (event) => {
                    const button = event.currentTarget
                    button.disabled = true
                    button.innerText = "Processing..."
                    try {
                    } finally {
                      button.disabled = false
                      button.innerText = "Bet"
                    }
                  }}
                >
                  Bet
                </Button>
              </Flex>

              {/* Right Section */}
              <Flex
                w="100%"
                padding={4}
                bg="#0e212e"
                marginBottom={[0, 1]}
                flexDirection="column"
              >
                {/* TODO */}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
