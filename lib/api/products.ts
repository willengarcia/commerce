import { apiFetch } from "./client";
import type {
  ImageViewModel,
  PageResponse,
  ProductImageResponseDTO,
  ProductListItemResponseDTO,
  ProductPageViewModel,
  ProductResponseDTO,
  ProductViewModel,
} from "./types";

type ProductFilters = {
  page?: number;
  size?: number;
  name?: string;
  categoryId?: number;
};

function adaptProduct(
  product: ProductResponseDTO,
  images: ImageViewModel[] = [],
): ProductViewModel {
  const promotionalPrice =
    product.precoPromocional == null
      ? null
      : product.precoPromocional.toString();

  return {
    id: product.id,
    name: product.nome,
    slug: product.slug,
    shortDescription: product.descricaoCurta,
    description: product.descricao,
    price: product.preco.toString(),
    promotionalPrice,
    displayPrice: promotionalPrice ?? product.preco.toString(),
    currencyCode: "BRL",
    availableForSale:
      product.status === "ATIVO" &&
      product.quantidadeEstoque - product.quantidadeReservada > 0,
    stockQuantity: product.quantidadeEstoque,
    reservedQuantity: product.quantidadeReservada,
    sku: product.sku,
    categoryId: product.categoriaId,
    createdAt: product.dataCriacao,
    images,
    featuredImage: images[0],
  };
}

function adaptProductListItem(
  product: ProductListItemResponseDTO,
): ProductViewModel {
  const promotionalPrice =
    product.precoPromocional == null
      ? null
      : product.precoPromocional.toString();
  const featuredImage = product.imagemPrincipal
    ? {
        url: product.imagemPrincipal.url,
        altText: product.imagemPrincipal.alt || product.nome,
      }
    : undefined;

  return {
    id: product.id,
    name: product.nome,
    slug: product.slug,
    shortDescription: product.descricaoCurta,
    description: product.descricaoCurta,
    price: product.preco.toString(),
    promotionalPrice,
    displayPrice: promotionalPrice ?? product.preco.toString(),
    currencyCode: "BRL",
    categoryId: product.categoriaId,
    images: featuredImage ? [featuredImage] : [],
    featuredImage,
  };
}

function adaptImages(images: ProductImageResponseDTO[]): ImageViewModel[] {
  return [...images]
    .sort(
      (left, right) =>
        Number(right.imagemPrincipal) - Number(left.imagemPrincipal),
    )
    .map((image) => ({
      url: image.urlImagem,
      altText: image.nomeArquivo,
    }));
}

export async function getProductImages(
  productId: number,
): Promise<ImageViewModel[]> {
  const images = await apiFetch<ProductImageResponseDTO[]>(
    `/products/${productId}/images`,
  );
  return adaptImages(images);
}

export async function getProducts(
  filters: ProductFilters = {},
): Promise<ProductPageViewModel> {
  const params = new URLSearchParams({
    page: String(filters.page ?? 0),
    size: String(filters.size ?? 24),
  });
  if (filters.name) params.set("name", filters.name);
  if (filters.categoryId != null) {
    params.set("categoryId", String(filters.categoryId));
  }

  const page = await apiFetch<PageResponse<ProductListItemResponseDTO>>(
    `/products?${params}`,
  );
  return { ...page, content: page.content.map(adaptProductListItem) };
}

export async function getProduct(productId: number): Promise<ProductViewModel> {
  const product = await apiFetch<ProductResponseDTO>(`/products/${productId}`);
  const images = await getProductImages(product.id);
  return adaptProduct(product, images);
}

export async function getAllProducts(): Promise<ProductViewModel[]> {
  const firstPage = await getProducts();
  if (firstPage.totalPages <= 1) return firstPage.content;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      getProducts({ page: index + 1, size: firstPage.size }),
    ),
  );
  return [
    ...firstPage.content,
    ...remainingPages.flatMap((page) => page.content),
  ];
}

export async function getProductsByCategory(
  categoryId: number,
): Promise<ProductViewModel[]> {
  const firstPage = await getProducts({ categoryId, size: 24 });
  if (firstPage.totalPages <= 1) return firstPage.content;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      getProducts({
        categoryId,
        page: index + 1,
        size: firstPage.size,
      }),
    ),
  );

  return [
    ...firstPage.content,
    ...remainingPages.flatMap((page) => page.content),
  ];
}
