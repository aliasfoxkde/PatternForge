import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
	Palette,
	Image,
	BarChart3,
	Settings,
	X,
	Sun,
	Moon,
	Monitor,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useSettingsStore } from "@/shared/stores/settings-store";
import { FocusTrap } from "@/shared/ui";

/* ------------------------------------------------------------------ */
/*  Context so TopNav hamburger can toggle the drawer                  */
/* ------------------------------------------------------------------ */

type ToggleFn = () => void;

const MobileMenuContext = {
	open: false,
	toggle: (() => {}) as ToggleFn,
};

export function getMobileMenuState() {
	return MobileMenuContext;
}

export function useMobileMenuToggle(): ToggleFn {
	// Consumers call this to wire their hamburger button.
	// It returns a stable reference that flips `open`.
	return MobileMenuContext.toggle;
}

/* ------------------------------------------------------------------ */
/*  Navigation links shared between mobile drawer & desktop bar        */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
	{ to: "/editor", label: "Editor", icon: Palette },
	{ to: "/gallery", label: "Gallery", icon: Image },
	{ to: "/calculators", label: "Calculators", icon: BarChart3 },
	{ to: "/settings", label: "Settings", icon: Settings },
] as const;

/* ------------------------------------------------------------------ */
/*  MobileMenu component                                               */
/* ------------------------------------------------------------------ */

export function MobileMenu() {
	const [open, setOpen] = useState(false);
	const panelRef = useRef<HTMLDivElement>(null);

	// Keep the context in sync so TopNav can toggle
	MobileMenuContext.open = open;
	MobileMenuContext.toggle = useCallback(() => setOpen((v) => !v), []);

	// Close on Escape
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		if (open) document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [open]);

	// Lock body scroll while open
	useEffect(() => {
		document.body.style.overflow = open ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	// Close on backdrop click
	const handleBackdrop = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === e.currentTarget) setOpen(false);
		},
		[],
	);

	const theme = useSettingsStore((s) => s.theme);
	const setTheme = useSettingsStore((s) => s.setTheme);

	const cycleTheme = useCallback(() => {
		if (theme === "light") setTheme("dark");
		else if (theme === "dark") setTheme("system");
		else setTheme("light");
	}, [theme, setTheme]);

	const ThemeIcon =
		theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

	return (
		<>
			{/* Backdrop */}
			{open && (
				<div
					className="fixed inset-0 z-40 bg-black/50 transition-opacity"
					onClick={handleBackdrop}
					onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
					role="presentation"
				/>
			)}

			{/* Drawer panel */}
			<FocusTrap active={open} onEscape={() => setOpen(false)}>
			<div
				ref={panelRef}
				className={cn(
					"fixed right-0 top-0 bottom-0 z-50 w-72 bg-surface shadow-xl transition-transform duration-200 ease-out",
					open ? "translate-x-0" : "translate-x-full",
				)}
				role="dialog"
				aria-modal="true"
				aria-label="Navigation menu"
			>
				{/* Drawer header */}
				<div className="flex items-center justify-between border-b border-border px-4 py-3">
					<span className="text-sm font-semibold text-text-primary">Menu</span>
					<button
						type="button"
						onClick={() => setOpen(false)}
						className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-tertiary"
						aria-label="Close menu"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Nav links */}
				<nav className="px-2 py-2">
					{NAV_LINKS.map(({ to, label, icon: Icon }) => (
						<NavLink
							key={to}
							to={to}
							onClick={() => setOpen(false)}
							className={({ isActive }) =>
								cn(
									"flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
									isActive
										? "bg-craft-100 text-craft-700 dark:bg-craft-900/30 dark:text-craft-300"
										: "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary",
								)
							}
						>
							<Icon className="h-5 w-5" />
							{label}
						</NavLink>
					))}
				</nav>

				{/* Divider + theme toggle */}
				<div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
					<button
						type="button"
						onClick={cycleTheme}
						className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
					>
						<ThemeIcon className="h-5 w-5" />
						Theme:{" "}
						{theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"}
					</button>
				</div>
			</div>
			</FocusTrap>
		</>
	);
}
