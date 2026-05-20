import { NextResponse } from "next/server";

type AnalyzeDocumentRequest = {
  fileName: string;
  fileType: string;
  fileBase64: string;
  fileSize?: number;
  chiefComplaint?: string;
  selectedRegion?: string | null;
  selectedLabel?: string | null;
  painLevel?: number | null;
  visitReason?: string | null;
};

type ErrorCode =
  | "DOCUMENT_AGENT_NOT_CONFIGURED"
  | "INVALID_REQUEST"
  | "NO_FILE_UPLOADED"
  | "UNSUPPORTED_FILE_TYPE"
  | "PDF_NOT_SUPPORTED_YET"
  | "INVALID_DOCUMENT_AGENT_KEY"
  | "DOCUMENT_AGENT_PROVIDER_ERROR"
  | "DOCUMENT_AGENT_BAD_RESPONSE";

function jsonError(
  status: number,
  error: ErrorCode,
  message: string,
  extra?: Record<string, unknown>
) {
  return NextResponse.json({ ok: false, error, message, ...(extra ?? {}) }, { status });
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  // Node.js runtime (Cloudflare/OpenNext also provides Buffer in server context)
  return Buffer.from(new Uint8Array(buf)).toString("base64");
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return jsonError(
      503,
      "DOCUMENT_AGENT_NOT_CONFIGURED",
      "کلید سرویس تحلیل مدارک تنظیم نشده است."
    );
  }

  const contentType = req.headers.get("content-type") || "";

  // We support BOTH:
  // 1) JSON requests from the web UI (base64 payload)
  // 2) multipart/form-data requests (curl / manual testing)
  let fileName = "";
  let fileType = "";
  let fileBase64 = "";
  let fileSize: number | null = null;

  // Optional context (from JSON mode)
  let chiefComplaint: string | undefined;
  let selectedRegion: string | null | undefined;
  let selectedLabel: string | null | undefined;
  let painLevel: number | null | undefined;
  let visitReason: string | null | undefined;

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[Document Agent] formData parse failed", {
          name: err instanceof Error ? err.name : "unknown",
          message: err instanceof Error ? err.message : String(err),
        });
      }
      return jsonError(400, "INVALID_REQUEST", "فرم‌دیتا نامعتبر است.");
    }

    const singleFile = formData.get("file");
    const multipleFiles = formData.getAll("files");
    const uploadedFiles: File[] = [
      ...(singleFile instanceof File ? [singleFile] : []),
      ...multipleFiles.filter((item): item is File => item instanceof File),
    ];

    if (process.env.NODE_ENV === "development") {
      console.log("[Document Agent] formData keys:", Array.from(formData.keys()));
      console.log("[Document Agent] raw file value:", singleFile);
      console.log("[Document Agent] file count:", uploadedFiles.length);
      console.log(
        "[Document Agent] file meta:",
        uploadedFiles.map((f) => ({ name: f.name, type: f.type, size: f.size }))
      );
    }

    if (uploadedFiles.length === 0) {
      return jsonError(400, "NO_FILE_UPLOADED", "فایلی برای تحلیل ارسال نشده است.");
    }

    // MVP: analyze only the first file per request.
    const file = uploadedFiles[0]!;
    fileName = file.name || "upload";
    fileType = file.type || "application/octet-stream";
    fileSize = typeof file.size === "number" ? file.size : null;

    if (fileType === "application/pdf") {
      return jsonError(
        400,
        "PDF_NOT_SUPPORTED_YET",
        "تحلیل PDF هنوز فعال نشده است. لطفاً فعلاً تصویر آزمایش یا نسخه را با فرمت JPG یا PNG بارگذاری کنید."
      );
    }

    if (!fileType.startsWith("image/")) {
      return jsonError(
        400,
        "UNSUPPORTED_FILE_TYPE",
        "فرمت فایل پشتیبانی نمی‌شود. لطفاً JPG، PNG یا PDF بارگذاری کنید."
      );
    }

    const buf = await file.arrayBuffer();
    if (buf.byteLength === 0) {
      return jsonError(400, "INVALID_REQUEST", "فایل خالی است.");
    }

    fileBase64 = arrayBufferToBase64(buf);
  } else {
    let body: AnalyzeDocumentRequest;
    try {
      body = (await req.json()) as AnalyzeDocumentRequest;
    } catch {
      return jsonError(400, "INVALID_REQUEST", "درخواست نامعتبر است.");
    }

    fileName = (body.fileName || "").trim();
    fileType = (body.fileType || "").trim();
    fileBase64 = (body.fileBase64 || "").trim();
    fileSize = typeof body.fileSize === "number" ? body.fileSize : null;

    chiefComplaint = body.chiefComplaint;
    selectedRegion = body.selectedRegion;
    selectedLabel = body.selectedLabel;
    painLevel = body.painLevel;
    visitReason = body.visitReason;

    if (!fileName || !fileType || !fileBase64) {
      return jsonError(400, "INVALID_REQUEST", "اطلاعات فایل ناقص است.");
    }

    if (fileType === "application/pdf") {
      return jsonError(
        400,
        "PDF_NOT_SUPPORTED_YET",
        "تحلیل PDF هنوز فعال نشده است. لطفاً فعلاً تصویر آزمایش یا نسخه را با فرمت JPG یا PNG بارگذاری کنید."
      );
    }

    if (!fileType.startsWith("image/")) {
      return jsonError(
        400,
        "UNSUPPORTED_FILE_TYPE",
        "فرمت فایل پشتیبانی نمی‌شود. لطفاً JPG، PNG یا PDF بارگذاری کنید."
      );
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[Document Agent] request normalized", {
      fileName,
      fileType,
      fileSize,
      hasKey: Boolean(apiKey),
      mode: contentType.includes("multipart/form-data") ? "formData" : "json",
    });
  }

  const imageDataUrl = `data:${fileType};base64,${fileBase64}`;

  const prompt = [
    "You are a medical document extraction assistant.",
    "All user-facing text values MUST be in Persian (fa). Do not write English summaries.",
    "Do not diagnose. Do not prescribe. Do not claim certainty.",
    "Summarize what is visible. Extract key items/values only if visible.",
    "Output valid JSON only (no markdown).",
    "",
    "Return JSON with this shape:",
    "{",
    '  "summary": string,',
    '  "documentType": string,',
    '  "detectedLanguage": string,',
    '  "detectedItems": string[],',
    '  "possibleConcerns": string[],',
    '  "recommendedNextSteps": string[],',
    '  "disclaimer": "این تحلیل جایگزین نظر پزشک نیست."',
    "}",
    "",
    "Context (may be empty):",
    `chiefComplaint: ${chiefComplaint ?? ""}`,
    `visitReason: ${visitReason ?? ""}`,
    `selectedRegion: ${selectedRegion ?? ""}`,
    `selectedLabel: ${selectedLabel ?? ""}`,
    `painLevel: ${painLevel ?? ""}`,
  ].join("\n");

  let openaiRes: Response;
  try {
    openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        // Ask provider for strict JSON output (Responses API format).
        text: { format: { type: "json_object" } },
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: imageDataUrl },
            ],
          },
        ],
      }),
    });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Document Agent] provider fetch exception", {
        name: err instanceof Error ? err.name : "unknown",
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
    }
    return jsonError(
      502,
      "DOCUMENT_AGENT_PROVIDER_ERROR",
      "سرویس تحلیل مدارک در حال حاضر پاسخ مناسبی نداد. کمی بعد دوباره تلاش کنید."
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[Document Agent] OpenAI response status", { status: openaiRes.status });
  }

  if (!openaiRes.ok) {
    let providerText: string | null = null;
    let providerJson: any = null;
    try {
      providerText = await openaiRes.text();
      providerJson = providerText ? JSON.parse(providerText) : null;
    } catch {
      // ignore
    }

    if (process.env.NODE_ENV === "development") {
      console.error("[Document Agent] OpenAI error body", {
        status: openaiRes.status,
        body: providerJson ?? providerText,
      });
    }

    const code = providerJson?.error?.code;
    if (openaiRes.status === 401 || code === "invalid_api_key") {
      return jsonError(
        401,
        "INVALID_DOCUMENT_AGENT_KEY",
        "کلید سرویس تحلیل مدارک معتبر نیست یا منقضی شده است."
      );
    }

    return jsonError(
      502,
      "DOCUMENT_AGENT_PROVIDER_ERROR",
      "سرویس تحلیل مدارک در حال حاضر پاسخ مناسبی نداد. کمی بعد دوباره تلاش کنید.",
      process.env.NODE_ENV === "development"
        ? { providerStatus: openaiRes.status, providerCode: code ?? null }
        : undefined
    );
  }

  let data: any = null;
  try {
    data = (await openaiRes.json()) as any;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Document Agent] OpenAI JSON parse failed", {
        name: err instanceof Error ? err.name : "unknown",
        message: err instanceof Error ? err.message : String(err),
      });
    }
    return jsonError(
      502,
      "DOCUMENT_AGENT_BAD_RESPONSE",
      "پاسخ سرویس تحلیل مدارک قابل پردازش نیست."
    );
  }

  const outputText: unknown =
    data?.output_text ??
    data?.output?.[0]?.content?.find?.((c: any) => c?.type === "output_text")?.text ??
    data?.output?.[0]?.content?.[0]?.text;

  if (process.env.NODE_ENV === "development") {
    console.info("[Document Agent] OpenAI response has output_text", {
      hasOutputText: typeof outputText === "string" && Boolean(outputText.trim()),
    });
  }

  if (typeof outputText !== "string" || !outputText.trim()) {
    return jsonError(
      502,
      "DOCUMENT_AGENT_BAD_RESPONSE",
      "پاسخ سرویس تحلیل مدارک قابل پردازش نیست."
    );
  }

  try {
    const parsed = JSON.parse(outputText) as any;
    if (!parsed || typeof parsed !== "object") throw new Error("invalid json object");

    return NextResponse.json(
      {
        ok: true,
        summary: String(parsed.summary ?? ""),
        documentType: String(parsed.documentType ?? "سند پزشکی"),
        detectedLanguage: String(parsed.detectedLanguage ?? "unknown"),
        detectedItems: Array.isArray(parsed.detectedItems) ? parsed.detectedItems : [],
        possibleConcerns: Array.isArray(parsed.possibleConcerns) ? parsed.possibleConcerns : [],
        recommendedNextSteps: Array.isArray(parsed.recommendedNextSteps)
          ? parsed.recommendedNextSteps
          : [],
        disclaimer:
          typeof parsed.disclaimer === "string" && parsed.disclaimer.trim()
            ? parsed.disclaimer
            : "این تحلیل جایگزین نظر پزشک نیست.",
      },
      { status: 200 }
    );
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Document Agent] model output JSON.parse failed", {
        name: err instanceof Error ? err.name : "unknown",
        message: err instanceof Error ? err.message : String(err),
        outputTextPreview: outputText.slice(0, 400),
      });
    }
    return jsonError(
      502,
      "DOCUMENT_AGENT_BAD_RESPONSE",
      "خروجی سرویس تحلیل مدارک به صورت JSON معتبر دریافت نشد. لطفاً دوباره تلاش کنید."
    );
  }
}
