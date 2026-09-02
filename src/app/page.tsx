"use client";

import { FormEvent, useMemo, useState } from "react";

import {
  blockLabels,
  initialBlocks,
  journalTemplates,
  renderLatex,
  renderWordDocument,
  tableRows,
  type BlockType,
  type TemplateId,
  type PaperBlock,
} from "@/lib/paper-export";

function createId() {
  return `block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [blocks, setBlocks] = useState<PaperBlock[]>(initialBlocks);
  const [selectedId, setSelectedId] = useState(initialBlocks[1]?.id ?? initialBlocks[0].id);
  const [templateId, setTemplateId] = useState<TemplateId>("ctex-journal");
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);
  const [insertMenuId, setInsertMenuId] = useState<string | null>(null);
  const selectedBlock = blocks.find((block) => block.id === selectedId) ?? blocks[0];
  const selectedTemplate = journalTemplates.find((template) => template.id === templateId) ?? journalTemplates[0];

  const outline = useMemo(
    () => blocks.filter((block) => block.type === "heading"),
    [blocks],
  );

  const visibleBlockIds = useMemo(() => {
    const visible = new Set<string>();
    let collapsedHeadingLevel: number | null = null;

    blocks.forEach((block) => {
      if (
        block.type === "heading" &&
        collapsedHeadingLevel !== null &&
        (block.level ?? 2) <= collapsedHeadingLevel
      ) {
        collapsedHeadingLevel = null;
      }

      if (collapsedHeadingLevel !== null) return;

      visible.add(block.id);
      if (block.type === "heading" && collapsedIds.includes(block.id)) {
        collapsedHeadingLevel = block.level ?? 2;
      }
    });

    return visible;
  }, [blocks, collapsedIds]);

  function updateBlock(id: string, patch: Partial<PaperBlock>) {
    setBlocks((current) =>
      current.map((block) => (block.id === id ? { ...block, ...patch } : block)),
    );
  }

  function addBlock(type: BlockType, level?: 1 | 2 | 3) {
    const defaults: Record<BlockType, string> = {
      heading: level === 3 ? "小节标题" : "章节标题",
      paragraph: "新的正文段落。",
      image: "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=1200&q=80",
      table: "项目|数值|备注\n样本量|128|初始数据\n准确率|86.2%|验证集",
      formula: "E = mc^2",
    };
    const nextBlock: PaperBlock = {
      id: createId(),
      type,
      level: type === "heading" ? level ?? 2 : undefined,
      content: defaults[type],
      caption: type === "image" ? "图：实验或方法示意" : type === "table" ? "表：数据说明" : undefined,
    };

    const selectedIndex = blocks.findIndex((block) => block.id === selectedId);
    const insertAt = selectedIndex >= 0 ? selectedIndex + 1 : blocks.length;
    const nextBlocks = [...blocks.slice(0, insertAt), nextBlock, ...blocks.slice(insertAt)];
    setBlocks(nextBlocks);
    setSelectedId(nextBlock.id);
  }

  function insertFromOutline(
    parent: PaperBlock | undefined,
    mode: "same" | "child" | "paragraph",
  ) {
    const parentLevel = parent?.level ?? 2;
    const level = (
      mode === "same" ? parentLevel : Math.min(3, parentLevel + 1)
    ) as 1 | 2 | 3;
    const nextBlock: PaperBlock = mode === "paragraph" ? {
      id: createId(),
      type: "paragraph",
      content: "新的正文段落。",
    } : {
      id: createId(),
      type: "heading",
      level,
      content: level === 3 ? "新的小节标题" : "新的章节标题",
    };

    if (!parent) {
      setBlocks((current) => [...current, nextBlock]);
    } else {
      const parentIndex = blocks.findIndex((block) => block.id === parent.id);
      let insertAt = parentIndex + 1;
      if (mode !== "paragraph") {
        while (insertAt < blocks.length) {
          const candidate = blocks[insertAt];
          if (
            candidate.type === "heading" &&
            (candidate.level ?? 2) <= parentLevel
          ) break;
          insertAt += 1;
        }
      }
      setBlocks([...blocks.slice(0, insertAt), nextBlock, ...blocks.slice(insertAt)]);
      setCollapsedIds((current) => current.filter((id) => id !== parent.id));
    }

    setSelectedId(nextBlock.id);
    setInsertMenuId(null);
  }

  function toggleCollapsed(id: string) {
    setCollapsedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function deleteHeading(id: string) {
    const index = blocks.findIndex((block) => block.id === id);
    if (index < 0 || blocks.length <= 1) return;
    const nextBlocks = blocks.filter((block) => block.id !== id);
    setBlocks(nextBlocks);
    setCollapsedIds((current) => current.filter((item) => item !== id));
    if (selectedId === id) {
      setSelectedId(nextBlocks[Math.max(0, index - 1)]?.id ?? nextBlocks[0].id);
    }
  }

  function format(command: string, value?: string) {
    document.execCommand(command, false, value);
  }

  function moveSelected(direction: "up" | "down") {
    const index = blocks.findIndex((block) => block.id === selectedId);
    const nextIndex = direction === "up" ? index - 1 : index + 1;

    if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) return;

    const nextBlocks = [...blocks];
    const [selected] = nextBlocks.splice(index, 1);
    nextBlocks.splice(nextIndex, 0, selected);
    setBlocks(nextBlocks);
  }

  function duplicateSelected() {
    const index = blocks.findIndex((block) => block.id === selectedId);
    if (index < 0) return;

    const copy = {
      ...blocks[index],
      id: createId(),
      content: `${blocks[index].content}`,
    };

    setBlocks([...blocks.slice(0, index + 1), copy, ...blocks.slice(index + 1)]);
    setSelectedId(copy.id);
  }

  function deleteSelected() {
    if (blocks.length <= 1) return;

    const index = blocks.findIndex((block) => block.id === selectedId);
    if (index < 0) return;

    const nextBlocks = blocks.filter((block) => block.id !== selectedId);
    setBlocks(nextBlocks);
    setSelectedId(nextBlocks[Math.max(0, index - 1)].id);
  }

  function resetTemplate() {
    setBlocks(initialBlocks);
    setSelectedId(initialBlocks[1].id);
    setCollapsedIds([]);
  }

  function exportLatex() {
    downloadFile("paper-helper-draft.tex", renderLatex(blocks, templateId), "application/x-tex;charset=utf-8");
  }

  function exportWord() {
    downloadFile("paper-helper-draft.doc", renderWordDocument(blocks), "application/msword;charset=utf-8");
  }

  function exportPdf() {
    const previousCollapsedIds = collapsedIds;
    setCollapsedIds([]);
    window.requestAnimationFrame(() => {
      window.print();
      setCollapsedIds(previousCollapsedIds);
    });
  }

  function handleContentInput(event: FormEvent<HTMLDivElement>, id: string) {
    updateBlock(id, { content: event.currentTarget.innerText });
  }

  return (
    <main className="workspace">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">PH</span>
          <div>
            <p>Paper Helper</p>
            <span>科研论文写作</span>
          </div>
        </div>

        <button className="primaryAction" onClick={() => resetTemplate()}>
          新建模板论文
        </button>

        <div className="templatePanel">
          <p className="panelLabel">期刊模板</p>
          <select value={templateId} onChange={(event) => setTemplateId(event.target.value as TemplateId)}>
            {journalTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <p>{selectedTemplate.description}</p>
        </div>

        <nav className="outline" aria-label="论文大纲">
          <div className="outlineHeader">
            <p className="panelLabel">大纲</p>
            <button
              className="outlineAdd"
              onClick={() => setInsertMenuId((current) => current === "root" ? null : "root")}
              title="选择新建内容"
            >
              ＋
            </button>
            {insertMenuId === "root" ? (
              <div className="outlineInsertMenu">
                <button onClick={() => insertFromOutline(undefined, "same")}>同级标题</button>
                <button onClick={() => insertFromOutline(undefined, "child")}>下一级标题</button>
                <button onClick={() => insertFromOutline(undefined, "paragraph")}>正文</button>
              </div>
            ) : null}
          </div>
          {outline.map((block) =>
            visibleBlockIds.has(block.id) ? (
              <div
                key={block.id}
                className={`outlineRow level${block.level ?? 2} ${selectedId === block.id ? "active" : ""}`}
              >
                <button
                  className="outlineToggle"
                  onClick={() => toggleCollapsed(block.id)}
                  title={collapsedIds.includes(block.id) ? "展开章节" : "收起章节"}
                >
                  {collapsedIds.includes(block.id) ? "›" : "⌄"}
                </button>
                <button className="outlineItem" onClick={() => setSelectedId(block.id)}>
                  {block.content}
                </button>
                <button
                  className="outlineAdd rowAction"
                  onClick={() => setInsertMenuId((current) => current === block.id ? null : block.id)}
                  title="选择新建内容"
                >
                  ＋
                </button>
                <button
                  className="outlineAdd rowAction rowDelete"
                  onClick={() => deleteHeading(block.id)}
                  title="删除这个标题（保留正文内容）"
                >
                  ×
                </button>
                {insertMenuId === block.id ? (
                  <div className="outlineInsertMenu">
                    <button onClick={() => insertFromOutline(block, "same")}>同级标题</button>
                    <button
                      disabled={(block.level ?? 2) >= 3}
                      onClick={() => insertFromOutline(block, "child")}
                    >
                      下一级标题
                    </button>
                    <button onClick={() => insertFromOutline(block, "paragraph")}>正文</button>
                  </div>
                ) : null}
              </div>
            ) : null,
          )}
        </nav>
      </aside>

      <section className="editorShell">
        <header className="toolbar">
          <div className="toolGroup formatTools" aria-label="文字格式">
            <button onMouseDown={(event) => event.preventDefault()} onClick={() => format("bold")}>B</button>
            <button onMouseDown={(event) => event.preventDefault()} onClick={() => format("italic")}>I</button>
            <button onMouseDown={(event) => event.preventDefault()} onClick={() => format("underline")}>U</button>
            <button onMouseDown={(event) => event.preventDefault()} onClick={() => format("insertUnorderedList")}>•</button>
            <button onMouseDown={(event) => event.preventDefault()} onClick={() => format("insertOrderedList")}>1.</button>
            <button onMouseDown={(event) => event.preventDefault()} onClick={() => format("justifyLeft")}>左</button>
            <button onMouseDown={(event) => event.preventDefault()} onClick={() => format("justifyCenter")}>中</button>
          </div>

          <div className="toolGroup" aria-label="插入内容">
            <button onClick={() => addBlock("heading", 2)}>H2</button>
            <button onClick={() => addBlock("heading", 3)}>H3</button>
            <button onClick={() => addBlock("paragraph")}>正文</button>
            <button onClick={() => addBlock("image")}>图片</button>
            <button onClick={() => addBlock("table")}>表格</button>
            <button onClick={() => addBlock("formula")}>公式</button>
          </div>

          <div className="toolGroup" aria-label="导出">
            <button onClick={exportLatex}>LaTeX</button>
            <button onClick={exportWord}>Word</button>
            <button onClick={exportPdf}>PDF</button>
          </div>
        </header>

        <article className="paper" aria-label="论文编辑器">
          {blocks.map((block) =>
            visibleBlockIds.has(block.id) ? (
              <section
                key={block.id}
                className={`paperBlock ${selectedId === block.id ? "selected" : ""} ${collapsedIds.includes(block.id) ? "collapsed" : ""}`}
                onClick={() => setSelectedId(block.id)}
              >
                <div className="blockChrome">
                  <button
                    className="blockCollapse"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleCollapsed(block.id);
                    }}
                    title={collapsedIds.includes(block.id) ? "展开" : "收起"}
                  >
                    {collapsedIds.includes(block.id) ? "›" : "⌄"}
                  </button>
                  <span className="blockType">{blockLabels[block.type]}</span>
                </div>
                {collapsedIds.includes(block.id) && block.type !== "heading" ? (
                  <button className="collapsedPreview" onClick={() => toggleCollapsed(block.id)}>
                    {block.content.replace(/\n/g, " ").slice(0, 54) || "空内容"}
                  </button>
                ) : (
                  <EditableBlock block={block} onInput={handleContentInput} onChange={updateBlock} />
                )}
              </section>
            ) : null,
          )}
        </article>
      </section>

      <aside className="inspector">
        <p className="panelLabel">属性</p>
        {selectedBlock ? (
          <div className="propertyList">
            <label>
              类型
              <span>{blockLabels[selectedBlock.type]}</span>
            </label>
            {selectedBlock.type === "heading" ? (
              <label>
                层级
                <select
                  value={selectedBlock.level}
                  onChange={(event) =>
                    updateBlock(selectedBlock.id, {
                      level: Number(event.target.value) as 1 | 2 | 3,
                    })
                  }
                >
                  <option value={1}>一级标题</option>
                  <option value={2}>二级标题</option>
                  <option value={3}>三级标题</option>
                </select>
              </label>
            ) : null}
            {"caption" in selectedBlock ? (
              <label>
                说明
                <input
                  value={selectedBlock.caption ?? ""}
                  onChange={(event) =>
                    updateBlock(selectedBlock.id, { caption: event.target.value })
                  }
                />
              </label>
            ) : null}
            <div className="blockActions">
              <button onClick={() => toggleCollapsed(selectedBlock.id)}>
                {collapsedIds.includes(selectedBlock.id) ? "展开" : "收起"}
              </button>
              <button onClick={() => moveSelected("up")}>上移</button>
              <button onClick={() => moveSelected("down")}>下移</button>
              <button onClick={duplicateSelected}>复制</button>
              <button onClick={deleteSelected}>删除</button>
            </div>
            <div className="templateSummary">
              <span>当前模板</span>
              <strong>{selectedTemplate.name}</strong>
            </div>
          </div>
        ) : null}
      </aside>
    </main>
  );
}

function EditableBlock({
  block,
  onInput,
  onChange,
}: {
  block: PaperBlock;
  onInput: (event: FormEvent<HTMLDivElement>, id: string) => void;
  onChange: (id: string, patch: Partial<PaperBlock>) => void;
}) {
  if (block.type === "image") {
    return (
      <figure className="imageBlock">
        <img src={block.content} alt={block.caption || "论文图片"} />
        <input
          value={block.content}
          aria-label="图片地址"
          onChange={(event) => onChange(block.id, { content: event.target.value })}
        />
        <figcaption>{block.caption}</figcaption>
      </figure>
    );
  }

  if (block.type === "table") {
    return (
      <div className="tableBlock">
        <table>
          <tbody>
            {tableRows(block.content).map((row, rowIndex) => (
              <tr key={`${block.id}-${rowIndex}`}>
                {row.map((cell, cellIndex) =>
                  rowIndex === 0 ? (
                    <th key={`${block.id}-${rowIndex}-${cellIndex}`}>{cell}</th>
                  ) : (
                    <td key={`${block.id}-${rowIndex}-${cellIndex}`}>{cell}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <textarea
          value={block.content}
          aria-label="表格 Markdown 数据"
          onChange={(event) => onChange(block.id, { content: event.target.value })}
        />
        <p>{block.caption}</p>
      </div>
    );
  }

  const className =
    block.type === "formula"
      ? "formulaInput"
      : block.type === "heading"
        ? `headingInput headingLevel${block.level ?? 2}`
        : "paragraphInput";

  return (
    <div
      className={className}
      contentEditable
      suppressContentEditableWarning
      onInput={(event) => onInput(event, block.id)}
    >
      {block.content}
    </div>
  );
}
