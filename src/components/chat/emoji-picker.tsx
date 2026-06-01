"use client"

import { useState, useRef, useEffect } from "react"
import { SmilePlus } from "lucide-react"

const EMOJIS = [
  "😀","😃","😄","😁","😅","😂","🤣","😊","😇","🙂","😉","😌","😍","🥰","😘","😗",
  "😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫣","🤫","🤔","😐","😑","😶","😏","😒",
  "🙄","😬","😮","😯","😲","😳","🥺","😢","😭","😤","😠","😡","🤬","💀","☠️","👍",
  "👎","👊","✊","🤛","🤜","👏","🙌","🤲","🤝","💪","✌️","🤞","🫰","🤟","🤘","👌",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💕","💗","💖","💝","💘","💋","✨",
  "🔥","⭐","🌟","💯","🎉","🎊","🎈","🎁","🎀","🕊️","😎","🤩","🥳","🤯","😱","😨",
]

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        aria-label="Inserir emoji"
      >
        <SmilePlus size={18} />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50">
          <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1 max-h-[160px] overflow-y-auto">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => { onSelect(e); setOpen(false) }}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
