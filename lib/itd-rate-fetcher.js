import VendorIntegration from "@/models/VendorIntegration";

const DEFAULT_PRODUCT_CODE = "NONDOX";
const GST_RATE = 0.18;

const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBase64 = (value) => Buffer.from(String(value || "")).toString("base64");

const formatDate = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const buildRateEndpoint = (apiUrl, companyId) => {
  const cleanUrl = String(apiUrl || "").replace(/\/+$/, "");
  const baseUrl = cleanUrl.endsWith("/docket_api") ? cleanUrl : `${cleanUrl}/docket_api`;
  return `${baseUrl}/customer_rate_cals?api_company_id=${encodeURIComponent(companyId)}`;
};

const getCustomerCode = (credentials) =>
  credentials.customerCode ||
  credentials.rateCustomerCode ||
  credentials.trackingCustomerCode ||
  credentials.cachedCustomerId ||
  "";

const getConfiguredProducts = (credentials, requestedProductCode) => {
  if (requestedProductCode) return [String(requestedProductCode).trim()].filter(Boolean);

  const serviceProducts = (credentials.services || [])
    .map((service) => service.apiServiceCode || service.serviceCode || service.serviceName)
    .map((code) => String(code || "").trim())
    .filter(Boolean);

  return serviceProducts.length > 0 ? [...new Set(serviceProducts)] : [DEFAULT_PRODUCT_CODE];
};

export class ITDRateFetcher {
  constructor(vendorOrId) {
    this.vendorOrId = vendorOrId;
    this.vendor = null;
    this.credentials = null;
  }

  async initialize() {
    this.vendor =
      typeof this.vendorOrId === "string"
        ? await VendorIntegration.findById(this.vendorOrId)
        : this.vendorOrId;

    if (!this.vendor) throw new Error("ITD vendor not found");
    if (this.vendor.softwareType !== "itd") {
      throw new Error(`Invalid software type: ${this.vendor.softwareType}`);
    }
    if (!this.vendor.isActive) {
      throw new Error(`Vendor is not active: ${this.vendor.vendorName}`);
    }

    this.credentials = this.vendor.itdCredentials;

    // ADD THIS
    console.log("[ITD] Configured services:",
      (this.credentials.services || []).map(s => ({
        serviceName: s.serviceName,
        serviceCode: s.serviceCode,
        apiServiceCode: s.apiServiceCode,  // Is this populated?
      }))
    );
    
    if (!this.credentials) throw new Error("Missing ITD credentials");
    if (!this.credentials.apiUrl) throw new Error("Missing ITD API URL");
    if (!this.credentials.companyId) throw new Error("Missing ITD company ID");
    if (!this.credentials.email) throw new Error("Missing ITD email");
    if (!this.credentials.password) throw new Error("Missing ITD password");
    if (!getCustomerCode(this.credentials)) throw new Error("Missing ITD customer code");
  }

  async fetchRates(params) {
    if (!this.vendor || !this.credentials) await this.initialize();

    const destinationCode = String(params.destinationCode || "").toUpperCase();
    const originCode = String(params.originCode || "IN").toUpperCase();
    const actualWeight = toNumber(params.weight ?? params.actualWeight);
    const pcs = Number.parseInt(params.pcs || 1, 10) || 1;

    if (!destinationCode) throw new Error("Missing destination code");
    if (!actualWeight || actualWeight <= 0) throw new Error("Missing actual weight");

    // If a specific product is requested, use it; otherwise send empty to get all rates
    const productCode = params.productCode
      ? String(params.productCode).trim()
      : "";

    const rates = await this.fetchProductRates({
      productCode,
      destinationCode,
      originCode,
      actualWeight,
      pcs,
      bookingDate: params.bookingDate || formatDate(),
    });

    if (rates.length === 0) {
      throw new Error("No rates found from ITD API");
    }

    return this.dedupeRates(rates);
  }

  async fetchProductRates({ productCode, destinationCode, originCode, actualWeight, pcs, bookingDate }) {
    const endpoint = buildRateEndpoint(this.credentials.apiUrl, this.credentials.companyId);
    const formData = new FormData();

    formData.append("product_code", productCode);
    formData.append("destination_code", destinationCode);
    formData.append("booking_date", bookingDate);
    formData.append("origin_code", originCode);
    formData.append("pcs", String(pcs));
    formData.append("actual_weight", String(actualWeight));
    formData.append("customer_code", String(getCustomerCode(this.credentials)));
    formData.append("username", toBase64(this.credentials.email));
    formData.append("password", toBase64(this.credentials.password));

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
      cache: "no-store",
    });

    const responseText = await response.text();

    // ADD THIS - see raw API response
    console.log(`[ITD] Raw response for ${productCode}:`, responseText.slice(0, 500));

    if (!response.ok) {
      throw new Error(`ITD API returned ${response.status}: ${responseText.slice(0, 300)}`);
    }

    let payload;
    try {
      payload = JSON.parse(responseText);
    } catch {
      throw new Error(`Invalid JSON from ITD: ${responseText.slice(0, 300)}`);
    }

    // ADD THIS - see parsed payload structure
    console.log(`[ITD] Parsed payload for ${productCode}:`, JSON.stringify(payload, null, 2));

    if (payload.success === false) {
      const error = Array.isArray(payload.error)
        ? payload.error.join(", ")
        : payload.error || "No rates found";
      throw new Error(error);
    }

    if (!Array.isArray(payload.data)) return [];
    return payload.data.map((rate) => this.transformRate(rate, productCode));
  }

  transformRate(rate, productCode) {
    const service = this.findService(rate.code || productCode);
    const baseRate = toNumber(rate.rate);
    const fsc = toNumber(rate.fsc);
    const otherCharges = toNumber(rate.other_charges);
    const igst = toNumber(rate.igst);
    const cgst = toNumber(rate.cgst);
    const sgst = toNumber(rate.sgst);
    const gstAmount = igst + cgst + sgst;
    const subtotalBeforeGST = baseRate + fsc + otherCharges;
    const total = toNumber(rate.total, subtotalBeforeGST + (gstAmount || subtotalBeforeGST * GST_RATE));
    const weight = toNumber(rate.weight);

    return {
      originalName: service?.serviceName || rate.name || rate.code || productCode,
      serviceCode: service?.serviceCode || rate.code || productCode,
      vendorCode: this.vendor.vendorCode,
      vendorName: this.vendor.vendorName,
      productCode,
      destinationCode: "",
      weight,
      baseRate,
      fuelCharges: fsc,
      otherCharges,
      gstAmount: gstAmount || Math.max(total - subtotalBeforeGST, 0),
      subtotalBeforeGST,
      total,
      perKg: toNumber(rate.per_kg, weight > 0 ? total / weight : total),
      chargesBreakdown: {
        Freight: baseRate,
        Fuel: fsc,
        "Other Charges": otherCharges,
        IGST: igst,
        CGST: cgst,
        SGST: sgst,
      },
      rateCategory: "purchase",
      rateStatus: "live",
      rawRate: rate,
    };
  }

  findService(code) {
    const normalized = String(code || "").trim().toLowerCase();
    return (this.credentials.services || []).find((service) =>
      [service.apiServiceCode, service.serviceCode, service.serviceName]
        .map((value) => String(value || "").trim().toLowerCase())
        .includes(normalized)
    );
  }

  dedupeRates(rates) {
    const byKey = new Map();
    rates.forEach((rate) => {
      const key = `${rate.serviceCode}|${rate.productCode}|${rate.total}`;
      if (!byKey.has(key)) byKey.set(key, rate);
    });
    return [...byKey.values()];
  }
}

export async function fetchITDRates(vendorId, params) {
  const fetcher = new ITDRateFetcher(vendorId);
  await fetcher.initialize();
  return fetcher.fetchRates(params);
}
