/**
 * Social media content management & publishing via official APIs only.
 *
 *  Instagram  — Instagram Graph API content publishing (Image, Carousel, Reel/Video, Story)
 *  Facebook   — Pages API (Photo, multi-photo, Video, text)
 *  Others     — YouTube, LinkedIn, Pinterest and unsupported formats are never
 *               "faked": they are marked "Ready to Publish" for manual posting.
 *
 * Flow: Draft → Approved → Scheduled → Publishing → Published (URL saved) | Failed
 * The time-driven trigger processScheduledPosts() runs every 15 minutes.
 * Auto Publish (SETTINGS) = TRUE also publishes *Approved* posts once due.
 */

var SOCIAL_STATUSES = ['Draft', 'Approved', 'Scheduled', 'Publishing', 'Published', 'Ready to Publish', 'Failed'];
var SOCIAL_FIELDS = ['contentType', 'platform', 'caption', 'imageUrl', 'videoUrl', 'hashtags', 'campaignId', 'scheduledDate', 'scheduledTime', 'status'];

function saveSocialPost_(p) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_('SOCIAL_POSTS');
    var fields = {};
    SOCIAL_FIELDS.forEach(function (k) { if (p[k] !== undefined) fields[k] = p[k]; });
    if (fields.status && SOCIAL_STATUSES.indexOf(fields.status) === -1) throw withCode_(new Error('Invalid status'), 'BAD_REQUEST');
    fields.updatedAt = now_().iso;
    var r = p.postId ? findRow_(sh, 'Post ID', p.postId) : 0;
    if (r) {
      var merged = rowObject_(sh, r);
      Object.keys(fields).forEach(function (k) { merged[k] = fields[k]; });
      if (merged.status === 'Scheduled' && (!merged.scheduledDate || !merged.scheduledTime)) {
        throw withCode_(new Error('Scheduled posts need a date and time'), 'BAD_REQUEST');
      }
      if (fields.status && fields.status !== 'Failed') fields.errorMessage = '';
      return updateRow_(sh, r, fields);
    }
    fields.postId = nextSeq_('SP', 3);
    fields.status = fields.status || 'Draft';
    fields.createdAt = fields.updatedAt;
    return rowObject_(sh, appendObject_('SOCIAL_POSTS', fields));
  } finally {
    lock.releaseLock();
  }
}

function publishPostById_(postId) {
  var sh = sheet_('SOCIAL_POSTS');
  var r = findRow_(sh, 'Post ID', postId);
  if (!r) throw withCode_(new Error('Post not found'), 'NOT_FOUND');
  var post = rowObject_(sh, r);
  if (post.status === 'Draft') throw withCode_(new Error('Approve the post before publishing'), 'BAD_REQUEST');
  return publishRow_(sh, r, post);
}

/** Time-driven trigger (every 15 min): publishes due posts and finalises video containers. */
function processScheduledPosts() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    var sh = sheet_('SOCIAL_POSTS');
    var auto = isTrue_(readSettings_().autoPublish, false);
    var nowStr = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm');
    var posts = readObjects_('SOCIAL_POSTS');
    posts.forEach(function (p) {
      var row = findRow_(sh, 'Post ID', p.postId);
      if (!row) return;
      if (p.status === 'Publishing' && p.containerId) return finaliseContainer_(sh, row, p);
      var eligible = p.status === 'Scheduled' || (auto && p.status === 'Approved');
      if (!eligible || !p.scheduledDate || !p.scheduledTime) return;
      if ((p.scheduledDate + ' ' + p.scheduledTime.slice(0, 5)) > nowStr) return;
      publishRow_(sh, row, p);
    });
  } finally {
    lock.releaseLock();
  }
}

function publishRow_(sh, row, p) {
  var caption = [p.caption, p.hashtags].filter(String).join('\n\n');
  updateRow_(sh, row, { status: 'Publishing', errorMessage: '', updatedAt: now_().iso });
  try {
    var result;
    if (p.platform === 'Instagram') result = publishInstagram_(p, caption);
    else if (p.platform === 'Facebook') result = publishFacebook_(p, caption);
    else result = { ready: 'Automatic publishing to ' + p.platform + ' is not enabled via an official API in this system. Post manually and paste the URL.' };

    if (result.ready) return updateRow_(sh, row, { status: 'Ready to Publish', errorMessage: result.ready, updatedAt: now_().iso });
    if (result.pendingContainer) return updateRow_(sh, row, { status: 'Publishing', containerId: result.pendingContainer, errorMessage: 'Video processing — will publish automatically.', updatedAt: now_().iso });
    return updateRow_(sh, row, { status: 'Published', publishedUrl: result.url || '', containerId: '', errorMessage: '', updatedAt: now_().iso });
  } catch (err) {
    return updateRow_(sh, row, { status: 'Failed', errorMessage: String(err.message || err).slice(0, 500), updatedAt: now_().iso });
  }
}

// ─── Graph API helpers ─────────────────────────────────────────────────────

function graph_(method, path, params, token) {
  var base = 'https://graph.facebook.com/' + (prop_('GRAPH_VERSION') || 'v23.0') + '/';
  var opts = { method: method, muteHttpExceptions: true };
  var p = params || {};
  p.access_token = token;
  var url = base + path;
  if (method === 'get') {
    url += '?' + Object.keys(p).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(p[k]); }).join('&');
  } else {
    opts.payload = p;
  }
  var res = UrlFetchApp.fetch(url, opts);
  var body = {};
  try { body = JSON.parse(res.getContentText()); } catch (e) { /* ignore */ }
  if (res.getResponseCode() >= 400 || body.error) {
    throw new Error('Graph API: ' + ((body.error && body.error.message) || ('HTTP ' + res.getResponseCode())));
  }
  return body;
}

function mediaUrls_(p) {
  return String(p.imageUrl || '').split(/\n|\|/).map(function (s) { return s.trim(); }).filter(function (s) { return /^https:\/\//.test(s); });
}

// ─── Instagram ─────────────────────────────────────────────────────────────

function publishInstagram_(p, caption) {
  var ig = prop_('IG_USER_ID');
  var token = prop_('META_ACCESS_TOKEN');
  if (!ig || !token) return { ready: 'Instagram API not connected (set IG_USER_ID and META_ACCESS_TOKEN). Ready for manual posting.' };
  var images = mediaUrls_(p);
  var type = p.contentType;
  var container;

  if (type === 'Carousel') {
    if (images.length < 2) throw new Error('Carousel needs 2–10 image URLs (one per line).');
    var children = images.slice(0, 10).map(function (u) { return graph_('post', ig + '/media', { image_url: u, is_carousel_item: 'true' }, token).id; });
    container = graph_('post', ig + '/media', { media_type: 'CAROUSEL', children: children.join(','), caption: caption }, token).id;
  } else if (type === 'Reel' || type === 'Video') {
    if (!p.videoUrl) throw new Error('Reel/Video needs a public Video URL.');
    container = graph_('post', ig + '/media', { media_type: 'REELS', video_url: p.videoUrl, caption: caption, share_to_feed: 'true' }, token).id;
  } else if (type === 'Story') {
    var sp = p.videoUrl ? { media_type: 'STORIES', video_url: p.videoUrl } : { media_type: 'STORIES', image_url: images[0] };
    if (!p.videoUrl && !images[0]) throw new Error('Story needs an image or video URL.');
    container = graph_('post', ig + '/media', sp, token).id;
  } else {
    if (!images[0]) throw new Error('Image post needs a public https Image URL.');
    container = graph_('post', ig + '/media', { image_url: images[0], caption: caption }, token).id;
  }

  if (!waitForContainer_(container, token, type === 'Reel' || type === 'Video' || (type === 'Story' && p.videoUrl) ? 45 : 10)) {
    return { pendingContainer: container };
  }
  return { url: publishContainer_(ig, container, token) };
}

function waitForContainer_(id, token, seconds) {
  var until = Date.now() + seconds * 1000;
  while (Date.now() < until) {
    var s = graph_('get', id, { fields: 'status_code' }, token).status_code;
    if (s === 'FINISHED' || !s) return true;
    if (s === 'ERROR' || s === 'EXPIRED') throw new Error('Instagram could not process the media (' + s + ').');
    Utilities.sleep(5000);
  }
  return false;
}

function publishContainer_(ig, container, token) {
  var mediaId = graph_('post', ig + '/media_publish', { creation_id: container }, token).id;
  try {
    return graph_('get', mediaId, { fields: 'permalink' }, token).permalink || '';
  } catch (e) {
    return '';
  }
}

function finaliseContainer_(sh, row, p) {
  var ig = prop_('IG_USER_ID');
  var token = prop_('META_ACCESS_TOKEN');
  try {
    if (!waitForContainer_(p.containerId, token, 5)) return;
    var url = publishContainer_(ig, p.containerId, token);
    updateRow_(sh, row, { status: 'Published', publishedUrl: url, containerId: '', errorMessage: '', updatedAt: now_().iso });
  } catch (err) {
    updateRow_(sh, row, { status: 'Failed', errorMessage: String(err.message || err).slice(0, 500), updatedAt: now_().iso });
  }
}

/** Latest media for the website's Instagram section (cached 1 hour). */
function instagramFeed_(limit) {
  var ig = prop_('IG_USER_ID');
  var token = prop_('META_ACCESS_TOKEN');
  if (!ig || !token) return [];
  var cache = CacheService.getScriptCache();
  var hit = cache.get('ig_feed');
  if (hit) return JSON.parse(hit);
  try {
    var res = graph_('get', ig + '/media', { fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp', limit: Math.min(limit || 8, 12) }, token);
    var items = (res.data || []).map(function (m) {
      return { id: m.id, caption: m.caption || '', mediaType: m.media_type, mediaUrl: m.media_url || '', thumbnailUrl: m.thumbnail_url || m.media_url || '', permalink: m.permalink, timestamp: m.timestamp };
    });
    cache.put('ig_feed', JSON.stringify(items), 3600);
    return items;
  } catch (err) {
    console.error('instagram feed: ' + err);
    return [];
  }
}

// ─── Facebook Page ─────────────────────────────────────────────────────────

function publishFacebook_(p, caption) {
  var page = prop_('FB_PAGE_ID');
  var token = prop_('FB_PAGE_TOKEN') || prop_('META_ACCESS_TOKEN');
  if (!page || !token) return { ready: 'Facebook Page API not connected (set FB_PAGE_ID and FB_PAGE_TOKEN). Ready for manual posting.' };
  var images = mediaUrls_(p);
  var type = p.contentType;

  if (type === 'Reel' || type === 'Story') return { ready: 'Facebook ' + type + 's are not auto-published by this system. Post manually from Meta Business Suite.' };
  if (type === 'Video') {
    if (!p.videoUrl) throw new Error('Video post needs a public Video URL.');
    var v = graph_('post', page + '/videos', { file_url: p.videoUrl, description: caption }, token);
    return { url: 'https://www.facebook.com/' + v.id };
  }
  if (type === 'Carousel' && images.length > 1) {
    var params = { message: caption };
    images.slice(0, 10).forEach(function (u, i) {
      var id = graph_('post', page + '/photos', { url: u, published: 'false' }, token).id;
      params['attached_media[' + i + ']'] = JSON.stringify({ media_fbid: id });
    });
    var post = graph_('post', page + '/feed', params, token);
    return { url: 'https://www.facebook.com/' + post.id };
  }
  if (images[0]) {
    var photo = graph_('post', page + '/photos', { url: images[0], caption: caption }, token);
    return { url: 'https://www.facebook.com/' + (photo.post_id || photo.id) };
  }
  var text = graph_('post', page + '/feed', { message: caption }, token);
  return { url: 'https://www.facebook.com/' + text.id };
}
