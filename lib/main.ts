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

    // Fetch the actual content from Arweave FIRST
    const content = await fetchTransactionData(node.id)

    // Then derive tags/metadata from the GraphQL edge
    const tags = node.tags.reduce(
      (acc, tag) => {
        acc[tag.name] = tag.value
        return acc
      },
      {} as Record<string, string>,
    )

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

      // For each edge, fetch content from arweave.net first, then apply tags/metadata
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
      // Always fetch the content from arweave.net FIRST
      const content = await fetchTransactionData(id)

      // Then attempt to fetch the metadata/tags from GraphQL
      const query = buildArticleQuery(id)
      const response: GraphQLResponse = await executeGraphQL(query)
      const edges = response.data.transactions.edges

      if (edges.length === 0) {
        // GraphQL item may not exist yet; still return the article with content
        return {
          id,
          title: 'Untitled',
          content,
          category: 'Uncategorized',
          timestamp: Date.now(),
          owner: '',
          tags: [],
        }
      }

      // If we do have an edge, enrich using its metadata but keep the fetched content
      const edge = edges[0]
      const { node } = edge
      const tags = node.tags.reduce(
        (acc, tag) => {
          acc[tag.name] = tag.value
          return acc
        },
        {} as Record<string, string>,
      )

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
