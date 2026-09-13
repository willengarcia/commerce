export type PageResponse<T> = {
  content: T[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type ProductResponseDTO = {
  id: number;
  nome: string;
  slug: string;
  descricaoCurta: string;
  descricao: string;
  preco: number;
  precoPromocional: number | null;
  quantidadeEstoque: number;
  quantidadeReservada: number;
  estoqueMinimo: number;
  sku: string;
  peso: number;
  altura: number;
  largura: number;
  comprimento: number;
  mediaAvaliacao: number;
  totalAvaliacoes: number;
  status: string;
  dataCriacao: string;
  categoriaId: number;
};

export type MainProductImageDTO = {
  id: number;
  url: string;
  alt: string | null;
};

export type ProductListItemResponseDTO = {
  id: number;
  nome: string;
  slug: string;
  descricaoCurta: string;
  preco: number;
  precoPromocional: number | null;
  imagemPrincipal: MainProductImageDTO | null;
  categoriaId: number;
};

export type CategoryDTO = {
  categoryId: number;
  name: string;
  description: string;
  ativo: boolean;
  dataAtualizacao: string;
};

export type ProductImageResponseDTO = {
  id: number;
  nomeArquivo: string;
  urlImagem: string;
  imagemPrincipal: boolean;
  dataCriacao: string;
  productId: number;
};

export type ImageViewModel = { url: string; altText: string };

export type ProductViewModel = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: string;
  promotionalPrice: string | null;
  displayPrice: string;
  currencyCode: "BRL";
  availableForSale?: boolean;
  stockQuantity?: number;
  reservedQuantity?: number;
  sku?: string;
  categoryId: number;
  createdAt?: string;
  images: ImageViewModel[];
  featuredImage?: ImageViewModel;
};

export type CategoryViewModel = {
  id: number;
  name: string;
  description: string;
  active: boolean;
  path: string;
  updatedAt: string;
};

export type ProductPageViewModel = Omit<
  PageResponse<ProductListItemResponseDTO>,
  "content"
> & { content: ProductViewModel[] };
