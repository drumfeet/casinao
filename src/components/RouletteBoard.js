import { Flex, Button } from "@chakra-ui/react"
import React from "react"

const redNumbers = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]

const blackNumbers = [
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
]

const getColorStyles = (number) => {
  if (number === 0) return { bg: "green.500", borderColor: "green.500" }
  if (redNumbers.includes(number))
    return { bg: "red.500", borderColor: "red.500" }
  if (blackNumbers.includes(number))
    return { bg: "#304553", borderColor: "#304553" }
  return { bg: "#304553", borderColor: "#304553" }
}

const getNumberRange = (start, end) => {
  const range = []
  for (let i = start; i <= end; i++) {
    range.push(i)
  }
  return range
}

const RouletteButton = ({
  children,
  color,
  borderColor,
  bg,
  onClick,
  ...props
}) => (
  <Button
    variant="outline"
    color={color || "white"}
    borderColor={borderColor || "#304553"}
    bg={bg || "transparent"}
    flex={["auto", "1"]}
    borderRadius="0"
    _hover={{
      filter: bg ? "brightness(.5)" : "invert(20%)",
    }}
    onClick={onClick}
    {...props}
  >
    {children}
  </Button>
)

const RouletteBoard = () => {
  const numberGroups = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [10, 11, 12],
    [13, 14, 15],
    [16, 17, 18],
    [19, 20, 21],
    [22, 23, 24],
    [25, 26, 27],
    [28, 29, 30],
    [31, 32, 33],
    [34, 35, 36],
  ]

  const handleButtonClick = (value) => {
    console.log("clicked: ", value)
  }

  return (
    <Flex flexDirection="column" gap={1}>
      <Flex flexDirection={["column", "row"]} gap={1}>
        <Flex flexDirection={["row", "column"]} gap={1}>
          <RouletteButton
            {...getColorStyles(0)}
            flex="1"
            onClick={() => handleButtonClick([0])}
          >
            0
          </RouletteButton>
        </Flex>

        {numberGroups.map((group, idx) => (
          <Flex key={idx} flexDirection={["row", "column"]} gap={1} flex="1">
            {group.map((number) => (
              <RouletteButton
                key={number}
                {...getColorStyles(number)}
                flex="1"
                onClick={() => handleButtonClick([number])}
                paddingY={[0, 4]}
              >
                {number}
              </RouletteButton>
            ))}
          </Flex>
        ))}

        <Flex flexDirection={["row", "column"]} gap={1} flex="1">
          <RouletteButton
            flex="1"
            onClick={() =>
              handleButtonClick([3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36])
            }
          >
            2:1
          </RouletteButton>
          <RouletteButton
            flex="1"
            onClick={() =>
              handleButtonClick([2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35])
            }
          >
            2:1
          </RouletteButton>
          <RouletteButton
            flex="1"
            onClick={() =>
              handleButtonClick([1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34])
            }
          >
            2:1
          </RouletteButton>
        </Flex>
      </Flex>

      <Flex flexDirection={["row", "column"]} gap={1} paddingX={[0, 28]}>
        <Flex flexDirection={["column", "row"]} gap={1}>
          <RouletteButton
            onClick={() => handleButtonClick(getNumberRange(1, 12))}
          >
            1 to 12
          </RouletteButton>
          <RouletteButton
            onClick={() => handleButtonClick(getNumberRange(13, 24))}
          >
            13 to 24
          </RouletteButton>
          <RouletteButton
            onClick={() => handleButtonClick(getNumberRange(25, 36))}
          >
            25 to 36
          </RouletteButton>
        </Flex>

        <Flex flexDirection={["column", "row"]} gap={1}>
          <RouletteButton
            onClick={() => handleButtonClick(getNumberRange(1, 18))}
          >
            1 to 18
          </RouletteButton>
          <RouletteButton
            onClick={() =>
              handleButtonClick([
                2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34,
                36,
              ])
            }
          >
            Even
          </RouletteButton>
          <RouletteButton
            {...getColorStyles(redNumbers[0])}
            onClick={() => handleButtonClick(redNumbers)}
          ></RouletteButton>
          <RouletteButton
            {...getColorStyles(2)}
            onClick={() => handleButtonClick(blackNumbers)}
          ></RouletteButton>
          <RouletteButton
            onClick={() =>
              handleButtonClick([
                1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33,
                35,
              ])
            }
          >
            Odd
          </RouletteButton>
          <RouletteButton
            onClick={() => handleButtonClick(getNumberRange(19, 36))}
          >
            19 to 36
          </RouletteButton>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default RouletteBoard
