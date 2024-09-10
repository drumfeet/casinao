import { createIcon } from "@chakra-ui/react"

const RepeatIcon = createIcon({
  displayName: "RepeatIcon",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M4 12v-3a3 3 0 0 1 3 -3h13m-3 -3l3 3l-3 3" />
      <path d="M20 12v3a3 3 0 0 1 -3 3h-13m3 3l-3 -3l3 -3" />
    </>
  ),
  defaultProps: {
    width: "20px",
    height: "20px",
    strokeWidth: "1.5",
    stroke: "gray.300", // Chakra UI color token
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
})

export default RepeatIcon
