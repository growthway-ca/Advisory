// Upload step for new posts. The caller first creates a posts row (status 'uploading') and gets back its id and
// one-time upload_token; then:
//   POST {post_id, upload_token, action: "urls", files?: ["reel.mp4","cover.png"] | ["01.jpg","02.jpg",...]}
//        -> {urls: {name: {signedUrl, path, token}}, plus legacy video/cover keys}
//   PUT each file to its URL
//   POST {post_id, upload_token, action: "done"} -> row moves to 'pending' (waiting for approval)
import { admin, cors, json } from "../_shared/common.ts";

const NAME = /^[a-z0-9-]{1,40}\.(mp4|png|jpg)$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const db = admin();
  const { post_id, upload_token, action, files } = await req.json().catch(() => ({}));
  if (!post_id || !upload_token) return json({ error: "post_id and upload_token required" }, 400);
  const { data: post } = await db.from("posts").select("id,status,upload_token,kind").eq("id", post_id).maybeSingle();
  if (!post || post.status !== "uploading" || post.upload_token !== upload_token) return json({ error: "not found" }, 404);

  if (action === "urls") {
    const names: string[] = Array.isArray(files) && files.length ? files : ["reel.mp4", "cover.png"];
    if (names.length > 12 || !names.every((n) => NAME.test(n))) return json({ error: "bad file names" }, 400);
    const urls: Record<string, unknown> = {};
    for (const n of names) {
      const r = await db.storage.from("reels").createSignedUploadUrl(`${post_id}/${n}`, { upsert: true });
      if (r.error) return json({ error: r.error.message }, 500);
      urls[n] = r.data;
    }
    return json({ urls, video: urls["reel.mp4"], cover: urls["cover.png"] });
  }
  if (action === "done") {
    const { data: list } = await db.storage.from("reels").list(post_id);
    const names = (list ?? []).map((f) => f.name).sort();
    if (post.kind === "carousel") {
      const imgs = names.filter((n) => n.endsWith(".jpg"));
      if (imgs.length < 2) return json({ error: "a carousel needs at least 2 .jpg slides" }, 400);
      await db.from("posts").update({ media: imgs.map((n) => `${post_id}/${n}`), status: "pending", upload_token: null }).eq("id", post_id);
    } else {
      if (!names.includes("reel.mp4")) return json({ error: "reel.mp4 not uploaded" }, 400);
      await db.from("posts").update({
        video_path: `${post_id}/reel.mp4`, cover_path: names.includes("cover.png") ? `${post_id}/cover.png` : null, status: "pending", upload_token: null,
      }).eq("id", post_id);
    }
    return json({ ok: true, status: "pending" });
  }
  return json({ error: "action must be urls or done" }, 400);
});
