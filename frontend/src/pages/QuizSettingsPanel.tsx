// src/components/teacher/QuizSettingsPanel.tsx
// Dùng trong QuizFormPage — thêm vào cuối form (sau description field)

interface QuizSettings {
  maxAttempts: number;
  showAnswerAfter: boolean;
  lockAnswers: boolean;
}

interface Props {
  settings: QuizSettings;
  onChange: (key: keyof QuizSettings, value: boolean | number) => void;
}

export default function QuizSettingsPanel({ settings, onChange }: Props) {
  return (
    <div className="border-t border-border pt-4 space-y-4">
      <p className="text-xs font-semibold text-foreground uppercase tracking-wide ">
        Cài đặt quiz
      </p>

      {/* Max attempts */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-foreground">
            Giới hạn số lần làm
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {settings.maxAttempts === 0
              ? "Không giới hạn"
              : `Tối đa ${settings.maxAttempts} lần`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() =>
              onChange("maxAttempts", Math.max(0, settings.maxAttempts - 1))
            }
            className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-accent transition-colors font-bold text-base leading-none"
            aria-label="Giảm"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-semibold text-foreground tabular-nums">
            {settings.maxAttempts === 0 ? "∞" : settings.maxAttempts}
          </span>
          <button
            onClick={() => onChange("maxAttempts", settings.maxAttempts + 1)}
            className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-accent transition-colors font-bold text-base leading-none"
            aria-label="Tăng"
          >
            +
          </button>
        </div>
      </div>

      {/* Show answers */}
      <ToggleRow
        label="Hiển thị đáp án sau khi nộp"
        sub="Học sinh xem được câu nào đúng/sai"
        checked={settings.showAnswerAfter}
        onChange={(v) => onChange("showAnswerAfter", v)}
      />

      {/* Lock answers */}
      <ToggleRow
        label="Khóa đáp án đã chọn"
        sub="Không cho quay lại thay đổi câu đã trả lời"
        checked={settings.lockAnswers}
        onChange={(v) => onChange("lockAnswers", v)}
      />
    </div>
  );
}

// ── Toggle row ─────────────────────────────────────────────────────────────────
const ToggleRow = ({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-ring/30 ${
        checked ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  </div>
);
