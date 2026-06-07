import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  CheckCircleIcon,
  ExclamationIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/outline";
import { setDialogBridge } from "../utils/dialog";

const VARIANT_STYLES = {
  info: {
    icon: InformationCircleIcon,
    iconWrap: "bg-indigo-100 text-indigo-600",
    confirmBtn: "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
  },
  success: {
    icon: CheckCircleIcon,
    iconWrap: "bg-emerald-100 text-emerald-600",
    confirmBtn: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500",
  },
  warning: {
    icon: ExclamationIcon,
    iconWrap: "bg-amber-100 text-amber-600",
    confirmBtn: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500",
  },
  danger: {
    icon: XCircleIcon,
    iconWrap: "bg-red-100 text-red-600",
    confirmBtn: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
  },
  error: {
    icon: XCircleIcon,
    iconWrap: "bg-red-100 text-red-600",
    confirmBtn: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
  },
};

function DialogCard({ state, onClose }) {
  const [inputValue, setInputValue] = useState(state.defaultValue || "");
  const type = state.type;
  const isConfirm = type === "confirm";
  const isPrompt = type === "prompt";
  const variant = state.variant || (isConfirm || isPrompt ? "warning" : "info");
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.info;
  const Icon = styles.icon;
  const title =
    state.title ||
    (isPrompt ? "Input required" : isConfirm ? "Please confirm" : "Notice");

  function finish(value) {
    state.resolve(value);
    onClose();
  }

  function handleConfirm() {
    if (isPrompt) finish(inputValue);
    else if (isConfirm) finish(true);
    else finish(undefined);
  }

  function handleCancel() {
    if (isConfirm || isPrompt) finish(isPrompt ? "" : false);
    else finish(undefined);
  }

  useLayoutEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") handleCancel();
      if (e.key === "Enter" && !isPrompt) handleConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={handleCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-[dialogIn_0.18s_ease-out]"
      >
        <div className="p-6">
          <div className="flex gap-4">
            <div
              className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${styles.iconWrap}`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 id="app-dialog-title" className="text-lg font-semibold text-gray-900">
                {title}
              </h2>
              {state.message && (
                <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {state.message}
                </p>
              )}
              {isPrompt && (
                <textarea
                  className="mt-3 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[88px]"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={state.placeholder || ""}
                  autoFocus
                />
              )}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          {(isConfirm || isPrompt) && (
            <button type="button" className="btn btn-outline btn-sm" onClick={handleCancel}>
              {state.cancelLabel || "Cancel"}
            </button>
          )}
          <button
            type="button"
            className={`btn btn-sm text-white border-transparent ${styles.confirmBtn}`}
            onClick={handleConfirm}
            autoFocus={!isPrompt}
          >
            {state.confirmLabel || (isConfirm ? "Confirm" : isPrompt ? "Submit" : "OK")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DialogProvider({ children }) {
  const [state, setState] = useState(null);
  const setStateRef = useRef(setState);
  setStateRef.current = setState;

  const close = useCallback(() => setState(null), []);

  useLayoutEffect(() => {
    setDialogBridge({
      alert: (opts) =>
        new Promise((resolve) => {
          setStateRef.current({
            type: "alert",
            title: opts.title,
            message: opts.message,
            variant: opts.variant || "info",
            confirmLabel: opts.confirmLabel || "OK",
            resolve: () => resolve(),
          });
        }),
      confirm: (opts) =>
        new Promise((resolve) => {
          setStateRef.current({
            type: "confirm",
            title: opts.title,
            message: opts.message,
            variant: opts.variant || "warning",
            confirmLabel: opts.confirmLabel || "Confirm",
            cancelLabel: opts.cancelLabel || "Cancel",
            resolve,
          });
        }),
      prompt: (opts) =>
        new Promise((resolve) => {
          setStateRef.current({
            type: "prompt",
            title: opts.title,
            message: opts.message,
            defaultValue: opts.defaultValue || "",
            placeholder: opts.placeholder || "",
            variant: opts.variant || "warning",
            confirmLabel: opts.confirmLabel || "Submit",
            cancelLabel: opts.cancelLabel || "Cancel",
            resolve,
          });
        }),
    });
    return () => setDialogBridge(null);
  }, []);

  return (
    <>
      {children}
      {state && <DialogCard state={state} onClose={close} />}
    </>
  );
}
