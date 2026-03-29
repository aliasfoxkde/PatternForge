/**
 * Theme hook.
 *
 * Reads the theme preference from the settings store, resolves "system"
 * to the actual OS preference, and applies a `data-theme` attribute
 * to `<html>` for CSS variable switching.
 */

import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { useSettingsStore } from "@/shared/stores/settings-store";
import { useEffect } from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

export function useTheme(): {
	theme: Theme;
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: Theme) => void;
} {
	const theme = useSettingsStore((s) => s.theme);
	const setTheme = useSettingsStore((s) => s.setTheme);

	const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

	const resolvedTheme: ResolvedTheme =
		theme === "system" ? (prefersDark ? "dark" : "light") : theme;

	// Apply data-theme attribute to <html>
	useEffect(() => {
		document.documentElement.setAttribute("data-theme", resolvedTheme);
	}, [resolvedTheme]);

	return { theme, resolvedTheme, setTheme };
}
