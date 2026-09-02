import { NextRequest } from "next/server";
import {
  renderLatex,
  renderWordDocument,
  type PaperBlock,
  type TemplateId,
} from "@/lib/paper-export";

type ExportFormat = "latex" | "word";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    format?: ExportFormat;
    blocks?: PaperBlock[];
    templateId?: TemplateId;
  };

  if (!body.blocks?.length) {
    return Response.json({ error: "Missing paper blocks" }, { status: 400 });
  }

  if (body.format === "word") {
    return new Response(renderWordDocument(body.blocks), {
      headers: {
        "Content-Disposition": 'attachment; filename="paper-helper-draft.doc"',
        "Content-Type": "application/msword; charset=utf-8",
      },
    });
  }

  return new Response(renderLatex(body.blocks, body.templateId), {
    headers: {
      "Content-Disposition": 'attachment; filename="paper-helper-draft.tex"',
      "Content-Type": "application/x-tex; charset=utf-8",
    },
  });
}
