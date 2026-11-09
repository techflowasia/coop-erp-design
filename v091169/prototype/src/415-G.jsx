// ═════════════════════════════════════════════════════════════════
//  Design System — ToggleConfirmModal (ยืนยันเปิด/ปิดใช้งาน)
//  หัวข้อชิดซ้าย + บรรทัด "รหัส · ชื่อ" + ปุ่มปิด · footer: ยกเลิก / ✓ ยืนยัน
//  window.ToggleConfirmModal({ next, title, subtitle, detail, onCancel, onConfirm })
// ═════════════════════════════════════════════════════════════════

(function () {
  const G = '#237450';
  const LINE = '#f0f0f0';

  // blocked = true → หน้าต่าง “ปิดใช้งานไม่ได้/เปิดใช้งานไม่ได้” ปุ่ม “ปิด” ปุ่มเดียว
  function ToggleConfirmModal({ next = true, title, subtitle, detail, confirmLabel, cancelLabel, onCancel, onConfirm, blocked }) {
    const tone = blocked ? { bg: '#fff1f0', fg: '#cf1322' } : next ? { bg: '#eafef2', fg: G } : { bg: '#fffbe6', fg: '#d48806' };
    const btn = (primary) => ({
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 38,
      border: '1px solid ' + (primary ? G : '#d9d9d9'), background: primary ? G : '#fff',
      borderRadius: 4, fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
      color: primary ? '#fff' : 'rgba(0,0,0,.65)', cursor: 'pointer', flex: 1,
    });
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 940,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
             style={{ width: 460, maxWidth: '100%', background: '#fff', borderRadius: 12,
                      boxShadow: '0 6px 24px rgba(0,0,0,.18)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 20px 16px',
                        borderBottom: '1px solid ' + LINE }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36,
                           borderRadius: 9999, flexShrink: 0, background: tone.bg, color: tone.fg }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                   strokeLinecap="round" strokeLinejoin="round">
                {next && !blocked ? <path d="m4 12.5 5.5 5.5L20 7" /> : <><path d="M12 7v6" /><path d="M12 16.5v.5" /><circle cx="12" cy="12" r="9" strokeWidth="1.8" /></>}
              </svg>
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'rgba(0,0,0,.88)', lineHeight: 1.35 }}>{title}</h2>
              {subtitle && <div style={{ fontSize: 13, color: 'rgba(0,0,0,.55)', marginTop: 6, lineHeight: 1.6 }}>{subtitle}</div>}
            </div>
            <button type="button" aria-label="ปิด" onClick={onCancel}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(0,0,0,.35)',
                             fontSize: 18, lineHeight: 1, padding: 0, marginTop: 2 }}>×</button>
          </div>
          <p style={{ margin: 0, padding: '20px 20px 0', fontSize: 13, color: 'rgba(0,0,0,.65)',
                      lineHeight: 1.7, textWrap: 'pretty', whiteSpace: 'pre-line' }}>{detail}</p>
          <div style={{ display: 'flex', gap: 10, padding: '20px' }}>
            <button type="button" style={btn(false)} onClick={onCancel}>{blocked ? 'ปิด' : (cancelLabel || 'ยกเลิก')}</button>
            {!blocked && <button type="button" style={btn(true)} onClick={onConfirm}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                   strokeLinecap="round" strokeLinejoin="round"><path d="m4 12.5 5.5 5.5L20 7" /></svg>
              {confirmLabel || 'ยืนยัน'}
            </button>}
          </div>
        </div>
      </div>
    );
  }

  // หน้าต่างแจ้ง “ปิดใช้งานไม่ได้” — ใช้ร่วมทุกเมนูค่าคงที่
  function ConstBlockedModal({ title, subtitle, detail, onClose }) {
    return <ToggleConfirmModal blocked next={false} title={title} subtitle={subtitle} detail={detail} onCancel={onClose} onConfirm={onClose} />;
  }
  Object.assign(window, { ToggleConfirmModal, ConstBlockedModal });
})();
