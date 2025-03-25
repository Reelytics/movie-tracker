import { Button } from "@/components/ui/button";

export default function AuthButtons() {
  return (
    <div className="flex items-center gap-3">
      <Button 
        variant="ghost" 
        size="sm"
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
      >
        Sign In
      </Button>
      <Button 
        variant="default" 
        size="sm"
        className="px-3 py-1.5 bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
      >
        Sign Up
      </Button>
    </div>
  );
}
