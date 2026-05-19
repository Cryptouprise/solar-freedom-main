import { useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  LinkIcon,
  ImageIcon,
  Undo,
  Redo,
  Eye,
  Save,
  Search,
  Upload,
  X,
  ExternalLink,
  Edit3,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Toolbar button ─────────────────────────────────────────────────────────────
function ToolbarBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded text-sm transition-all",
        active
          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
          : "text-gray-400 hover:text-white hover:bg-white/10 border border-transparent",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

// ── Link dialog ────────────────────────────────────────────────────────────────
function LinkDialog({
  open,
  onClose,
  onConfirm,
  initialUrl,
  initialText,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (url: string, text: string, newTab: boolean) => void;
  initialUrl?: string;
  initialText?: string;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [text, setText] = useState(initialText ?? "");
  const [newTab, setNewTab] = useState(true);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#1a1d24] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Insert / Edit Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-gray-300 text-sm mb-1.5 block">URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="bg-white/5 border-white/10 text-white placeholder-gray-600"
              autoFocus
            />
          </div>
          <div>
            <Label className="text-gray-300 text-sm mb-1.5 block">Link Text (optional)</Label>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Leave blank to keep selection"
              className="bg-white/5 border-white/10 text-white placeholder-gray-600"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newTab}
              onChange={(e) => setNewTab(e.target.checked)}
              className="accent-amber-500"
            />
            <span className="text-gray-300 text-sm">Open in new tab</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-400">Cancel</Button>
          <Button
            onClick={() => { onConfirm(url, text, newTab); onClose(); }}
            disabled={!url}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            Apply Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Image dialog ───────────────────────────────────────────────────────────────
function ImageDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (url: string, alt: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.content.uploadImage.useMutation();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          filename: file.name,
          contentType: file.type,
          base64,
        });
        setUrl(result.url);
        if (!alt) setAlt(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Upload failed");
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#1a1d24] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Insert Image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-gray-300 text-sm mb-1.5 block">Image URL</Label>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://cdn.example.com/image.jpg"
                className="bg-white/5 border-white/10 text-white placeholder-gray-600 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="border-white/10 text-gray-400 hover:text-white shrink-0"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                title="Upload from device"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>
          </div>
          {url && (
            <div className="rounded-lg overflow-hidden border border-white/10 bg-white/5">
              <img src={url} alt={alt} className="w-full max-h-40 object-contain" />
            </div>
          )}
          <div>
            <Label className="text-gray-300 text-sm mb-1.5 block">Alt Text (for SEO)</Label>
            <Input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe the image for screen readers"
              className="bg-white/5 border-white/10 text-white placeholder-gray-600"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-400">Cancel</Button>
          <Button
            onClick={() => { onConfirm(url, alt); onClose(); }}
            disabled={!url}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            Insert Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main PostEditor ────────────────────────────────────────────────────────────
export default function PostEditor() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [linkDialog, setLinkDialog] = useState(false);
  const [imageDialog, setImageDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [published, setPublished] = useState(1);
  const [heroUploading, setHeroUploading] = useState(false);
  const heroFileRef = useRef<HTMLInputElement>(null);

  // tRPC
  const { data: postsData } = trpc.content.listAllPosts.useQuery({ limit: 200, offset: 0 });
  const { data: postData, isLoading: postLoading } = trpc.content.getAdminPost.useQuery(
    { slug: selectedSlug! },
    { enabled: !!selectedSlug }
  );
  const updateMutation = trpc.content.updatePost.useMutation();
  const uploadMutation = trpc.content.uploadImage.useMutation();

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-amber-400 underline" } }),
      Placeholder.configure({ placeholder: "Start writing your post content here..." }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-amber max-w-none min-h-[400px] p-6 focus:outline-none text-gray-200 leading-relaxed",
      },
    },
  });

  // Load post into form when selected
  const loadPost = useCallback((post: typeof postData) => {
    if (!post || !editor) return;
    setTitle(post.title ?? "");
    setSlug(post.slug ?? "");
    setMetaTitle(post.metaTitle ?? "");
    setMetaDescription(post.metaDescription ?? "");
    setHeroImage(post.heroImage ?? "");
    setExcerpt(post.excerpt ?? "");
    setCategory(post.category ?? "");
    setTags(Array.isArray(JSON.parse(post.tags ?? "[]")) ? JSON.parse(post.tags ?? "[]").join(", ") : "");
    setCanonicalUrl(post.canonicalUrl ?? "");
    setPublished(post.published ?? 1);
    editor.commands.setContent(post.content ?? "");
    setSaved(false);
  }, [editor]);

  // When postData changes (after selecting a slug), load it
  useState(() => {
    if (postData) loadPost(postData);
  });

  if (postData && editor && editor.isEmpty && postData.content) {
    loadPost(postData);
  }

  // Hero image upload
  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({ filename: file.name, contentType: file.type, base64 });
        setHeroImage(result.url);
        setHeroUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Hero image upload failed");
      setHeroUploading(false);
    }
  };

  // Save
  const handleSave = async () => {
    if (!selectedSlug || !editor) return;
    setSaving(true);
    try {
      const tagsArray = tags.split(",").map((t) => t.trim()).filter(Boolean);
      await updateMutation.mutateAsync({
        slug: selectedSlug,
        title,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        heroImage: heroImage || undefined,
        excerpt: excerpt || undefined,
        category: category || undefined,
        tags: JSON.stringify(tagsArray),
        canonicalUrl: canonicalUrl || undefined,
        published,
        content: editor.getHTML(),
      });
      setSaved(true);
      toast.success("Post saved successfully");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      toast.error("Save failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  // Link insert
  const handleLinkConfirm = (url: string, text: string, newTab: boolean) => {
    if (!editor) return;
    if (text && editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}" ${newTab ? 'target="_blank"' : ""}>${text}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: url, target: newTab ? "_blank" : "" }).run();
    }
  };

  // Image insert
  const handleImageConfirm = (url: string, alt: string) => {
    if (!editor) return;
    editor.chain().focus().setImage({ src: url, alt }).run();
  };

  const filteredPosts = (postsData ?? []).filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Post Editor" subtitle="Edit content, images, and links for any post">
      <div className="flex h-full min-h-screen">
        {/* ── Post list sidebar ─────────────────────────────────────── */}
        <div className="w-72 shrink-0 bg-[#111318] border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts..."
                className="pl-9 bg-white/5 border-white/10 text-white placeholder-gray-600 text-sm h-9"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {filteredPosts.length === 0 && (
              <div className="text-gray-500 text-sm text-center py-8">No posts found</div>
            )}
            {filteredPosts.map((post) => (
              <button
                key={post.slug}
                type="button"
                onClick={() => setSelectedSlug(post.slug)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg transition-all border",
                  selectedSlug === post.slug
                    ? "bg-amber-500/15 border-amber-500/20 text-amber-300"
                    : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="text-sm font-medium truncate leading-tight">{post.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-600 truncate">{post.slug}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1 py-0 h-4 shrink-0",
                      post.published
                        ? "border-green-500/30 text-green-400"
                        : "border-gray-600 text-gray-500"
                    )}
                  >
                    {post.published ? "Live" : "Draft"}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Editor area ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {!selectedSlug ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Edit3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium text-gray-400">Select a post to edit</p>
                <p className="text-sm text-gray-600 mt-1">Choose from the list on the left</p>
              </div>
            </div>
          ) : postLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {/* Top action bar */}
              <div className="sticky top-0 z-10 bg-[#0D0F14] border-b border-white/5 px-6 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Select value={String(published)} onValueChange={(v) => setPublished(Number(v))}>
                    <SelectTrigger className="w-28 h-8 text-xs bg-white/5 border-white/10 text-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-white/10 text-white">
                      <SelectItem value="1">Published</SelectItem>
                      <SelectItem value="0">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                  <a
                    href={`/blog/${selectedSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-400 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Preview
                  </a>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className={cn(
                    "h-8 px-4 text-sm font-semibold",
                    saved
                      ? "bg-green-600 hover:bg-green-600 text-white"
                      : "bg-amber-500 hover:bg-amber-600 text-black"
                  )}
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : saved ? (
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {saving ? "Saving..." : saved ? "Saved!" : "Save Post"}
                </Button>
              </div>

              <div className="p-6 space-y-6 max-w-5xl mx-auto">
                {/* Basic fields */}
                <Card className="bg-[#111318] border-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm font-semibold">Post Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-400 text-xs mb-1.5 block">Title *</Label>
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400 text-xs mb-1.5 block">Slug</Label>
                        <Input
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          className="bg-white/5 border-white/10 text-white font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-400 text-xs mb-1.5 block">Category</Label>
                        <Input
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="e.g. Solar Fraud"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400 text-xs mb-1.5 block">Tags (comma-separated)</Label>
                        <Input
                          value={tags}
                          onChange={(e) => setTags(e.target.value)}
                          placeholder="sunrun, solar contract, fraud"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-400 text-xs mb-1.5 block">Excerpt</Label>
                      <Textarea
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        rows={2}
                        placeholder="Short summary shown in post cards and search results"
                        className="bg-white/5 border-white/10 text-white resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Hero image */}
                <Card className="bg-[#111318] border-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      Hero / Featured Image
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={heroImage}
                        onChange={(e) => setHeroImage(e.target.value)}
                        placeholder="https://cdn.example.com/hero.jpg"
                        className="bg-white/5 border-white/10 text-white flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="border-white/10 text-gray-400 hover:text-white shrink-0"
                        onClick={() => heroFileRef.current?.click()}
                        disabled={heroUploading}
                        title="Upload from device"
                      >
                        {heroUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      </Button>
                      <input ref={heroFileRef} type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
                      {heroImage && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="border-white/10 text-red-400 hover:text-red-300 shrink-0"
                          onClick={() => setHeroImage("")}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {heroImage && (
                      <div className="rounded-lg overflow-hidden border border-white/10">
                        <img src={heroImage} alt="Hero" className="w-full max-h-48 object-cover" />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* SEO */}
                <Card className="bg-[#111318] border-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm font-semibold">SEO Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-gray-400 text-xs mb-1.5 block">
                        Meta Title
                        <span className={cn("ml-2 font-mono", metaTitle.length > 60 ? "text-red-400" : "text-gray-600")}>
                          {metaTitle.length}/60
                        </span>
                      </Label>
                      <Input
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        placeholder="Defaults to post title if blank"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-xs mb-1.5 block">
                        Meta Description
                        <span className={cn("ml-2 font-mono", metaDescription.length > 160 ? "text-red-400" : "text-gray-600")}>
                          {metaDescription.length}/160
                        </span>
                      </Label>
                      <Textarea
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        rows={2}
                        placeholder="Shown in Google search results"
                        className="bg-white/5 border-white/10 text-white resize-none"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-xs mb-1.5 block">Canonical URL</Label>
                      <Input
                        value={canonicalUrl}
                        onChange={(e) => setCanonicalUrl(e.target.value)}
                        placeholder="Leave blank to use default URL"
                        className="bg-white/5 border-white/10 text-white font-mono text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Rich text editor */}
                <Card className="bg-[#111318] border-white/5">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-white text-sm font-semibold">Content</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-0.5 px-4 py-2 border-b border-white/5 bg-white/2">
                      {/* History */}
                      <ToolbarBtn onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()} title="Undo">
                        <Undo className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                      <ToolbarBtn onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()} title="Redo">
                        <Redo className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                      <div className="w-px h-5 bg-white/10 mx-1" />

                      {/* Headings */}
                      <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive("heading", { level: 1 })} title="H1">
                        <Heading1 className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                      <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 })} title="H2">
                        <Heading2 className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                      <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive("heading", { level: 3 })} title="H3">
                        <Heading3 className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                      <div className="w-px h-5 bg-white/10 mx-1" />

                      {/* Inline formatting */}
                      <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")} title="Bold">
                        <Bold className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                      <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")} title="Italic">
                        <Italic className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                      <ToolbarBtn onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive("underline")} title="Underline">
                        <UnderlineIcon className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                      <ToolbarBtn onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive("strike")} title="Strikethrough">
                        <Strikethrough className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                      <ToolbarBtn onClick={() => editor?.chain().focus().toggleCode().run()} active={editor?.isActive("code")} title="Inline code">
                        <Code className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                      <div className="w-px h-5 bg-white/10 mx-1" />

                      {/* Alignment */}
                      <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign("left").run()} active={editor?.isActive({ textAlign: "left" })} title="Align left">
                        <AlignLeft className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                      <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign("center").run()} active={editor?.isActive({ textAlign: "center" })} title="Align center">
                        <AlignCenter className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                      <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign("right").run()} active={editor?.isActive({ textAlign: "right" })} title="Align right">
                        <AlignRight className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                      <div className="w-px h-5 bg-white/10 mx-1" />

                      {/* Lists */}
                      <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")} title="Bullet list">
                        <List className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                      <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")} title="Numbered list">
                        <ListOrdered className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                      <ToolbarBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive("blockquote")} title="Blockquote">
                        <Quote className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                      <div className="w-px h-5 bg-white/10 mx-1" />

                      {/* Link & Image */}
                      <ToolbarBtn onClick={() => setLinkDialog(true)} active={editor?.isActive("link")} title="Insert/edit link">
                        <LinkIcon className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                      {editor?.isActive("link") && (
                        <ToolbarBtn onClick={() => editor?.chain().focus().unsetLink().run()} title="Remove link">
                          <X className="w-3.5 h-3.5" />
                        </ToolbarBtn>
                      )}
                      <ToolbarBtn onClick={() => setImageDialog(true)} title="Insert image">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </ToolbarBtn>
                    </div>

                    {/* Editor */}
                    <div className="min-h-[400px] bg-[#0D0F14]">
                      <EditorContent editor={editor} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <LinkDialog
        open={linkDialog}
        onClose={() => setLinkDialog(false)}
        onConfirm={handleLinkConfirm}
        initialUrl={editor?.getAttributes("link").href ?? ""}
      />
      <ImageDialog
        open={imageDialog}
        onClose={() => setImageDialog(false)}
        onConfirm={handleImageConfirm}
      />
    </AdminLayout>
  );
}
