import { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { marked } from "marked";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Link2,
  ImageIcon, Mic, Video, Search, Wand2, RefreshCw, Save, Eye, EyeOff,
  Upload, Plus, Trash2, CheckCircle, AlertTriangle, Info, ChevronDown,
  ChevronUp, Loader2, FileText, Globe, Sparkles, AlignLeft, X, Clock,
  BookOpen, FolderOpen
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const AI_MODELS = [
  { id: "openrouter/owl-alpha", label: "⭐ Owl Alpha (Free)", group: "Free" },
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash Preview", group: "Free" },
  { id: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash", group: "Fast" },
  { id: "tencent/hunyuan-t1-preview", label: "Tencent HunyuanT1", group: "Fast" },
  { id: "google/gemini-2.5-flash-preview", label: "Gemini 2.5 Flash", group: "Premium" },
  { id: "anthropic/claude-3-haiku", label: "Claude 3 Haiku", group: "Premium" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini", group: "Premium" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", group: "Premium" },
  { id: "openai/gpt-4o", label: "GPT-4o", group: "Premium" },
  { id: "deepseek/deepseek-r1", label: "DeepSeek R1 (Reasoning)", group: "Premium" },
];

const IMAGE_MODELS = [
  { id: "bytedance-seed/seedream-4.5", label: "Seedream 4.5" },
  { id: "google/gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image" },
  { id: "google/gemini-3.1-flash-image-preview", label: "Gemini 3.1 Flash Image" },
];

const REWRITE_TONES = [
  { id: "more_aggressive", label: "More Aggressive / Urgent" },
  { id: "simpler", label: "Simpler / Clearer" },
  { id: "seo_optimized", label: "SEO Optimized" },
  { id: "shorter", label: "Shorter / Tighter" },
  { id: "more_authoritative", label: "More Authoritative" },
  { id: "conversational", label: "More Conversational" },
];

const AUTOSAVE_INTERVAL_MS = 30_000; // 30 seconds

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert AI markdown output to HTML for TipTap insertion */
function markdownToHtml(md: string): string {
  // marked.parse returns string synchronously when not using async option
  return marked.parse(md, { async: false }) as string;
}

// ─── Toolbar Button ────────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick, active = false, title, children, disabled = false
}: {
  onClick: () => void; active?: boolean; title: string;
  children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? "bg-amber-500/20 text-amber-400"
          : "text-gray-400 hover:text-white hover:bg-white/10"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

// ─── SEO Score Badge ──────────────────────────────────────────────────────────

function SeoScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-green-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  const bg = score >= 80 ? "bg-green-500/10 border-green-500/30" : score >= 50 ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30";
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-mono font-bold ${bg} ${color}`}>
      SEO {score}/100
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BlogStudio() {
  // Post selection
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [lastAutosaved, setLastAutosaved] = useState<Date | null>(null);
  const [autosaving, setAutosaving] = useState(false);

  // Post fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [published, setPublished] = useState(true);

  // Podcast fields
  const [podcastTitle, setPodcastTitle] = useState("");
  const [podcastDescription, setPodcastDescription] = useState("");
  const [podcastAudioUrl, setPodcastAudioUrl] = useState("");
  const [podcastEmbedUrl, setPodcastEmbedUrl] = useState("");
  const [podcastTranscript, setPodcastTranscript] = useState("");

  // Video fields
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoThumbnail, setVideoThumbnail] = useState("");

  // AI state
  const [aiModel, setAiModel] = useState("openrouter/owl-alpha");
  const [imageModel, setImageModel] = useState("bytedance-seed/seedream-4.5");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [rewriteTone, setRewriteTone] = useState("more_aggressive");
  const [researchQuery, setResearchQuery] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageImportUrl, setImageImportUrl] = useState("");

  // SEO state
  const [seoData, setSeoData] = useState<{
    wordCount: number; readingTime: number; h2Count: number; h3Count: number;
    internalLinks: number; externalLinks: number; keywordDensity: number;
    suggestions: Array<{ type: "warning" | "success" | "info"; message: string }>;
  } | null>(null);
  const [seoLoading, setSeoLoading] = useState(false);

  // Draft state
  const [showDraftPanel, setShowDraftPanel] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);

  // UI state
  const [activePanel, setActivePanel] = useState<"ai" | "seo" | "media" | "podcast" | "video">("ai");
  const [showMetaPanel, setShowMetaPanel] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // tRPC
  const { data: posts = [] } = trpc.content.listAllPosts.useQuery({ limit: 500, offset: 0 });
  const { data: topPages = [] } = trpc.blogStudio.getTopPages.useQuery({ limit: 15 });
  const updatePost = trpc.content.updatePost.useMutation();
  const generateContent = trpc.blogStudio.generateContent.useMutation();
  const analyzeSeo = trpc.blogStudio.analyzeSeo.useMutation();
  const generateImageMutation = trpc.blogStudio.generateImage.useMutation();
  const uploadImageMutation = trpc.content.uploadImage.useMutation();
  const saveDraftMutation = trpc.blogDrafts.save.useMutation();
  const deleteDraftMutation = trpc.blogDrafts.delete.useMutation();
  const utils = trpc.useUtils();

  // Get the slug for the selected post
  const selectedPost = (posts as any[]).find((p: any) => p.id === selectedPostId);
  const selectedSlug = selectedPost?.slug;

  const { data: postData } = trpc.content.getAdminPost.useQuery(
    { slug: selectedSlug! },
    { enabled: !!selectedSlug }
  );

  // Drafts for current post
  const { data: drafts = [], refetch: refetchDrafts } = trpc.blogDrafts.list.useQuery(
    { postSlug: selectedSlug! },
    { enabled: !!selectedSlug }
  );

  // Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-amber-400 underline" } }),
      Image.configure({ HTMLAttributes: { class: "max-w-full rounded-lg my-4" } }),
      Placeholder.configure({ placeholder: "Start writing your post... or use the AI assistant on the right →" }),
      TextStyle,
    ],
    content: "",
    onUpdate: () => setIsDirty(true),
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-amber max-w-none min-h-[500px] focus:outline-none text-gray-200 leading-relaxed",
      },
    },
  });

  // Load post when selected
  useEffect(() => {
    if (!postData || !editor) return;
    setTitle(postData.title || "");
    setSlug(postData.slug || "");
    setMetaTitle(postData.metaTitle || "");
    setMetaDescription(postData.metaDescription || "");
    setHeroImage(postData.heroImage || "");
    setTargetKeyword((postData as any).targetKeyword || "");
    setExcerpt(postData.excerpt || "");
    setPublished(postData.published === 1);
    setPodcastTitle((postData as any).podcastTitle || "");
    setPodcastDescription((postData as any).podcastDescription || "");
    setPodcastAudioUrl((postData as any).podcastAudioUrl || "");
    setPodcastEmbedUrl((postData as any).podcastEmbedUrl || "");
    setPodcastTranscript((postData as any).podcastTranscript || "");
    setVideoUrl((postData as any).videoUrl || "");
    setVideoTitle((postData as any).videoTitle || "");
    setVideoDescription((postData as any).videoDescription || "");
    setVideoThumbnail((postData as any).videoThumbnail || "");
    editor.commands.setContent(postData.content || "");
    setIsDirty(false);
    setLastAutosaved(null);
    setSeoData(null);
  }, [postData, editor]);

  // ─── Autosave ────────────────────────────────────────────────────────────────
  const doAutosave = useCallback(async () => {
    if (!selectedSlug || !editor) return;
    setAutosaving(true);
    try {
      await saveDraftMutation.mutateAsync({
        postSlug: selectedSlug,
        name: "autosave",
        title,
        content: editor.getHTML(),
        metaTitle,
        metaDescription,
        excerpt,
        heroImage,
        targetKeyword,
      });
      setLastAutosaved(new Date());
      setIsDirty(false);
    } catch {
      // Autosave failures are silent — don't interrupt the user
    } finally {
      setAutosaving(false);
    }
  }, [selectedSlug, editor, title, metaTitle, metaDescription, excerpt, heroImage, targetKeyword, saveDraftMutation]);

  // Set up autosave interval when a post is selected
  useEffect(() => {
    if (!selectedSlug) return;
    if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);
    autosaveTimerRef.current = setInterval(() => {
      doAutosave();
    }, AUTOSAVE_INTERVAL_MS);
    return () => {
      if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);
    };
  }, [selectedSlug, doAutosave]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ─── Save post ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedPostId || !editor) return;
    try {
      await updatePost.mutateAsync({
        slug: selectedSlug!,
        title,
        metaTitle,
        metaDescription,
        heroImage,
        excerpt,
        content: editor.getHTML(),
        published: published ? 1 : 0,
      } as any);
      setIsDirty(false);
      setLastAutosaved(new Date());
      toast.success("Post saved successfully");
    } catch (err) {
      toast.error("Failed to save post");
    }
  };

  // ─── Draft management ────────────────────────────────────────────────────────
  const handleSaveNamedDraft = async () => {
    if (!selectedSlug || !editor) return;
    const name = draftName.trim() || `Draft ${new Date().toLocaleString()}`;
    setSavingDraft(true);
    try {
      await saveDraftMutation.mutateAsync({
        postSlug: selectedSlug,
        name,
        title,
        content: editor.getHTML(),
        metaTitle,
        metaDescription,
        excerpt,
        heroImage,
        targetKeyword,
      });
      toast.success(`Draft "${name}" saved`);
      setDraftName("");
      refetchDrafts();
    } catch {
      toast.error("Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleRestoreDraft = (draft: any) => {
    if (!editor) return;
    if (isDirty && !confirm("Restoring this draft will overwrite your current unsaved changes. Continue?")) return;
    setTitle(draft.title || title);
    setMetaTitle(draft.metaTitle || metaTitle);
    setMetaDescription(draft.metaDescription || metaDescription);
    setExcerpt(draft.excerpt || excerpt);
    setHeroImage(draft.heroImage || heroImage);
    setTargetKeyword(draft.targetKeyword || targetKeyword);
    if (draft.content) editor.commands.setContent(draft.content);
    setIsDirty(true);
    toast.success(`Draft "${draft.name}" restored — remember to Save when done`);
  };

  const handleDeleteDraft = async (id: number, name: string) => {
    if (!confirm(`Delete draft "${name}"?`)) return;
    try {
      await deleteDraftMutation.mutateAsync({ id });
      toast.success("Draft deleted");
      refetchDrafts();
    } catch {
      toast.error("Failed to delete draft");
    }
  };

  // ─── AI generate ─────────────────────────────────────────────────────────────
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiOutput("");
    try {
      const result = await generateContent.mutateAsync({
        prompt: aiPrompt,
        model: aiModel,
        existingContent: editor?.getHTML(),
      });
      setAiOutput(result.content);
    } catch (err: any) {
      toast.error(err.message || "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  // AI rewrite selection
  const handleRewrite = async () => {
    if (!editor) return;
    const selection = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to, " ");
    if (!selectedText.trim()) {
      toast.error("Select some text in the editor first, then click Rewrite");
      return;
    }
    setAiLoading(true);
    setAiOutput("");
    try {
      const toneLabel = REWRITE_TONES.find(t => t.id === rewriteTone)?.label || rewriteTone;
      const result = await generateContent.mutateAsync({
        prompt: `Rewrite the following text to be ${toneLabel}. Keep the same core message but improve it. Return only the rewritten text, no explanation:\n\n${selectedText}`,
        model: aiModel,
      });
      setAiOutput(result.content);
    } catch (err: any) {
      toast.error(err.message || "Rewrite failed");
    } finally {
      setAiLoading(false);
    }
  };

  // AI research
  const handleResearch = async () => {
    if (!researchQuery.trim()) return;
    setAiLoading(true);
    setAiOutput("");
    try {
      const result = await generateContent.mutateAsync({
        prompt: `Research the following topic and provide a comprehensive summary with key facts, statistics, and talking points that would be useful for a blog post about solar contract issues and consumer protection. Format as bullet points with headers. Topic: ${researchQuery}`,
        model: aiModel,
      });
      setAiOutput(result.content);
    } catch (err: any) {
      toast.error(err.message || "Research failed");
    } finally {
      setAiLoading(false);
    }
  };

  // ─── Insert AI output into editor (FIXED: markdown → HTML) ───────────────────
  const handleInsertOutput = () => {
    if (!editor || !aiOutput) return;
    const html = markdownToHtml(aiOutput);
    editor.chain().focus().insertContent(html).run();
    setAiOutput("");
    setIsDirty(true);
    toast.success("Content inserted into editor");
  };

  // Replace selection with AI output
  const handleReplaceSelection = () => {
    if (!editor || !aiOutput) return;
    const { from, to } = editor.state.selection;
    if (from !== to) {
      // Replace selected text
      editor.chain().focus().deleteRange({ from, to }).insertContent(markdownToHtml(aiOutput)).run();
    } else {
      // No selection — just insert at cursor
      editor.chain().focus().insertContent(markdownToHtml(aiOutput)).run();
    }
    setAiOutput("");
    setIsDirty(true);
    toast.success("Content inserted");
  };

  // ─── SEO analysis ────────────────────────────────────────────────────────────
  const handleAnalyzeSeo = async () => {
    if (!editor) return;
    setSeoLoading(true);
    try {
      const result = await analyzeSeo.mutateAsync({
        title,
        content: editor?.getHTML() ?? "",
        targetKeyword: targetKeyword || undefined,
        slug,
      });
      setSeoData(result);
    } catch (err: any) {
      toast.error(err.message || "SEO analysis failed");
    } finally {
      setSeoLoading(false);
    }
  };

  // ─── Image handlers ──────────────────────────────────────────────────────────
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setImageLoading(true);
    try {
      const result = await generateImageMutation.mutateAsync({
        prompt: imagePrompt,
        model: imageModel,
        postSlug: slug || "blog",
      });
      setHeroImage(result.url);
      setIsDirty(true);
      toast.success("Image generated and set as hero image");
    } catch (err: any) {
      toast.error(err.message || "Image generation failed");
    } finally {
      setImageLoading(false);
    }
  };

  const handleImportImageUrl = async () => {
    if (!imageImportUrl.trim()) return;
    setHeroImage(imageImportUrl);
    setIsDirty(true);
    setImageImportUrl("");
    toast.success("Hero image updated");
  };

  const handleImageFileUpload = async (file: File) => {
    if (!file) return;
    setImageLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const result = await uploadImageMutation.mutateAsync({
          filename: file.name,
          contentType: file.type,
          base64,
        });
        setHeroImage(result.url);
        setIsDirty(true);
        toast.success("Image uploaded");
        setImageLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
      setImageLoading(false);
    }
  };

  const handleInsertImageIntoEditor = (url: string) => {
    if (!editor || !url) return;
    editor.commands.setImage({ src: url });
    setIsDirty(true);
  };

  const wordCount = editor ? editor.state.doc.textContent.split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  // Non-autosave drafts (for display in draft panel)
  const namedDrafts = (drafts as any[]).filter((d: any) => d.name !== "autosave");
  const autosaveDraft = (drafts as any[]).find((d: any) => d.name === "autosave");

  return (
    <AdminLayout>
      <div className="flex flex-col h-full min-h-screen bg-[#0D0F14]">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0D0F14]/90 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span className="text-white font-semibold">Blog Studio</span>
            </div>
            {/* Post selector */}
            <Select
              value={selectedPostId?.toString() || ""}
              onValueChange={(v) => setSelectedPostId(parseInt(v))}
            >
              <SelectTrigger className="w-72 bg-white/5 border-white/10 text-gray-200 text-sm">
                <SelectValue placeholder="Select a post to edit..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1d24] border-white/10">
                {(posts as any[]).map((p: any) => (
                  <SelectItem key={p.id} value={p.id.toString()} className="text-gray-200">
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            {/* Autosave status */}
            {autosaving && (
              <span className="text-gray-500 text-xs font-mono flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Autosaving...
              </span>
            )}
            {!autosaving && lastAutosaved && (
              <span className="text-gray-600 text-xs font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" /> Saved {lastAutosaved.toLocaleTimeString()}
              </span>
            )}
            {isDirty && !autosaving && (
              <span className="text-amber-400 text-xs font-mono">● Unsaved changes</span>
            )}
            <span className="text-gray-500 text-xs font-mono">{wordCount} words · {readingTime} min read</span>
            {seoData && <SeoScoreBadge score={Math.min(100, seoData.suggestions.filter(s => s.type === "success").length * 20)} />}
            {/* Drafts button */}
            {selectedSlug && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDraftPanel(!showDraftPanel)}
                className={`border-white/10 text-xs ${showDraftPanel ? "text-amber-400 border-amber-500/50" : "text-gray-400"}`}
              >
                <FolderOpen className="w-3.5 h-3.5 mr-1" />
                Drafts {namedDrafts.length > 0 ? `(${namedDrafts.length})` : ""}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPublished(!published)}
              className={`border-white/10 text-xs ${published ? "text-green-400" : "text-gray-400"}`}
            >
              {published ? <Eye className="w-3.5 h-3.5 mr-1" /> : <EyeOff className="w-3.5 h-3.5 mr-1" />}
              {published ? "Published" : "Draft"}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!selectedPostId || updatePost.isPending}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
            >
              {updatePost.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
              Save
            </Button>
          </div>
        </div>

        {/* Draft Panel (slide-down) */}
        {showDraftPanel && selectedSlug && (
          <div className="border-b border-white/10 bg-[#12141a] px-6 py-4">
            <div className="flex items-start gap-6">
              {/* Save new named draft */}
              <div className="flex-1 space-y-2">
                <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block">Save Current State as Draft</label>
                <div className="flex gap-2">
                  <Input
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    placeholder="Draft name (e.g. 'Version 2 — more aggressive')"
                    className="bg-white/5 border-white/10 text-gray-200 text-sm flex-1"
                    onKeyDown={e => e.key === "Enter" && handleSaveNamedDraft()}
                  />
                  <Button
                    onClick={handleSaveNamedDraft}
                    disabled={savingDraft}
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs whitespace-nowrap"
                  >
                    {savingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                    Save Draft
                  </Button>
                </div>
                {autosaveDraft && (
                  <p className="text-gray-600 text-xs">
                    Last autosave: {new Date(autosaveDraft.updatedAt).toLocaleString()}
                    {" · "}
                    <button
                      type="button"
                      onClick={() => handleRestoreDraft(autosaveDraft)}
                      className="text-amber-400 hover:underline"
                    >
                      Restore autosave
                    </button>
                  </p>
                )}
              </div>

              {/* Named drafts list */}
              {namedDrafts.length > 0 && (
                <div className="w-80 space-y-1.5">
                  <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block">Saved Drafts</label>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {namedDrafts.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-200 text-xs font-medium truncate">{d.name}</p>
                          <p className="text-gray-600 text-xs">{new Date(d.updatedAt).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => handleRestoreDraft(d)}
                            className="text-amber-400 hover:text-amber-300 text-xs px-2 py-1 rounded hover:bg-amber-500/10 transition-colors"
                            title="Restore this draft"
                          >
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDraft(d.id, d.name)}
                            className="text-gray-600 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                            title="Delete draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main 3-panel layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Editor */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Meta bar (collapsible) */}
            <div className="border-b border-white/10">
              <button
                type="button"
                onClick={() => setShowMetaPanel(!showMetaPanel)}
                className="w-full flex items-center justify-between px-6 py-2.5 text-gray-400 hover:text-white text-sm transition-colors"
              >
                <span className="font-medium">Post Settings & Meta</span>
                {showMetaPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showMetaPanel && (
                <div className="px-6 pb-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1">Title</label>
                    <Input value={title} onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
                      className="bg-white/5 border-white/10 text-white text-sm" placeholder="Post title..." />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1">Slug</label>
                    <Input value={slug} onChange={e => { setSlug(e.target.value); setIsDirty(true); }}
                      className="bg-white/5 border-white/10 text-white text-sm font-mono" placeholder="post-slug" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1">Meta Title</label>
                    <Input value={metaTitle} onChange={e => { setMetaTitle(e.target.value); setIsDirty(true); }}
                      className="bg-white/5 border-white/10 text-white text-sm" placeholder="SEO title (50-60 chars)" />
                    <span className={`text-xs mt-0.5 ${metaTitle.length > 65 ? "text-red-400" : "text-gray-500"}`}>{metaTitle.length}/65</span>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1">Target Keyword</label>
                    <Input value={targetKeyword} onChange={e => { setTargetKeyword(e.target.value); setIsDirty(true); }}
                      className="bg-white/5 border-white/10 text-white text-sm" placeholder="e.g. cancel solar contract" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1">Meta Description</label>
                    <Textarea value={metaDescription} onChange={e => { setMetaDescription(e.target.value); setIsDirty(true); }}
                      className="bg-white/5 border-white/10 text-white text-sm resize-none" rows={2} placeholder="SEO description (150-160 chars)" />
                    <span className={`text-xs mt-0.5 ${metaDescription.length > 165 ? "text-red-400" : "text-gray-500"}`}>{metaDescription.length}/165</span>
                  </div>
                  <div className="col-span-2">
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1">Excerpt</label>
                    <Textarea value={excerpt} onChange={e => { setExcerpt(e.target.value); setIsDirty(true); }}
                      className="bg-white/5 border-white/10 text-white text-sm resize-none" rows={2} placeholder="Short summary for blog cards..." />
                  </div>
                </div>
              )}
            </div>

            {/* Title input */}
            {selectedPostId && (
              <div className="px-6 pt-6 pb-2">
                <input
                  type="text"
                  value={title}
                  onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
                  placeholder="Post Title"
                  className="w-full bg-transparent text-white text-3xl font-bold placeholder-gray-600 border-none outline-none font-display"
                />
              </div>
            )}

            {/* Editor toolbar */}
            {editor && (
              <div className="px-6 py-2 flex items-center gap-1 flex-wrap border-b border-white/10 bg-white/2">
                <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
                  <Bold className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
                  <Italic className="w-4 h-4" />
                </ToolbarBtn>
                <div className="w-px h-5 bg-white/10 mx-1" />
                <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="H2">
                  <Heading2 className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="H3">
                  <Heading3 className="w-4 h-4" />
                </ToolbarBtn>
                <div className="w-px h-5 bg-white/10 mx-1" />
                <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
                  <List className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
                  <ListOrdered className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
                  <Quote className="w-4 h-4" />
                </ToolbarBtn>
                <div className="w-px h-5 bg-white/10 mx-1" />
                <ToolbarBtn
                  onClick={() => {
                    const url = window.prompt("Enter URL:");
                    if (url) editor.chain().focus().setLink({ href: url }).run();
                  }}
                  active={editor.isActive("link")}
                  title="Add Link"
                >
                  <Link2 className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() => {
                    const url = window.prompt("Enter image URL:");
                    if (url) editor.chain().focus().setImage({ src: url }).run();
                  }}
                  title="Insert Image"
                >
                  <ImageIcon className="w-4 h-4" />
                </ToolbarBtn>
              </div>
            )}

            {/* Editor body */}
            <div className="flex-1 px-6 py-4">
              {!selectedPostId ? (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <FileText className="w-16 h-16 text-gray-700 mb-4" />
                  <p className="text-gray-500 text-lg">Select a post to start editing</p>
                  <p className="text-gray-600 text-sm mt-1">Use the dropdown above to choose a blog post</p>
                </div>
              ) : (
                <EditorContent editor={editor} />
              )}
            </div>
          </div>

          {/* Right: Panels */}
          <div className="w-96 border-l border-white/10 flex flex-col bg-[#0D0F14] overflow-y-auto">
            {/* Panel tabs */}
            <div className="flex border-b border-white/10 sticky top-0 bg-[#0D0F14] z-10">
              {[
                { id: "ai", icon: <Wand2 className="w-3.5 h-3.5" />, label: "AI" },
                { id: "seo", icon: <Search className="w-3.5 h-3.5" />, label: "SEO" },
                { id: "media", icon: <ImageIcon className="w-3.5 h-3.5" />, label: "Images" },
                { id: "podcast", icon: <Mic className="w-3.5 h-3.5" />, label: "Podcast" },
                { id: "video", icon: <Video className="w-3.5 h-3.5" />, label: "Video" },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePanel(tab.id as any)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                    activePanel === tab.id
                      ? "text-amber-400 border-b-2 border-amber-400"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* AI Panel */}
            {activePanel === "ai" && (
              <div className="p-4 space-y-4">
                {/* Model selector */}
                <div>
                  <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1.5">AI Model</label>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-gray-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-white/10">
                      {AI_MODELS.map(m => (
                        <SelectItem key={m.id} value={m.id} className="text-gray-200 text-sm">
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Write / Generate */}
                <div className="space-y-2">
                  <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block">Write / Generate</label>
                  <Textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="e.g. Write an intro section about why solar contracts trap homeowners..."
                    className="bg-white/5 border-white/10 text-gray-200 text-sm resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={handleAiGenerate}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm"
                  >
                    {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Generate
                  </Button>
                </div>

                {/* Rewrite selection */}
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block">Rewrite Selection</label>
                  <p className="text-gray-600 text-xs">Select text in the editor, then choose a tone and click Rewrite</p>
                  <Select value={rewriteTone} onValueChange={setRewriteTone}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-gray-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-white/10">
                      {REWRITE_TONES.map(t => (
                        <SelectItem key={t.id} value={t.id} className="text-gray-200 text-sm">{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleRewrite}
                    disabled={aiLoading}
                    variant="outline"
                    className="w-full border-white/10 text-gray-300 hover:text-white text-sm"
                  >
                    {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Rewrite Selection
                  </Button>
                </div>

                {/* Research */}
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block">AI Research</label>
                  <Input
                    value={researchQuery}
                    onChange={e => setResearchQuery(e.target.value)}
                    placeholder="e.g. Sunrun contract cancellation statistics 2024"
                    className="bg-white/5 border-white/10 text-gray-200 text-sm"
                  />
                  <Button
                    onClick={handleResearch}
                    disabled={aiLoading || !researchQuery.trim()}
                    variant="outline"
                    className="w-full border-white/10 text-gray-300 hover:text-white text-sm"
                  >
                    {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
                    Research Topic
                  </Button>
                </div>

                {/* AI Output */}
                {aiOutput && (
                  <div className="border-t border-white/10 pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-400 text-xs font-mono uppercase tracking-wider">AI Output</label>
                      <button type="button" onClick={() => setAiOutput("")} className="text-gray-600 hover:text-gray-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-gray-300 text-sm max-h-64 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                      {aiOutput}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleInsertOutput} size="sm" className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Insert into Body
                      </Button>
                      <Button onClick={handleReplaceSelection} size="sm" variant="outline" className="flex-1 border-white/10 text-gray-300 text-xs">
                        <RefreshCw className="w-3.5 h-3.5 mr-1" /> Replace Selection
                      </Button>
                    </div>
                    <p className="text-gray-600 text-xs text-center">Markdown is automatically converted to formatted HTML</p>
                  </div>
                )}
              </div>
            )}

            {/* SEO Panel */}
            {activePanel === "seo" && (
              <div className="p-4 space-y-4">
                <Button
                  onClick={handleAnalyzeSeo}
                  disabled={seoLoading || !selectedPostId}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm"
                >
                  {seoLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  Analyze SEO
                </Button>

                {seoData && (
                  <div className="space-y-3">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Words", value: seoData.wordCount },
                        { label: "Read", value: `${seoData.readingTime}m` },
                        { label: "H2s", value: seoData.h2Count },
                        { label: "H3s", value: seoData.h3Count },
                        { label: "Int. Links", value: seoData.internalLinks },
                        { label: "Keyword %", value: `${seoData.keywordDensity}%` },
                      ].map(stat => (
                        <div key={stat.label} className="bg-white/5 rounded-lg p-2 text-center">
                          <div className="text-white font-bold text-sm">{stat.value}</div>
                          <div className="text-gray-500 text-xs">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    {/* Suggestions */}
                    <div className="space-y-2">
                      {seoData.suggestions.map((s, i) => (
                        <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${
                          s.type === "success" ? "bg-green-500/10 text-green-300" :
                          s.type === "warning" ? "bg-red-500/10 text-red-300" :
                          "bg-blue-500/10 text-blue-300"
                        }`}>
                          {s.type === "success" ? <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> :
                           s.type === "warning" ? <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> :
                           <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
                          <span className="leading-relaxed">{s.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top performing pages from GA4 */}
                {topPages.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-2">Top Pages (90 days)</label>
                    <div className="space-y-1.5">
                      {topPages.slice(0, 8).map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-400 truncate flex-1 mr-2 font-mono">{p.path}</span>
                          <span className="text-amber-400 font-mono flex-shrink-0">{p.views.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Images Panel */}
            {activePanel === "media" && (
              <div className="p-4 space-y-4">
                {/* Hero image preview */}
                {heroImage && (
                  <div className="relative">
                    <img src={heroImage} alt="Hero" className="w-full h-40 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => { setHeroImage(""); setIsDirty(true); }}
                      className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-red-500/80"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-2 left-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => heroImage && handleInsertImageIntoEditor(heroImage)}
                        className="bg-black/60 text-white text-xs px-2 py-1 rounded hover:bg-amber-500/80"
                      >
                        Insert in body
                      </button>
                    </div>
                  </div>
                )}

                {/* Generate image */}
                <div className="space-y-2">
                  <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block">Generate with AI</label>
                  <Select value={imageModel} onValueChange={setImageModel}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-gray-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-white/10">
                      {IMAGE_MODELS.map(m => (
                        <SelectItem key={m.id} value={m.id} className="text-gray-200 text-sm">{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={imagePrompt}
                    onChange={e => setImagePrompt(e.target.value)}
                    placeholder="e.g. Frustrated homeowner looking at solar panels on roof, dramatic lighting, photorealistic"
                    className="bg-white/5 border-white/10 text-gray-200 text-sm resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={handleGenerateImage}
                    disabled={imageLoading || !imagePrompt.trim()}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm"
                  >
                    {imageLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Generate Image
                  </Button>
                </div>

                {/* Import from URL */}
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block">Import from URL</label>
                  <div className="flex gap-2">
                    <Input
                      value={imageImportUrl}
                      onChange={e => setImageImportUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-white/5 border-white/10 text-gray-200 text-sm flex-1"
                    />
                    <Button onClick={handleImportImageUrl} size="sm" variant="outline" className="border-white/10 text-gray-300">
                      Set
                    </Button>
                  </div>
                </div>

                {/* Upload file */}
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block">Upload File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleImageFileUpload(e.target.files[0])}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageLoading}
                    variant="outline"
                    className="w-full border-white/10 text-gray-300 hover:text-white text-sm"
                  >
                    {imageLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload Image
                  </Button>
                </div>
              </div>
            )}

            {/* Podcast Panel */}
            {activePanel === "podcast" && (
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="w-4 h-4 text-amber-400" />
                  <span className="text-white text-sm font-medium">Podcast Episode</span>
                </div>
                <p className="text-gray-500 text-xs">Attach a podcast episode to this blog post. Supports MP3 uploads, external URLs, or NotebookLM embed links.</p>

                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1">Episode Title</label>
                    <Input value={podcastTitle} onChange={e => { setPodcastTitle(e.target.value); setIsDirty(true); }}
                      className="bg-white/5 border-white/10 text-white text-sm" placeholder="Episode title..." />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1">Audio URL (MP3 or external)</label>
                    <Input value={podcastAudioUrl} onChange={e => { setPodcastAudioUrl(e.target.value); setIsDirty(true); }}
                      className="bg-white/5 border-white/10 text-white text-sm font-mono" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1">NotebookLM / Embed URL</label>
                    <Input value={podcastEmbedUrl} onChange={e => { setPodcastEmbedUrl(e.target.value); setIsDirty(true); }}
                      className="bg-white/5 border-white/10 text-white text-sm font-mono" placeholder="NotebookLM share link or Spotify embed..." />
                    <p className="text-gray-600 text-xs mt-1">Paste your NotebookLM Audio Overview share link here</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1">Description / Show Notes</label>
                    <Textarea value={podcastDescription} onChange={e => { setPodcastDescription(e.target.value); setIsDirty(true); }}
                      className="bg-white/5 border-white/10 text-white text-sm resize-none" rows={3} placeholder="Episode description and show notes..." />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1">Transcript</label>
                    <Textarea value={podcastTranscript} onChange={e => { setPodcastTranscript(e.target.value); setIsDirty(true); }}
                      className="bg-white/5 border-white/10 text-white text-sm resize-none" rows={5} placeholder="Full episode transcript (great for SEO)..." />
                  </div>
                  {/* Upload audio */}
                  <div className="border-t border-white/10 pt-3">
                    <input ref={audioInputRef} type="file" accept="audio/*" className="hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        toast.info("Upload audio via the file upload feature — store in S3 and paste the URL above");
                      }}
                    />
                    <Button onClick={() => audioInputRef.current?.click()} variant="outline"
                      className="w-full border-white/10 text-gray-300 hover:text-white text-sm">
                      <Upload className="w-4 h-4 mr-2" /> Upload MP3
                    </Button>
                  </div>
                </div>

                {/* Preview */}
                {(podcastAudioUrl || podcastEmbedUrl) && (
                  <div className="border-t border-white/10 pt-4">
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-2">Preview</label>
                    {podcastAudioUrl && (
                      <audio controls className="w-full" src={podcastAudioUrl}>
                        Your browser does not support the audio element.
                      </audio>
                    )}
                    {podcastEmbedUrl && podcastEmbedUrl.includes("notebooklm") && (
                      <div className="bg-white/5 rounded-lg p-3 text-xs text-gray-400">
                        NotebookLM embed: <a href={podcastEmbedUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400 underline break-all">{podcastEmbedUrl}</a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Video Panel */}
            {activePanel === "video" && (
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="w-4 h-4 text-amber-400" />
                  <span className="text-white text-sm font-medium">Vlog / Video</span>
                </div>
                <p className="text-gray-500 text-xs">Attach a video to this blog post. Supports YouTube, Vimeo, or direct video URLs.</p>

                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1">Video Title</label>
                    <Input value={videoTitle} onChange={e => { setVideoTitle(e.target.value); setIsDirty(true); }}
                      className="bg-white/5 border-white/10 text-white text-sm" placeholder="Video title..." />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1">Video URL</label>
                    <Input value={videoUrl} onChange={e => { setVideoUrl(e.target.value); setIsDirty(true); }}
                      className="bg-white/5 border-white/10 text-white text-sm font-mono" placeholder="YouTube, Vimeo, or direct video URL..." />
                    <p className="text-gray-600 text-xs mt-1">YouTube: paste the full URL (e.g. https://youtube.com/watch?v=...)</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1">Thumbnail URL</label>
                    <Input value={videoThumbnail} onChange={e => { setVideoThumbnail(e.target.value); setIsDirty(true); }}
                      className="bg-white/5 border-white/10 text-white text-sm font-mono" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1">Description</label>
                    <Textarea value={videoDescription} onChange={e => { setVideoDescription(e.target.value); setIsDirty(true); }}
                      className="bg-white/5 border-white/10 text-white text-sm resize-none" rows={3} placeholder="Video description..." />
                  </div>
                </div>

                {/* Preview */}
                {videoUrl && (
                  <div className="border-t border-white/10 pt-4">
                    <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-2">Preview</label>
                    {videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
                      <div className="aspect-video rounded-lg overflow-hidden bg-black">
                        <iframe
                          src={`https://www.youtube.com/embed/${videoUrl.includes("v=") ? videoUrl.split("v=")[1]?.split("&")[0] : videoUrl.split("/").pop()}`}
                          className="w-full h-full"
                          allowFullScreen
                          title="Video preview"
                        />
                      </div>
                    ) : videoUrl.includes("vimeo.com") ? (
                      <div className="aspect-video rounded-lg overflow-hidden bg-black">
                        <iframe
                          src={`https://player.vimeo.com/video/${videoUrl.split("/").pop()}`}
                          className="w-full h-full"
                          allowFullScreen
                          title="Video preview"
                        />
                      </div>
                    ) : (
                      <video controls className="w-full rounded-lg" src={videoUrl}>
                        Your browser does not support the video element.
                      </video>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
