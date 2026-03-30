import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
}

interface ToastState {
	toasts: Toast[];
	addToast: (type: ToastType, message: string) => void;
	removeToast: (id: string) => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastState>((set) => ({
	toasts: [],
	addToast: (type, message) => {
		const id = `toast-${++toastCounter}`;
		set((s) => ({
			toasts: [...s.toasts, { id, type, message }],
		}));
		// Auto-dismiss after 4s
		setTimeout(() => {
			set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
		}, 4000);
	},
	removeToast: (id) => {
		set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
	},
}));

/** Convenience hook alias */
export function useToast() {
	const { addToast, removeToast } = useToastStore();
	return {
		addToast: (type: ToastType, message: string) => addToast(type, message),
		removeToast,
		success: (message: string) => addToast("success", message),
		error: (message: string) => addToast("error", message),
		warning: (message: string) => addToast("warning", message),
		info: (message: string) => addToast("info", message),
	};
}
