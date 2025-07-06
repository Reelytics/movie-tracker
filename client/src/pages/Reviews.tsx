import Header from "@/components/layout/Header";

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Reviews</h1>
        <p className="text-muted-foreground">
          Read and write film reviews. This page is coming soon.
        </p>
      </div>
    </div>
  );
}