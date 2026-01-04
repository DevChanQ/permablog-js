export interface Article {
  id: string
  title: string
  content: string
  category: string
  timestamp: number
  owner: string
  tags?: string[]
}

export interface FetchArticlesOptions {
  category?: string
  limit?: number
  after?: string // cursor for pagination
}

export interface PermablogInstance {
  fetchArticles: (options?: FetchArticlesOptions) => Promise<Article[]>
  fetchArticle: (id: string) => Promise<Article | null>
}

export interface GraphQLEdge {
  cursor: string
  node: {
    id: string
    owner: {
      address: string
    }
    tags: Array<{
      name: string
      value: string
    }>
    block?: {
      timestamp: number
    }
  }
}

export interface GraphQLResponse {
  data: {
    transactions: {
      edges: GraphQLEdge[]
    }
  }
}
