"use client";

import Link from "next/link";
import {
  getProjectApiBase,
  useProjects,
} from "@/components/dashboard/project-context";

const baseUrl = "https://api.laughingwaffle.online";

const responseExample = `{
  "data": [
    {
      "id": "post_123",
      "title": "Designing a calmer CMS workflow",
      "slug": "designing-a-calmer-cms-workflow",
      "excerpt": "A practical guide to structured editorial systems.",
      "category": "CMS",
      "tags": ["cms", "workflow"],
      "authors": [
        {
          "name": "Ada Lovelace",
          "profilePic": "https://example.com/ada.jpg"
        }
      ],
      "readTimeMinutes": 5,
      "publishedAt": "2026-05-16T10:30:00.000Z",
      "updatedAt": "2026-05-16T10:30:00.000Z"
    }
  ]
}`;

const singlePostResponseExample = `{
  "post": {
    "id": "post_123",
    "title": "Designing a calmer CMS workflow",
    "slug": "designing-a-calmer-cms-workflow",
    "excerpt": "A practical guide to structured editorial systems.",
    "content": "Full post body content...",
    "category": "CMS",
    "tags": ["cms", "workflow"],
    "authors": [
      {
        "name": "Ada Lovelace",
        "profilePic": "https://example.com/ada.jpg"
      }
    ],
    "readTimeMinutes": 5,
    "publishedAt": "2026-05-16T10:30:00.000Z",
    "updatedAt": "2026-05-16T10:30:00.000Z"
  }
}`;

const createPostResponseExample = `{
  "post": {
    "id": "post_123",
    "title": "Guest post from your app",
    "slug": "guest-post-from-your-app",
    "status": "draft",
    "authors": [{ "name": "Ada Lovelace", "profilePic": "https://example.com/ada.jpg" }],
    "readTimeMinutes": 1,
    "createdAt": "2026-05-18T10:30:00.000Z"
  }
}`;

const updatePostResponseExample = `{
  "post": {
    "id": "post_123",
    "title": "Updated title",
    "slug": "updated-title",
    "status": "published",
    "authors": [{ "name": "Ada Lovelace", "profilePic": "https://example.com/ada.jpg" }],
    "readTimeMinutes": 3,
    "updatedAt": "2026-05-18T12:00:00.000Z"
  }
}`;

const deletePostResponseExample = `{
  "deleted": true,
  "id": "post_123",
  "slug": "guest-post-from-your-app"
}`;

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <section className="min-w-0 rounded-lg border border-cloud bg-white shadow-sm">
      <div className="border-b border-cloud px-4 py-3">
        <h3 className="text-base font-semibold text-ink">{label}</h3>
      </div>
      <pre className="max-w-full overflow-x-auto p-4 text-sm leading-6">
        <code className="font-mono text-slate">{code}</code>
      </pre>
    </section>
  );
}

export default function DocsPage() {
  const { activeProject } = useProjects();
  const endpoint = `${baseUrl}${getProjectApiBase(activeProject)}`;
  const singlePostEndpoint = `${endpoint}/designing-a-calmer-cms-workflow`;
  const createEndpoint = `${baseUrl}/api/v1/projects/${activeProject.slug ?? activeProject.id}/posts`;
  const fetchExample = `const response = await fetch("${endpoint}", {
  headers: {
    Authorization: "Bearer YOUR_LAUGHINGWAFFLE_API_KEY"
  }
});

const data = await response.json();`;
  const curlExample = `curl "${endpoint}" \\
  -H "Authorization: Bearer YOUR_LAUGHINGWAFFLE_API_KEY"`;
  const singlePostFetchExample = `const response = await fetch("${singlePostEndpoint}", {
  headers: {
    Authorization: "Bearer YOUR_LAUGHINGWAFFLE_API_KEY"
  }
});

const data = await response.json();`;
  const singlePostCurlExample = `curl "${singlePostEndpoint}" \\
  -H "Authorization: Bearer YOUR_LAUGHINGWAFFLE_API_KEY"`;
  const createPostFetchExample = `const response = await fetch("${createEndpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_WRITE_API_KEY"
  },
  body: JSON.stringify({
    title: "Guest post from your app",
    slug: "guest-post-from-your-app",
    excerpt: "A short summary for previews.",
    content: "Post body content goes here.",
    status: "draft",
    category: "Community",
    tags: ["guest", "community"],
    authorName: "Ada Lovelace",
    authorProfilePic: "https://example.com/ada.jpg"
  })
});

const data = await response.json();`;
  const createPostCurlExample = `curl "${createEndpoint}" \\
  -X POST \\
  -H "Authorization: Bearer YOUR_WRITE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Guest post from your app",
    "slug": "guest-post-from-your-app",
    "content": "Post body content goes here.",
    "status": "draft",
    "authorName": "Ada Lovelace",
    "authorProfilePic": "https://example.com/ada.jpg"
  }'`;
  const updateEndpoint = `${baseUrl}/api/v1/projects/${activeProject.slug ?? activeProject.id}/posts/guest-post-from-your-app`;
  const updatePostFetchExample = `const response = await fetch("${updateEndpoint}", {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_WRITE_API_KEY"
  },
  body: JSON.stringify({
    title: "Updated title",
    status: "published"
  })
});

const data = await response.json();`;
  const updatePostCurlExample = `curl "${updateEndpoint}" \\
  -X PATCH \\
  -H "Authorization: Bearer YOUR_WRITE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "title": "Updated title", "status": "published" }'`;
  const deletePostFetchExample = `const response = await fetch("${updateEndpoint}", {
  method: "DELETE",
  headers: {
    Authorization: "Bearer YOUR_DELETE_ONLY_API_KEY"
  }
});

const data = await response.json();`;
  const deletePostCurlExample = `curl "${updateEndpoint}" \\
  -X DELETE \\
  -H "Authorization: Bearer YOUR_DELETE_ONLY_API_KEY"`;

  return (
    <main className="overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-slate">Docs</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">
              Use LaughingWaffle in your app
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate">
              Fetch published posts from {activeProject.name} with a project API
              key.
            </p>
          </div>
          <Link
            href="/dashboard/api-keys/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-coral px-4 text-sm font-semibold text-white transition hover:bg-[#ef5a49]"
          >
            Create API key
          </Link>
        </section>

        <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">
                List posts endpoint
              </h3>
              <div className="mt-4 max-w-full overflow-x-auto whitespace-nowrap rounded-lg border border-cloud bg-paper p-3 font-mono text-sm text-ink">
                GET {endpoint}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate">
                This endpoint returns published post metadata without the full{" "}
                <span className="font-mono text-xs">content</span> field, so
                index pages, cards, and feeds stay fast.
              </p>
            </section>

            <CodeBlock label="List posts with JavaScript" code={fetchExample} />
            <CodeBlock label="List posts with cURL" code={curlExample} />
            <CodeBlock label="List posts response" code={responseExample} />

            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">
                Single post endpoint
              </h3>
              <div className="mt-4 max-w-full overflow-x-auto whitespace-nowrap rounded-lg border border-cloud bg-paper p-3 font-mono text-sm text-ink">
                GET {singlePostEndpoint}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate">
                Fetch a single published post by slug when you need the full
                body content for a detail page.
              </p>
            </section>

            <CodeBlock
              label="Fetch one post with JavaScript"
              code={singlePostFetchExample}
            />
            <CodeBlock
              label="Fetch one post with cURL"
              code={singlePostCurlExample}
            />
            <CodeBlock
              label="Single post response"
              code={singlePostResponseExample}
            />

            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">
                Create post endpoint
              </h3>
              <div className="mt-4 max-w-full overflow-x-auto whitespace-nowrap rounded-lg border border-cloud bg-paper p-3 font-mono text-sm text-ink">
                POST {createEndpoint}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate">
                This endpoint requires a key with the{" "}
                <span className="font-mono text-xs">content:write</span> scope.
                A full-access key also works.
              </p>
            </section>

            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">
                How create post works
              </h3>
              <div className="mt-4 space-y-4 text-sm leading-6 text-slate">
                <p>
                  Use this endpoint when another app needs to submit content
                  into this LaughingWaffle project. A common example is a
                  community form, customer story form, internal tool, or another
                  backend service creating drafts.
                </p>
                <p>
                  The API key must have the{" "}
                  <span className="font-mono text-xs">content:write</span> scope.
                  In the API key screen, choose the{" "}
                  <span className="font-semibold text-ink">Write only</span>{" "}
                  preset, or tick <span className="font-mono text-xs">content:write</span> manually.
                </p>
                <div className="rounded-lg border border-cloud bg-paper p-3">
                  <p className="font-semibold text-ink">Required fields</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div>
                      <span className="font-mono text-xs text-ink">title</span>
                      <p>Post title. Must be at least 2 characters.</p>
                    </div>
                    <div>
                      <span className="font-mono text-xs text-ink">slug</span>
                      <p>
                        Unique URL slug for this project. Use lowercase letters,
                        numbers, and hyphens.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-cloud bg-paper p-3">
                  <p className="font-semibold text-ink">Optional fields</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div>
                      <span className="font-mono text-xs text-ink">
                        excerpt
                      </span>
                      <p>Short summary for cards, previews, and SEO.</p>
                    </div>
                    <div>
                      <span className="font-mono text-xs text-ink">
                        content
                      </span>
                      <p>Main post body content.</p>
                    </div>
                    <div>
                      <span className="font-mono text-xs text-ink">status</span>
                      <p>
                        One of draft, review, scheduled, or published. Defaults
                        to draft.
                      </p>
                    </div>
                    <div>
                      <span className="font-mono text-xs text-ink">
                        category
                      </span>
                      <p>Optional category label.</p>
                    </div>
                    <div>
                      <span className="font-mono text-xs text-ink">tags</span>
                      <p>Array of tag strings.</p>
                    </div>
                    <div>
                      <span className="font-mono text-xs text-ink">
                        userProfile
                      </span>
                      <p>
                        Author profile object for content submitted by an
                        external user.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-cloud bg-paper p-3">
                  <p className="font-semibold text-ink">userProfile shape</p>
                  <pre className="mt-3 overflow-x-auto text-xs leading-6">
                    <code>{`{
  "fullName": "Ada Lovelace",
  "profilePic": "https://example.com/ada.jpg"
}`}</code>
                  </pre>
                  <p className="mt-2">
                    <span className="font-mono text-xs">fullName</span> is
                    required when userProfile is sent.{" "}
                    <span className="font-mono text-xs">profilePic</span> is
                    optional.
                  </p>
                </div>
                <div className="rounded-lg border border-cloud bg-paper p-3">
                  <p className="font-semibold text-ink">Important responses</p>
                  <div className="mt-3 space-y-2">
                    <p>
                      <span className="font-mono text-xs text-ink">201</span>{" "}
                      Post created.
                    </p>
                    <p>
                      <span className="font-mono text-xs text-ink">401</span>{" "}
                      Missing or invalid API key.
                    </p>
                    <p>
                      <span className="font-mono text-xs text-ink">403</span>{" "}
                      API key is not create-only or does not belong to this
                      project.
                    </p>
                    <p>
                      <span className="font-mono text-xs text-ink">409</span> A
                      post with this slug already exists.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <CodeBlock
              label="Create post with JavaScript"
              code={createPostFetchExample}
            />
            <CodeBlock
              label="Create post with cURL"
              code={createPostCurlExample}
            />
            <CodeBlock
              label="Create post response"
              code={createPostResponseExample}
            />

            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">Update post endpoint</h3>
              <div className="mt-4 max-w-full overflow-x-auto whitespace-nowrap rounded-lg border border-cloud bg-paper p-3 font-mono text-sm text-ink">
                PATCH {updateEndpoint}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate">
                Update any fields of an existing post by slug. All fields are optional — only the ones you send are changed. Requires a key with the <span className="font-mono text-xs">content:write</span> scope.
              </p>
            </section>

            <CodeBlock label="Update post with JavaScript" code={updatePostFetchExample} />
            <CodeBlock label="Update post with cURL" code={updatePostCurlExample} />
            <CodeBlock label="Update post response" code={updatePostResponseExample} />

            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">Delete post endpoint</h3>
              <div className="mt-4 max-w-full overflow-x-auto whitespace-nowrap rounded-lg border border-cloud bg-paper p-3 font-mono text-sm text-ink">
                DELETE {updateEndpoint}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate">
                Permanently removes a post by slug. Requires a key with the <span className="font-mono text-xs">content:delete</span> scope.
              </p>
            </section>

            <CodeBlock label="Delete post with JavaScript" code={deletePostFetchExample} />
            <CodeBlock label="Delete post with cURL" code={deletePostCurlExample} />
            <CodeBlock label="Delete post response" code={deletePostResponseExample} />
          </div>

          <aside className="min-w-0 space-y-6">
            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">
                Authentication
              </h3>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate">
                <p>Send your key in the Authorization header.</p>
                <div className="max-w-full overflow-x-auto whitespace-nowrap rounded-lg border border-cloud bg-paper p-3 font-mono text-xs text-ink">
                  Authorization: Bearer YOUR_LAUGHINGWAFFLE_API_KEY
                </div>
                <p>
                  Keep API keys on your server. Do not ship real keys in browser
                  JavaScript, public repos, docs screenshots, or mobile app
                  bundles.
                </p>
                <p>
                  For external post creation or updates, generate a key with the
                  <span className="font-mono text-xs"> content:write</span> scope.
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">
                Query options
              </h3>
              <div className="mt-4 space-y-3 text-sm text-slate">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs">limit</span>
                  <span>Number of posts</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs">tag</span>
                  <span>Filter by tag</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs">page</span>
                  <span>Pagination page</span>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-cloud bg-ink p-4 text-white shadow-sm">
              <h3 className="text-base font-semibold">Next.js example</h3>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Use the fetch example in a Server Component or route handler
                when the API key should stay private.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
