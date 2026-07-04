# Nghiên cứu chức năng tham chiếu (vBulletin Suite 4.2.0 PL3)

> **Lưu ý pháp lý:** Gói nguồn được cung cấp là bản *nulled* (đã gỡ bảo vệ bản quyền). Tài liệu này chỉ dùng để **tham chiếu chức năng** khi thiết kế hệ thống **hoàn toàn gốc**. Không sao chép mã nguồn, template, asset, hay schema tên bảng của vBulletin. Không triển khai bản nulled lên production.

**Stack gốc tham chiếu:** PHP + MySQL, kiến trúc script-per-page + AdminCP/ModCP, plugin hooks, datastore cache, cron PHP.

---

## 1. Tổng quan kiến trúc tham chiếu

| Thành phần | Vai trò |
|---|---|
| Forum core | Chuyên mục → chủ đề → bài viết |
| Blog | Blog cá nhân / nhóm, entry, comment, trackback |
| CMS | Cây node (nested set), article, layout, widget |
| Social | Social group, album ảnh, visitor message, friend list |
| AdminCP / ModCP | Quản trị & điều hành |
| API mobile | REST-like method whitelist theo phiên bản |
| Plugin / Product | Hook mở rộng |
| Cron | Tác vụ nền (digest, cleanup, promotion, sitemap…) |
| Payment | Gói subscription trả phí |

---

## 2. Danh mục chức năng theo domain

### 2.1. Người dùng & xác thực

| Chức năng | Cách hoạt động (tham chiếu) |
|---|---|
| Đăng ký / kích hoạt email | `user` + `useractivation`; captcha (`humanverify`, Q&A) |
| Đăng nhập / session | Cookie session trong `session`; AdminCP dùng `cpsession` |
| Đổi / quên mật khẩu | Token kích hoạt; `passwordhistory` |
| Usergroup (nhóm quyền) | Bitfield permissions trên `usergroup` + override theo forum (`forumpermission`) |
| Member group phụ | `membergroupids`, `displaygroupid` |
| Profile tùy biến | `profilefield`, `userfield`, `usertextfield`, avatar, signature, CSS profile |
| Ban / strike | `userban`, `strikes` (sai mật khẩu) |
| Promotion tự động | Cron `promotion` theo số post / ngày tham gia |
| Facebook login | Trường `fbuserid`, `fbaccesstoken` trên `user` |
| User note (ghi chú staff) | `usernote` |
| Member list / online | `memberlist`, `online`, `session` |

### 2.2. Diễn đàn (Forum)

| Chức năng | Cách hoạt động |
|---|---|
| Cây chuyên mục | `forum.parentid` + `parentlist` / `childlist` (denormalized path) |
| Chủ đề / bài viết | `thread` (metadata) + `post` (nội dung); first/last post denormalized |
| Soft delete | `visible` flag + `deletionlog` |
| Sticky / lock | `thread.sticky`, `thread.open` |
| Prefix chủ đề | `prefix`, `prefixset`, `forumprefixset`, quyền theo usergroup |
| Poll | `poll` + `pollvote` gắn `thread.pollid` |
| Đánh giá chủ đề | `threadrate` |
| Tag | `tag`, `tagcontent` (polymorphic theo contenttype) |
| Attachment | `attachment` → `filedata` (blob hoặc filesystem) |
| BBCode / smilie | `bbcode`, `smilie`; cache HTML trong `postparsed` |
| Autosave soạn thảo | `autosave` |
| Lịch sử sửa bài | `postedithistory`, `editlog` |
| Đánh dấu đã đọc | `forumread`, `threadread` |
| Subscribe / digest | `subscribethread`, `subscribeforum`; cron daily/weekly digest |
| Announcement | `announcement` theo forum, `announcementread` |
| Ignore / friends | `userlist` (buddy / ignore) |
| Similar threads | `thread.similar` (precomputed) |
| Print / RSS / podcast | `printthread`, `rssfeed`, `podcast` |
| Redirect thread | `threadredirect` |
| Tachy (ẩn post với user) | `tachythreadpost`, `tachyforumpost` |

### 2.3. Điều hành (Moderation)

| Chức năng | Cách hoạt động |
|---|---|
| Hàng chờ duyệt | `moderation` (content chờ approve) |
| Inline moderation | Approve/unapprove, move, merge, copy, delete, spam, stick |
| Moderator theo forum | `moderator` + bitfield quyền |
| Report bài | Tạo thread report hoặc email staff |
| Infraction / warning | `infraction`, `infractionlevel`, `infractiongroup`, `infractionban` |
| Mod log / admin log | `moderatorlog`, `adminlog` |
| Soft-delete restore | `deletionlog` |

### 2.4. Tin nhắn riêng (PM)

| Chức năng | Cách hoạt động |
|---|---|
| Hộp thư PM | `pm` (metadata per-user) + `pmtext` (nội dung dùng chung) |
| Receipt / track | `pmreceipt` |
| Throttle gửi | `pmthrottle` |
| Folder tùy chỉnh | Lưu trong user text fields |

### 2.5. Social

| Chức năng | Cách hoạt động |
|---|---|
| Social group | `socialgroup`, category, member (public/moderated/invite) |
| Thảo luận nhóm | `discussion` + `groupmessage` |
| Album ảnh | `album` + attachment contenttype Album |
| Picture comment | `picturecomment` |
| Visitor message (tường) | `visitormessage` |
| Profile visitor | `profilevisitor` |
| Activity stream | `activitystream` + types theo package/section |

### 2.6. Blog

| Chức năng | Cách hoạt động |
|---|---|
| Blog user / entry | `blog_user`, `blog`, `blog_text` |
| Category / permission | `blog_category`, `blog_categorypermission` |
| Comment / rate / tag | `blog_text` (comment), `blog_rate`, `blog_tag*` |
| Subscribe entry/user | `blog_subscribeentry`, `blog_subscribeuser` |
| Group blog membership | `blog_groupmembership`, `blog_grouppermission` |
| Trackback / ping | `blog_trackback`, `blog_pinghistory` |
| Custom block / CSS | `blog_custom_block`, `blog_usercss` |
| Moderation blog | `blog_moderation`, `blog_moderator` |

### 2.7. CMS (publishing)

| Chức năng | Cách hoạt động |
|---|---|
| Cây nội dung | `cms_node` (nested set: nodeleft/noderight) |
| Article body | `cms_article` (pagetext, preview) |
| Node metadata | `cms_nodeinfo` (title, workflow, views) |
| Section / category | `cms_category`, `cms_nodecategory`, `cms_sectionorder` |
| Layout / grid / widget | `cms_layout`, `cms_grid`, `cms_widget*`, `cms_layoutwidget` |
| Permission theo node | `cms_permissions` |
| Rate article | `cms_rate` |
| Liên kết forum thread | `associatedthreadid` trên nodeinfo |

### 2.8. Lịch & sự kiện

| Chức năng | Cách hoạt động |
|---|---|
| Calendar / event | `calendar`, `event`, custom fields |
| Holiday | `holiday` |
| Subscribe event | `subscribeevent` |
| Calendar permission / mod | `calendarpermission`, `calendarmoderator` |

### 2.9. Tìm kiếm & SEO

| Chức năng | Cách hoạt động |
|---|---|
| Search index | `searchcore` + `searchcore_text`, queue `indexqueue` |
| Search log | `searchlog`, `searchgroup` |
| XML sitemap | Cron `sitemap.php` → `store_sitemap` |
| Friendly URL | `route` table |

### 2.10. Hệ thống / nền tảng

| Chức năng | Cách hoạt động |
|---|---|
| Settings | `setting`, `settinggroup` |
| Datastore cache | `datastore` (options, bitfields serialized) |
| Language / phrase | `language`, `phrase`, `phrasetype` |
| Style / template | `style`, `template`, `stylevar` |
| Plugin / product | `plugin`, `product`, `productcode`, `productdependency` |
| Cron jobs | `cron`, `cronlog` |
| Mail queue | `mailqueue` |
| Ads / notices | `ad`+`adcriteria`, `notice`+`noticecriteria` |
| FAQ | `faq` |
| Navigation | `navigation` |
| Blocks (sidebar) | `block`, `blocktype`, `blockconfig` |
| Reputation | `reputation`, `reputationlevel`, `ranks`, `usertitle` |
| Paid subscription | `subscription`, payment APIs (PayPal, 2Checkout…) |
| Mobile API | `apiclient`, `apilog`, method whitelist |
| Stats | `stats` daily counters |
| IP data | `ipdata` |
| Human verification | Image captcha / Q&A |

### 2.11. Cron jobs chính

`birthday`, `threadviews`, `promotion`, `digestdaily`, `digestweekly`, `subscriptions`, `cleanup`, `attachmentviews`, `activate`, `removebans`, `stats`, `reminder`, `dailycleanup`, `infractions`, `rssposter`, `sitemap`, `activity`, `mailqueue`, `queueprocessor`, blog/cms cleanup.

### 2.12. Entry points frontend (script)

Auth: `login`, `register`, `profile`, `usercp`  
Forum: `forumdisplay`, `showthread`, `newthread`, `newreply`, `editpost`, `inlinemod`, `search`, `poll`, `tags`  
Social: `group`, `album`, `picture`, `visitormessage`, `member`  
Messaging: `private`, `sendmessage`  
Blog: `blog`, `blog_post`, `entry`, `blog_usercp`  
CMS: `content`, `list`, `widget`  
System: `cron`, `api`, `ajax`, `xmlsitemap`, `payments`

---

## 3. Mô hình dữ liệu cốt lõi (tham chiếu logic)

```
User ──< UserGroup (bitfield permissions)
  │
  ├── Forum (tree) ──< Thread ──< Post
  │                      ├── Poll / Tags / Attachments
  │                      └── Subscriptions
  │
  ├── PM (pm + pmtext)
  ├── SocialGroup ── Discussion ── GroupMessage
  ├── Album ── Pictures ── Comments
  ├── BlogUser ── BlogEntry ── Comments
  └── CmsNode (nested set) ── Article / Widgets / Layout
```

**Điểm thiết kế đáng học (không copy):**

1. **Denormalized counters** trên thread/forum để list nhanh.
2. **Polymorphic content type** cho attachment, tag, moderation, activity.
3. **Bitfield permissions** gọn nhưng khó bảo trì → hệ thống mới nên dùng RBAC tường minh.
4. **Parsed content cache** (`postparsed`) giảm CPU render BBCode.
5. **Read tracking** theo user×thread/forum.
6. **Soft visibility states** (visible / moderated / deleted) thay vì xóa cứng.
7. **Queue + cron** cho email, search index, view counters.

---

## 4. Những gì hệ thống gốc của chúng ta sẽ *không* làm theo

- Không dùng BBCode làm định dạng chính → **Markdown** (+ HTML sanitize).
- Không bitfield permission → **RBAC + permission keys**.
- Không nested-set bắt buộc cho CMS → **path/materialized path hoặc adjacency + closure** tùy phase.
- Không lưu file trong BLOB DB mặc định → **object storage (S3/MinIO)**.
- Không PHP session table làm auth chính → **JWT access + refresh token** (đã có trong codebase).
- Không plugin eval PHP → **module/plugin package an toàn** (phase sau).
- Không copy tên bảng/cột/API của vBulletin.
