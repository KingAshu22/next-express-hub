/**
 * Xpression Rate Fetcher Service
 * Handles rate fetching from Xpression-based APIs (WorldFirst, Atlantic, etc.)
 *
 * Architecture:
 * - apiUrl = AWB entry endpoint (separate, not used here)
 * - Portal origin = extracted from apiUrl/loginUrl for login + rate compare
 * - Login page = portalOrigin + "/"
 * - Login action = portalOrigin + "/Login/LoginValidate"
 * - Rate API = portalOrigin + "/CustomerRateCompare/GetCustomerRate"
 *
 * WorldFirst login page field mapping:
 * - Username field: "UserName"
 * - Password field: "Password"
 * - Hidden field: "UserType" (value="")
 * - CSRF token: "__RequestVerificationToken"
 * - Form action: "/Login/LoginValidate"
 * - Session cookie: "ASP.NET_SessionId"
 *
 * Rate API:
 * - POST /CustomerRateCompare/GetCustomerRate
 * - Body: { searchdata: { CustomerCode, VendorCode, ProductCode, DestinationCode,
 *           Destination, ServiceType, Weight, VolWeight, OriginCode, ToPinCode } }
 * - Weight is STRING (e.g. "21")
 * - Response: { error: "", result: [ headerRow, ...dataRows ] }
 * - First result element is column headers, skip it
 */

import axios from "axios";
import VendorIntegration from "@/models/VendorIntegration";
import { connectToDB } from "@/app/_utils/mongodb";

const SESSION_EXPIRY_MS = 23 * 60 * 60 * 1000; // 23 hours

export class XpressionRateFetcher {
  constructor(vendorId) {
    this.vendorId = vendorId;
    this.vendor = null;
    this.credentials = null;
    this.axiosInstance = null;
  }

  // ─── Initialize ─────────────────────────────────────────────────────────────
  async initialize() {
    try {
      await connectToDB();
      this.vendor = await VendorIntegration.findById(this.vendorId);

      if (!this.vendor) {
        throw new Error(`Vendor not found: ${this.vendorId}`);
      }

      if (this.vendor.softwareType !== "xpression") {
        throw new Error(`Invalid software type: ${this.vendor.softwareType}`);
      }

      this.credentials = this.vendor.xpressionCredentials;

      if (!this.credentials) {
        throw new Error("Xpression credentials not configured");
      }

      if (!this.credentials.userId) {
        throw new Error("Missing userId in xpressionCredentials");
      }

      if (!this.credentials.password) {
        throw new Error("Missing password in xpressionCredentials");
      }

      this.axiosInstance = axios.create({
        timeout: 30000,
        validateStatus: () => true,
        maxRedirects: 0,
      });

      console.log(
        `[Xpression] ✅ Initialized for vendor: ${this.vendor.vendorName}`
      );
      return true;
    } catch (error) {
      console.error("[Xpression] ❌ Initialization error:", error.message);
      throw error;
    }
  }

  // ─── Session Validity Check ──────────────────────────────────────────────────
  isSessionValid() {
    if (!this.credentials.sessionId || !this.credentials.sessionCookies) {
      console.log("[Xpression] Session missing required fields");
      return false;
    }

    if (!this.credentials.sessionExpiresAt) {
      console.log("[Xpression] Session has no expiry set");
      return false;
    }

    const expiresAt = new Date(this.credentials.sessionExpiresAt);
    const now = new Date();
    const minutesRemaining = (expiresAt - now) / (1000 * 60);

    if (minutesRemaining < 30) {
      console.log(
        `[Xpression] Session expiring soon (${minutesRemaining.toFixed(0)} min remaining) - will refresh`
      );
      return false;
    }

    console.log(
      `[Xpression] ✅ Session valid (${minutesRemaining.toFixed(0)} min remaining)`
    );
    return true;
  }

  // ─── Portal Origin ──────────────────────────────────────────────────────────
  getPortalOrigin() {
    const fallback = "https://xpresion.worldfirst.in";

    const candidates = [
      this.credentials.loginUrl,
      this.credentials.portalUrl,
      this.credentials.websiteUrl,
      this.credentials.siteUrl,
      this.credentials.webUrl,
      this.credentials.baseUrl,
      this.credentials.apiUrl,
      this.credentials.rateApiUrl,
    ].filter(Boolean);

    for (const candidate of candidates) {
      try {
        const parsed = new URL(candidate);
        if (parsed.origin && parsed.origin !== "null") {
          return parsed.origin;
        }
      } catch {
        continue;
      }
    }

    return fallback;
  }

  // ─── URL Helpers ────────────────────────────────────────────────────────────
  getLoginPageUrl() {
    if (this.credentials.loginUrl) {
      try {
        return new URL(this.credentials.loginUrl).toString();
      } catch {
        // ignore
      }
    }
    return `${this.getPortalOrigin()}/`;
  }

  getLoginActionUrl() {
    return `${this.getPortalOrigin()}/Login/LoginValidate`;
  }

  getRateApiUrl() {
    return `${this.getPortalOrigin()}/CustomerRateCompare/GetCustomerRate`;
  }

  getRatePageUrl() {
    return `${this.getPortalOrigin()}/CustomerRateCompare/CustomerRateCompare`;
  }

  // ─── Browser User Agent ─────────────────────────────────────────────────────
  getBrowserUserAgent() {
    return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
  }

  // ─── Base Headers ───────────────────────────────────────────────────────────
  getBaseHeaders() {
    return {
      "User-Agent": this.getBrowserUserAgent(),
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
    };
  }

  // ─── Page Headers (GET HTML) ────────────────────────────────────────────────
  getPageHeaders(extraCookies = "") {
    return {
      ...this.getBaseHeaders(),
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      ...(extraCookies ? { Cookie: extraCookies } : {}),
    };
  }

  // ─── Form Submit Headers (POST login) ───────────────────────────────────────
  getFormSubmitHeaders(cookieStr, refererUrl) {
    const portalOrigin = this.getPortalOrigin();

    return {
      ...this.getBaseHeaders(),
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: portalOrigin,
      Referer: refererUrl || this.getLoginPageUrl(),
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-User": "?1",
      "Cache-Control": "no-cache",
      Cookie: cookieStr,
    };
  }

  // ─── Rate Request Headers (POST JSON for rates) ─────────────────────────────
  getRateRequestHeaders() {
    const cookieStr = this.credentials.sessionCookies || "";

    return {
      ...this.getBaseHeaders(),
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Content-Type": "application/json; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      Referer: this.getRatePageUrl(),
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      Cookie: cookieStr,
    };
  }

  // ─── Cookie Utilities ───────────────────────────────────────────────────────
  parseCookies(setCookieHeaders) {
    const cookies = {};
    if (!Array.isArray(setCookieHeaders)) return cookies;

    for (const header of setCookieHeaders) {
      const firstPart = header.split(";")[0].trim();
      const eqIdx = firstPart.indexOf("=");
      if (eqIdx > 0) {
        const name = firstPart.substring(0, eqIdx).trim();
        const value = firstPart.substring(eqIdx + 1).trim();
        cookies[name] = value;
      }
    }

    return cookies;
  }

  buildCookieString(cookiesObj) {
    return Object.entries(cookiesObj)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  mergeCookies(...cookieHeaderArrays) {
    let merged = {};
    for (const headers of cookieHeaderArrays) {
      if (Array.isArray(headers)) {
        const parsed = this.parseCookies(headers);
        merged = { ...merged, ...parsed };
      }
    }
    return merged;
  }

  // ─── CSRF Token Extraction ──────────────────────────────────────────────────
  extractCSRFToken(html) {
    if (!html) {
      console.error("[Xpression] No HTML received for CSRF extraction");
      return null;
    }

    const htmlStr = typeof html === "string" ? html : String(html);
    console.log(`[Xpression] HTML length for CSRF scan: ${htmlStr.length}`);

    // Pattern 1: Exact format from WorldFirst site
    const p1 =
      /<input\s+name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"/i;
    const m1 = htmlStr.match(p1);
    if (m1?.[1]) {
      console.log("[Xpression] ✅ CSRF found via Pattern 1 (name-type-value)");
      return m1[1];
    }

    // Pattern 2: name first, then value
    const p2 =
      /<input[^>]+name="__RequestVerificationToken"[^>]+value="([^"]+)"/i;
    const m2 = htmlStr.match(p2);
    if (m2?.[1]) {
      console.log("[Xpression] ✅ CSRF found via Pattern 2 (name then value)");
      return m2[1];
    }

    // Pattern 3: value first, then name
    const p3 =
      /<input[^>]+value="([^"]{20,})"[^>]+name="__RequestVerificationToken"/i;
    const m3 = htmlStr.match(p3);
    if (m3?.[1]) {
      console.log("[Xpression] ✅ CSRF found via Pattern 3 (value then name)");
      return m3[1];
    }

    // Pattern 4: Single quotes
    const p4 =
      /<input[^>]+name='__RequestVerificationToken'[^>]+value='([^']+)'/i;
    const m4 = htmlStr.match(p4);
    if (m4?.[1]) {
      console.log("[Xpression] ✅ CSRF found via Pattern 4 (single quotes)");
      return m4[1];
    }

    // Pattern 5: Scan all hidden inputs
    const allHiddenInputs = [
      ...htmlStr.matchAll(/<input[^>]+type="hidden"[^>]*>/gi),
    ];
    for (const match of allHiddenInputs) {
      const inputHtml = match[0];
      const nameMatch = inputHtml.match(/name="([^"]+)"/i);
      const valueMatch = inputHtml.match(/value="([^"]{30,})"/i);
      if (
        nameMatch?.[1] === "__RequestVerificationToken" &&
        valueMatch?.[1]
      ) {
        console.log(
          "[Xpression] ✅ CSRF found via Pattern 5 (hidden input scan)"
        );
        return valueMatch[1];
      }
    }

    // Pattern 6: Surrounding text
    const tokenIndex = htmlStr.indexOf("__RequestVerificationToken");
    if (tokenIndex !== -1) {
      const surrounding = htmlStr.substring(tokenIndex, tokenIndex + 400);
      const valueMatch = surrounding.match(/value="([^"]{20,})"/i);
      if (valueMatch?.[1]) {
        console.log(
          "[Xpression] ✅ CSRF found via Pattern 6 (surrounding text)"
        );
        return valueMatch[1];
      }
    }

    console.error("[Xpression] ❌ Could not extract CSRF token from HTML");
    return null;
  }

  // ─── Extract CSRF from Cookies ──────────────────────────────────────────────
  extractCSRFFromCookies(setCookieHeaders) {
    if (!Array.isArray(setCookieHeaders)) return null;

    for (const header of setCookieHeaders) {
      const match = header.match(/__RequestVerificationToken=([^;]+)/i);
      if (match?.[1]) {
        console.log("[Xpression] ✅ CSRF found in Set-Cookie header");
        return match[1];
      }
    }

    return null;
  }

  // ─── Full Authentication Flow ───────────────────────────────────────────────
  async authenticate() {
    try {
      const portalOrigin = this.getPortalOrigin();
      const loginPageUrl = this.getLoginPageUrl();
      const loginActionUrl = this.getLoginActionUrl();

      console.log(
        `[Xpression] 🔐 Starting authentication for: ${this.vendor.vendorName}`
      );
      console.log(`[Xpression] Portal origin: ${portalOrigin}`);
      console.log(`[Xpression] Login page URL: ${loginPageUrl}`);
      console.log(`[Xpression] Login action URL: ${loginActionUrl}`);
      console.log(`[Xpression] Username: ${this.credentials.userId}`);

      // ── STEP 1: GET login page ──
      console.log("[Xpression] Step 1: Fetching login page...");

      const loginPageResponse = await this.axiosInstance.get(loginPageUrl, {
        headers: this.getPageHeaders(),
      });

      console.log(
        `[Xpression] Login page status: ${loginPageResponse.status}`
      );

      if (loginPageResponse.status !== 200) {
        throw new Error(
          `Login page returned unexpected status: ${loginPageResponse.status}`
        );
      }

      const loginPageCookieHeaders =
        loginPageResponse.headers["set-cookie"] || [];
      console.log(
        `[Xpression] Login page set ${loginPageCookieHeaders.length} cookies`
      );

      const loginPageCookies = this.parseCookies(loginPageCookieHeaders);
      console.log(
        "[Xpression] Login page cookie names:",
        Object.keys(loginPageCookies)
      );

      // ── STEP 2: Extract CSRF token ──
      let csrfToken =
        this.extractCSRFToken(loginPageResponse.data) ||
        this.extractCSRFFromCookies(loginPageCookieHeaders);

      if (!csrfToken) {
        console.warn(
          "[Xpression] ⚠️ CSRF token not found, attempting login without it..."
        );
      } else {
        console.log(
          `[Xpression] ✅ CSRF Token: ${csrfToken.substring(0, 30)}...`
        );
      }

      // ── STEP 3: Build cookie string for login POST ──
      const loginCookieStr = this.buildCookieString(loginPageCookies);
      console.log(
        `[Xpression] Sending cookies with login: ${loginCookieStr.substring(0, 100)}...`
      );

      // ── STEP 4: Build login form payload ──
      const loginPayload = new URLSearchParams();
      loginPayload.append("UserName", this.credentials.userId);
      loginPayload.append("Password", this.credentials.password);
      loginPayload.append("UserType", "");

      if (csrfToken) {
        loginPayload.append("__RequestVerificationToken", csrfToken);
      }

      console.log(
        "[Xpression] Step 2: Submitting login form to:",
        loginActionUrl
      );

      // ── STEP 5: POST login credentials ──
      const loginResponse = await this.axiosInstance.post(
        loginActionUrl,
        loginPayload.toString(),
        {
          headers: this.getFormSubmitHeaders(loginCookieStr, loginPageUrl),
          maxRedirects: 0,
        }
      );

      console.log(`[Xpression] Login POST status: ${loginResponse.status}`);

      const loginResponseCookieHeaders =
        loginResponse.headers["set-cookie"] || [];
      console.log(
        `[Xpression] Login response cookies count: ${loginResponseCookieHeaders.length}`
      );

      // ── STEP 6: Check success ──
      const isRedirect =
        loginResponse.status === 301 ||
        loginResponse.status === 302 ||
        loginResponse.status === 303;

      const isSuccess = isRedirect || loginResponse.status === 200;

      if (!isSuccess) {
        throw new Error(
          `Login failed with status: ${loginResponse.status}`
        );
      }

      // ── STEP 7: Merge all cookies ──
      const allCookies = this.mergeCookies(
        loginPageCookieHeaders,
        loginResponseCookieHeaders
      );
      console.log(
        "[Xpression] All cookie names after login:",
        Object.keys(allCookies)
      );

      // ── STEP 8: Follow redirect if applicable ──
      if (isRedirect && loginResponse.headers.location) {
        const redirectPath = loginResponse.headers.location;
        const redirectUrl = redirectPath.startsWith("http")
          ? redirectPath
          : `${portalOrigin}${redirectPath}`;

        console.log(
          `[Xpression] Step 3: Following redirect to: ${redirectUrl}`
        );

        const currentCookieStr = this.buildCookieString(allCookies);

        const redirectResponse = await this.axiosInstance.get(redirectUrl, {
          headers: this.getPageHeaders(currentCookieStr),
          maxRedirects: 5,
        });

        console.log(
          `[Xpression] Redirect response status: ${redirectResponse.status}`
        );

        const redirectCookieHeaders =
          redirectResponse.headers["set-cookie"] || [];

        const finalCookies = this.mergeCookies(
          loginPageCookieHeaders,
          loginResponseCookieHeaders,
          redirectCookieHeaders
        );

        console.log(
          "[Xpression] Final cookie names after redirect:",
          Object.keys(finalCookies)
        );

        // Verify not still on login page
        const responseHtml =
          typeof redirectResponse.data === "string"
            ? redirectResponse.data
            : "";

        const isStillOnLoginPage =
          responseHtml.includes("/Login/LoginValidate") &&
          responseHtml.includes('name="UserName"');

        if (isStillOnLoginPage) {
          throw new Error(
            "Login failed - redirected back to login page. Check credentials."
          );
        }

        const finalCookieStr = this.buildCookieString(finalCookies);
        const sessionId =
          finalCookies["ASP.NET_SessionId"] ||
          allCookies["ASP.NET_SessionId"] ||
          `session_${Date.now()}`;

        await this.saveSession(sessionId, finalCookieStr, csrfToken || "");
        console.log(
          "[Xpression] ✅ Authentication successful (with redirect follow)"
        );
        return this.buildAuthResult(sessionId, csrfToken || "");
      }

      // ── STEP 9: Handle 200 response ──
      const cookieStr = this.buildCookieString(allCookies);
      const sessionId =
        allCookies["ASP.NET_SessionId"] || `session_${Date.now()}`;

      if (loginResponse.status === 200) {
        const responseHtml =
          typeof loginResponse.data === "string" ? loginResponse.data : "";

        const isStillOnLoginPage =
          responseHtml.includes("/Login/LoginValidate") &&
          responseHtml.includes('name="UserName"');

        if (isStillOnLoginPage && responseHtml.length < 80000) {
          const errorMatch = responseHtml.match(
            /class="[^"]*error[^"]*"[^>]*>([^<]+)</i
          );
          const errorMsg = errorMatch?.[1]?.trim() || "Invalid credentials";
          throw new Error(`Login failed: ${errorMsg}`);
        }
      }

      await this.saveSession(sessionId, cookieStr, csrfToken || "");
      console.log("[Xpression] ✅ Authentication successful (200 response)");
      return this.buildAuthResult(sessionId, csrfToken || "");
    } catch (error) {
      console.error("[Xpression] ❌ Authentication failed:", error.message);
      throw error;
    }
  }

  // ─── Save Session to DB ─────────────────────────────────────────────────────
  async saveSession(sessionId, cookieStr, csrfToken) {
    this.credentials.sessionId = sessionId;
    this.credentials.sessionCookies = cookieStr;
    this.credentials.verificationToken = csrfToken;
    this.credentials.sessionExpiresAt = new Date(
      Date.now() + SESSION_EXPIRY_MS
    );
    this.credentials.lastSessionRefreshAt = new Date();

    this.vendor.markModified("xpressionCredentials");
    await this.vendor.save();

    console.log("[Xpression] 💾 Session saved to DB");
    console.log(`[Xpression] Session ID: ${sessionId}`);
    console.log(
      `[Xpression] Expires: ${this.credentials.sessionExpiresAt}`
    );
    console.log(
      `[Xpression] Cookie string: ${cookieStr.substring(0, 100)}...`
    );
  }

  // ─── Build Auth Result ──────────────────────────────────────────────────────
  buildAuthResult(sessionId, csrfToken) {
    return {
      success: true,
      sessionId,
      verificationToken: csrfToken,
      expiresAt: this.credentials.sessionExpiresAt,
    };
  }

  // ─── Fetch Rates ────────────────────────────────────────────────────────────
  async fetchRates(params) {
    try {
      const {
        originCode,
        destinationCode,
        destination,
        weight,
        volWeight = 0,
        vendorCode = "",
        productCode = "",
        serviceType = "",
        toPinCode = "",
      } = params;

      // Validate required params
      if (!originCode || !destinationCode || !weight) {
        throw new Error(
          "Missing required parameters: originCode, destinationCode, weight"
        );
      }

      const parsedWeight = parseFloat(weight);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        throw new Error(`Invalid weight value: ${weight}`);
      }

      const rateUrl = this.getRateApiUrl();
      const customerCode = this.credentials.customerCode || this.credentials.userId || "";

      // ── Build request body in the exact format the API expects ──
      // Wrapped in { searchdata: { ... } }
      // Weight MUST be a string
      const requestBody = {
        searchdata: {
          CustomerCode: customerCode,
          VendorCode: vendorCode || "",
          ProductCode: productCode || "",
          DestinationCode: destinationCode,
          Destination: destination || destinationCode,
          ServiceType: serviceType || "",
          Weight: String(parsedWeight),
          VolWeight: String(parseFloat(volWeight) || 0),
          OriginCode: originCode,
          ToPinCode: toPinCode || "",
        },
      };

      console.log(`[Xpression] 📦 Fetching rates from: ${rateUrl}`);
      console.log(
        `[Xpression] Request body: ${JSON.stringify(requestBody)}`
      );
      console.log(
        `[Xpression] Using cookies: ${(this.credentials.sessionCookies || "").substring(0, 100)}...`
      );

      // ── Make rate API request ──
      let response = await this.axiosInstance.post(rateUrl, requestBody, {
        headers: this.getRateRequestHeaders(),
      });

      console.log(
        `[Xpression] Rate API response status: ${response.status}`
      );

      // ── Handle session expiry ──
      const isSessionExpired =
        response.status === 401 ||
        response.status === 403 ||
        response.status === 302 ||
        response.status === 301 ||
        (typeof response.data === "string" &&
          (response.data.includes("/Login/LoginValidate") ||
            response.data.includes("<title>Login</title>")));

      if (isSessionExpired) {
        console.log(
          "[Xpression] ⚠️ Session expired during rate fetch, re-authenticating..."
        );
        await this.authenticate();

        // Retry with new session
        response = await this.axiosInstance.post(rateUrl, requestBody, {
          headers: this.getRateRequestHeaders(),
        });

        console.log(
          `[Xpression] Retry response status: ${response.status}`
        );
      }

      // ── Handle errors ──
      if (response.status !== 200) {
        const errorPreview =
          typeof response.data === "string"
            ? response.data.substring(0, 500)
            : JSON.stringify(response.data).substring(0, 500);

        console.error(
          `[Xpression] Rate API error response: ${errorPreview}`
        );
        throw new Error(
          `Rate API returned status ${response.status}`
        );
      }

      // ── Parse response ──
      return this.parseAndTransformRates(response.data);
    } catch (error) {
      console.error("[Xpression] ❌ Error fetching rates:", error.message);
      throw error;
    }
  }

  // ─── Parse and Transform Rate Response ──────────────────────────────────────
  // Response format: { "error": "", "result": [ headerRow, ...dataRows ] }
  // First element in result is the column header row — must skip it
  parseAndTransformRates(data) {
    let parsed = data;

    console.log(
      `[Xpression] Parsing response type: ${typeof parsed}`,
      Array.isArray(parsed) ? `array[${parsed.length}]` : ""
    );

    // Handle string response
    if (typeof parsed === "string") {
      const trimmed = parsed.trim();

      if (trimmed.startsWith("<")) {
        console.error(
          "[Xpression] Received HTML instead of JSON - session expired"
        );
        throw new Error(
          "Session expired - received HTML login page instead of rate data"
        );
      }

      try {
        parsed = JSON.parse(trimmed);
      } catch {
        console.error(
          "[Xpression] Failed to parse JSON:",
          trimmed.substring(0, 300)
        );
        throw new Error("Invalid JSON response from rate API");
      }
    }

    // Extract result array from { error, result } wrapper
    let ratesArray = null;

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      // Check for API error
      if (parsed.error && parsed.error !== "") {
        console.warn(`[Xpression] API returned error: ${parsed.error}`);
      }

      // Extract from known wrapper fields
      if (Array.isArray(parsed.result)) {
        ratesArray = parsed.result;
      } else if (Array.isArray(parsed.Result)) {
        ratesArray = parsed.Result;
      } else if (Array.isArray(parsed.data)) {
        ratesArray = parsed.data;
      } else if (Array.isArray(parsed.Data)) {
        ratesArray = parsed.Data;
      } else if (Array.isArray(parsed.rates)) {
        ratesArray = parsed.rates;
      } else if (Array.isArray(parsed.Rates)) {
        ratesArray = parsed.Rates;
      } else if (Array.isArray(parsed.Results)) {
        ratesArray = parsed.Results;
      }
    } else if (Array.isArray(parsed)) {
      ratesArray = parsed;
    }

    if (!ratesArray || !Array.isArray(ratesArray)) {
      console.error(
        "[Xpression] Could not extract rate array:",
        JSON.stringify(parsed).substring(0, 500)
      );

      // If there's an error message, include it
      if (parsed?.error) {
        throw new Error(`Xpression API error: ${parsed.error}`);
      }

      throw new Error(
        `Invalid response format. Expected array in response.`
      );
    }

    // ── Skip the header row ──
    // The first element is column headers like:
    // { "From Date": "From Date", "Vendor": "Vendor", ... }
    // Detect it by checking if values match keys
    let dataRows = ratesArray;

    if (ratesArray.length > 0) {
      const firstRow = ratesArray[0];
      const isHeaderRow = this.isHeaderRow(firstRow);

      if (isHeaderRow) {
        console.log(
          "[Xpression] First row is header row, skipping it"
        );
        dataRows = ratesArray.slice(1);
      }
    }

    console.log(
      `[Xpression] ✅ Got ${dataRows.length} rate rows (skipped header: ${ratesArray.length - dataRows.length})`
    );

    if (dataRows.length > 0) {
      console.log(
        "[Xpression] Sample rate keys:",
        Object.keys(dataRows[0])
      );
      console.log(
        "[Xpression] Sample rate:",
        JSON.stringify(dataRows[0])
      );
    }

    if (dataRows.length === 0) {
      console.warn("[Xpression] No rate data found after parsing");

      if (parsed?.error) {
        throw new Error(`No rates found. API error: ${parsed.error}`);
      }

      return [];
    }

    return this.transformRates(dataRows);
  }

  // ─── Check if row is a header row ───────────────────────────────────────────
  isHeaderRow(row) {
    if (!row || typeof row !== "object") return false;

    const entries = Object.entries(row);
    if (entries.length === 0) return false;

    // Header row: keys and values are the same string
    // e.g. { "Vendor": "Vendor", "Total": "Total" }
    let matchCount = 0;
    for (const [key, value] of entries) {
      if (typeof value === "string" && key === value) {
        matchCount++;
      }
    }

    // If more than half the fields match key=value, it's a header row
    return matchCount > entries.length / 2;
  }

  // ─── Transform Rates to Frontend Format ─────────────────────────────────────
  // Maps from Xpression field names (with spaces) to ResultCard format
  //
  // Xpression fields:
  //   "From Date", "Vendor", "Product", "Service", "Country", "Destination",
  //   "Amount" (base rate), "Other Charges", "Fuel", "Total" (subtotal),
  //   "Tax", "Grand Total", "Display Days",
  //   "Vendor_Code", "customer_code", "Prod_Code", "Destination_Code"
  transformRates(rates) {
    const vendorName = this.vendor?.vendorName || "Xpression";

    return rates
      .map((rate) => {
        // ── Extract prices using exact field names from API ──
        const baseRate =
          parseFloat(rate["Amount"]) ||
          parseFloat(rate["BaseFreight"]) ||
          parseFloat(rate["BaseRate"]) ||
          parseFloat(rate["Freight"]) ||
          0;

        const fuelCharge =
          parseFloat(rate["Fuel"]) ||
          parseFloat(rate["FuelCharge"]) ||
          parseFloat(rate["FuelSurcharge"]) ||
          0;

        const otherCharges =
          parseFloat(rate["Other Charges"]) ||
          parseFloat(rate["OtherCharges"]) ||
          0;

        const subtotal =
          parseFloat(rate["Total"]) ||
          0;

        const taxAmount =
          parseFloat(rate["Tax"]) ||
          parseFloat(rate["GST"]) ||
          0;

        const grandTotal =
          parseFloat(rate["Grand Total"]) ||
          parseFloat(rate["GrandTotal"]) ||
          parseFloat(rate["TotalCharge"]) ||
          parseFloat(rate["TotalAmount"]) ||
          0;

        // ── Calculate subtotalBeforeGST and total ──
        let subtotalBeforeGST;
        let gstAmount;
        let total;

        if (grandTotal > 0 && taxAmount > 0) {
          // Both provided - use directly
          subtotalBeforeGST = parseFloat((grandTotal - taxAmount).toFixed(2));
          gstAmount = parseFloat(taxAmount.toFixed(2));
          total = parseFloat(grandTotal.toFixed(2));
        } else if (grandTotal > 0) {
          // Grand total without separate tax
          subtotalBeforeGST = parseFloat((grandTotal / 1.18).toFixed(2));
          gstAmount = parseFloat((grandTotal - subtotalBeforeGST).toFixed(2));
          total = parseFloat(grandTotal.toFixed(2));
        } else if (subtotal > 0 && taxAmount > 0) {
          // Subtotal + tax
          subtotalBeforeGST = parseFloat(subtotal.toFixed(2));
          gstAmount = parseFloat(taxAmount.toFixed(2));
          total = parseFloat((subtotal + taxAmount).toFixed(2));
        } else if (subtotal > 0) {
          // Just subtotal
          subtotalBeforeGST = parseFloat(subtotal.toFixed(2));
          gstAmount = parseFloat((subtotal * 0.18).toFixed(2));
          total = parseFloat((subtotal + gstAmount).toFixed(2));
        } else {
          // Build from components
          const componentTotal = baseRate + fuelCharge + otherCharges;
          subtotalBeforeGST = parseFloat(componentTotal.toFixed(2));
          gstAmount = parseFloat((componentTotal * 0.18).toFixed(2));
          total = parseFloat((componentTotal + gstAmount).toFixed(2));
        }

        // ── Service name ──
        // Combine Vendor + Product + Service for a descriptive name
        const vendor = rate["Vendor"] || "";
        const product = rate["Product"] || "";
        const service = rate["Service"] || "";

        let serviceName = "";
        if (vendor && service) {
          serviceName = `${vendor} - ${service}`;
        } else if (vendor && product) {
          serviceName = `${vendor} - ${product}`;
        } else if (vendor) {
          serviceName = vendor;
        } else {
          serviceName =
            rate.ServiceName ||
            rate.ServiceType ||
            rate.ProductName ||
            `${vendorName} Express`;
        }

        // ── Transit days ──
        const displayDays = rate["Display Days"] || "";
        const transitDays =
          parseInt(displayDays) ||
          parseInt(rate["TransitDays"]) ||
          parseInt(rate["Transit"]) ||
          0;

        // ── Zone / Country ──
        const zone =
          rate["Country"] ||
          rate["Destination"] ||
          rate["Zone"] ||
          "";

        // ── Build charges breakdown ──
        const chargesBreakdown = {};
        if (fuelCharge > 0) {
          chargesBreakdown["Fuel Surcharge"] = parseFloat(fuelCharge.toFixed(2));
        }
        if (otherCharges > 0) {
          chargesBreakdown["Other Charges"] = parseFloat(otherCharges.toFixed(2));
        }

        return {
          // ── Required by ResultCard ──
          originalName: serviceName,
          vendorName: vendorName,
          baseRate: parseFloat(baseRate.toFixed(2)),
          subtotalBeforeGST: subtotalBeforeGST,
          gstAmount: gstAmount,
          total: total,
          chargesBreakdown: chargesBreakdown,

          // ── Display metadata ──
          zone: zone,
          tatDays: transitDays,
          isDDP: false,
          isEcommerce: false,
          rateCategory: "purchase",
          rateStatus: "live",
          isSpecialRate: false,
          profitPercent: 0,
          profitCharges: 0,
          awbCharges: 0,
          currency: "INR",

          // ── Xpression-specific fields ──
          serviceCode: rate["Prod_Code"] || "",
          vendorCode: rate["Vendor_Code"] || "",
          productCode: rate["Prod_Code"] || "",
          destinationCode: rate["Destination_Code"] || "",
          xpressionCustomerCode: rate["customer_code"] || "",

          // ── Raw charges ──
          charges: {
            baseFreight: baseRate,
            fuel: fuelCharge,
            tax: taxAmount,
            other: otherCharges,
          },
        };
      })
      .filter((r) => r.total > 0 || r.baseRate > 0);
  }
}

// ─── Helper Export ────────────────────────────────────────────────────────────
export async function getXpressionRates(vendorId, params) {
  try {
    const fetcher = new XpressionRateFetcher(vendorId);
    await fetcher.initialize();

    if (!fetcher.isSessionValid()) {
      console.log("[Xpression] Session invalid or expired, authenticating...");
      await fetcher.authenticate();
    }

    const rates = await fetcher.fetchRates(params);
    return { success: true, data: rates };
  } catch (error) {
    console.error("[Xpression] Helper error:", error.message);
    return { success: false, error: error.message };
  }
}