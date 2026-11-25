// Upload step for new reels. The caller first creates a posts row (status 'uploading') and gets back
// its id and one-time upload_token; then:
//   POST {post_id, upload_token, action: "urls"}  -> signed upload URLs for reel.mp4 and cover.png
//   PUT the files to those URLs
//   POST {post_id, upload_token, action: "done"}  -> row moves to 'pending' (waiting for approval)
import { admin, cors, json } from "../_shared/common.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const db = admin();
  const { post_id, upload_token, action } = await req.json().catch(() => ({}));
  if (!post_id || !upload_token) return json({ error: "post_id and upload_token required" }, 400);
  const { data: post } = await db.from("posts").select("id,status,upload_token").eq("id", post_id).maybeSingle();
  if (!post || post.status !== "uploading" || post.upload_token !== upload_token) return json({ error: "not found" }, 404);

  const video = `${post_id}/reel.mp4`, cover = `${post_id}/cover.png`;
  if (action === "urls") {
    const v = await db.storage.from("reels").createSignedUploadUrl(video, { upsert: true });
    const c = await db.storage.from("reels").createSignedUploadUrl(cover, { upsert: true });
    if (v.error || c.error) return json({ error: (v.error ?? c.error)!.message }, 500);
    return json({ video: v.data, cover: c.data });
  }
  if (action === "done") {
    const { data: files } = await db.storage.from("reels").list(post_id);
    const names = new Set((files ?? []).map((f) => f.name));
    if (!names.has("reel.mp4")) return json({ error: "reel.mp4 not uploaded" }, 400);
    await db.from("posts").update({
      video_path: video, cover_path: names.has("cover.png") ? cover : null, status: "pending", upload_token: null,
    }).eq("id", post_id);
    return json({ ok: true, status: "pending" });
  }
  return json({ error: "action must be urls or done" }, 400);
});
