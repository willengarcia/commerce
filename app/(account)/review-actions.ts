"use server";
import {
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
  getProductReviews,
} from "lib/api/reviews";
import { ApiError } from "lib/api/errors";
import { positiveId, validateReview } from "lib/validation/customer-v110";
import { revalidatePath } from "next/cache";

function message(error: unknown) {
  return error instanceof ApiError && error.status < 500
    ? error.message
    : "Não foi possível atualizar as avaliações. Tente novamente.";
}
export async function loadReviewsAction(
  productId: number | null,
  page: number,
) {
  if (
    !Number.isSafeInteger(page) ||
    page < 0 ||
    (productId !== null && !positiveId(productId))
  )
    return { error: "Página inválida." };
  try {
    return {
      page:
        productId === null
          ? await getMyReviews(page)
          : await getProductReviews(productId, page),
    };
  } catch (error) {
    return { error: message(error) };
  }
}
export async function saveReviewAction(
  productId: number,
  reviewId: number | null,
  nota: number,
  comentario: string,
) {
  if (
    !positiveId(productId) ||
    (reviewId !== null && !positiveId(reviewId)) ||
    typeof comentario !== "string"
  )
    return { error: "Avaliação inválida." };
  const error = validateReview(nota, comentario);
  if (error) return { error };
  try {
    const input = { nota, comentario };
    const review =
      reviewId === null
        ? await createReview(productId, input)
        : await updateReview(reviewId, input);
    revalidatePath(`/product/${review.productId}`);
    revalidatePath("/account/reviews");
    return { review };
  } catch (error) {
    return { error: message(error) };
  }
}
export async function deleteReviewAction(reviewId: number) {
  if (!positiveId(reviewId)) return { error: "Avaliação inválida." };
  try {
    await deleteReview(reviewId);
    revalidatePath("/account/reviews");
    return { success: true };
  } catch (error) {
    return { error: message(error) };
  }
}
