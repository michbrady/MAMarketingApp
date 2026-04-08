export const testContent = {
  video: {
    id: 1,
    title: 'Product Launch Video',
    description: 'New product announcement',
    contentType: 'Video',
    categoryId: 1,
    status: 'Published'
  },
  document: {
    id: 2,
    title: 'Training Guide',
    description: 'Getting started guide',
    contentType: 'Document',
    categoryId: 2,
    status: 'Published'
  },
  image: {
    id: 3,
    title: 'Event Invitation',
    description: 'Annual conference',
    contentType: 'Image',
    categoryId: 3,
    status: 'Published'
  },
  draft: {
    id: 4,
    title: 'Draft Content',
    description: 'Not published yet',
    contentType: 'Video',
    categoryId: 1,
    status: 'Draft'
  }
};

export const newContentData = {
  valid: {
    title: 'New Product Feature',
    description: 'Introducing our latest innovation',
    contentType: 'Video',
    categoryId: 1,
    thumbnailUrl: 'https://example.com/thumb.jpg',
    videoUrl: 'https://example.com/video.mp4',
    tags: ['product', 'innovation', 'new-release']
  },
  minimal: {
    title: 'Minimal Content',
    contentType: 'Image',
    categoryId: 1
  },
  missingTitle: {
    description: 'Content without title',
    contentType: 'Video',
    categoryId: 1
  },
  missingContentType: {
    title: 'Content without type',
    description: 'No content type specified',
    categoryId: 1
  },
  invalidCategory: {
    title: 'Invalid Category',
    description: 'Non-existent category',
    contentType: 'Video',
    categoryId: 9999
  },
  longTitle: {
    title: 'A'.repeat(300), // Exceeds max length
    description: 'Too long title',
    contentType: 'Video',
    categoryId: 1
  }
};

export const contentFilters = {
  byType: {
    video: { contentType: 'Video' },
    document: { contentType: 'Document' },
    image: { contentType: 'Image' }
  },
  byCategory: {
    product: { categoryId: 1 },
    training: { categoryId: 2 },
    event: { categoryId: 3 }
  },
  byStatus: {
    published: { status: 'Published' },
    draft: { status: 'Draft' },
    archived: { status: 'Archived' }
  },
  combined: {
    publishedVideos: { contentType: 'Video', status: 'Published' },
    draftDocuments: { contentType: 'Document', status: 'Draft' }
  }
};

export const contentSearchTerms = {
  withResults: [
    'Product',
    'Training',
    'Video',
    'Launch'
  ],
  noResults: [
    'NonExistentTerm',
    'XYZABC123',
    'ThisWillNotBeFound'
  ]
};
