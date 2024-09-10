import { createIcon } from "@chakra-ui/react"

const GripIcon = createIcon({
  displayName: "GripIcon",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M9 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M9 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M9 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M15 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M15 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M15 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    </>
  ),
  defaultProps: {
    width: "24px",
    height: "24px",
    strokeWidth: "1.5",
    stroke: "gray.300", // Chakra UI color token
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
})

export default GripIcon
