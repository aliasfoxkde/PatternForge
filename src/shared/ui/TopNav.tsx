import { useCallback } from "react";
import { NavLink } from "react-router-dom";
import {
	Palette,
	Image,
	BarChart3,
	Settings,
	Menu,
	Sun,
	Moon,
	Monitor,
	Scissors,
	HelpCircle,
	Info,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useSettingsStore } from "@/shared/stores/settings-store";
import {
	MobileMenu,
	useMobileMenuToggle,
} from "./MobileMenu";

const NAV_LINKS = [
	{ to: "/editor", label: "Editor", icon: Palette },
	{ to: "/gallery", label: "Gallery", icon: Image },
	{ to: "/calculators", label: "Calculators", icon: BarChart3 },
	{ to: "/yarn", label: "Threads", icon: Scissors },
	{ to: "/stitches", label: "Stitches", icon: Scissors },
	{ to: "/help", label: "Help", icon: HelpCircle },
	{ to: "/settings", label: "Settings", icon: Settings },
	{ to: "/about", label: "About", icon: Info },
] as const;

export function TopNav() {
	const theme = useSettingsStore((s) => s.theme);
	const setTheme = useSettingsStore((s) => s.setTheme);
	const toggleMobile = useMobileMenuToggle();

	const cycleTheme = useCallback(() => {
		if (theme === "light") setTheme("dark");
		else if (theme === "dark") setTheme("system");
		else setTheme("light");
	}, [theme, setTheme]);

	const ThemeIcon =
		theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

	return (
		<>
			<MobileMenu />
			<header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-border bg-surface px-4">
				{/* Logo / brand */}
				<NavLink
					to="/"
					className="flex items-center gap-2 text-sm font-bold text-craft-700 dark:text-craft-300"
				>
					<Palette className="h-5 w-5" />
					<span className="hidden sm:inline">PatternForge</span>
				</NavLink>

				{/* Desktop nav links */}
				<nav className="hidden items-center gap-1 md:flex">
					{NAV_LINKS.map(({ to, label }) => (
						<NavLink
							key={to}
							to={to}
							className={({ isActive }) =>
								cn(
									"rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
									isActive
										? "bg-craft-100 text-craft-700 dark:bg-craft-900/30 dark:text-craft-300"
										: "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary",
								)
							}
						>
							{label}
						</NavLink>
					))}
				</nav>

				{/* Right: theme toggle + hamburger */}
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={cycleTheme}
						className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
						title={`Theme: ${theme}`}
					>
						<ThemeIcon className="h-4.5 w-4.5" />
					</button>
					<button
						type="button"
						onClick={toggleMobile}
						className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary md:hidden"
						aria-label="Open menu"
					>
						<Menu className="h-5 w-5" />
					</button>
				</div>
			</header>
		</>
	);
}
