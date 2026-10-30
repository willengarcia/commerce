import { getCurrentCustomer } from "lib/api/customers";
import { getMyReviews } from "lib/api/reviews";
import { ReviewsPanel } from "components/reviews/reviews-panel";
import Link from "next/link";
import { redirect } from "next/navigation";
export const metadata = { title: "Minhas avaliações" };
export default async function MyReviewsPage() {
  if (!(await getCurrentCustomer())) redirect("/login");
  const result = await getMyReviews()
    .then((page) => ({ page, error: undefined }))
    .catch(() => ({
      page: undefined,
      error: "Não foi possível carregar suas avaliações.",
    }));
  return (
    <>
      <Link href="/account" className="text-sm text-blue-600">
        Minha conta
      </Link>
      <h1 className="my-6 text-2xl font-semibold">Minhas avaliações</h1>
      <ReviewsPanel initialPage={result.page} initialError={result.error} />
    </>
  );
}
