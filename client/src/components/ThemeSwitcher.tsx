import { Moon, Sun, Palette, Check, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme, colorThemes } from "@/components/ThemeProvider"

export default function ThemeSwitcher() {
  const { mode, colorTheme, setMode, setColorTheme, isDark } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          data-testid="button-theme-switcher"
          className="relative glass-button"
        >
          <Palette className="h-[1.2rem] w-[1.2rem] transition-all" />
          <span className="sr-only">Theme settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 glass-panel">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          Appearance
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setMode("light")}
          className="flex items-center gap-2 cursor-pointer"
          data-testid="mode-light"
        >
          <Sun className="h-4 w-4" />
          Light
          {mode === "light" && <Check className="h-4 w-4 ml-auto text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setMode("dark")}
          className="flex items-center gap-2 cursor-pointer"
          data-testid="mode-dark"
        >
          <Moon className="h-4 w-4" />
          Dark
          {mode === "dark" && <Check className="h-4 w-4 ml-auto text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setMode("system")}
          className="flex items-center gap-2 cursor-pointer"
          data-testid="mode-system"
        >
          <Monitor className="h-4 w-4" />
          System
          {mode === "system" && <Check className="h-4 w-4 ml-auto text-primary" />}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Color Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {colorThemes.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => setColorTheme(theme.id)}
            className="flex items-center gap-3 cursor-pointer"
            data-testid={`theme-${theme.id}`}
          >
            <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${theme.preview} ring-2 ring-offset-2 ring-offset-background ${colorTheme === theme.id ? 'ring-primary' : 'ring-transparent'}`} />
            {theme.name}
            {colorTheme === theme.id && <Check className="h-4 w-4 ml-auto text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
