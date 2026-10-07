"use client";

import { deleteSermon } from "@/app/admin/sermons/actions";

export function DeleteSermonForm({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteSermon}
      onSubmit={(event) => {
        if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-xl border border-destructive/40 px-3 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Delete
      </button>
    </form>
  );
}
