export type BlockType = "heading" | "paragraph" | "image" | "table" | "formula";

export type TemplateId = "ctex-journal" | "ieee-conference" | "elsevier-article";

export type JournalTemplate = {
  id: TemplateId;
  name: string;
  description: string;
  documentClass: string;
  packages: string[];
};

export type PaperBlock = {
  id: string;
  type: BlockType;
  level?: 1 | 2 | 3;
  content: string;
  caption?: string;
};

export const journalTemplates: JournalTemplate[] = [
  {
    id: "ctex-journal",
    name: "中文期刊通用模板",
    description: "适合中文论文初稿，使用 ctexart 与常见数学、图表包。",
    documentClass: "\\documentclass[UTF8]{ctexart}",
    packages: ["\\usepackage{graphicx}", "\\usepackage{amsmath}", "\\usepackage{booktabs}"],
  },
  {
    id: "ieee-conference",
    name: "IEEE Conference",
    description: "适合 IEEE 会议论文结构预览，后续可替换为官方 cls 文件。",
    documentClass: "\\documentclass[conference]{IEEEtran}",
    packages: ["\\usepackage{graphicx}", "\\usepackage{amsmath}", "\\usepackage{booktabs}"],
  },
  {
    id: "elsevier-article",
    name: "Elsevier Article",
    description: "适合 Elsevier 期刊投稿结构预览，后续可接入 elsarticle 模板。",
    documentClass: "\\documentclass[preprint,12pt]{elsarticle}",
    packages: ["\\usepackage{graphicx}", "\\usepackage{amsmath}", "\\usepackage{booktabs}"],
  },
];

export const initialBlocks: PaperBlock[] = [
  { id: "title", type: "heading", level: 1, content: "论文标题" },
  { id: "abstract", type: "heading", level: 2, content: "摘要" },
  {
    id: "abstract-body",
    type: "paragraph",
    content: "在这里概述研究问题、方法、结果与贡献。",
  },
  { id: "intro", type: "heading", level: 2, content: "1 引言" },
  {
    id: "intro-body",
    type: "paragraph",
    content: "从研究背景、相关工作缺口和本文贡献开始写起。",
  },
  { id: "method", type: "heading", level: 2, content: "2 方法" },
  {
    id: "method-body",
    type: "paragraph",
    content: "描述数据、模型、实验设置或理论推导。",
  },
  { id: "results", type: "heading", level: 2, content: "3 结果" },
  {
    id: "results-table",
    type: "table",
    content: "指标|Baseline|Ours\nAccuracy|82.4|88.7\nF1|79.1|85.3",
    caption: "表 1：主要实验结果",
  },
  { id: "conclusion", type: "heading", level: 2, content: "4 结论" },
  {
    id: "conclusion-body",
    type: "paragraph",
    content: "总结发现、局限性与未来工作。",
  },
];

export const blockLabels: Record<BlockType, string> = {
  heading: "标题",
  paragraph: "正文",
  image: "图片",
  table: "表格",
  formula: "公式",
};

export function tableRows(content: string) {
  return content
    .split("\n")
    .filter(Boolean)
    .map((row) => row.split("|").map((cell) => cell.trim()));
}

function escapeLatex(value: string) {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getTemplate(templateId: TemplateId = "ctex-journal") {
  return journalTemplates.find((template) => template.id === templateId) ?? journalTemplates[0];
}

export function renderLatex(blocks: PaperBlock[], templateId: TemplateId = "ctex-journal") {
  const template = getTemplate(templateId);
  const title = blocks[0]?.content || "Paper Helper Draft";
  const body = blocks
    .slice(1)
    .map((block) => {
      if (block.type === "heading") {
        if (block.level === 1) return `\\section*{${escapeLatex(block.content)}}`;
        if (block.level === 3) return `\\subsection{${escapeLatex(block.content)}}`;
        return `\\section{${escapeLatex(block.content)}}`;
      }

      if (block.type === "formula") {
        return `\\[\n${block.content}\n\\]`;
      }

      if (block.type === "image") {
        return [
          "\\begin{figure}[h]",
          "\\centering",
          `% Image source: ${block.content}`,
          `\\caption{${escapeLatex(block.caption || "图片说明")}}`,
          "\\end{figure}",
        ].join("\n");
      }

      if (block.type === "table") {
        const rows = tableRows(block.content);
        const columns = rows[0]?.map(() => "c").join("|") || "c";
        const latexRows = rows
          .map((row) => `${row.map(escapeLatex).join(" & ")} \\\\`)
          .join("\n");
        return [
          "\\begin{table}[h]",
          "\\centering",
          `\\begin{tabular}{${columns}}`,
          latexRows,
          "\\end{tabular}",
          `\\caption{${escapeLatex(block.caption || "表格说明")}}`,
          "\\end{table}",
        ].join("\n");
      }

      return escapeLatex(block.content);
    })
    .join("\n\n");

  return [
    template.documentClass,
    ...template.packages,
    "",
    `\\title{${escapeLatex(title)}}`,
    "\\author{}",
    "\\date{}",
    "",
    "\\begin{document}",
    "\\maketitle",
    body,
    "\\end{document}",
  ].join("\n");
}

export function renderHtml(blocks: PaperBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === "heading") {
        const tag = block.level === 1 ? "h1" : block.level === 3 ? "h3" : "h2";
        return `<${tag}>${escapeHtml(block.content)}</${tag}>`;
      }

      if (block.type === "image") {
        return `<figure><img src="${escapeHtml(block.content)}" alt="${escapeHtml(block.caption || "")}" /><figcaption>${escapeHtml(block.caption || "")}</figcaption></figure>`;
      }

      if (block.type === "formula") {
        return `<p><strong>公式：</strong> ${escapeHtml(block.content)}</p>`;
      }

      if (block.type === "table") {
        const rows = tableRows(block.content);
        return `<table>${rows
          .map(
            (row, index) =>
              `<tr>${row.map((cell) => `<${index === 0 ? "th" : "td"}>${escapeHtml(cell)}</${index === 0 ? "th" : "td"}>`).join("")}</tr>`,
          )
          .join("")}</table><p>${escapeHtml(block.caption || "")}</p>`;
      }

      return `<p>${escapeHtml(block.content)}</p>`;
    })
    .join("\n");
}

export function renderWordDocument(blocks: PaperBlock[]) {
  return [
    "<!doctype html>",
    "<html>",
    "<head>",
    '<meta charset="utf-8">',
    "<title>Paper Helper Draft</title>",
    "<style>body{font-family:serif;line-height:1.75}table{border-collapse:collapse}td,th{border:1px solid #999;padding:6px 10px}img{max-width:100%}</style>",
    "</head>",
    `<body>${renderHtml(blocks)}</body>`,
    "</html>",
  ].join("");
}
