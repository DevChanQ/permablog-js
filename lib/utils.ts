import { Article } from './types'

export const EMPTY_ARTICLE: Article = {
  id: '',
  slug: '',
  title: 'Untitled',
  description: '',
  image: '',
  content: '',
  category: '',
  timestamp: Date.now(),
  owner: '',
  meta: {},
  tags: [],
}

export const tagsToArticle = (tagsArray: Array<{ name: string; value: string }>): Article => {
  const tags: Record<string, string> = tagsArray.reduce(
    (acc, tag) => {
      acc[tag.name] = tag.value
      return acc
    },
    {} as Record<string, string>,
  )

  return {
    id: tags['Article-ID'] || '',
    slug: tags['Article-Slug'] || '',
    title: tags['Article-Title'] || '',
    description: tags['Article-Description'] || '',
    image: tags['Article-Image'] || '',
    content: '', // Content is not included in tags; to be fetched separately
    category: tags['Article-Category'] || 'Uncategorized',
    timestamp: parseInt(tags['Article-Timestamp'] || '0', 10),
    owner: tags['Article-Owner'] || '',
    meta: {
      title: tags['Article-Meta-Title'],
      description: tags['Article-Meta-Description'],
      image: tags['Article-Meta-Image'],
    },
    // remaining tags
    tags: Object.keys(tags)
      .filter((key) => !key.startsWith('Article-'))
      .map((key) => `${key}:${tags[key]}`),
  }
}
