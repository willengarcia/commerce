import CartModal from "components/cart/modal";
import { getSessionToken } from "lib/api/auth";
export const metadata = {
  title: "Meu carrinho",
  robots: { index: false, follow: false },
};
export default async function CartPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Meu carrinho</h1>
      <CartModal
        initiallyOpen
        isAuthenticated={Boolean(await getSessionToken())}
      />
      <a href="/search" className="ml-4 underline">
        Continuar comprando
      </a>
    </>
  );
}
