"use client";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type Bouton = { libelle: string; titre: string; actif?: (e: Editor) => boolean; action: (e: Editor) => void; classe?: string };

const BOUTONS: (Bouton | "|")[] = [
  { libelle: "B", titre: "Gras", classe: "font-bold", actif: (e) => e.isActive("bold"), action: (e) => e.chain().focus().toggleBold().run() },
  { libelle: "I", titre: "Italique", classe: "italic", actif: (e) => e.isActive("italic"), action: (e) => e.chain().focus().toggleItalic().run() },
  { libelle: "U", titre: "Souligné", classe: "underline", actif: (e) => e.isActive("underline"), action: (e) => e.chain().focus().toggleUnderline().run() },
  { libelle: "S", titre: "Barré", classe: "line-through", actif: (e) => e.isActive("strike"), action: (e) => e.chain().focus().toggleStrike().run() },
  "|",
  { libelle: "• Liste", titre: "Liste à puces", actif: (e) => e.isActive("bulletList"), action: (e) => e.chain().focus().toggleBulletList().run() },
  { libelle: "1. Liste", titre: "Liste numérotée", actif: (e) => e.isActive("orderedList"), action: (e) => e.chain().focus().toggleOrderedList().run() },
  { libelle: "Titre", titre: "Intertitre", actif: (e) => e.isActive("heading", { level: 3 }), action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  {
    libelle: "Lien",
    titre: "Ajouter / retirer un lien",
    actif: (e) => e.isActive("link"),
    action: (e) => {
      if (e.isActive("link")) return void e.chain().focus().unsetLink().run();
      const url = window.prompt("Adresse du lien (https://…)");
      if (url && /^https:\/\//i.test(url)) e.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    },
  },
  "|",
  { libelle: "↶", titre: "Annuler", action: (e) => e.chain().focus().undo().run() },
  { libelle: "↷", titre: "Rétablir", action: (e) => e.chain().focus().redo().run() },
];

/** Éditeur de texte riche (gras, listes, intertitres, liens). Renvoie du HTML via onChange. */
export function EditeurRiche({ valeur, onChange, id, minHauteur = 120 }: { valeur: string; onChange: (html: string) => void; id?: string; minHauteur?: number }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [3] },
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        link: { openOnClick: false, protocols: ["https", "mailto"], HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } },
      }),
    ],
    content: valeur,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: "prose-fiche min-w-0 px-3 py-2 focus:outline-none",
        style: `min-height:${minHauteur}px`,
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
  });

  const actifs = useEditorState({
    editor,
    selector: ({ editor: e }) => (e ? BOUTONS.map((b) => (b !== "|" && b.actif ? b.actif(e) : false)) : []),
  });

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white focus-within:outline-2 focus-within:outline-violet">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-surface-2 px-2 py-1.5" role="toolbar" aria-label="Mise en forme">
        {BOUTONS.map((b, i) =>
          b === "|" ? (
            <span key={i} className="mx-1 h-5 w-px bg-line" aria-hidden />
          ) : (
            <button
              key={b.titre}
              type="button"
              title={b.titre}
              aria-label={b.titre}
              aria-pressed={actifs?.[i] ?? false}
              disabled={!editor}
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => editor && b.action(editor)}
              className={`rounded-md px-2 py-1 text-xs ${b.classe ?? "font-semibold"} ${actifs?.[i] ? "bg-violet text-white" : "text-ink hover:bg-lavande"}`}
            >
              {b.libelle}
            </button>
          ),
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
