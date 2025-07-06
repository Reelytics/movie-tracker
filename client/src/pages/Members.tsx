import Header from "@/components/layout/Header";

export default function MembersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Members</h1>
        <p className="text-muted-foreground">
          Connect with other film enthusiasts. This page is coming soon.
        </p>
      </div>
    </div>
  );
}