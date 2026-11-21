import React, { useMemo, useState } from 'react';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell, CrossIcon } from '../../src/components/LBODIShell';
import { DEFAULT_AI_PRIVACY } from '../../src/data/faithData';
import { buildAuthorizedAIContext } from '../../src/services/aiPrivacyService';
import { AIMessage, AIPrivacySettings } from '../../src/types';

const SUGGESTED_PROMPTS_SL = [
  'Pomagaj mi načrtovati današnji dan.',
  'Kako lahko postanem bolj discipliniran?',
  'Pomagaj mi razumeti današnji svetopisemski odlomek.',
  'Napiši kratko molitev.',
  'Analiziraj moje navade zadnjega tedna.',
  'Pomagaj mi izboljšati prehrano.',
  'Spomni me, zakaj sem začel.',
  'Pomagaj mi pri oblikovanju življenjskih ciljev.',
];

export default function LBODIAIAssistantScreen() {
  const {
    state,
    createAIConversation,
    appendAIMessages,
    deleteAIConversation,
    clearAllAIConversations,
    updateAIPrivacy,
  } = useApp();

  const lang = state.settings.language;
  const conversations = state.aiConversations || [];
  const privacy = state.settings.aiPrivacy || DEFAULT_AI_PRIVACY;

  const [activeConvId, setActiveConvId] = useState<string>(conversations[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorBanner, setErrorBanner] = useState<{ code?: string; message: string } | null>(null);
  const [showPrivacyPanel, setShowPrivacyPanel] = useState(false);
  const [showConvList, setShowConvList] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeConvId) || conversations[0] || null,
    [conversations, activeConvId]
  );

  const messages = activeConv?.messages || [];

  const handleNewChat = async () => {
    const newId = await createAIConversation('Nov pogovor');
    setActiveConvId(newId);
    setShowConvList(false);
    setErrorBanner(null);
  };

  const sendMessageText = async (rawPrompt: string) => {
    const text = rawPrompt.trim();
    if (!text || isSending) return;

    let convId = activeConv?.id;
    if (!convId) {
      convId = await createAIConversation(text.slice(0, 42));
      setActiveConvId(convId);
    }

    const userMsg: AIMessage = {
      id: `m_u_${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    const historyForApi = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setInputText('');
    setIsSending(true);
    setErrorBanner(null);

    await appendAIMessages(convId, [userMsg]);

    try {
      const authorizedContext = buildAuthorizedAIContext(state, privacy);
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForApi,
          authorizedContext,
          language: lang,
        }),
      });

      const data = await response.json().catch(() => ({
        ok: false,
        code: 'INVALID_RESPONSE',
        error: 'Neveljaven odgovor strežnika.',
      }));

      if (!response.ok || !data.ok) {
        setErrorBanner({
          code: data.code,
          message:
            data.code === 'AI_NOT_CONFIGURED'
              ? 'Strežniški API ključ GEMINI_API_KEY še ni nastavljen v Vercel Environment Variables. Ko ga dodaš, bo LBODI AI takoj odgovarjal z resničnim modelom Gemini.'
              : data.error || 'LBODI AI trenutno ni dosegljiv.',
        });
      } else {
        const assistantMsg: AIMessage = {
          id: `m_a_${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          createdAt: new Date().toISOString(),
          model: data.model,
        };
        await appendAIMessages(convId, [assistantMsg]);
      }
    } catch {
      setErrorBanner({
        code: 'NETWORK_ERROR',
        message:
          'Povezava do /api/ai/chat ni uspela (lokalni Expo dev strežnik brez Vercel serverless okolja ali manjkajoča omrežna povezava). Na Vercelu preveri še GEMINI_API_KEY.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleRetryLast = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) sendMessageText(lastUser.content);
  };

  const handleCopy = (msg: AIMessage) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(msg.content).catch(() => {});
      setCopiedMsgId(msg.id);
      setTimeout(() => setCopiedMsgId(null), 1500);
    }
  };

  const privacyToggles: { key: keyof AIPrivacySettings; label: string; sensitive?: boolean }[] = [
    { key: 'allowHabits', label: 'Navade in opravljeni dnevi' },
    { key: 'allowGoals', label: 'Osebni cilji' },
    { key: 'allowVision', label: 'Življenjska vizija' },
    { key: 'allowWorkouts', label: 'Vadbe in fitnes' },
    { key: 'allowNutrition', label: 'Prehrana (dnevni zapisi)' },
    { key: 'allowSleep', label: 'Spanje in počutje' },
    { key: 'allowJournal', label: 'Osebni dnevnik (občutljivo)', sensitive: true },
    { key: 'allowPrayers', label: 'Molitve (občutljivo)', sensitive: true },
    { key: 'allowDisciplineTracker', label: 'Disciplina in čistost (občutljivo)', sensitive: true },
  ];

  return (
    <LBODIShell showBackButton subtitle="Vera • Disciplina • Rast">
      {/* Header Bar */}
      <section className="lbodi-card thermal-top-edge p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[var(--accent-gold)]">
              <CrossIcon size={14} />
              <span className="text-[11px] font-semibold uppercase tracking-widest">
                LBODI AI
              </span>
            </div>
            <h1 className="font-sacred text-2xl font-semibold text-[var(--text-main)]">
              {lang === 'sl' ? 'Tvoj premišljeni spremljevalec' : 'Faith & Discipline Companion'}
            </h1>
            <p className="text-[11px] text-[var(--text-muted)]">
              Deluje prek varnega strežniškega klica (/api/ai/chat) in uporablja samo izrecno dovoljene podatke.
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowConvList(!showConvList)}
              className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)]"
            >
              Pogovori ({conversations.length})
            </button>
            <button
              onClick={handleNewChat}
              className="px-2.5 py-1.5 rounded-xl lbodi-gold-btn text-xs"
            >
              + Nov
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowPrivacyPanel(!showPrivacyPanel)}
            className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-gold)] text-[11px] text-[var(--accent-gold)] flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">lock</span>
            <span>Zasebnost konteksta ({buildAuthorizedAIContext(state, privacy).sharedCategories.length} vključenih)</span>
          </button>
          <button
            onClick={() =>
              sendMessageText(
                'Pripravi moj tedenski pregled na podlagi dejanskih dovoljenih podatkov: opravljene navade, zgrešene navade, vadbe, prehrana in konkretni naslednji koraki.'
              )
            }
            className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-main)]"
          >
            Moj tedenski pregled
          </button>
        </div>
      </section>

      {/* Conversations List Drawer */}
      {showConvList && (
        <section className="lbodi-card p-3.5 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[var(--text-main)]">Shranjeni pogovori</span>
            {conversations.length > 0 && (
              <button
                onClick={async () => {
                  await clearAllAIConversations();
                  setActiveConvId('');
                }}
                className="text-[11px] text-red-400"
              >
                Počisti vse
              </button>
            )}
          </div>
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`p-2.5 rounded-xl flex justify-between items-center text-xs cursor-pointer border ${
                c.id === activeConv?.id
                  ? 'bg-[var(--bg-elevated)] border-[var(--border-gold)]'
                  : 'bg-[var(--bg-lowest)] border-[var(--border-subtle)]'
              }`}
              onClick={() => {
                setActiveConvId(c.id);
                setShowConvList(false);
              }}
            >
              <span className="truncate text-[var(--text-main)]">{c.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteAIConversation(c.id);
                }}
                className="text-red-400 ml-2"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          ))}
        </section>
      )}

      {/* AI Privacy Controls */}
      {showPrivacyPanel && (
        <section className="lbodi-card p-4 space-y-2.5">
          <span className="text-xs font-semibold text-[var(--accent-gold)] block">
            Katere podatke sme videti LBODI AI?
          </span>
          <p className="text-[11px] text-[var(--text-muted)]">
            Dnevnik, molitve in števec čistosti so privzeto IZKLOPLJENI in se nikoli ne pošljejo modelu brez tvojega dovoljenja.
          </p>
          <div className="space-y-1.5">
            {privacyToggles.map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-[var(--bg-lowest)] cursor-pointer"
              >
                <span className={item.sensitive ? 'text-[var(--accent-gold)]' : 'text-[var(--text-main)]'}>
                  {item.label}
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(privacy[item.key])}
                  onChange={(e) => updateAIPrivacy({ [item.key]: e.target.checked })}
                  className="accent-amber-500 w-4 h-4"
                />
              </label>
            ))}
          </div>
        </section>
      )}

      {/* Honest Server Error Banner */}
      {errorBanner && (
        <section className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs space-y-2">
          <p className="font-semibold text-amber-200">{errorBanner.message}</p>
          {errorBanner.code === 'AI_NOT_CONFIGURED' && (
            <p className="text-[11px] text-[var(--text-muted)]">
              Konfiguracija za Vercel: dodaj okoljsko spremenljivko <code className="text-[var(--accent-gold)]">GEMINI_API_KEY</code> v Vercel Project Settings → Environment Variables in ponovno zaženi deploy.
            </p>
          )}
          <button
            onClick={handleRetryLast}
            className="px-3 py-1 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent-gold)] text-[11px] font-semibold"
          >
            Poskusi znova
          </button>
        </section>
      )}

      {/* Empty State + Starter Prompts */}
      {messages.length === 0 ? (
        <section className="lbodi-card p-4 space-y-3">
          <p className="font-sacred text-xl text-[var(--text-main)]">
            {lang === 'sl' ? 'O čem želiš danes razmišljati?' : 'How can I support you today?'}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            LBODI AI jasno razlikuje med svetopisemskimi referencami in AI nasveti ter nikoli ne izmišlja tvojih podatkov.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUGGESTED_PROMPTS_SL.map((p, idx) => (
              <button
                key={idx}
                onClick={() => sendMessageText(p)}
                className="p-2.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] hover:border-[var(--border-gold)] text-left text-xs text-[var(--text-main)] transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </section>
      ) : (
        /* Messages Stream */
        <section className="space-y-2.5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-3.5 rounded-2xl border text-xs sm:text-sm leading-relaxed space-y-1.5 ${
                m.role === 'user'
                  ? 'bg-[var(--bg-elevated)] border-[var(--border-gold)] ml-6'
                  : 'lbodi-card mr-4'
              }`}
            >
              <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)]">
                <span className="font-semibold uppercase text-[var(--accent-gold)]">
                  {m.role === 'user' ? 'Luka' : `LBODI AI${m.model ? ` (${m.model})` : ''}`}
                </span>
                <button onClick={() => handleCopy(m)} className="hover:text-[var(--text-main)]">
                  {copiedMsgId === m.id ? 'Kopirano ✓' : 'Kopiraj'}
                </button>
              </div>
              <div className="text-[var(--text-main)] whitespace-pre-wrap">{m.content}</div>
            </div>
          ))}
          {isSending && (
            <div className="lbodi-card p-3.5 mr-4 text-xs text-[var(--text-muted)] animate-pulse">
              LBODI AI pripravlja premišljen odgovor...
            </div>
          )}
        </section>
      )}

      {/* Composer */}
      <section className="lbodi-card p-3 flex gap-2 items-end sticky bottom-20 md:bottom-4 z-20">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessageText(inputText);
            }
          }}
          rows={2}
          placeholder={
            lang === 'sl'
              ? 'Vprašaj za načrt dneva, razlago odlomka, molitev ali pregled navad...'
              : 'Ask LBODI AI...'
          }
          className="flex-1 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)] resize-none focus:border-[var(--accent-gold)] focus:outline-none"
        />
        <button
          onClick={() => sendMessageText(inputText)}
          disabled={isSending || !inputText.trim()}
          className="px-4 py-2.5 rounded-xl lbodi-gold-btn text-xs disabled:opacity-40"
        >
          {lang === 'sl' ? 'Pošlji' : 'Send'}
        </button>
      </section>
    </LBODIShell>
  );
}
