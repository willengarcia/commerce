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
  descricaoCurta: string | null;
  descricao: string | null;
  preco: number;
  precoPromocional: number | null;
  quantidadeEstoque: number;
  quantidadeReservada: number;
  estoqueMinimo: number;
  sku: string | null;
  peso?: number | null;
  altura?: number | null;
  largura?: number | null;
  comprimento?: number | null;
  mediaAvaliacao?: number | null;
  totalAvaliacoes?: number | null;
  status: string;
  dataCriacao: string;
  categoriaId: number | null;
  categoriaName?: string | null;
  brandId: number | null;
  brandName?: string | null;
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
  categoriaId: number | null;
  brandId: number | null;
  brandName: string | null;
};

export type CategoryDTO = {
  categoryId: number;
  name: string;
  description: string;
  ativo: boolean;
  dataAtualizacao: string;
  parentCategoryId?: number | null;
};

export type BrandDTO = {
  id: number;
  name: string;
  slug: string;
  ativo: boolean;
  dataCriacao: string;
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
  sku?: string | null;
  weight?: number | null;
  height?: number | null;
  width?: number | null;
  length?: number | null;
  categoryId: number | null;
  categoryName?: string | null;
  brandId: number | null;
  brandName?: string | null;
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
  parentCategoryId: number | null;
};

export type CategoryTreeNode = CategoryViewModel & {
  children: CategoryTreeNode[];
};

export type BrandViewModel = {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductPageViewModel = Omit<
  PageResponse<ProductListItemResponseDTO>,
  "content"
> & { content: ProductViewModel[] };
