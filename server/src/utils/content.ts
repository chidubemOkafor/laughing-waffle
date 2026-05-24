const wordsPerMinute = 200;

export type AuthorFields = {
  authorName: string | null;
  authorProfilePic: string | null;
};

export function calculateReadTimeMinutes(content: string) {
  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function serializeAuthors(post: AuthorFields) {
  if (!post.authorName) {
    return [];
  }

  return [
    {
      name: post.authorName,
      profilePic: post.authorProfilePic
    }
  ];
}
