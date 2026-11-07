"use client";

import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { CircleAlert, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/features/auth/actions";

// useSearchParams() es dato de URL: el formulario va dentro de <Suspense>.
export function LoginForm() {
  const t = useTranslations("login");
  const params = useSearchParams();

  return (
    <form action={signInWithGoogle} className="space-y-4">
      <input type="hidden" name="next" value={params.get("next") ?? "/"} />
      {params.get("error") && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm"
        >
          <CircleAlert aria-hidden className="size-4" />
          {t("error")}
        </p>
      )}
      <GoogleButton label={t("google")} />
    </form>
  );
}

export function GoogleButton({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size="lg"
      disabled={disabled || pending}
      className="bg-card w-full"
    >
      {pending ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
      {label}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
