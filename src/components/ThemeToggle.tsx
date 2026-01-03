import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const getCurrentIcon = () => {
    if (theme === "system") return Monitor;
    if (resolvedTheme === "dark") return Moon;
    return Sun;
  };

  const CurrentIcon = getCurrentIcon();

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="h-9 w-9 border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent/50 transition-all duration-200"
        >
          <CurrentIcon className="h-4 w-4 text-foreground/80" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {themes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem 
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              theme === value && "bg-accent"
            )}
          >
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </span>
            {theme === value && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
