import ThemeToggle from '../ThemeToggle'
import { ThemeProvider } from '../ThemeProvider'

export default function ThemeToggleExample() {
  return (
    <ThemeProvider>
      <div className="p-6 space-y-4">
        <h3 className="text-lg font-medium">Theme Toggle</h3>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">Toggle theme:</span>
          <ThemeToggle />
        </div>
        <p className="text-sm text-muted-foreground">
          Try switching between light and dark modes
        </p>
      </div>
    </ThemeProvider>
  )
}