"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";
import { useRef } from "react";

type Props = {
  content: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string | null>;
  imageUploading?: boolean;
};

function Btn({
  active,
  disabled,
  title,
  onClick,
  children
}: {
  active?: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`h-8 rounded-md px-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-ink text-white"
          : "border border-cloud text-slate hover:border-slate/40 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span aria-hidden className="h-5 w-px bg-cloud" />;
}

export function PostEditor({ content, onChange, onImageUpload, imageUploading }: Props) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension,
      Placeholder.configure({ placeholder: "Write your post content here..." }),
      Underline,
      CharacterCount
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML())
  });

  function addLink() {
    const prev = editor?.getAttributes("link").href ?? "";
    const url = window.prompt("Enter link URL", prev);
    if (url === null) return;
    if (!url) {
      editor?.chain().focus().unsetLink().run();
    } else {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }

  async function handleImageFile(file: File | undefined) {
    if (!file || !onImageUpload || !editor) return;
    const url = await onImageUpload(file);
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }

  const words = editor?.storage.characterCount?.words() ?? 0;
  const readTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="rounded-lg border border-cloud bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-cloud px-4 py-3">
        <Btn active={editor?.isActive("heading", { level: 1 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>H1</Btn>
        <Btn active={editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Btn>
        <Btn active={editor?.isActive("heading", { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Btn>
        <Sep />
        <Btn active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</Btn>
        <Btn active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}>Italic</Btn>
        <Btn active={editor?.isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()}>Underline</Btn>
        <Btn active={editor?.isActive("strike")} onClick={() => editor?.chain().focus().toggleStrike().run()}>Strike</Btn>
        <Sep />
        <Btn active={editor?.isActive("link")} onClick={addLink}>Link</Btn>
        <Btn disabled={imageUploading} onClick={() => imageInputRef.current?.click()}>
          {imageUploading ? "Uploading..." : "Image"}
        </Btn>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => { void handleImageFile(e.target.files?.[0]); e.target.value = ""; }}
        />
        <Sep />
        <Btn active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}>Bullet list</Btn>
        <Btn active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>Numbered list</Btn>
        <Sep />
        <Btn active={editor?.isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>Quote</Btn>
        <Btn active={editor?.isActive("codeBlock")} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>Code block</Btn>
        <Btn active={editor?.isActive("code")} onClick={() => editor?.chain().focus().toggleCode().run()}>Inline code</Btn>
        <Btn onClick={() => editor?.chain().focus().setHorizontalRule().run()}>Divider</Btn>
      </div>

      <EditorContent
        editor={editor}
        className="post-editor-content"
      />

      <div className="flex items-center justify-between border-t border-cloud px-4 py-2 text-xs text-slate">
        <span>{words} words</span>
        <span>{readTime} min read</span>
      </div>
    </div>
  );
}
