import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useToastStore } from "@/shared/hooks/use-toast";
import type { ToastType } from "@/shared/hooks/use-toast";

const TOAST_STYLES: Record<ToastType, { icon: typeof CheckCircle; bg: string; border: string; text: string; iconColor: string }> = {
	success: {
		icon: CheckCircle,
		bg: "bg-green-50 dark:bg-green-900/20",
		border: "border-green-200 dark:border-green-800",
		text: "text-green-800 dark:text-green-200",
		iconColor: "text-green-600 dark:text-green-400",
	},
	error: {
		icon: AlertCircle,
		bg: "bg-red-50 dark:bg-red-900/20",
		border: "border-red-200 dark:border-red-800",
		text: "text-red-800 dark:text-red-200",
		iconColor: "text-red-600 dark:text-red-400",
	},
	warning: {
		icon: AlertTriangle,
		bg: "bg-amber-50 dark:bg-amber-900/20",
		border: "border-amber-200 dark:border-amber-800",
		text: "text-amber-800 dark:text-amber-200",
		iconColor: "text-amber-600 dark:text-amber-400",
	},
	info: {
		icon: Info,
		bg: "bg-blue-50 dark:bg-blue-900/20",
		border: "border-blue-200 dark:border-blue-800",
		text: "text-blue-800 dark:text-blue-200",
		iconColor: "text-blue-600 dark:text-blue-400",
	},
};

export function ToastContainer() {
	const toasts = useToastStore((s) => s.toasts);
	const removeToast = useToastStore((s) => s.removeToast);

	if (toasts.length === 0) return null;

	return (
		<div
			className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
			role="region"
			aria-live="polite"
			aria-label="Notifications"
		>
			{toasts.map((toast) => {
				const style = TOAST_STYLES[toast.type];
				const Icon = style.icon;
				return (
					<div
						key={toast.id}
						className={cn(
							"pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all",
							style.bg,
							style.border,
							"animate-[slideIn_0.2s_ease-out]",
						)}
						role="alert"
					>
						<Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.iconColor)} />
						<p className={cn("text-sm font-medium", style.text)}>
							{toast.message}
						</p>
						<button
							type="button"
							onClick={() => removeToast(toast.id)}
							className={cn(
								"ml-2 -mr-1 shrink-0 rounded p-0.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10",
								style.iconColor,
							)}
							aria-label="Dismiss"
						>
							<X className="h-3.5 w-3.5" />
						</button>
					</div>
				);
			})}
		</div>
	);
}
