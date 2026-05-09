type AnalyzeDocumentRequest = {
  fileName: string;
  fileType: string;
  fileBase64: string;
  chiefComplaint?: string;
  selectedRegion?: string | null;
  selectedLabel?: string | null;
  painLevel?: number | null;
  visitReason?: string | null;
};

type NetlifyEvent = {
  httpMethod?: string;
  body?: string | null;
};

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
};

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    documentType: { type: "string" },
    detectedLanguage: { type: "string" },
    extractedTextSummary: { type: "string" },
    abnormalFindings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          value: { type: "string" },
          referenceRange: { type: "string" },
          status: {
            type: "string",
            enum: ["low", "high", "normal", "unknown"],
          },
          note: { type: "string" },
        },
        required: ["name", "value", "referenceRange", "status", "note"],
      },
    },
    plainLanguageSummary: { type: "string" },
    doctorFacingSummary: { type: "string" },
    triageImpact: { type: "string" },
    recommendedSpecialtyHint: { type: "string" },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    safetyDisclaimer: { type: "string" },
  },
  required: [
    "documentType",
    "detectedLanguage",
    "extractedTextSummary",
    "abnormalFindings",
    "plainLanguageSummary",
    "doctorFacingSummary",
    "triageImpact",
    "recommendedSpecialtyHint",
    "confidence",
    "safetyDisclaimer",
  ],
};

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(body),
  };
}

function parseJsonBody(body?: string | null): AnalyzeDocumentRequest | null {
  if (!body) return null;

  try {
    return JSON.parse(body) as AnalyzeDocumentRequest;
  } catch {
    return null;
  }
}

function getOutputText(responseData: Record<string, unknown>) {
  if (typeof responseData.output_text === "string") {
    return responseData.output_text;
  }

  const output = responseData.output;
  if (!Array.isArray(output)) return "";

  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as { content?: unknown }).content;
      return Array.isArray(content) ? content : [];
    })
    .map((contentItem) => {
      if (!contentItem || typeof contentItem !== "object") return "";
      const text = (contentItem as { text?: unknown }).text;
      return typeof text === "string" ? text : "";
    })
    .join("");
}

export async function handler(event: NetlifyEvent) {
  if (event.httpMethod && event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Only POST requests are supported." });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // Set OPENAI_API_KEY in Netlify: Site configuration -> Environment variables -> Add variable.
  if (!apiKey) {
    return jsonResponse(500, {
      error:
        "OPENAI_API_KEY is not configured. Add it in Netlify environment variables.",
    });
  }

  const payload = parseJsonBody(event.body);

  if (!payload?.fileName || !payload.fileType || !payload.fileBase64) {
    return jsonResponse(400, {
      error: "fileName, fileType, and fileBase64 are required.",
    });
  }

  const dataUrl = `data:${payload.fileType};base64,${payload.fileBase64}`;
  const isPdf = payload.fileType.toLowerCase().includes("pdf");
  const model = process.env.OPENAI_DOCUMENT_MODEL || "gpt-4.1-mini";

  const context = [
    `File name: ${payload.fileName}`,
    `File type: ${payload.fileType}`,
    payload.chiefComplaint
      ? `Chief complaint: ${payload.chiefComplaint}`
      : null,
    payload.selectedLabel
      ? `Selected pain region: ${payload.selectedLabel}`
      : null,
    typeof payload.painLevel === "number"
      ? `Pain level: ${payload.painLevel}/10`
      : null,
    payload.visitReason ? `Visit reason: ${payload.visitReason}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `
You are a medical document extraction assistant.
Do not diagnose.
Do not prescribe.
Do not tell the patient they have a disease.
Extract visible values and flag obvious out-of-range values only when reference ranges are visible.
If reference ranges are not visible, set status to "unknown".
If a finding is normal and visible, set status to "normal".
If the document is unreadable, set confidence to "low" and explain that in summaries.
Return valid JSON only. Do not include markdown.
Always include this safety disclaimer in Persian: "این خروجی جایگزین تفسیر پزشک نیست و صرفاً برای استخراج و خلاصه‌سازی محتوای سند در نسخه آزمایشی استفاده می‌شود."

Patient/context information:
${context}
`;

  const fileContent = isPdf
    ? {
        type: "input_file",
        filename: payload.fileName,
        file_data: dataUrl,
      }
    : {
        type: "input_image",
        image_url: dataUrl,
      };

  try {
    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: prompt,
              },
              fileContent,
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "salamax_document_analysis",
            schema: responseSchema,
            strict: true,
          },
        },
      }),
    });

    const responseData = (await openAiResponse.json()) as Record<
      string,
      unknown
    >;

    if (!openAiResponse.ok) {
      return jsonResponse(openAiResponse.status, {
        error: "Document analysis failed.",
        details: responseData,
      });
    }

    const outputText = getOutputText(responseData);
    const analysis = JSON.parse(outputText);

    return jsonResponse(200, analysis);
  } catch (error) {
    return jsonResponse(500, {
      error: "Document analysis failed unexpectedly.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
