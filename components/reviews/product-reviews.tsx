import { getProductReviews, getMyReviews } from "lib/api/reviews";
import { getSessionToken } from "lib/api/auth";
import { getOrders } from "lib/api/orders";
import { ReviewsPanel } from "./reviews-panel";

export async function ProductReviews({ productId }: { productId: number }) {
  const result = await getProductReviews(productId)
    .then((page) => ({ page, error: undefined }))
    .catch(() => ({
      page: undefined,
      error: "Não foi possível carregar as avaliações.",
    }));
  let canReview = false;
  let message =
    "Entre na sua conta para avaliar um produto de uma compra entregue.";
  if (await getSessionToken()) {
    try {
      const orders = await getOrders();
      canReview = orders.some(
        (order) =>
          order.status === "ENTREGUE" &&
          order.items.some((item) => item.productId === productId),
      );
      message =
        "Você poderá avaliar este produto após a entrega da sua compra.";
      if (canReview) {
        let mine = await getMyReviews();
        let alreadyReviewed = mine.content.some(
          (review) => review.productId === productId,
        );
        while (!alreadyReviewed && !mine.last) {
          mine = await getMyReviews(mine.number + 1);
          alreadyReviewed = mine.content.some(
            (review) => review.productId === productId,
          );
        }
        if (alreadyReviewed) {
          canReview = false;
          message =
            "Você já avaliou este produto. Edite sua avaliação em Minha Conta.";
        }
      }
    } catch {
      canReview = false;
      message =
        "Não foi possível verificar suas compras. Tente novamente mais tarde.";
    }
  }
  return (
    <section
      id="avaliacoes"
      className="mx-auto mt-10 max-w-(--breakpoint-2xl) px-4"
    >
      <h2 className="mb-5 text-xl font-semibold">Avaliações de clientes</h2>
      <ReviewsPanel
        productId={productId}
        initialPage={result.page}
        initialError={result.error}
        canReview={canReview}
        eligibilityMessage={message}
      />
    </section>
  );
}
