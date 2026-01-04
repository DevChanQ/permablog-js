const ARWEAVE_GRAPHQL_ENDPOINT = 'https://arweave-search.goldsky.com/graphql'

export const buildArticlesQuery = (
  ownerAddress: string,
  options?: {
    tags?: string[]
    category?: string
    limit?: number
    after?: string
  },
) => {
  const limit = options?.limit || 100
  const after = options?.after ? `, after: "${options.after}"` : ''

  // Build tag filters
  const tagFilters = [
    '{ name: "App-Name", values: ["Permablog"] }',
    '{ name: "Content-Type", values: ["text/markdown"] }',
  ]

  if (options?.category) {
    tagFilters.push(`{ name: "Article-Category", values: ["${options.category}"] }`)
  }

  return `
    query {
      transactions(
        owners: ["${ownerAddress}"]
        tags: [${tagFilters.join(', ')}]
        first: ${limit}
        ${after}
        sort: HEIGHT_DESC
      ) {
        edges {
          cursor
          node {
            id
            owner {
              address
            }
            tags {
              name
              value
            }
            block {
              timestamp
            }
          }
        }
      }
    }
  `
}

export const buildArticleQuery = (transactionId: string) => {
  return `
    query {
      transactions(
        ids: ["${transactionId}"]
      ) {
        edges {
          node {
            id
            owner {
              address
            }
            tags {
              name
              value
            }
            block {
              timestamp
            }
          }
        }
      }
    }
  `
}

export const executeGraphQL = async (query: string) => {
  const response = await fetch(ARWEAVE_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`)
  }

  return response.json()
}

export const fetchTransactionData = async (transactionId: string): Promise<string> => {
  const response = await fetch(`https://arweave.net/${transactionId}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch transaction data: ${response.statusText}`)
  }

  return response.text()
}
