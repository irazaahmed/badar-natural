"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { inputCls } from "./ui";

/** Password field with a show/hide toggle. Same visual style as <Input>. */
export function PasswordInput({
  id,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="relative">
      <input
        {...props}
        id={inputId}
        type={visible ? "text" : "password"}
        className={`${inputCls} pr-11 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-slate-500 dark:hover:text-slate-300"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
