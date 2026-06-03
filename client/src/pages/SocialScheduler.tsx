/**
 * Social Media Scheduler — Full UI
 * Tabs: Queue | Compose | AI Generator | Accounts
 */
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar, Clock, Wand2, Send, Trash2, Edit, CheckCircle,
  XCircle, Plus, Facebook, Linkedin, Instagram,
  Copy, ExternalLink, Zap, Share2, Settings, RefreshCw
} from "lucide-react";

type Locale = "cs" | "en";

const T = {
  cs: {
    title: "Plánovač sociálních sítí",
    subtitle: "Plánujte a automatizujte příspěvky na sociálních sítích",
    tabs: { queue: "Fronta", compose: "Nový příspěvek", aiGen: "AI Generátor", accounts: "Účty" },
    queue: {
      empty: "Fronta je prázdná",
      emptyDesc: "Vytvořte nový příspěvek nebo vygenerujte obsah pomocí AI.",
      status: { draft: "Koncept", scheduled: "Naplánováno", published: "Publikováno", failed: "Chyba", publishing: "Publikuji..." },
      publishNow: "Publikovat nyní",
      delete: "Smazat",
    },
    compose: {
      postTitle: "Název (interní)",
      caption: "Text příspěvku",
      captionPlaceholder: "Napište text příspěvku...",
      hashtags: "Hashtagy",
      hashtagsPlaceholder: "#humandesign #bodygraph #seberozvoj",
      imageUrl: "URL obrázku",
      imageUrlPlaceholder: "https://...",
      postType: "Typ příspěvku",
      locale: "Jazyk",
      scheduleAt: "Naplánovat na",
      accounts: "Cílové účty",
      noAccounts: "Nejprve připojte sociální sítě v záložce Účty",
      saveDraft: "Uložit koncept",
      schedule: "Naplánovat",
      generateCaption: "AI caption",
      postTypes: {
        hd_type: "Typ HD", quote: "Citát", infographic: "Infografika",
        transit: "Tranzit", iching: "I-Ťing", promo: "Promo", custom: "Vlastní",
      },
    },
    aiGen: {
      title: "AI Generátor vizuálů",
      subtitle: "Vygenerujte HD-tematické obrázky pro sociální sítě",
      topic: "Téma",
      topicPlaceholder: "např. Generator typ, Brána 1, Denní tranzit...",
      style: "Styl",
      styles: { dark_cosmic: "Tmavý kosmický", light_minimal: "Světlý minimalistický", golden_mystical: "Zlatý mystický" },
      postType: "Typ obsahu",
      generate: "Generovat obrázek",
      generating: "Generuji...",
      useImage: "Kopírovat URL",
      download: "Otevřít",
    },
    accounts: {
      title: "Připojené účty",
      connect: "Připojit účet",
      disconnect: "Odpojit",
      noAccounts: "Žádné připojené účty",
      noAccountsDesc: "Připojte své sociální sítě pro automatické publikování.",
      platform: "Platforma",
      accountName: "Název účtu",
      accessToken: "Access Token",
      pageId: "Page ID",
      save: "Uložit",
      cancel: "Zrušit",
      connected: "Připojeno",
    },
  },
  en: {
    title: "Social Media Scheduler",
    subtitle: "Plan and automate your social media posts",
    tabs: { queue: "Queue", compose: "New Post", aiGen: "AI Generator", accounts: "Accounts" },
    queue: {
      empty: "Queue is empty",
      emptyDesc: "Create a new post or generate content with AI.",
      status: { draft: "Draft", scheduled: "Scheduled", published: "Published", failed: "Failed", publishing: "Publishing..." },
      publishNow: "Publish Now",
      delete: "Delete",
    },
    compose: {
      postTitle: "Title (internal)",
      caption: "Post caption",
      captionPlaceholder: "Write your post caption...",
      hashtags: "Hashtags",
      hashtagsPlaceholder: "#humandesign #bodygraph #selfawareness",
      imageUrl: "Image URL",
      imageUrlPlaceholder: "https://...",
      postType: "Post type",
      locale: "Language",
      scheduleAt: "Schedule at",
      accounts: "Target accounts",
      noAccounts: "First connect social accounts in the Accounts tab",
      saveDraft: "Save Draft",
      schedule: "Schedule",
      generateCaption: "AI caption",
      postTypes: {
        hd_type: "HD Type", quote: "Quote", infographic: "Infographic",
        transit: "Transit", iching: "I-Ching", promo: "Promo", custom: "Custom",
      },
    },
    aiGen: {
      title: "AI Visual Generator",
      subtitle: "Generate HD-themed images for social media",
      topic: "Topic",
      topicPlaceholder: "e.g. Generator type, Gate 1, Daily transit...",
      style: "Style",
      styles: { dark_cosmic: "Dark Cosmic", light_minimal: "Light Minimal", golden_mystical: "Golden Mystical" },
      postType: "Content type",
      generate: "Generate Image",
      generating: "Generating...",
      useImage: "Copy URL",
      download: "Open",
    },
    accounts: {
      title: "Connected Accounts",
      connect: "Connect Account",
      disconnect: "Disconnect",
      noAccounts: "No connected accounts",
      noAccountsDesc: "Connect your social media accounts for automated publishing.",
      platform: "Platform",
      accountName: "Account name",
      accessToken: "Access Token",
      pageId: "Page ID",
      save: "Save",
      cancel: "Cancel",
      connected: "Connected",
    },
  },
};

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "bg-blue-600",
  instagram: "bg-gradient-to-br from-purple-600 to-pink-500",
  linkedin: "bg-blue-700",
  pinterest: "bg-red-600",
};

// ─── Queue Tab ────────────────────────────────────────────────────────────────

function QueueTab({ locale, t }: { locale: Locale; t: typeof T.cs }) {
  const utils = trpc.useUtils();

  const { data: posts, isLoading } = trpc.social.listPosts.useQuery({ status: "all", limit: 100 });

  const publishNow = trpc.social.publishNow.useMutation({
    onSuccess: () => {
      toast.success(locale === "cs" ? "Příspěvek publikován!" : "Post published!");
      utils.social.listPosts.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePost = trpc.social.deletePost.useMutation({
    onSuccess: () => {
      toast.success(locale === "cs" ? "Příspěvek smazán" : "Post deleted");
      utils.social.listPosts.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
    </div>
  );

  if (!posts || posts.length === 0) return (
    <div className="text-center py-16">
      <Share2 className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-40" />
      <p className="font-medium text-muted-foreground">{t.queue.empty}</p>
      <p className="text-sm text-muted-foreground mt-1">{t.queue.emptyDesc}</p>
    </div>
  );

  const grouped = {
    scheduled: posts.filter(p => p.status === "scheduled"),
    draft: posts.filter(p => p.status === "draft"),
    published: posts.filter(p => p.status === "published"),
    failed: posts.filter(p => p.status === "failed"),
  };

  const statusIcons: Record<string, React.ReactNode> = {
    scheduled: <Clock className="w-4 h-4 text-blue-500" />,
    draft: <Edit className="w-4 h-4 text-muted-foreground" />,
    published: <CheckCircle className="w-4 h-4 text-green-500" />,
    failed: <XCircle className="w-4 h-4 text-red-500" />,
  };

  return (
    <div className="space-y-6">
      {(["scheduled", "draft", "failed", "published"] as const).map(status => {
        const group = grouped[status];
        if (group.length === 0) return null;
        return (
          <div key={status}>
            <div className="flex items-center gap-2 mb-3">
              {statusIcons[status]}
              <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t.queue.status[status as keyof typeof t.queue.status]} ({group.length})
              </span>
            </div>
            <div className="space-y-2">
              {group.map(post => {
                const platforms: string[] = Array.isArray(post.platforms) ? post.platforms as string[] : [];
                return (
                  <Card key={post.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {post.imageUrl && (
                          <img src={post.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-medium truncate">{post.title || post.caption.slice(0, 60)}</p>
                            <div className="flex gap-1 shrink-0">
                              {platforms.map(p => {
                                const Icon = PLATFORM_ICONS[p] ?? Share2;
                                return <Icon key={p} className="w-4 h-4 text-muted-foreground" />;
                              })}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{post.caption}</p>
                          {post.scheduledAt && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {new Date(post.scheduledAt).toLocaleString(locale === "cs" ? "cs-CZ" : "en-US")}
                              </span>
                            </div>
                          )}
                          {post.errorMessage && (
                            <p className="text-xs text-red-500 mt-1">{post.errorMessage}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          {(status === "scheduled" || status === "draft") && (
                            <Button
                              size="sm" variant="outline" className="text-xs h-7 px-2"
                              onClick={() => publishNow.mutate({ postId: post.id })}
                              disabled={publishNow.isPending}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              {t.queue.publishNow}
                            </Button>
                          )}
                          {(status === "draft" || status === "scheduled" || status === "failed") && (
                            <Button
                              size="sm" variant="ghost" className="text-xs h-7 px-2 text-red-500 hover:text-red-600"
                              onClick={() => deletePost.mutate({ postId: post.id })}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              {t.queue.delete}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Compose Tab ──────────────────────────────────────────────────────────────

function ComposeTab({ locale, t }: { locale: Locale; t: typeof T.cs }) {
  const utils = trpc.useUtils();

  const [caption, setCaption] = useState("");
  const [title, setTitle] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [postType, setPostType] = useState<"hd_type" | "quote" | "infographic" | "transit" | "iching" | "promo" | "custom">("custom");
  const [postLocale, setPostLocale] = useState<"cs" | "en">(locale);
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);

  const { data: accounts } = trpc.social.listAccounts.useQuery();

  const savePost = trpc.social.savePost.useMutation({
    onSuccess: () => {
      toast.success(scheduledAt
        ? (locale === "cs" ? "Příspěvek naplánován!" : "Post scheduled!")
        : (locale === "cs" ? "Koncept uložen" : "Draft saved"));
      utils.social.listPosts.invalidate();
      setCaption(""); setTitle(""); setHashtags(""); setImageUrl(""); setScheduledAt(""); setSelectedAccounts([]);
    },
    onError: (e) => toast.error(e.message),
  });

  const generateCaption = trpc.social.generateCaption.useMutation({
    onSuccess: (data) => {
      const parts = data.caption.split(/\n\n#/);
      if (parts.length > 1) {
        setCaption(parts[0].trim());
        setHashtags("#" + parts.slice(1).join("\n\n#").trim());
      } else {
        setCaption(data.caption);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleAccount = (id: number) => {
    setSelectedAccounts(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const handleSave = (asDraft: boolean) => {
    if (!caption.trim()) {
      toast.error(locale === "cs" ? "Vyplňte text příspěvku" : "Enter post caption");
      return;
    }
    if (selectedAccounts.length === 0) {
      toast.error(locale === "cs" ? "Vyberte alespoň jeden účet" : "Select at least one account");
      return;
    }
    const platforms = accounts?.filter(a => selectedAccounts.includes(a.id)).map(a => a.platform) ?? [];
    savePost.mutate({
      title: title || undefined,
      caption,
      hashtags: hashtags || undefined,
      imageUrl: imageUrl || undefined,
      postType,
      locale: postLocale,
      scheduledAt: (!asDraft && scheduledAt) ? new Date(scheduledAt) : undefined,
      platforms,
      accountIds: selectedAccounts,
    });
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t.compose.postTitle}</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Interní název..." />
        </div>
        <div className="space-y-1.5">
          <Label>{t.compose.postType}</Label>
          <Select value={postType} onValueChange={v => setPostType(v as typeof postType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(t.compose.postTypes).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>{t.compose.caption}</Label>
          <Button
            size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => generateCaption.mutate({ postType, topic: caption || "Human Design", locale: postLocale, tone: "inspirational" })}
            disabled={generateCaption.isPending}
          >
            <Wand2 className="w-3 h-3" />
            {generateCaption.isPending ? "..." : t.compose.generateCaption}
          </Button>
        </div>
        <Textarea
          value={caption} onChange={e => setCaption(e.target.value)}
          placeholder={t.compose.captionPlaceholder} rows={5} className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">{caption.length} znaků</p>
      </div>

      <div className="space-y-1.5">
        <Label>{t.compose.hashtags}</Label>
        <Input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder={t.compose.hashtagsPlaceholder} />
      </div>

      <div className="space-y-1.5">
        <Label>{t.compose.imageUrl}</Label>
        <div className="flex gap-2">
          <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder={t.compose.imageUrlPlaceholder} className="flex-1" />
          {imageUrl && <img src={imageUrl} alt="" className="w-10 h-10 rounded object-cover border" />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t.compose.locale}</Label>
          <Select value={postLocale} onValueChange={v => setPostLocale(v as "cs" | "en")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cs">🇨🇿 Čeština</SelectItem>
              <SelectItem value="en">🇬🇧 English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t.compose.scheduleAt}</Label>
          <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t.compose.accounts}</Label>
        {!accounts || accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.compose.noAccounts}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {accounts.map(acc => {
              const Icon = PLATFORM_ICONS[acc.platform] ?? Share2;
              const selected = selectedAccounts.includes(acc.id);
              return (
                <button
                  key={acc.id}
                  onClick={() => toggleAccount(acc.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all ${selected ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {acc.accountName}
                  {selected && <CheckCircle className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => handleSave(true)} disabled={savePost.isPending}>
          <Edit className="w-4 h-4 mr-2" />
          {t.compose.saveDraft}
        </Button>
        <Button onClick={() => handleSave(false)} disabled={savePost.isPending || !scheduledAt}>
          <Calendar className="w-4 h-4 mr-2" />
          {t.compose.schedule}
        </Button>
      </div>
    </div>
  );
}

// ─── AI Generator Tab ─────────────────────────────────────────────────────────

function AiGeneratorTab({ locale, t }: { locale: Locale; t: typeof T.cs }) {
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState<"dark_cosmic" | "light_minimal" | "golden_mystical">("dark_cosmic");
  const [postType, setPostType] = useState<"hd_type" | "quote" | "infographic" | "transit" | "iching" | "promo" | "custom">("hd_type");
  const [generatedImages, setGeneratedImages] = useState<{ imageUrl: string; prompt: string }[]>([]);

  const generateImage = trpc.social.generatePostImage.useMutation({
    onSuccess: (data) => {
      setGeneratedImages(prev => [data, ...prev]);
      toast.success(locale === "cs" ? "Obrázek vygenerován!" : "Image generated!");
    },
    onError: (e) => toast.error(e.message),
  });

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success(locale === "cs" ? "URL zkopírována" : "URL copied");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-primary" />
            {t.aiGen.title}
          </CardTitle>
          <CardDescription>{t.aiGen.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t.aiGen.postType}</Label>
              <Select value={postType} onValueChange={v => setPostType(v as typeof postType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(t.compose.postTypes).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t.aiGen.style}</Label>
              <Select value={style} onValueChange={v => setStyle(v as typeof style)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(t.aiGen.styles).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t.aiGen.topic}</Label>
            <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder={t.aiGen.topicPlaceholder} />
          </div>
          <Button
            className="w-full"
            onClick={() => generateImage.mutate({ postType, topic: topic || "Human Design", style, locale })}
            disabled={generateImage.isPending}
          >
            {generateImage.isPending ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />{t.aiGen.generating}</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" />{t.aiGen.generate}</>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedImages.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {generatedImages.map((img, i) => (
            <Card key={i} className="overflow-hidden group">
              <div className="relative aspect-square">
                <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => copyUrl(img.imageUrl)}>
                    <Copy className="w-3 h-3 mr-1" />{t.aiGen.useImage}
                  </Button>
                  <a href={img.imageUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="w-3 h-3 mr-1" />{t.aiGen.download}
                    </Button>
                  </a>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground line-clamp-2">{img.prompt}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Accounts Tab ─────────────────────────────────────────────────────────────

function AccountsTab({ locale, t }: { locale: Locale; t: typeof T.cs }) {
  const utils = trpc.useUtils();

  const [showForm, setShowForm] = useState(false);
  const [platform, setPlatform] = useState<"facebook" | "instagram" | "linkedin" | "pinterest">("instagram");
  const [accountName, setAccountName] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [pageId, setPageId] = useState("");
  const [pageName, setPageName] = useState("");

  const { data: accounts, isLoading } = trpc.social.listAccounts.useQuery();

  const saveAccount = trpc.social.saveAccount.useMutation({
    onSuccess: () => {
      toast.success(locale === "cs" ? "Účet připojen!" : "Account connected!");
      utils.social.listAccounts.invalidate();
      setShowForm(false);
      setAccessToken(""); setAccountId(""); setAccountName(""); setPageId(""); setPageName("");
    },
    onError: (e) => toast.error(e.message),
  });

  const disconnectAccount = trpc.social.disconnectAccount.useMutation({
    onSuccess: () => {
      toast.success(locale === "cs" ? "Účet odpojen" : "Account disconnected");
      utils.social.listAccounts.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const PLATFORM_INSTRUCTIONS: Record<string, string> = {
    facebook: locale === "cs"
      ? "Získejte Page Access Token z Meta for Developers → Tools → Graph API Explorer. Vyberte svou stránku a zkopírujte token."
      : "Get your Page Access Token from Meta for Developers → Tools → Graph API Explorer. Select your page and copy the token.",
    instagram: locale === "cs"
      ? "Instagram vyžaduje Facebook Page Access Token s oprávněním instagram_basic a instagram_content_publish. Účet musí být Business nebo Creator."
      : "Instagram requires a Facebook Page Access Token with instagram_basic and instagram_content_publish permissions. Account must be Business or Creator.",
    linkedin: locale === "cs"
      ? "Získejte Access Token z LinkedIn Developer Portal → OAuth 2.0 Tools. Potřebujete oprávnění w_member_social."
      : "Get your Access Token from LinkedIn Developer Portal → OAuth 2.0 Tools. You need the w_member_social permission.",
    pinterest: locale === "cs"
      ? "Pinterest API je momentálně v beta verzi. Získejte token z Pinterest Developer Portal."
      : "Pinterest API is currently in beta. Get your token from the Pinterest Developer Portal.",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{t.accounts.title}</h3>
          <p className="text-sm text-muted-foreground">
            {locale === "cs" ? "Spravujte připojené sociální sítě" : "Manage connected social media accounts"}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          {t.accounts.connect}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-1.5">
              <Label>{t.accounts.platform}</Label>
              <Select value={platform} onValueChange={v => setPlatform(v as typeof platform)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="pinterest">Pinterest</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">{PLATFORM_INSTRUCTIONS[platform]}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t.accounts.accountName}</Label>
                <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Můj Instagram" />
              </div>
              <div className="space-y-1.5">
                <Label>Account / User ID</Label>
                <Input value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="123456789" />
              </div>
            </div>
            {(platform === "facebook" || platform === "instagram") && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t.accounts.pageId}</Label>
                  <Input value={pageId} onChange={e => setPageId(e.target.value)} placeholder="Page ID" />
                </div>
                <div className="space-y-1.5">
                  <Label>Page Name</Label>
                  <Input value={pageName} onChange={e => setPageName(e.target.value)} placeholder="Název stránky" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>{t.accounts.accessToken}</Label>
              <Input
                type="password" value={accessToken}
                onChange={e => setAccessToken(e.target.value)}
                placeholder="EAABwzLixnjYBO..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => saveAccount.mutate({ platform, accountName, accountId, accessToken, pageId: pageId || undefined, pageName: pageName || undefined })}
                disabled={saveAccount.isPending || !accountName || !accountId || !accessToken}
              >
                {t.accounts.save}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>{t.accounts.cancel}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : !accounts || accounts.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl">
          <Settings className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-40" />
          <p className="font-medium text-muted-foreground">{t.accounts.noAccounts}</p>
          <p className="text-sm text-muted-foreground mt-1">{t.accounts.noAccountsDesc}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map(acc => {
            const Icon = PLATFORM_ICONS[acc.platform] ?? Share2;
            return (
              <Card key={acc.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full ${PLATFORM_COLORS[acc.platform] ?? "bg-muted"} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{acc.accountName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{acc.platform}{acc.pageName ? ` · ${acc.pageName}` : ""}</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/20 shrink-0">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {t.accounts.connected}
                  </Badge>
                  <Button
                    size="sm" variant="ghost" className="text-red-500 hover:text-red-600 shrink-0"
                    onClick={() => disconnectAccount.mutate({ accountId: acc.id })}
                  >
                    {t.accounts.disconnect}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SocialScheduler() {
  const { locale = "cs" } = useParams<{ locale: string }>();
  const safeLocale: Locale = locale === "en" ? "en" : "cs";
  const t = T[safeLocale];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container max-w-5xl py-8 pt-24">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="queue">
        <TabsList className="mb-6">
          <TabsTrigger value="queue" className="gap-2">
            <Calendar className="w-4 h-4" />{t.tabs.queue}
          </TabsTrigger>
          <TabsTrigger value="compose" className="gap-2">
            <Plus className="w-4 h-4" />{t.tabs.compose}
          </TabsTrigger>
          <TabsTrigger value="ai-gen" className="gap-2">
            <Wand2 className="w-4 h-4" />{t.tabs.aiGen}
          </TabsTrigger>
          <TabsTrigger value="accounts" className="gap-2">
            <Settings className="w-4 h-4" />{t.tabs.accounts}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue"><QueueTab locale={safeLocale} t={t} /></TabsContent>
        <TabsContent value="compose"><ComposeTab locale={safeLocale} t={t} /></TabsContent>
        <TabsContent value="ai-gen"><AiGeneratorTab locale={safeLocale} t={t} /></TabsContent>
        <TabsContent value="accounts"><AccountsTab locale={safeLocale} t={t} /></TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
