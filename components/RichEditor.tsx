"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";

interface RichEditorProps {
  initialValue?: string;
  onChange: (html: string) => void;
}

function Btn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // keep editor focus
        onClick();
      }}
      title={title}
      className={[
        "px-1.5 py-0.5 text-[11px] rounded transition-colors select-none",
        active
          ? "bg-accent text-white"
          : "text-accent-light/55 hover:text-white hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-3.5 bg-white/15 mx-0.5 self-center" />;
}

export default function RichEditor({ initialValue = "", onChange }: RichEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: "Dear John,\n\nWe have a new listing we think you'll love…",
      }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: initialValue,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  function setLink() {
    const prev = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }

  return (
    <div className="flex flex-col border-t border-white/10 mt-1">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 py-1.5 border-b border-white/8">
        <Btn title="Bold (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
          <strong>B</strong>
        </Btn>
        <Btn title="Italic (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
          <em>I</em>
        </Btn>
        <Btn title="Underline (Ctrl+U)" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}>
          <u>U</u>
        </Btn>
        <Divider />
        <Btn title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
          H2
        </Btn>
        <Btn title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>
          H3
        </Btn>
        <Divider />
        <Btn title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
          • List
        </Btn>
        <Btn title="Ordered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
          1. List
        </Btn>
        <Divider />
        <Btn title="Align left" onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })}>
          ≡L
        </Btn>
        <Btn title="Align center" onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })}>
          ≡C
        </Btn>
        <Btn title="Align right" onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })}>
          ≡R
        </Btn>
        <Divider />
        <Btn title="Insert / edit link" onClick={setLink} active={editor.isActive("link")}>
          Link
        </Btn>
        <Btn title="Remove link" onClick={() => editor.chain().focus().unsetLink().run()}>
          Unlink
        </Btn>
      </div>

      {/* Editor content area */}
      <EditorContent editor={editor} />
    </div>
  );
}
