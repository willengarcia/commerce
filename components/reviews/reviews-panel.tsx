"use client";
import {
  deleteReviewAction,
  loadReviewsAction,
  saveReviewAction,
} from "app/(account)/review-actions";
import type { Review } from "lib/api/reviews";
import type { PageResponse } from "lib/api/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

const button =
  "rounded-full border border-blue-600 px-4 py-2 text-sm text-blue-600 disabled:opacity-50";
export function ReviewForm({
  productId,
  review,
  onSaved,
}: {
  productId: number;
  review?: Review;
  onSaved: (review: Review) => void;
}) {
  const [nota, setNota] = useState(review?.nota ?? 0);
  const [comment, setComment] = useState(review?.comentario ?? "");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const busy = useRef(false);
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (busy.current) return;
        busy.current = true;
        start(async () => {
          try {
            const result = await saveReviewAction(
              productId,
              review?.id ?? null,
              nota,
              comment,
            );
            setError(result.error);
            if (result.review) onSaved(result.review);
          } catch {
            setError(
              "Não foi possível confirmar o envio. Consulte Minhas avaliações antes de tentar novamente.",
            );
          } finally {
            busy.current = false;
          }
        });
      }}
    >
      <fieldset disabled={pending}>
        <legend className="text-sm">Sua nota</legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className="cursor-pointer rounded p-1 focus-within:ring-2 focus-within:ring-blue-600"
            >
              <input
                className="sr-only"
                type="radio"
                name="nota"
                required
                checked={nota === value}
                onChange={() => setNota(value)}
                aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`}
              />
              <span
                aria-hidden="true"
                className={`text-3xl ${value <= nota ? "text-blue-600" : "text-neutral-400"}`}
              >
                ★
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm">
        Comentário (opcional)
        <textarea
          maxLength={1000}
          value={comment}
          disabled={pending}
          onChange={(event) => setComment(event.target.value)}
          className="mt-2 min-h-24 w-full rounded-md border bg-transparent p-3"
        />
      </label>
      <p className="text-xs text-neutral-500">
        {comment.length}/1.000 caracteres
      </p>
      <p className="text-xs text-neutral-500">
        {review
          ? "Ao editar, sua avaliação volta a ficar pendente de moderação."
          : "A avaliação será publicada após aprovação."}
      </p>
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <button disabled={pending || nota === 0} className={button}>
        {pending
          ? "Salvando..."
          : review
            ? "Salvar avaliação"
            : "Enviar avaliação"}
      </button>
    </form>
  );
}

export function ReviewsPanel({
  initialPage,
  productId = null,
  canReview = false,
  eligibilityMessage,
  initialError,
}: {
  initialPage?: PageResponse<Review>;
  productId?: number | null;
  canReview?: boolean;
  eligibilityMessage?: string;
  initialError?: string;
}) {
  const [page, setPage] = useState(initialPage);
  const [error, setError] = useState(initialError);
  const [editing, setEditing] = useState<number | null>(null);
  const [confirmation, setConfirmation] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  function load(index: number) {
    start(async () => {
      try {
        const result = await loadReviewsAction(productId, index);
        setError(result.error);
        if (result.page) setPage(result.page);
      } catch {
        setError("Não foi possível carregar as avaliações.");
      }
    });
  }
  const items = (page?.content ?? []).filter(
    (review) => productId === null || review.status === "APROVADA",
  );
  return (
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      {notice ? (
        <p role="status" className="text-sm text-blue-600">
          {notice}
        </p>
      ) : null}
      {error ? (
        <div role="alert">
          <p className="text-sm text-red-600">{error}</p>
          <button
            className={button}
            disabled={pending}
            onClick={() => load(page?.number ?? 0)}
          >
            Tentar novamente
          </button>
        </div>
      ) : null}
      {!error && items.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {productId === null
            ? "Você ainda não tem avaliações."
            : "Este produto ainda não tem avaliações publicadas."}
        </p>
      ) : null}
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
        {items.map((review) => (
          <li key={review.id} className="py-5">
            {productId === null ? (
              <Link
                href={`/product/${review.productId}`}
                className="font-medium text-blue-600 hover:underline"
              >
                Produto #{review.productId}
              </Link>
            ) : (
              <p className="font-medium">{review.nomeCliente}</p>
            )}
            <p
              aria-label={`${review.nota} de 5 estrelas`}
              className="text-blue-600"
            >
              <span aria-hidden="true">
                {"★".repeat(Math.max(0, Math.min(5, review.nota)))}
                {"☆".repeat(Math.max(0, 5 - review.nota))}
              </span>
            </p>
            {review.comentario ? (
              <p className="mt-2 whitespace-pre-line text-sm">
                {review.comentario}
              </p>
            ) : null}
            <time
              dateTime={review.dataCriacao}
              className="mt-2 block text-xs text-neutral-500"
            >
              {new Date(review.dataCriacao).toLocaleDateString("pt-BR")}
            </time>
            {productId === null ? (
              <>
                <p className="mt-2 text-xs">
                  {
                    {
                      PENDENTE: "Pendente de moderação",
                      APROVADA: "Aprovada",
                      REJEITADA: "Rejeitada",
                    }[review.status]
                  }
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    className={button}
                    disabled={pending}
                    onClick={() =>
                      setEditing(editing === review.id ? null : review.id)
                    }
                  >
                    Editar
                  </button>
                  <button
                    className={button}
                    disabled={pending}
                    onClick={() => setConfirmation(review.id)}
                  >
                    Excluir
                  </button>
                </div>
                {editing === review.id ? (
                  <ReviewForm
                    productId={review.productId}
                    review={review}
                    onSaved={(updated) => {
                      setPage((current) =>
                        current
                          ? {
                              ...current,
                              content: current.content.map((item) =>
                                item.id === updated.id ? updated : item,
                              ),
                            }
                          : current,
                      );
                      setEditing(null);
                      setNotice(
                        "Avaliação atualizada e enviada para moderação.",
                      );
                      router.refresh();
                    }}
                  />
                ) : null}
                {confirmation === review.id ? (
                  <div className="mt-3 rounded-md border p-3">
                    <p>
                      Excluir esta avaliação? Esta ação não pode ser desfeita.
                    </p>
                    <div className="mt-3 flex gap-3">
                      <button
                        disabled={pending}
                        className={button}
                        onClick={() =>
                          start(async () => {
                            try {
                              const result = await deleteReviewAction(
                                review.id,
                              );
                              if (result.error) {
                                setError(result.error);
                                return;
                              }
                              setPage((current) =>
                                current
                                  ? {
                                      ...current,
                                      content: current.content.filter(
                                        (item) => item.id !== review.id,
                                      ),
                                    }
                                  : current,
                              );
                              setConfirmation(null);
                              setNotice("Avaliação excluída.");
                              const next = await loadReviewsAction(
                                null,
                                page && page.content.length === 1
                                  ? Math.max(0, page.number - 1)
                                  : (page?.number ?? 0),
                              );
                              if (next.page) setPage(next.page);
                              router.refresh();
                            } catch {
                              setError(
                                "Não foi possível confirmar a exclusão. Atualize a lista.",
                              );
                            }
                          })
                        }
                      >
                        {pending ? "Excluindo..." : "Confirmar exclusão"}
                      </button>
                      <button
                        disabled={pending}
                        className={button}
                        onClick={() => setConfirmation(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </li>
        ))}
      </ul>
      {page && page.totalPages > 1 ? (
        <nav
          aria-label="Paginação de avaliações"
          className="flex flex-wrap items-center gap-3"
        >
          <button
            className={button}
            disabled={pending || page.first}
            onClick={() => load(page.number - 1)}
          >
            Anterior
          </button>
          <span className="text-sm">
            Página {page.number + 1} de {page.totalPages}
          </span>
          <button
            className={button}
            disabled={pending || page.last}
            onClick={() => load(page.number + 1)}
          >
            Próxima
          </button>
        </nav>
      ) : null}
      {pending ? (
        <p role="status" className="text-sm">
          Atualizando avaliações...
        </p>
      ) : null}
      {productId !== null ? (
        <div className="border-t pt-5">
          {canReview && !sent ? (
            <>
              <h3 className="font-medium">Avalie sua compra</h3>
              <ReviewForm
                productId={productId}
                onSaved={() => {
                  setSent(true);
                  setNotice("Avaliação enviada e pendente de moderação.");
                  router.refresh();
                }}
              />
            </>
          ) : (
            <p className="text-sm text-neutral-500">
              {sent
                ? "Sua avaliação está pendente de moderação."
                : eligibilityMessage}
            </p>
          )}
          <Link
            href="/account/reviews"
            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
          >
            Minhas avaliações
          </Link>
        </div>
      ) : null}
    </div>
  );
}
