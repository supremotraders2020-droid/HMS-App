import { createContext, useContext, useEffect, useState } from "react"

type Mode = "dark" | "light" | "system"
type ColorTheme = "clinical-teal" | "sunrise-amber" | "midnight-indigo" | "rose-garden" | "forest-green"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultMode?: Mode
  defaultColorTheme?: ColorTheme
  storageKey?: string
}

type ThemeProviderState = {
  mode: Mode
  colorTheme: ColorTheme
  setMode: (mode: Mode) => void
  setColorTheme: (colorTheme: ColorTheme) => void
  isDark: boolean
}

const initialState: ThemeProviderState = {
  mode: "system",
  colorTheme: "clinical-teal",
  setMode: () => null,
  setColorTheme: () => null,
  isDark: false,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export const colorThemes: { id: ColorTheme; name: string; preview: string }[] = [
  { id: "clinical-teal", name: "Clinical Teal", preview: "from-teal-500 to-cyan-500" },
  { id: "sunrise-amber", name: "Sunrise Amber", preview: "from-amber-500 to-orange-500" },
  { id: "midnight-indigo", name: "Midnight Indigo", preview: "from-indigo-500 to-purple-500" },
  { id: "rose-garden", name: "Rose Garden", preview: "from-rose-500 to-pink-500" },
  { id: "forest-green", name: "Forest Green", preview: "from-emerald-500 to-green-500" },
]

export function ThemeProvider({
  children,
  defaultMode = "system",
  defaultColorTheme = "clinical-teal",
  storageKey = "hms-theme",
  ...props
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<Mode>(
    () => (localStorage.getItem(`${storageKey}-mode`) as Mode) || defaultMode
  )
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(
    () => (localStorage.getItem(`${storageKey}-color`) as ColorTheme) || defaultColorTheme
  )
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")
    colorThemes.forEach(t => root.removeAttribute(`data-theme`))

    let resolvedMode: "light" | "dark" = "light"
    if (mode === "system") {
      resolvedMode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    } else {
      resolvedMode = mode
    }

    root.classList.add(resolvedMode)
    root.setAttribute("data-theme", colorTheme)
    setIsDark(resolvedMode === "dark")
  }, [mode, colorTheme])

  const setMode = (newMode: Mode) => {
    localStorage.setItem(`${storageKey}-mode`, newMode)
    setModeState(newMode)
  }

  const setColorTheme = (newColorTheme: ColorTheme) => {
    localStorage.setItem(`${storageKey}-color`, newColorTheme)
    setColorThemeState(newColorTheme)
  }

  const value = {
    mode,
    colorTheme,
    setMode,
    setColorTheme,
    isDark,
    theme: mode,
    setTheme: setMode,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
