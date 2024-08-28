import React from "react"

const ChipSvg = ({ text }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width="40"
      height="40"
    >
      <circle cx="50" cy="50" r="45" fill="#adb5bd" />
      <circle cx="50" cy="50" r="40" fill="#b7a34e" />
      <text
        x="50%"
        y="50%"
        textAnchor="middle" // Use camelCase for JSX properties
        fill="#000"
        fontSize="30" // Use camelCase for JSX properties
        fontFamily="Arial, sans-serif" // Use camelCase for JSX properties
        dy=".3em"
      >
        {text}
      </text>
      <g fill="#adb5bd">
        <rect x="10" y="47.5" width="10" height="5" />
        <rect x="80" y="47.5" width="10" height="5" />
        <rect x="47.5" y="10" width="5" height="10" />
        <rect x="47.5" y="80" width="5" height="10" />
        <rect
          x="20"
          y="20"
          width="10"
          height="5"
          transform="rotate(-45 25 22.5)"
        />
        <rect
          x="70"
          y="70"
          width="10"
          height="5"
          transform="rotate(-45 75 72.5)"
        />
        <rect
          x="70"
          y="20"
          width="10"
          height="5"
          transform="rotate(45 75 22.5)"
        />
        <rect
          x="20"
          y="70"
          width="10"
          height="5"
          transform="rotate(45 25 72.5)"
        />
      </g>
    </svg>
  )
}

export default ChipSvg
