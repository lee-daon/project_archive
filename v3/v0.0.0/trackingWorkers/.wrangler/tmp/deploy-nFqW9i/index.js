var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/itty-router/index.mjs
var e = /* @__PURE__ */ __name(({ base: e2 = "", routes: t = [], ...o2 } = {}) => ({ __proto__: new Proxy({}, { get: (o3, s2, r, n) => "handle" == s2 ? r.fetch : (o4, ...a) => t.push([s2.toUpperCase?.(), RegExp(`^${(n = (e2 + o4).replace(/\/+(\/|$)/g, "$1")).replace(/(\/?\.?):(\w+)\+/g, "($1(?<$2>*))").replace(/(\/?\.?):(\w+)/g, "($1(?<$2>[^$1/]+?))").replace(/\./g, "\\.").replace(/(\/?)\*/g, "($1.*)?")}/*$`), a, n]) && r }), routes: t, ...o2, async fetch(e3, ...o3) {
  let s2, r, n = new URL(e3.url), a = e3.query = { __proto__: null };
  for (let [e4, t2] of n.searchParams)
    a[e4] = a[e4] ? [].concat(a[e4], t2) : t2;
  for (let [a2, c2, i2, l2] of t)
    if ((a2 == e3.method || "ALL" == a2) && (r = n.pathname.match(c2))) {
      e3.params = r.groups || {}, e3.route = l2;
      for (let t2 of i2)
        if (null != (s2 = await t2(e3.proxy ?? e3, ...o3)))
          return s2;
    }
} }), "e");
var o = /* @__PURE__ */ __name((e2 = "text/plain; charset=utf-8", t) => (o2, { headers: s2 = {}, ...r } = {}) => void 0 === o2 || "Response" === o2?.constructor.name ? o2 : new Response(t ? t(o2) : o2, { headers: { "content-type": e2, ...s2.entries ? Object.fromEntries(s2) : s2 }, ...r }), "o");
var s = o("application/json; charset=utf-8", JSON.stringify);
var c = o("text/plain; charset=utf-8", String);
var i = o("text/html");
var l = o("image/jpeg");
var p = o("image/png");
var d = o("image/webp");

// src/durable_object.mjs
var ProductTracker = class {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.views = {};
    this.state.blockConcurrencyWhile(async () => {
      const storedViews = await this.state.storage.get("views");
      if (storedViews) {
        this.views = storedViews;
      }
    });
  }
  // 메인 워커로부터의 fetch 요청 처리
  async fetch(request) {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const productId = url.searchParams.get("productId");
    const groupId = url.searchParams.get("groupId");
    const market = url.searchParams.get("market");
    if (!userId || !productId || !groupId || !market) {
      return new Response("Missing required parameters", { status: 400 });
    }
    await this.state.storage.put("userId", userId);
    await this.state.storage.put("productId", productId);
    await this.state.storage.put("groupId", groupId);
    this.views[market] = (this.views[market] || 0) + 1;
    this.views["total"] = (this.views["total"] || 0) + 1;
    await this.state.storage.put("views", this.views);
    const currentAlarm = await this.state.storage.getAlarm();
    if (currentAlarm === null) {
      const fiveMinutes = 1 * 6 * 1e3;
      const alarmTime = Date.now() + fiveMinutes;
      await this.state.storage.setAlarm(alarmTime);
    }
    return new Response("Tracked", { status: 200 });
  }
  // fetch()에서 설정된 알람이 울릴 때 호출되는 메서드
  async alarm() {
    const userId = await this.state.storage.get("userId");
    const productId = await this.state.storage.get("productId");
    const groupId = await this.state.storage.get("groupId");
    const storedViews = await this.state.storage.get("views");
    if (storedViews && Object.keys(this.views).length === 0) {
      this.views = storedViews;
    }
    if (!userId || !productId || !groupId || Object.keys(this.views).length === 0) {
      return;
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const viewsToCommit = this.views;
    this.views = {};
    const markets = ["cou", "nav", "ele", "acu", "gma"];
    const viewEntries = markets.map((m) => viewsToCommit[m] || 0);
    const totalViews = viewsToCommit["total"] || 0;
    const statement = `
      INSERT INTO product_views (userId, date, productId, groupId, cou_views, nav_views, ele_views, acu_views, gma_views, total_views)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(userId, date, productId) DO UPDATE SET
        cou_views = cou_views + excluded.cou_views,
        nav_views = nav_views + excluded.nav_views,
        ele_views = ele_views + excluded.ele_views,
        acu_views = acu_views + excluded.acu_views,
        gma_views = gma_views + excluded.gma_views,
        total_views = total_views + excluded.total_views;
    `;
    try {
      await this.env.DB.prepare(statement).bind(userId, today, productId, groupId, ...viewEntries, totalViews).run();
      await this.state.storage.delete("views");
    } catch (e2) {
      console.error("D2 write failed:", e2.message);
      this.views = viewsToCommit;
      await this.state.storage.put("views", this.views);
      await this.state.storage.setAlarm(Date.now() + 60 * 1e3);
    }
  }
};
__name(ProductTracker, "ProductTracker");

// src/index.mjs
var router = e();
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i2 = 0; i2 < len; i2++) {
    bytes[i2] = binaryString.charCodeAt(i2);
  }
  return bytes.buffer;
}
__name(base64ToArrayBuffer, "base64ToArrayBuffer");
var PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==";
var PNG_DATA = base64ToArrayBuffer(PNG_BASE64);
router.get("/:market/:userId/:productId/:groupId", async (request, env, ctx) => {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter((part) => part !== "");
  const market = pathParts[0];
  const userIdStr = pathParts[1];
  const productIdStr = pathParts[2];
  const groupIdStr = pathParts[3];
  const validMarkets = ["cou", "nav", "ele", "acu", "gma"];
  if (!validMarkets.includes(market)) {
    return new Response("Not Found.", { status: 404 });
  }
  const userId = parseInt(userIdStr, 10);
  const productId = parseInt(productIdStr, 10);
  const groupId = parseInt(groupIdStr, 10);
  if (isNaN(userId) || isNaN(productId) || isNaN(groupId) || userId <= 0 || productId <= 0 || groupId <= 0) {
    return new Response("Invalid user, product, or group ID", { status: 400 });
  }
  const doId = env.PRODUCT_TRACKER.idFromName(`${userId}-${productId}`);
  const stub = env.PRODUCT_TRACKER.get(doId);
  const doUrl = new URL("https://worker.internal/track");
  doUrl.searchParams.set("userId", userId.toString());
  doUrl.searchParams.set("productId", productId.toString());
  doUrl.searchParams.set("groupId", groupId.toString());
  doUrl.searchParams.set("market", market);
  ctx.waitUntil(stub.fetch(doUrl.toString()));
  return new Response(PNG_DATA, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0"
    }
  });
});
router.get("/api/views", async (request, env, ctx) => {
  const authHeader = request.headers.get("Authorization");
  const expectedToken = `Bearer ${env.API_SECRET}`;
  if (!env.API_SECRET || authHeader !== expectedToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const url = new URL(request.url);
  const userIdStr = url.searchParams.get("userId");
  const productIdStr = url.searchParams.get("productId");
  const groupIdStr = url.searchParams.get("groupId");
  const daysStr = url.searchParams.get("days") || "30";
  const market = url.searchParams.get("market") || "total";
  const minViewsStr = url.searchParams.get("min_views");
  const maxViewsStr = url.searchParams.get("max_views");
  const sort_order = url.searchParams.get("sort_order") || "desc";
  if (!userIdStr) {
    return new Response(JSON.stringify({ error: "userId query parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const userId = parseInt(userIdStr, 10);
  const days = parseInt(daysStr, 10);
  if (isNaN(userId) || userId <= 0) {
    return new Response(JSON.stringify({ error: "Invalid userId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (isNaN(days) || days < 1 || days > 365) {
    return new Response(JSON.stringify({ error: "Invalid days (1-365)" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  let productId = null;
  if (productIdStr) {
    productId = parseInt(productIdStr, 10);
    if (isNaN(productId) || productId <= 0) {
      return new Response(JSON.stringify({ error: "Invalid productId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  let groupId = null;
  if (groupIdStr) {
    groupId = parseInt(groupIdStr, 10);
    if (isNaN(groupId) || groupId <= 0) {
      return new Response(JSON.stringify({ error: "Invalid groupId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  const startDate = /* @__PURE__ */ new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateString = startDate.toISOString().slice(0, 10);
  const marketMap = {
    cou: "cou_views",
    nav: "nav_views",
    ele: "ele_views",
    acu: "acu_views",
    gma: "gma_views",
    total: "total_views"
  };
  const sortColumn = marketMap[market.toLowerCase()] || "total_views";
  const order = sort_order.toLowerCase() === "asc" ? "ASC" : "DESC";
  const whereConditions = ["userId = ?", "date >= ?"];
  const bindings = [userId, startDateString];
  if (productId !== null) {
    whereConditions.push("productId = ?");
    bindings.push(productId);
  }
  if (groupId !== null) {
    whereConditions.push("groupId = ?");
    bindings.push(groupId);
  }
  const havingConditions = [];
  if (minViewsStr && minViewsStr !== "null") {
    const minViews = parseInt(minViewsStr, 10);
    if (!isNaN(minViews) && minViews >= 0) {
      havingConditions.push(`SUM(${sortColumn}) >= ?`);
      bindings.push(minViews);
    }
  }
  if (maxViewsStr && maxViewsStr !== "null") {
    const maxViews = parseInt(maxViewsStr, 10);
    if (!isNaN(maxViews) && maxViews >= 0) {
      havingConditions.push(`SUM(${sortColumn}) <= ?`);
      bindings.push(maxViews);
    }
  }
  const whereClause = `WHERE ${whereConditions.join(" AND ")}`;
  const havingClause = havingConditions.length > 0 ? `HAVING ${havingConditions.join(" AND ")}` : "";
  let queryBuilder = `
    SELECT 
      productId,
      groupId,
      SUM(total_views) as total_views,
      SUM(cou_views) as cou_views,
      SUM(nav_views) as nav_views,
      SUM(ele_views) as ele_views,
      SUM(acu_views) as acu_views,
      SUM(gma_views) as gma_views
    FROM product_views 
    ${whereClause}
    GROUP BY productId, groupId
    ${havingClause}
    ORDER BY ${sortColumn} ${order}
    LIMIT 1000;
  `;
  try {
    const { results } = await env.DB.prepare(queryBuilder).bind(...bindings).all();
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e2) {
    return new Response(JSON.stringify({ error: e2.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
router.all("*", () => new Response("Not Found.", { status: 404 }));
var src_default = {
  fetch: router.handle
};
export {
  ProductTracker,
  src_default as default
};
//# sourceMappingURL=index.js.map
