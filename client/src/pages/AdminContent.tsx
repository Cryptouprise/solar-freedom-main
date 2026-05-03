import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Globe,
  Bot,
  Search,
  RefreshCw,
  ArrowLeft,
  Eye,
  Trash2,
  ExternalLink,
  BookOpen,
  Calendar,
  Tag,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface DbPost {
  id: number;
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  heroImage: string | null;
  category: string | null;
  tags: string[];
  excerpt: string | null;
  readTime: string | null;
  relatedSlugs: string[];
  published: number;
  publishedAt: Date | null;
  updatedAt: Date | null;
}

// ─── Static post info (pulled from blog.ts at build time via tRPC) ─────────────
// We'll just show the count + list from a separate endpoint

// ─── API Key display ───────────────────────────────────────────────────────────
const CLAUDE_KEY = "sf_c95d0b522cf9d0f593e8dd9983fbcb217f13215a8e831cd434e3c69c771c6726";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="ml-2 p-1 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ─── Post detail modal ─────────────────────────────────────────────────────────
function PostDetailModal({
  slug,
  open,
  onClose,
}: {
  slug: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: post, isLoading } = trpc.content.getPost.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug && open }
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-[#0D0F14] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white font-display text-xl">
            {isLoading ? "Loading..." : post?.title ?? "Post Not Found"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {post ? (
              <span className="font-mono text-xs">
                /blog/{post.slug} · {post.category ?? "Uncategorized"} · {post.readTime ?? "—"}
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
          </div>
        )}

        {post && (
          <div className="space-y-4">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Meta Title</div>
                <div className="text-sm text-white">{post.metaTitle ?? post.title}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Published</div>
                <div className="text-sm text-white">
                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "—"}
                </div>
              </div>
            </div>

            {post.metaDescription && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Meta Description</div>
                <div className="text-sm text-gray-300">{post.metaDescription}</div>
              </div>
            )}

            {/* Tags */}
            {(post.tags as string[])?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(post.tags as string[]).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs border-amber-500/30 text-amber-400">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Excerpt */}
            {post.excerpt && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Excerpt</div>
                <div className="text-sm text-gray-300">{post.excerpt}</div>
              </div>
            )}

            {/* Content preview */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-xs text-gray-400 mb-2">Content Preview</div>
              <div
                className="text-sm text-gray-300 prose prose-invert prose-sm max-w-none line-clamp-10"
                dangerouslySetInnerHTML={{ __html: post.content ?? "" }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <a
                href={`/blog/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View live post
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Fetch DB posts
  const {
    data: dbData,
    isLoading: dbLoading,
    refetch: refetchDb,
  } = trpc.content.listPosts.useQuery({ limit: 200, offset: 0 });

  const dbPosts = (dbData ?? []) as DbPost[];

  // Filter by search
  const filteredPosts = useMemo(() => {
    if (!search.trim()) return dbPosts;
    const q = search.toLowerCase();
    return dbPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q)
    );
  }, [dbPosts, search]);

  // Delete mutation via fetch (uses admin API key)
  const handleDelete = async (slug: string) => {
    try {
      const res = await fetch(`/api/admin/posts/${slug}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${CLAUDE_KEY}`,
        },
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success(`Post "${slug}" deleted`);
      refetchDb();
    } catch {
      toast.error("Failed to delete post.");
    }
    setDeleteConfirmOpen(false);
    setDeleteSlug(null);
  };

  // Toggle publish/unpublish
  const handleTogglePublish = async (slug: string, currentPublished: number) => {
    try {
      const res = await fetch(`/api/admin/posts/${slug}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${CLAUDE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ published: currentPublished === 1 ? false : true }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(currentPublished === 1 ? `"${slug}" unpublished` : `"${slug}" published`);
      refetchDb();
    } catch {
      toast.error("Failed to update post.");
    }
  };

  // Auth guard
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F14] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0D0F14] flex items-center justify-center text-white">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400">Admin access required.</p>
          <Link href="/">
            <Button className="mt-4" variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F14] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0D0F14]/95 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/leads">
              <button className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <div>
              <h1 className="font-display text-2xl text-white tracking-wide">CONTENT MANAGER</h1>
              <p className="text-gray-400 text-xs font-mono">breakyoursolarcontract.com</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchDb()}
              className="border-white/10 text-gray-300 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
            <a href="/blog" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                View Blog
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{dbPosts.length}</div>
                  <div className="text-xs text-gray-400">AI-Published Posts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">97</div>
                  <div className="text-xs text-gray-400">Static Articles</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {dbPosts.filter((p) => p.published === 1).length}
                  </div>
                  <div className="text-xs text-gray-400">DB Posts Live</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {97 + dbPosts.filter((p) => p.published === 1).length}
                  </div>
                  <div className="text-xs text-gray-400">Total Live Articles</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="db-posts">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="db-posts" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <Bot className="h-3.5 w-3.5 mr-1.5" />
              AI-Published ({dbPosts.length})
            </TabsTrigger>
            <TabsTrigger value="static-posts" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Static Articles (97)
            </TabsTrigger>
            <TabsTrigger value="api-info" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <Globe className="h-3.5 w-3.5 mr-1.5" />
              API & Claude Setup
            </TabsTrigger>
          </TabsList>

          {/* DB Posts Tab */}
          <TabsContent value="db-posts" className="mt-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base">
                    AI-Published Posts
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      Created via Claude or Admin API
                    </span>
                  </CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      placeholder="Search posts..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder-gray-500 h-8 text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {dbLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-1">No AI-published posts yet</p>
                    <p className="text-sm">
                      Use Claude with the Admin API to create posts — they'll appear here instantly.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-gray-400 font-mono text-xs uppercase">Title</TableHead>
                        <TableHead className="text-gray-400 font-mono text-xs uppercase">Category</TableHead>
                        <TableHead className="text-gray-400 font-mono text-xs uppercase">Status</TableHead>
                        <TableHead className="text-gray-400 font-mono text-xs uppercase">Published</TableHead>
                        <TableHead className="text-gray-400 font-mono text-xs uppercase">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPosts.map((post) => (
                        <TableRow key={post.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="max-w-xs">
                            <div className="font-medium text-white truncate">{post.title}</div>
                            <div className="text-xs text-gray-500 font-mono truncate">/blog/{post.slug}</div>
                          </TableCell>
                          <TableCell>
                            {post.category ? (
                              <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                                <Tag className="h-2.5 w-2.5 mr-1" />
                                {post.category}
                              </Badge>
                            ) : (
                              <span className="text-gray-500 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {post.published === 1 ? (
                              <Badge variant="outline" className="text-xs border-green-500/30 text-green-400 bg-green-500/10">
                                <CheckCircle className="h-2.5 w-2.5 mr-1" />
                                Live
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs border-gray-500/30 text-gray-400 bg-gray-500/10">
                                <Clock className="h-2.5 w-2.5 mr-1" />
                                Draft
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Calendar className="h-3 w-3" />
                              {post.publishedAt
                                ? new Date(post.publishedAt).toLocaleDateString()
                                : "—"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedSlug(post.slug);
                                  setModalOpen(true);
                                }}
                                className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                title="View post"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <a
                                href={`/blog/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-amber-400 transition-colors"
                                title="Open live post"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                              <button
                                onClick={() => handleTogglePublish(post.slug, post.published)}
                                className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
                                  post.published === 1
                                    ? "text-green-400 hover:text-gray-400"
                                    : "text-gray-400 hover:text-green-400"
                                }`}
                                title={post.published === 1 ? "Unpublish" : "Publish"}
                              >
                                <Globe className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteSlug(post.slug);
                                  setDeleteConfirmOpen(true);
                                }}
                                className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                                title="Delete post"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Static Posts Tab */}
          <TabsContent value="static-posts" className="mt-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base">
                  Static Articles
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    Hardcoded in TypeScript source files — edit via Manus or GitHub
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { file: "blog.ts", count: 12, desc: "Original core articles" },
                    { file: "blog-extra.ts", count: 5, desc: "Supplemental articles" },
                    { file: "blog-articles-batch9.ts", count: 8, desc: "Batch 9 — state/city targeting" },
                    { file: "blog-articles-batch10.ts", count: 5, desc: "Batch 10 — company-specific" },
                    { file: "blog-articles-batch*.ts", count: 67, desc: "Batches 1–8 — core SEO content" },
                  ].map((item) => (
                    <div
                      key={item.file}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div>
                        <div className="font-mono text-sm text-amber-400">{item.file}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
                      </div>
                      <Badge variant="outline" className="border-white/20 text-gray-300">
                        {item.count} posts
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-300">
                    <strong>To edit static articles:</strong> Use Manus to modify the TypeScript files
                    in <code className="font-mono text-xs bg-white/10 px-1 rounded">client/src/data/</code>,
                    then redeploy. Static articles are faster to load but require a code deployment to update.
                    New AI-generated content should use the Admin API instead.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Info Tab */}
          <TabsContent value="api-info" className="mt-4">
            <div className="space-y-4">
              {/* API Key */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Bot className="h-4 w-4 text-amber-400" />
                    Claude API Key
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-black/40 border border-white/10 font-mono text-xs">
                    <span className="text-green-400 flex-1 break-all">{CLAUDE_KEY}</span>
                    <CopyButton text={CLAUDE_KEY} />
                  </div>
                  <p className="text-xs text-gray-400">
                    This key has full permissions: posts:read/write/delete, companies:read/write, config:read/write, keys:manage.
                  </p>
                </CardContent>
              </Card>

              {/* Claude System Prompt */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-base">Claude System Prompt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="text-xs text-gray-300 bg-black/40 border border-white/10 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`You are the content manager for breakyoursolarcontract.com, a legal resource site helping homeowners cancel predatory solar contracts.

You have access to the Admin API at:
  https://breakyoursolarcontract.com/api/admin

Your API key: ${CLAUDE_KEY}

Content guidelines:
- All articles target homeowners trapped in solar contracts
- Tone: authoritative, empathetic, urgent but not alarmist  
- Always include FAQ sections with 3-5 questions
- Use HTML for content (h2, h3, p, ul, li tags)
- Target 1,200-2,000 words per article
- Include a clear CTA to the free case review form
- Meta descriptions should be 150-160 characters
- Slugs should be lowercase, hyphenated, keyword-rich

When creating articles:
1. Research the topic thoroughly
2. Write the full HTML content  
3. POST to /api/admin/posts with all fields
4. Confirm the post was created successfully`}
                    </pre>
                    <CopyButton text={`You are the content manager for breakyoursolarcontract.com...\n\nAPI key: ${CLAUDE_KEY}\nBase URL: https://breakyoursolarcontract.com/api/admin`} />
                  </div>
                </CardContent>
              </Card>

              {/* Quick reference */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-base">Quick API Reference</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-400 text-xs">Method</TableHead>
                        <TableHead className="text-gray-400 text-xs">Endpoint</TableHead>
                        <TableHead className="text-gray-400 text-xs">Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { method: "GET", path: "/api/admin/status", desc: "Health check + stats" },
                        { method: "GET", path: "/api/admin/posts", desc: "List all DB posts" },
                        { method: "POST", path: "/api/admin/posts", desc: "Create new post" },
                        { method: "PUT", path: "/api/admin/posts/:slug", desc: "Update a post" },
                        { method: "DELETE", path: "/api/admin/posts/:slug", desc: "Delete a post" },
                        { method: "GET", path: "/api/admin/companies", desc: "List companies" },
                        { method: "POST", path: "/api/admin/companies", desc: "Create company" },
                        { method: "GET", path: "/api/admin/config", desc: "Get site config" },
                        { method: "PUT", path: "/api/admin/config/:key", desc: "Set config value" },
                        { method: "POST", path: "/api/admin/keys", desc: "Generate new API key" },
                      ].map((row, i) => (
                        <TableRow key={`${row.method}-${row.path}-${i}`} className="border-white/10 hover:bg-white/5">
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs font-mono ${
                                row.method === "GET"
                                  ? "border-blue-500/30 text-blue-400"
                                  : row.method === "POST"
                                  ? "border-green-500/30 text-green-400"
                                  : row.method === "PUT"
                                  ? "border-amber-500/30 text-amber-400"
                                  : "border-red-500/30 text-red-400"
                              }`}
                            >
                              {row.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-300">{row.path}</TableCell>
                          <TableCell className="text-xs text-gray-400">{row.desc}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-3 text-xs text-gray-400">
                    Full documentation: <code className="font-mono bg-white/10 px-1 rounded">docs/ADMIN-API.md</code>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Post Detail Modal */}
      <PostDetailModal
        slug={selectedSlug}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedSlug(null);
        }}
      />

      {/* Delete Confirm Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-[#0D0F14] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete <strong className="text-white">"{deleteSlug}"</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-white/10 text-gray-300 hover:text-white bg-transparent"
              onClick={() => setDeleteSlug(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-400 text-white"
              onClick={() => deleteSlug && handleDelete(deleteSlug)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
