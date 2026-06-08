import { Leaf } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
      <Leaf aria-hidden="true" className="mb-3 h-6 w-6 text-primary" />
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
