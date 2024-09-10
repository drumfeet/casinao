import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.jsx"
import "./index.css"
import { ChakraProvider } from "@chakra-ui/react"
import { AppContextProvider } from "./AppContext.jsx"
import { createHashRouter, RouterProvider } from "react-router-dom"
import Roulette from "./pages/Roulette.jsx"

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/roulette",
    element: <Roulette />,
  },
])

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ChakraProvider>
      <AppContextProvider>
        <RouterProvider router={router} />
      </AppContextProvider>
    </ChakraProvider>
  </StrictMode>
)
