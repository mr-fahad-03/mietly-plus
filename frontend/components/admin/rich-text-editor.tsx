"use client";

import { ChangeEvent, useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { uploadProductImage } from "@/lib/api";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  adminToken?: string;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  adminToken,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: placeholder || "Enter detailed product description with images...",
      }),
    ],
    content: value || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose max-w-none min-h-[220px] rounded-b-[20px] border border-t-0 border-[rgba(73,153,173,0.22)] bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none",
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [editor, value]);

  const addLink = () => {
    const url = window.prompt("Enter URL");
    if (!url) return;
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImageFromUrl = () => {
    const url = window.prompt("Enter image URL");
    if (!url) return;
    editor?.chain().focus().setImage({ src: url }).run();
  };

  const addImageFromUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const token = adminToken || localStorage.getItem("admin_token") || "";
    if (!token) {
      window.alert("Admin session expired. Please login again.");
      return;
    }
    try {
      const imageUrl = await uploadProductImage(file, token);
      editor?.chain().focus().setImage({ src: imageUrl }).run();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Image upload failed.");
    }
  };

  const baseBtn = "rounded-md border border-transparent px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100";
  const activeBtn = "bg-zinc-200 text-zinc-900";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 rounded-t-[20px] border border-[rgba(73,153,173,0.22)] bg-[linear-gradient(180deg,rgba(73,153,173,0.09),rgba(73,153,173,0.04))] px-3 py-2">
        <button
          type="button"
          className="mr-1 rounded-full border border-[rgba(73,153,173,0.22)] bg-white px-3 py-1 text-sm font-medium text-[rgb(47,118,135)]"
          onClick={() => editor?.chain().focus().setParagraph().run()}
        >
          Normal Text
        </button>
        <span className="mx-1 h-6 w-px bg-zinc-300" />
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`${baseBtn} ${editor?.isActive("bold") ? activeBtn : ""}`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`${baseBtn} italic ${editor?.isActive("italic") ? activeBtn : ""}`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          className={`${baseBtn} underline ${editor?.isActive("underline") ? activeBtn : ""}`}
        >
          U
        </button>
        <span className="mx-1 h-6 w-px bg-zinc-300" />
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`${baseBtn} ${editor?.isActive("bulletList") ? activeBtn : ""}`}
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={`${baseBtn} ${editor?.isActive("orderedList") ? activeBtn : ""}`}
        >
          1.
        </button>
        <span className="mx-1 h-6 w-px bg-zinc-300" />
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          className={`${baseBtn} ${editor?.isActive({ textAlign: "left" }) ? activeBtn : ""}`}
        >
          L
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          className={`${baseBtn} ${editor?.isActive({ textAlign: "center" }) ? activeBtn : ""}`}
        >
          C
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
          className={`${baseBtn} ${editor?.isActive({ textAlign: "right" }) ? activeBtn : ""}`}
        >
          R
        </button>
        <span className="mx-1 h-6 w-px bg-zinc-300" />
        <label className={`${baseBtn} cursor-pointer`}>
          Img Upload
          <input type="file" accept="image/*" className="hidden" onChange={addImageFromUpload} />
        </label>
        <button type="button" onClick={addImageFromUrl} className={baseBtn}>
          Img URL
        </button>
        <span className="mx-1 h-6 w-px bg-zinc-300" />
        <button type="button" onClick={addLink} className={baseBtn}>
          Link
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().unsetLink().run()}
          className={baseBtn}
        >
          Unlink
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
