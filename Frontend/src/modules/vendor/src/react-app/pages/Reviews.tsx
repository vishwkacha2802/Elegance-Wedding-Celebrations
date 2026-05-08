import RecentReviews from "@vendor/react-app/components/dashboard/RecentReviews";

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-2xl font-display font-semibold text-foreground">Customer Reviews</h1>
        <p className="mt-1 text-muted-foreground">
          Read all feedback shared by couples across your services.
        </p>
      </div>

      <RecentReviews />
    </div>
  );
}
