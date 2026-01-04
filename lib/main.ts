import type {
  Article,
  FetchArticlesOptions,
  PermablogInstance,
  GraphQLResponse,
  GraphQLEdge,
} from './types'
import {
  buildArticlesQuery,
  buildArticleQuery,
  executeGraphQL,
  fetchTransactionData,
} from './graphql'

const parseArticleFromEdge = async (edge: GraphQLEdge): Promise<Article | null> => {
  try {
    const { node } = edge
    const tags = node.tags.reduce(
      (acc, tag) => {
        acc[tag.name] = tag.value
        return acc
      },
      {} as Record<string, string>,
    )

    // Fetch the actual content from Arweave
    const content = await fetchTransactionData(node.id)

    return {
      id: node.id,
      title: tags['Article-Title'] || 'Untitled',
      content,
      category: tags['Article-Category'] || 'Uncategorized',
      timestamp: node.block?.timestamp || Date.now(),
      owner: node.owner.address,
      tags: [],
    }
  } catch (error) {
    console.error(`Failed to parse article from edge:`, error)
    return null
  }
}

const createPermablog = (options: { key: string }): PermablogInstance => {
  const { key: ownerAddress } = options

  const fetchArticles = async (options?: FetchArticlesOptions): Promise<Article[]> => {
    try {
      const query = buildArticlesQuery(ownerAddress, options)
      const response: GraphQLResponse = await executeGraphQL(query)

      const edges = response.data.transactions.edges

      // Parse all articles in parallel
      const articlePromises = edges.map((edge) => parseArticleFromEdge(edge))
      const articles = await Promise.all(articlePromises)

      // Filter out any null values (failed parses)
      return articles.filter((article): article is Article => article !== null)
    } catch (error) {
      console.error('Failed to fetch articles:', error)
      throw new Error(
        `Failed to fetch articles: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  const fetchArticle = async (id: string): Promise<Article | null> => {
    try {
      const query = buildArticleQuery(id)
      const response: GraphQLResponse = await executeGraphQL(query)

      const edges = response.data.transactions.edges

      if (edges.length === 0) {
        return null
      }

      return parseArticleFromEdge(edges[0])
    } catch (error) {
      console.error(`Failed to fetch article ${id}:`, error)
      throw new Error(
        `Failed to fetch article: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  return {
    fetchArticles,
    fetchArticle,
  }
}

export default createPermablog
export type { Article, FetchArticlesOptions, PermablogInstance } from './types'
