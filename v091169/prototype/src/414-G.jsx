// ═════════════════════════════════════════════════════════════════
//  Design System — StatusModal (แจ้งผลการทำรายการแบบเต็มจอ)
//  variants: success · error · warning · info · confirm
//  window.StatusModal({ variant, title, detail, onClose, onConfirm })
// ═════════════════════════════════════════════════════════════════

(function () {
  const G = '#237450';
  const TONES = {
    success: { bg: '#eafef2', fg: G, path: 'm4 12.5 5.5 5.5L20 7' },
    error: { bg: '#fff2f0', fg: '#cf1322', path: 'M6 6l12 12M18 6 6 18' },
    warning: { bg: '#fffbe6', fg: '#d48806', path: 'M12 5v9M12 18v.5' },
    info: { bg: '#e6f4ff', fg: '#1677ff', path: 'M12 10v8M12 6v.5' },
    confirm: { bg: '#eafef2', fg: G, path: 'M12 8v5M12 16v.5' },
  };

  // ใช้หน้าตาเดียวกับ popup ระบบเงินฝาก (DepStatusDialog) ทั้งระบบ
  const TONE_MAP = { success: 'success', error: 'danger', warning: 'warn', info: 'confirm', confirm: 'confirm' };
  function StatusModal(props) {
    const { variant = 'success', title, detail, confirmLabel, cancelLabel, onClose, onConfirm } = props;
    const D = null; // ยึดแบบ StatusModal ของระบบสหกรณ์ (7ba8c41b)
    if (D) {
      const isConfirm = variant === 'confirm';
      const box = (
        <div className="dep-dlg-wrap" style={{ position: 'relative', zIndex: 1100 }}>
          <D tone={TONE_MAP[variant] || 'success'} title={title} desc={detail}
             cancelLabel={isConfirm ? (cancelLabel || 'ยกเลิก') : null}
             okLabel={confirmLabel || (isConfirm ? 'ยืนยัน' : 'เสร็จสิ้น')}
             onOk={isConfirm ? onConfirm : onClose} onClose={onClose} />
        </div>
      );
      return ReactDOM.createPortal(box, document.body);
    }
    return LegacyStatusModal(props);
  }
  function LegacyStatusModal({ variant = 'success', title, detail, confirmLabel, cancelLabel, onClose, onConfirm }) {
    const t = TONES[variant] || TONES.success;
    const isConfirm = variant === 'confirm';
    const btn = (primary) => ({
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 38,
      padding: '0 26px', border: '1px solid ' + (primary ? G : '#d9d9d9'),
      background: primary ? G : '#fff', borderRadius: 4, fontFamily: 'inherit', fontSize: 13,
      fontWeight: 600, color: primary ? '#fff' : 'rgba(0,0,0,.65)', cursor: 'pointer',
    });
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 950,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
             style={{ width: 460, maxWidth: '100%', background: '#fff', borderRadius: 12,
                      padding: '36px 32px 32px', boxShadow: '0 6px 24px rgba(0,0,0,.18)', textAlign: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72,
                         borderRadius: 9999, background: t.bg, color: t.fg, marginBottom: 20 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
                 strokeLinecap="round" strokeLinejoin="round"><path d={t.path} /></svg>
          </span>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'rgba(0,0,0,.88)', lineHeight: 1.35 }}>{title}</h2>
          {detail && (
            <p style={{ margin: '12px auto 0', maxWidth: 380, fontSize: 13, color: 'rgba(0,0,0,.55)',
                        lineHeight: 1.65, textWrap: 'pretty' }}>{detail}</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            {isConfirm && <button type="button" style={btn(false)} onClick={onClose}>{cancelLabel || 'ยกเลิก'}</button>}
            <button type="button" style={btn(true)} onClick={isConfirm ? onConfirm : onClose}>
              {confirmLabel || (isConfirm ? 'ยืนยัน' : 'เสร็จสิ้น')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  Object.assign(window, { StatusModal });
})();
