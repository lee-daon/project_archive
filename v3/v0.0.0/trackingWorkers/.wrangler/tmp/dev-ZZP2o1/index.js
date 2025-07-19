var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-JeCuS9/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-JeCuS9/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

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
  }
  // 메인 워커로부터의 fetch 요청 처리
  async fetch(request) {
    const url = new URL(request.url);
    const { userId, productId, market } = Object.fromEntries(url.searchParams);
    if (!userId || !productId || !market) {
      return new Response("Missing required parameters", { status: 400 });
    }
    await this.state.storage.put({ userId, productId });
    this.views[market] = (this.views[market] || 0) + 1;
    this.views["total"] = (this.views["total"] || 0) + 1;
    const currentAlarm = await this.state.storage.getAlarm();
    if (currentAlarm === null) {
      const oneMinute = 1 * 60 * 1e3;
      await this.state.storage.setAlarm(Date.now() + oneMinute);
    }
    return new Response("Tracked", { status: 200 });
  }
  // fetch()에서 설정된 알람이 울릴 때 호출되는 메서드
  async alarm() {
    const { userId, productId } = await this.state.storage.get(["userId", "productId"]);
    if (!userId || !productId || Object.keys(this.views).length === 0) {
      return;
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const viewsToCommit = this.views;
    this.views = {};
    const markets = ["cou", "nav", "ele", "acu", "gma"];
    const viewEntries = markets.map((m) => viewsToCommit[m] || 0);
    const totalViews = viewsToCommit["total"] || 0;
    const statement = `
      INSERT INTO product_views (date, userId, productId, cou_views, nav_views, ele_views, acu_views, gma_views, total_views)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date, userId, productId) DO UPDATE SET
        cou_views = cou_views + excluded.cou_views,
        nav_views = nav_views + excluded.nav_views,
        ele_views = ele_views + excluded.ele_views,
        acu_views = acu_views + excluded.acu_views,
        gma_views = gma_views + excluded.gma_views,
        total_views = total_views + excluded.total_views;
    `;
    try {
      await this.env.DB.prepare(statement).bind(today, userId, productId, ...viewEntries, totalViews).run();
    } catch (e2) {
      console.error("D2 write failed:", e2.message);
      this.views = viewsToCommit;
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
router.get("/:market/:userId(\\d+)/:productId(\\d+)", async ({ params }, env, ctx) => {
  const { userId, productId, market } = params;
  const validMarkets = ["cou", "nav", "ele", "acu", "gma"];
  if (!validMarkets.includes(market)) {
    return new Response("Not Found.", { status: 404 });
  }
  const doId = env.PRODUCT_TRACKER.idFromName(`${userId}-${productId}`);
  const stub = env.PRODUCT_TRACKER.get(doId);
  const doUrl = new URL("https://worker.internal/track");
  doUrl.searchParams.set("userId", userId);
  doUrl.searchParams.set("productId", productId);
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
router.get("/api/views", async ({ query, request }, env, ctx) => {
  const authHeader = request.headers.get("Authorization");
  const expectedToken = `Bearer ${env.API_SECRET}`;
  if (!env.API_SECRET || authHeader !== expectedToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const {
    userId,
    days = "30",
    market = "total",
    min_views,
    max_views,
    sort_order = "desc"
  } = query;
  if (!userId) {
    return new Response(JSON.stringify({ error: "userId query parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const startDate = /* @__PURE__ */ new Date();
  startDate.setDate(startDate.getDate() - parseInt(days, 10));
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
  const havingConditions = [];
  const bindings = [userId, startDateString];
  if (min_views !== void 0) {
    havingConditions.push(`SUM(${sortColumn}) >= ?`);
    bindings.push(parseInt(min_views, 10));
  }
  if (max_views !== void 0) {
    havingConditions.push(`SUM(${sortColumn}) <= ?`);
    bindings.push(parseInt(max_views, 10));
  }
  const havingClause = havingConditions.length > 0 ? `HAVING ${havingConditions.join(" AND ")}` : "";
  let queryBuilder = `
    SELECT 
      productId, 
      SUM(total_views) as total_views,
      SUM(cou_views) as cou_views,
      SUM(nav_views) as nav_views,
      SUM(ele_views) as ele_views,
      SUM(acu_views) as acu_views,
      SUM(gma_views) as gma_views
    FROM product_views 
    WHERE userId = ? AND date >= ?
    GROUP BY productId
    ${havingClause}
    ORDER BY ${sortColumn} ${order}
    LIMIT 100;
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

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e2) {
      console.error("Failed to drain the unused request body.", e2);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e2) {
  return {
    name: e2?.name,
    message: e2?.message ?? String(e2),
    stack: e2?.stack,
    cause: e2?.cause === void 0 ? void 0 : reduceError(e2.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e2) {
    const error = reduceError(e2);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-JeCuS9/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-JeCuS9/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  ProductTracker,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
