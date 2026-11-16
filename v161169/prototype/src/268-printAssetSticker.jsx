// ════════════════════════════════════════════════════════════════════
//  สติกเกอร์บาร์โค้ดครุภัณฑ์ — พรีวิว + พิมพ์เป็นสติกเกอร์ (label sheet)
//  ใช้ barcode128() สร้าง SVG จากรหัสครุภัณฑ์ · พิมพ์ผ่าน @media print
// ════════════════════════════════════════════════════════════════════

// trigger พิมพ์ (กลไกเดียวกับการพิมพ์เอกสารอื่นในระบบ)
window.printAssetSticker = (onToast) => {
  document.documentElement.classList.add('ast-printing');
  const cleanup = () => {
    document.documentElement.classList.remove('ast-printing');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => window.print(), 60);
  onToast && onToast('กำลังเตรียมสติกเกอร์บาร์โค้ด — เลือก “บันทึกเป็น PDF” หรือเครื่องพิมพ์ในกล่องพิมพ์');
};

// สติกเกอร์ 1 ดวง
function AssetStickerLabel({ asset }) {
  const cat = window.astCat(asset.category);
  const svg = window.barcode128(asset.id, { module: 2, height: 46, quiet: 8 });
  return (
    <div className="ast-sticker">
      <div className="ast-sticker-top">
        <span className="ast-sticker-org">สหกรณ์ออมทรัพย์</span>
        <span className="ast-sticker-tag">ทะเบียนครุภัณฑ์</span>
      </div>
      <div className="ast-sticker-bc" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="ast-sticker-code mono">{asset.id}</div>
      <div className="ast-sticker-name">{asset.name}</div>
      <div className="ast-sticker-cat">{cat ? cat.name : ''}</div>
    </div>
  );
}

function AssetStickerModal({ asset, onClose, onToast }) {
  const [qty, setQty] = React.useState(1);
  const n = Math.max(1, Math.min(40, Number(qty) || 1));
  const sheet = Array.from({ length: n });

  const doPrint = () => { onClose && setTimeout(() => {}, 0); window.printAssetSticker(onToast); };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card ast-sticker-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
            <Icon name="print" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>พิมพ์สติกเกอร์บาร์โค้ด</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              สำหรับติดบนตัวครุภัณฑ์ <span className="mono">{asset.id}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <div className="modal-body">
          <div className="ast-sticker-preview">
            <AssetStickerLabel asset={asset} />
          </div>

          <div className="ast-sticker-ctrl">
            <label className="vch-label" style={{ margin: 0 }}>จำนวนดวงที่พิมพ์</label>
            <div className="ast-sticker-qty">
              <button className="btn sm" onClick={() => setQty(q => Math.max(1, (Number(q) || 1) - 1))}>−</button>
              <input className="cfg-input mono num" type="number" min="1" max="40" value={qty}
                     onChange={(e) => setQty(e.target.value)} style={{ width: 70, textAlign: 'center' }} />
              <button className="btn sm" onClick={() => setQty(q => Math.min(40, (Number(q) || 1) + 1))}>+</button>
              <span className="muted" style={{ fontSize: 12 }}>ดวง · เรียงเป็นแผ่นสติกเกอร์</span>
            </div>
          </div>

          <div className="as-vat-note muted" style={{ marginTop: 12 }}>
            <Icon name="info" size={12} /> บาร์โค้ดเข้ารหัสแบบ Code 128 จากเลขทะเบียนครุภัณฑ์ — สแกนเพื่อเรียกดูรายการได้
          </div>
        </div>

        <div className="stk-modal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" onClick={doPrint}><Icon name="print" /> พิมพ์ {n} ดวง</button>
        </div>
      </div>

      {/* พอร์ทัลสำหรับพิมพ์ (ซ่อนบนจอ — แสดงเฉพาะตอนพิมพ์) */}
      <div className="ast-sticker-portal">
        <div className="ast-sticker-grid">
          {sheet.map((_, i) => <AssetStickerLabel key={i} asset={asset} />)}
        </div>
      </div>
    </>
  );
}

// ─── พิมพ์บาร์โค้ดเป็นชุด — กรองหมวด + ช่วงวันที่ แล้วพิมพ์ทีเดียว ───────
function AssetBatchStickerModal({ assets, onClose, onToast }) {
  const [cat, setCat] = React.useState('all');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');

  const reg = (assets || []).filter(a => a.registered !== false);
  const match = reg.filter(a => {
    if (cat !== 'all' && a.category !== cat) return false;
    const d = a.acquiredDate || '';
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });

  const doPrint = () => {
    if (match.length === 0) { onToast && onToast('ไม่มีครุภัณฑ์ตรงตามเงื่อนไขที่เลือก'); return; }
    window.printAssetSticker(onToast);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card ast-batch-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
            <Icon name="print" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>พิมพ์บาร์โค้ดครุภัณฑ์ (พิมพ์ทีเดียว)</h2>
            <div className="muted" style={{ fontSize: 11 }}>เลือกหมวดและช่วงวันที่ขึ้นทะเบียน — ระบบสร้างบาร์โค้ดให้ทั้งหมด</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <div className="modal-body">
          <div className="vch-grid g3">
            <div className="vch-field">
              <label className="vch-label">หมวดหมู่</label>
              <select className="cfg-input" value={cat} onChange={(e) => setCat(e.target.value)}>
                <option value="all">ทุกหมวดหมู่</option>
                {window.AST_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="vch-field">
              <label className="vch-label">ตั้งแต่วันที่ <span className="vch-hint">(ขึ้นทะเบียน)</span></label>
              <window.ThaiDateField value={from} onChange={(v) => setFrom(v)} max={to || undefined} />
            </div>
            <div className="vch-field">
              <label className="vch-label">ถึงวันที่</label>
              <window.ThaiDateField value={to} onChange={(v) => setTo(v)} min={from || undefined} />
            </div>
          </div>

          <div className="ast-batch-bar">
            <span className="muted" style={{ fontSize: 12.5 }}>ครุภัณฑ์ที่ตรงเงื่อนไข</span>
            <span className="ast-batch-count">{match.length} <span className="u">ดวง</span></span>
          </div>

          <div className="ast-batch-preview">
            {match.length === 0 ? (
              <div className="stk-empty-note" style={{ margin: 0 }}>
                <Icon name="info" size={14} /> ไม่มีครุภัณฑ์ตรงตามเงื่อนไข — ลองปรับหมวดหรือช่วงวันที่
              </div>
            ) : (
              <div className="ast-batch-grid">
                {match.map(a => <AssetStickerLabel key={a.id} asset={a} />)}
              </div>
            )}
          </div>
        </div>

        <div className="stk-modal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" onClick={doPrint} disabled={match.length === 0}>
            <Icon name="print" /> พิมพ์ทั้งหมด {match.length} ดวง
          </button>
        </div>
      </div>

      {/* พอร์ทัลพิมพ์ (ซ่อนบนจอ) */}
      <div className="ast-sticker-portal">
        <div className="ast-sticker-grid">
          {match.map(a => <AssetStickerLabel key={a.id} asset={a} />)}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { AssetStickerModal, AssetStickerLabel, AssetBatchStickerModal });
