import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Campo "@usuario": minúsculas, sin autocorrección ni mayúscula inicial.
export function UsernameInput({
  invalid,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { invalid?: boolean }) {
  return (
    <div className="relative">
      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
        @
      </span>
      <Input
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={20}
        aria-invalid={invalid}
        aria-describedby={props.id && `${props.id}-message`}
        className={cn("pl-7", className)}
        {...props}
      />
    </div>
  );
}
